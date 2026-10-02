// Calm-passage alerts. A scheduled job (POST /api/watches/run) rescores every
// watched saved passage for the next 48 h and sends a push when a departure
// scores at or under the owner's threshold. Pure decisions are separate from
// I/O so they can be tested without MET, a database or a push service.

const HOUR = 3600e3;
const BAND_NAMES = {
  no: { flat: 'Blikkstille', comfortable: 'Behagelig', uncomfortable: 'Ubehagelig', bucket: 'Bøtta klar', ashore: 'Bli på land' },
  en: { flat: 'Flat calm', comfortable: 'Comfortable', uncomfortable: 'Uncomfortable', bucket: 'Bucket ready', ashore: 'Stay ashore' },
};

/**
 * Picks the departure to tell the owner about, or none.
 * - only departures at least an hour away, scoring at or under the threshold
 * - the calmest wins; on a tie, the earliest
 * - no repeat for the same departure (±3 h) we already announced
 */
function decide(departures, threshold, now, lastNotifiedDeparture) {
  const soon = now.getTime() + HOUR;
  const candidates = departures.filter(d => d.score != null && d.score <= threshold && new Date(d.departure).getTime() >= soon);
  if (!candidates.length) return { notify: false, reason: 'none-calm' };
  const pick = candidates.reduce((a, d) => (d.score < a.score ? d : a), candidates[0]);
  if (lastNotifiedDeparture) {
    const last = new Date(lastNotifiedDeparture).getTime();
    if (last > now.getTime() && Math.abs(last - new Date(pick.departure).getTime()) <= 3 * HOUR) return { notify: false, reason: 'already-told', departure: pick };
  }
  return { notify: true, departure: pick };
}

function message({ tripName, departure, lang, url }) {
  const no = !String(lang || '').startsWith('en');
  const locale = no ? 'nb-NO' : 'en-GB';
  const when = new Date(departure.departure).toLocaleString(locale, { timeZone: 'Europe/Oslo', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const score = departure.score.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const band = BAND_NAMES[no ? 'no' : 'en'][departure.band] ?? '';
  return {
    title: no ? `Rolig avgang: ${tripName}` : `Calm departure: ${tripName}`,
    body: no ? `${when} · ${score} ${band}. Trykk for å se turen.` : `${when} · ${score} ${band}. Tap to see the passage.`,
    url,
    tag: `trip-${url}`,
  };
}

const WATCH_SQL = `
  SELECT t.id, t.name, t.boat_id, t.user_id, t.waypoints, t.speed_kn, t.watch_threshold, t.watch_notified_departure,
         b.name AS boat_name, b.loa_m, b.displacement_kg, b.hull_type, b.keel_type, u.language
    FROM trips t JOIN boats b ON b.id = t.boat_id JOIN users u ON u.id = t.user_id
   WHERE t.watch_threshold IS NOT NULL
   ORDER BY t.watch_checked_at NULLS FIRST
   LIMIT $1`;

/**
 * Checks watched passages, oldest-checked first, until the list or the time
 * budget runs out (the function has 60 s on Vercel; MET reads are the cost).
 * @param {{pool, scoreWindow, sendTo, now?:Date, budgetMs?:number, limit?:number}} deps
 */
async function runWatches({ pool, scoreWindow, sendTo, now = new Date(), budgetMs = 45000, limit = 20 }) {
  const started = Date.now();
  const summary = { checked: 0, notified: 0, noData: 0, outOfTime: 0 };
  const { rows } = await pool.query(WATCH_SQL, [limit]);
  for (const t of rows) {
    if (Date.now() - started > budgetMs) { summary.outOfTime = rows.length - summary.checked; break; }
    summary.checked++;
    let result;
    try {
      result = await scoreWindow({ waypoints: t.waypoints, speed: Number(t.speed_kn) }, { name: t.boat_name, loa_m: t.loa_m, displacement_kg: t.displacement_kg, hull_type: t.hull_type, keel_type: t.keel_type });
    } catch (err) {
      console.error(`Watch ${t.id} scoring failed:`, err.message);
      result = { status: 500 };
    }
    await pool.query('UPDATE trips SET watch_checked_at = NOW() WHERE id = $1', [t.id]);
    if (result.status !== 200) { summary.noData++; continue; }

    const d = decide(result.body.departures, Number(t.watch_threshold), now, t.watch_notified_departure);
    if (!d.notify) continue;

    const payload = message({ tripName: t.name, departure: d.departure, lang: t.language, url: `/boats/${t.boat_id}/passage?trip=${t.id}` });
    const { rows: subs } = await pool.query('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1', [t.user_id]);
    let sent = 0;
    for (const sub of subs) {
      const outcome = await sendTo(sub, payload);
      if (outcome === 'sent') sent++;
      if (outcome === 'gone') await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
    }
    if (sent) {
      summary.notified++;
      await pool.query('UPDATE trips SET watch_notified_at = NOW(), watch_notified_departure = $2 WHERE id = $1', [t.id, d.departure.departure]);
    }
  }
  return summary;
}

module.exports = { decide, message, runWatches };
