const router = require('express').Router({ mergeParams: true });
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const TEMPLATES = [
  // Spring
  { key: 'antifouling',      name_en: 'Antifouling',                name_no: 'Bunnstoff',                season: 'spring', sort_order: 1 },
  { key: 'hull_inspection',  name_en: 'Hull Inspection',             name_no: 'Skrogsjekk',               season: 'spring', sort_order: 2 },
  { key: 'sea_cocks',        name_en: 'Sea Cocks Service',           name_no: 'Sjøkraner service',        season: 'spring', sort_order: 3 },
  { key: 'engine_service',   name_en: 'Engine Service',              name_no: 'Motorservice',             season: 'spring', sort_order: 4 },
  { key: 'battery_check',    name_en: 'Battery Check & Charge',      name_no: 'Batterikontroll',          season: 'spring', sort_order: 5 },
  { key: 'safety_gear',      name_en: 'Safety Gear Inspection',      name_no: 'Sikkerhetsutstyr sjekk',   season: 'spring', sort_order: 6 },
  { key: 'rigging_check',    name_en: 'Rigging Inspection',          name_no: 'Riggkontroll',             season: 'spring', sort_order: 7 },
  { key: 'winch_service',    name_en: 'Winch Service & Lubrication', name_no: 'Vinsjeservice og smøring', season: 'spring', sort_order: 8 },
  { key: 'sail_inspection',  name_en: 'Sail Inspection',             name_no: 'Seilsjekk',                season: 'spring', sort_order: 9 },
  { key: 'through_hull',     name_en: 'Through-Hull Fittings',       name_no: 'Gjennomføringer',          season: 'spring', sort_order: 10 },
  // Summer
  { key: 'nav_lights',       name_en: 'Navigation Lights Check',     name_no: 'Navigasjonslys sjekk',    season: 'summer', sort_order: 1 },
  { key: 'bilge_pump',       name_en: 'Bilge Pump Test',             name_no: 'Lensepumpe test',          season: 'summer', sort_order: 2 },
  { key: 'epirb_check',      name_en: 'EPIRB / PLB Check',           name_no: 'EPIRB / PLB sjekk',       season: 'summer', sort_order: 3 },
  { key: 'flares_check',     name_en: 'Flares Expiry Check',         name_no: 'Nødbluss utløpsdato',     season: 'summer', sort_order: 4 },
  // Autumn
  { key: 'winterize_engine', name_en: 'Engine Winterizing',          name_no: 'Vinterlegging motor',     season: 'autumn', sort_order: 1 },
  { key: 'sail_storage',     name_en: 'Sail Cleaning & Storage',     name_no: 'Seilrens og lagring',     season: 'autumn', sort_order: 2 },
  { key: 'freshwater_drain', name_en: 'Freshwater System Drain',     name_no: 'Tøm ferskvannssystem',   season: 'autumn', sort_order: 3 },
  { key: 'hull_wash',        name_en: 'Hull Wash & Wax',             name_no: 'Skrogvask og voks',       season: 'autumn', sort_order: 4 },
  { key: 'battery_winter',   name_en: 'Battery Maintenance',         name_no: 'Batteristell',             season: 'autumn', sort_order: 5 },
  // Winter
  { key: 'insurance',        name_en: 'Insurance Renewal',           name_no: 'Fornyelse forsikring',    season: 'winter', sort_order: 1 },
  { key: 'mooring_check',    name_en: 'Mooring & Dock Lines',        name_no: 'Fortøyning og tauverk',   season: 'winter', sort_order: 2 },
  { key: 'equipment_inv',    name_en: 'Equipment Inventory',         name_no: 'Utstyrsinventar',          season: 'winter', sort_order: 3 },
  { key: 'vhf_service',      name_en: 'VHF Radio Service',           name_no: 'VHF radio service',       season: 'winter', sort_order: 4 },
];

async function requireBoatOwner(req, res) {
  const { rows } = await pool.query('SELECT user_id FROM boats WHERE id = $1', [req.params.boatId]);
  if (!rows.length) { res.status(404).json({ error: 'Boat not found' }); return null; }
  if (rows[0].user_id !== req.user.id) { res.status(403).json({ error: 'Forbidden' }); return null; }
  return rows[0];
}

async function seedTasks(boatId) {
  const { rows } = await pool.query(
    'SELECT id FROM maintenance_tasks WHERE boat_id = $1 LIMIT 1',
    [boatId]
  );
  if (rows.length) return;
  for (const tmpl of TEMPLATES) {
    await pool.query(
      `INSERT INTO maintenance_tasks (boat_id, template_key, name_en, name_no, season, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [boatId, tmpl.key, tmpl.name_en, tmpl.name_no, tmpl.season, tmpl.sort_order]
    );
  }
}

// Tasks
router.get('/tasks', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;
  await seedTasks(req.params.boatId);
  const { rows } = await pool.query(
    `SELECT t.*,
       (SELECT completed_date FROM maintenance_logs l
        WHERE l.task_id = t.id ORDER BY l.completed_date DESC LIMIT 1) AS last_completed
     FROM maintenance_tasks t
     WHERE t.boat_id = $1
     ORDER BY t.season, t.sort_order, t.created_at`,
    [req.params.boatId]
  );
  res.json(rows);
});

router.post('/tasks', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;
  const { name, season } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Task name is required' });
  if (!['spring', 'summer', 'autumn', 'winter'].includes(season))
    return res.status(400).json({ error: 'Invalid season' });
  const { rows } = await pool.query(
    `INSERT INTO maintenance_tasks (boat_id, name_en, name_no, season, is_custom, sort_order)
     VALUES ($1, $2, $2, $3, TRUE, 999) RETURNING *`,
    [req.params.boatId, name.trim(), season]
  );
  res.status(201).json({ ...rows[0], last_completed: null });
});

router.patch('/tasks/:taskId', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;
  const { rows: found } = await pool.query(
    'SELECT * FROM maintenance_tasks WHERE id = $1 AND boat_id = $2',
    [req.params.taskId, req.params.boatId]
  );
  if (!found.length) return res.status(404).json({ error: 'Task not found' });
  const task = found[0];
  const { is_active, name } = req.body;
  const fields = [];
  const vals = [];
  if (is_active !== undefined) { fields.push(`is_active = $${fields.length + 1}`); vals.push(is_active); }
  if (name && task.is_custom) {
    fields.push(`name_en = $${fields.length + 1}`, `name_no = $${fields.length + 2}`);
    vals.push(name.trim(), name.trim());
  }
  if (!fields.length) return res.json(task);
  vals.push(req.params.taskId);
  const { rows } = await pool.query(
    `UPDATE maintenance_tasks SET ${fields.join(', ')} WHERE id = $${vals.length} RETURNING *`,
    vals
  );
  res.json(rows[0]);
});

router.delete('/tasks/:taskId', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;
  const { rows } = await pool.query(
    'SELECT * FROM maintenance_tasks WHERE id = $1 AND boat_id = $2',
    [req.params.taskId, req.params.boatId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Task not found' });
  if (rows[0].is_custom) {
    await pool.query('DELETE FROM maintenance_tasks WHERE id = $1', [req.params.taskId]);
  } else {
    await pool.query('UPDATE maintenance_tasks SET is_active = FALSE WHERE id = $1', [req.params.taskId]);
  }
  res.json({ ok: true });
});

// Logs
router.get('/logs', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;
  const { year } = req.query;
  const params = [req.params.boatId];
  let yearFilter = '';
  if (year) {
    params.push(parseInt(year));
    yearFilter = `AND EXTRACT(YEAR FROM l.completed_date) = $${params.length}`;
  }
  const { rows } = await pool.query(
    `SELECT l.*, t.name_en, t.name_no, t.season, t.template_key,
       COALESCE(
         json_agg(json_build_object('id', p.id, 'category', p.category, 'created_at', p.created_at)
           ORDER BY p.created_at) FILTER (WHERE p.id IS NOT NULL),
         '[]'
       ) AS photos
     FROM maintenance_logs l
     JOIN maintenance_tasks t ON t.id = l.task_id
     LEFT JOIN maintenance_photos p ON p.log_id = l.id
     WHERE t.boat_id = $1 ${yearFilter}
     GROUP BY l.id, t.name_en, t.name_no, t.season, t.template_key
     ORDER BY l.completed_date DESC`,
    params
  );
  res.json(rows);
});

router.get('/logs/:logId', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;
  const { rows } = await pool.query(
    `SELECT l.*, t.name_en, t.name_no, t.season,
       COALESCE(
         json_agg(json_build_object('id', p.id, 'category', p.category, 'data', p.data, 'created_at', p.created_at)
           ORDER BY p.created_at) FILTER (WHERE p.id IS NOT NULL),
         '[]'
       ) AS photos
     FROM maintenance_logs l
     JOIN maintenance_tasks t ON t.id = l.task_id
     LEFT JOIN maintenance_photos p ON p.log_id = l.id
     WHERE l.id = $1 AND t.boat_id = $2
     GROUP BY l.id, t.name_en, t.name_no, t.season`,
    [req.params.logId, req.params.boatId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Log not found' });
  res.json(rows[0]);
});

router.post('/logs', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;
  const { task_id, completed_date, notes, cost_nok, photos } = req.body;
  if (!task_id || !completed_date) return res.status(400).json({ error: 'task_id and completed_date required' });
  const { rows: taskRows } = await pool.query(
    'SELECT id FROM maintenance_tasks WHERE id = $1 AND boat_id = $2',
    [task_id, req.params.boatId]
  );
  if (!taskRows.length) return res.status(404).json({ error: 'Task not found' });
  const { rows: logRows } = await pool.query(
    `INSERT INTO maintenance_logs (task_id, completed_date, notes, cost_nok)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [task_id, completed_date, notes || null, cost_nok || null]
  );
  const log = logRows[0];
  if (Array.isArray(photos)) {
    for (const p of photos) {
      if (!p.data || !['job', 'receipt'].includes(p.category)) continue;
      await pool.query(
        'INSERT INTO maintenance_photos (log_id, data, category) VALUES ($1, $2, $3)',
        [log.id, p.data, p.category]
      );
    }
  }
  const { rows } = await pool.query(
    `SELECT l.*,
       COALESCE(
         json_agg(json_build_object('id', p.id, 'category', p.category, 'created_at', p.created_at)
           ORDER BY p.created_at) FILTER (WHERE p.id IS NOT NULL),
         '[]'
       ) AS photos
     FROM maintenance_logs l
     LEFT JOIN maintenance_photos p ON p.log_id = l.id
     WHERE l.id = $1 GROUP BY l.id`,
    [log.id]
  );
  res.status(201).json(rows[0]);
});

router.put('/logs/:logId', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;
  const { rows: existing } = await pool.query(
    `SELECT l.* FROM maintenance_logs l
     JOIN maintenance_tasks t ON t.id = l.task_id
     WHERE l.id = $1 AND t.boat_id = $2`,
    [req.params.logId, req.params.boatId]
  );
  if (!existing.length) return res.status(404).json({ error: 'Log not found' });
  const e = existing[0];
  const { completed_date, notes, cost_nok } = req.body;
  const { rows } = await pool.query(
    `UPDATE maintenance_logs SET completed_date=$1, notes=$2, cost_nok=$3, updated_at=NOW()
     WHERE id=$4 RETURNING *`,
    [completed_date || e.completed_date, notes ?? e.notes, cost_nok ?? e.cost_nok, req.params.logId]
  );
  res.json(rows[0]);
});

router.delete('/logs/:logId', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;
  const { rows } = await pool.query(
    `SELECT l.id FROM maintenance_logs l
     JOIN maintenance_tasks t ON t.id = l.task_id
     WHERE l.id = $1 AND t.boat_id = $2`,
    [req.params.logId, req.params.boatId]
  );
  if (!rows.length) return res.status(404).json({ error: 'Log not found' });
  await pool.query('DELETE FROM maintenance_logs WHERE id = $1', [req.params.logId]);
  res.json({ ok: true });
});

// Photos
router.post('/logs/:logId/photos', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;
  const { rows: logRows } = await pool.query(
    `SELECT l.id FROM maintenance_logs l
     JOIN maintenance_tasks t ON t.id = l.task_id
     WHERE l.id = $1 AND t.boat_id = $2`,
    [req.params.logId, req.params.boatId]
  );
  if (!logRows.length) return res.status(404).json({ error: 'Log not found' });
  const { data, category } = req.body;
  if (!data || !['job', 'receipt'].includes(category))
    return res.status(400).json({ error: 'data and valid category required' });
  const { rows } = await pool.query(
    'INSERT INTO maintenance_photos (log_id, data, category) VALUES ($1, $2, $3) RETURNING id, category, created_at',
    [req.params.logId, data, category]
  );
  res.status(201).json(rows[0]);
});

router.delete('/logs/:logId/photos/:photoId', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;
  await pool.query(
    'DELETE FROM maintenance_photos WHERE id = $1 AND log_id = $2',
    [req.params.photoId, req.params.logId]
  );
  res.json({ ok: true });
});

// Summary
router.get('/summary', authenticate, async (req, res) => {
  const boat = await requireBoatOwner(req, res);
  if (!boat) return;
  const { rows } = await pool.query(
    `SELECT EXTRACT(YEAR FROM l.completed_date)::INTEGER AS year,
       t.season,
       COALESCE(SUM(l.cost_nok), 0)::NUMERIC AS total_cost,
       COUNT(l.id) AS task_count
     FROM maintenance_logs l
     JOIN maintenance_tasks t ON t.id = l.task_id
     WHERE t.boat_id = $1
     GROUP BY year, t.season
     ORDER BY year DESC, t.season`,
    [req.params.boatId]
  );
  res.json(rows);
});

module.exports = router;
