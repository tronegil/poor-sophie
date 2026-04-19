const router = require('express').Router({ mergeParams: true });
const Anthropic = require('@anthropic-ai/sdk');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MAX_HISTORY = 20;
const MAX_DOC_CHARS = 20000;
const MAX_TOTAL_DOC_CHARS = 80000;

async function requireBoatOwner(req, res) {
  const { rows } = await pool.query(
    'SELECT user_id, name, type, year FROM boats WHERE id = $1',
    [req.params.boatId]
  );
  if (!rows.length) { res.status(404).json({ error: 'Boat not found' }); return null; }
  if (rows[0].user_id !== req.user.id) { res.status(403).json({ error: 'Forbidden' }); return null; }
  return rows[0];
}

router.get('/messages', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;

  const { rows } = await pool.query(
    `SELECT id, role, content, created_at FROM chat_messages
     WHERE boat_id = $1 AND user_id = $2 ORDER BY created_at ASC`,
    [req.params.boatId, req.user.id]
  );
  res.json(rows);
});

router.post('/messages', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;

  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  const [{ rows: wikiItems }, { rows: logs }] = await Promise.all([
    pool.query(
      `SELECT title, description, type, url, file_data, youtube_id
       FROM wiki_items WHERE boat_id = $1 ORDER BY created_at ASC`,
      [req.params.boatId]
    ),
    pool.query(
      `SELECT mt.name_en, ml.completed_date, ml.notes, ml.cost_nok
       FROM maintenance_logs ml
       JOIN maintenance_tasks mt ON ml.task_id = mt.id
       WHERE mt.boat_id = $1
       ORDER BY ml.completed_date DESC LIMIT 50`,
      [req.params.boatId]
    ),
  ]);

  // Build wiki context
  let docsContext = '';
  let totalChars = 0;
  for (const item of wikiItems) {
    if (totalChars >= MAX_TOTAL_DOC_CHARS) break;
    let block = `\n\n### ${item.title}`;
    if (item.description) block += `\n${item.description}`;
    if ((item.type === 'pdf' || item.type === 'text') && item.file_data) {
      const text = item.file_data.slice(0, MAX_DOC_CHARS);
      block += `\n${text}`;
      if (item.file_data.length > MAX_DOC_CHARS) block += '\n[... truncated ...]';
    } else if (item.type === 'url') {
      block += `\nURL: ${item.url}`;
    } else if (item.type === 'youtube') {
      block += `\nYouTube: https://www.youtube.com/watch?v=${item.youtube_id}`;
    }
    docsContext += block;
    totalChars += block.length;
  }

  // Build maintenance context
  let maintenanceContext = '';
  if (logs.length > 0) {
    maintenanceContext = '\n\n### Maintenance History (most recent first)\n';
    for (const log of logs) {
      maintenanceContext += `- ${log.completed_date}: ${log.name_en}`;
      if (log.notes) maintenanceContext += ` — ${log.notes}`;
      if (log.cost_nok) maintenanceContext += ` (${log.cost_nok} NOK)`;
      maintenanceContext += '\n';
    }
  }

  const boatDesc = [boat.year, boat.type].filter(Boolean).join(' ');
  const systemPrompt = `You are Gunnar Fokkeslask — the AI first mate and self-appointed Chief Officer of Not-Sinking aboard "${boat.name}"${boatDesc ? ` (${boatDesc})` : ''}.

PERSONALITY:
You are a weathered old sea dog. Knowledgeable, calm, and utterly reliable — the kind of sailor who has seen everything and sunk nothing. You have a dry, understated sense of humor. You love a good tot of grog (or three) and have been known to burst into song at inopportune moments, usually something vaguely pirate-adjacent. You are deeply fond of ${boat.name} and take your "not-sinking" duties very seriously.

Humor: About 1 in every 5 or 6 responses, slip in a subtle sailing joke, a dry nautical observation, or a wry comment. Never force it. Think salty old sailor at the end of the dock, not stand-up comedian. The joke should feel earned.

RULES:
- Always answer in the same language the user writes in (Norwegian or English). Never mix languages in a single response.
- Always check the boat's own documents first. Cite the source by name (e.g. "According to the engine manual…").
- If the answer isn't in the documents, say so plainly, then offer solid general sailing knowledge.
- Be practical and specific — the user may be standing on a wet dock with a phone in one hand and a boat hook in the other.
- Refer to the boat as "${boat.name}" naturally, not "the boat" or "your vessel".
- On the very first message in a conversation (when there's no prior history), introduce yourself briefly as Gunnar Fokkeslask, first mate of ${boat.name}, and invite the user to ask away.

WIKI DOCUMENTS:${docsContext || '\n(no documents uploaded yet)'}
${maintenanceContext}`;

  // Fetch recent history
  const { rows: history } = await pool.query(
    `SELECT role, content FROM chat_messages
     WHERE boat_id = $1 AND user_id = $2
     ORDER BY created_at DESC LIMIT $3`,
    [req.params.boatId, req.user.id, MAX_HISTORY]
  );
  const messages = [
    ...history.reverse().map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message.trim() },
  ];

  let reply;
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });
    reply = response.content[0].text;
  } catch (err) {
    console.error('Anthropic API error:', err.message);
    return res.status(502).json({ error: 'AI service unavailable' });
  }

  await pool.query(
    `INSERT INTO chat_messages (boat_id, user_id, role, content)
     VALUES ($1,$2,'user',$3), ($1,$2,'assistant',$4)`,
    [req.params.boatId, req.user.id, message.trim(), reply]
  );

  res.json({ reply });
});

router.delete('/messages', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;

  await pool.query(
    'DELETE FROM chat_messages WHERE boat_id = $1 AND user_id = $2',
    [req.params.boatId, req.user.id]
  );
  res.json({ ok: true });
});

module.exports = router;
