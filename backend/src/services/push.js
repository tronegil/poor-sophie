// Web Push (VAPID) sending. Configured by env:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  — from `npx web-push generate-vapid-keys`
//   VAPID_SUBJECT                        — mailto: or https: contact for push services
const webpush = require('web-push');

let configured = null;
function isConfigured() {
  if (configured === null) {
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
    configured = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
    if (configured) {
      webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'https://github.com/tronegil/poor-sophie', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    }
  }
  return configured;
}

const publicKey = () => (isConfigured() ? process.env.VAPID_PUBLIC_KEY : null);

/**
 * Sends one payload to one stored subscription row.
 * @returns {Promise<'sent'|'gone'|'failed'>} 'gone' = the browser dropped it; delete the row
 */
async function sendTo(sub, payload) {
  if (!isConfigured()) return 'failed';
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), { TTL: 6 * 3600 });
    return 'sent';
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) return 'gone';
    console.error('Push send failed:', err.statusCode, err.body || err.message);
    return 'failed';
  }
}

module.exports = { isConfigured, publicKey, sendTo };
