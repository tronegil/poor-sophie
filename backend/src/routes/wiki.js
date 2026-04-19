const router = require('express').Router({ mergeParams: true });
const https = require('https');
const http = require('http');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pdfParse = require('pdf-parse/lib/pdf-parse.js');

function fetchBuffer(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timeout')), timeoutMs);
    const mod = url.startsWith('https') ? https : http;
    const chunks = [];
    const req = mod.get(url, (res) => {
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => { clearTimeout(timer); resolve(Buffer.concat(chunks)); });
      res.on('error', err => { clearTimeout(timer); reject(err); });
    });
    req.on('error', err => { clearTimeout(timer); reject(err); });
  });
}

async function requireBoatOwner(req, res) {
  const { rows } = await pool.query('SELECT user_id FROM boats WHERE id = $1', [req.params.boatId]);
  if (!rows.length) { res.status(404).json({ error: 'Boat not found' }); return null; }
  if (rows[0].user_id !== req.user.id) { res.status(403).json({ error: 'Forbidden' }); return null; }
  return rows[0];
}

// List — no file_data to keep payload small
router.get('/items', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;

  const { search } = req.query;
  const params = [req.params.boatId];
  let where = 'WHERE boat_id = $1';
  if (search?.trim()) {
    params.push(`%${search.trim()}%`);
    where += ` AND (title ILIKE $2 OR description ILIKE $2)`;
  }

  const { rows } = await pool.query(
    `SELECT id, boat_id, type, title, description, url, file_name, file_size, youtube_id, created_at, updated_at
     FROM wiki_items ${where} ORDER BY created_at DESC`,
    params
  );
  res.json(rows);
});

// Single item — includes file_data for text viewing
router.get('/items/:id', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;

  const { rows } = await pool.query(
    'SELECT * FROM wiki_items WHERE id = $1 AND boat_id = $2',
    [req.params.id, req.params.boatId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

router.post('/items', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;

  const { type, title, description, url, cloudinary_id, file_data, file_name, file_size, youtube_id } = req.body;

  if (!['pdf', 'text', 'url', 'youtube'].includes(type))
    return res.status(400).json({ error: 'Invalid type' });
  if (!title?.trim())
    return res.status(400).json({ error: 'Title is required' });
  if (type === 'url' && !url)
    return res.status(400).json({ error: 'URL is required' });
  if (type === 'youtube' && !youtube_id)
    return res.status(400).json({ error: 'YouTube ID is required' });
  if (type === 'pdf' && !url)
    return res.status(400).json({ error: 'Cloudinary URL is required' });
  if (type === 'text' && !file_data)
    return res.status(400).json({ error: 'File content is required' });

  if (file_data && Buffer.byteLength(file_data, 'utf8') > 15 * 1024 * 1024)
    return res.status(400).json({ error: 'File too large (max 10 MB)' });

  let storedFileData = type === 'text' ? file_data : null;
  if (type === 'pdf') {
    try {
      const buf = await fetchBuffer(url);
      const parsed = await pdfParse(buf);
      storedFileData = parsed.text || '';
    } catch {
      storedFileData = '';
    }
  }

  const { rows } = await pool.query(
    `INSERT INTO wiki_items (boat_id, type, title, description, url, cloudinary_id, file_data, file_name, file_size, youtube_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [req.params.boatId, type, title.trim(), description || null,
     url || null, cloudinary_id || null, storedFileData,
     file_name || null, file_size || null, youtube_id || null]
  );
  const { file_data: _fd, cloudinary_id: _cid, ...item } = rows[0];
  res.status(201).json(item);
});

router.put('/items/:id', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;

  const { rows: found } = await pool.query(
    'SELECT id FROM wiki_items WHERE id = $1 AND boat_id = $2',
    [req.params.id, req.params.boatId]
  );
  if (!found.length) return res.status(404).json({ error: 'Not found' });

  const { title, description, url } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });

  const { rows } = await pool.query(
    `UPDATE wiki_items SET title=$1, description=$2, url=$3, updated_at=NOW()
     WHERE id=$4
     RETURNING id, boat_id, type, title, description, url, file_name, file_size, youtube_id, created_at, updated_at`,
    [title.trim(), description || null, url || null, req.params.id]
  );
  res.json(rows[0]);
});

router.delete('/items/:id', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;

  const { rows } = await pool.query(
    'SELECT id, type, cloudinary_id FROM wiki_items WHERE id = $1 AND boat_id = $2',
    [req.params.id, req.params.boatId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Not found' });

  const item = rows[0];
  if (item.type === 'pdf' && item.cloudinary_id) {
    try {
      await cloudinary.uploader.destroy(item.cloudinary_id, { resource_type: 'raw' });
    } catch {
      // best-effort cleanup
    }
  }

  await pool.query('DELETE FROM wiki_items WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
