const router = require('express').Router();
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

function requireAdmin(req, res, next) {
  const allowed = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.includes(req.user.email.toLowerCase())) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  const [users, boats, wiki, logs, messages] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users'),
    pool.query('SELECT COUNT(*) FROM boats'),
    pool.query('SELECT COUNT(*) FROM wiki_items'),
    pool.query('SELECT COUNT(*) FROM maintenance_logs'),
    pool.query('SELECT COUNT(*) FROM chat_messages'),
  ]);
  res.json({
    users:    parseInt(users.rows[0].count),
    boats:    parseInt(boats.rows[0].count),
    wiki:     parseInt(wiki.rows[0].count),
    logs:     parseInt(logs.rows[0].count),
    messages: parseInt(messages.rows[0].count),
  });
});

router.get('/users', authenticate, requireAdmin, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      u.id, u.name, u.email, u.avatar_url, u.language, u.created_at,
      COUNT(DISTINCT b.id)::int  AS boat_count,
      COUNT(DISTINCT cm.id)::int AS message_count
    FROM users u
    LEFT JOIN boats b  ON b.user_id  = u.id
    LEFT JOIN chat_messages cm ON cm.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `);
  res.json(rows);
});

router.get('/boats', authenticate, requireAdmin, async (req, res) => {
  const { rows } = await pool.query(`
    SELECT
      b.id, b.name, b.type, b.year, b.is_public, b.created_at,
      u.name  AS owner_name,
      u.email AS owner_email,
      COUNT(DISTINCT mt.id)::int  AS task_count,
      COUNT(DISTINCT ml.id)::int  AS log_count,
      COUNT(DISTINCT wi.id)::int  AS wiki_count,
      COUNT(DISTINCT cm.id)::int  AS message_count
    FROM boats b
    JOIN users u ON u.id = b.user_id
    LEFT JOIN maintenance_tasks mt ON mt.boat_id = b.id
    LEFT JOIN maintenance_logs  ml ON ml.task_id = mt.id
    LEFT JOIN wiki_items        wi ON wi.boat_id  = b.id
    LEFT JOIN chat_messages     cm ON cm.boat_id  = b.id
    GROUP BY b.id, u.name, u.email
    ORDER BY b.created_at DESC
  `);
  res.json(rows);
});

module.exports = router;
