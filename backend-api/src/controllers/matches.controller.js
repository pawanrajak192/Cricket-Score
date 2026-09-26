import { pool } from '../db.js';

function rowToMatch(row) {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : row.date,
    matchType: row.match_type,
    oversLimit: row.overs_limit,
    wicketsLimit: row.wickets_limit,
    powerplayOvers: row.powerplay_overs,
    status: row.status,
    teamA: row.team_a,
    teamB: row.team_b,
    toss: row.toss,
    innings: row.innings,
    result: row.result,
    createdAt: Number(row.created_at)
  };
}

export async function listMine(req, res) {
  const [rows] = await pool.query('SELECT * FROM matches WHERE owner_id = :ownerId ORDER BY created_at DESC', { ownerId: req.userId });
  res.json({ matches: rows.map(rowToMatch) });
}

export async function getPublic(req, res) {
  const [rows] = await pool.query('SELECT * FROM matches WHERE id = :id', { id: req.params.id });
  if (!rows[0]) return res.status(404).json({ error: 'Match not found.' });
  res.json({ match: rowToMatch(rows[0]) });
}

export async function create(req, res) {
  const m = req.body || {};
  if (!m.id || !m.name || !m.teamA || !m.teamB) return res.status(400).json({ error: 'Missing required match fields.' });

  await pool.query(
    `INSERT INTO matches
      (id, owner_id, name, date, match_type, overs_limit, wickets_limit, powerplay_overs, status, team_a, team_b, toss, innings, result, created_at)
     VALUES
      (:id, :ownerId, :name, :date, :matchType, :oversLimit, :wicketsLimit, :powerplayOvers, :status, :teamA, :teamB, :toss, :innings, :result, :createdAt)
     ON DUPLICATE KEY UPDATE
      name = VALUES(name), date = VALUES(date), match_type = VALUES(match_type),
      overs_limit = VALUES(overs_limit), wickets_limit = VALUES(wickets_limit), powerplay_overs = VALUES(powerplay_overs),
      status = VALUES(status), team_a = VALUES(team_a), team_b = VALUES(team_b), toss = VALUES(toss),
      innings = VALUES(innings), result = VALUES(result)`,
    {
      id: m.id, ownerId: req.userId, name: m.name, date: m.date, matchType: m.matchType,
      oversLimit: m.oversLimit ?? null, wicketsLimit: m.wicketsLimit ?? 10, powerplayOvers: m.powerplayOvers ?? null,
      status: m.status || 'draft', teamA: JSON.stringify(m.teamA), teamB: JSON.stringify(m.teamB),
      toss: m.toss ? JSON.stringify(m.toss) : null, innings: JSON.stringify(m.innings || []),
      result: m.result ? JSON.stringify(m.result) : null, createdAt: m.createdAt || Date.now()
    }
  );
  res.status(201).json({ match: m });
}

export async function update(req, res) {
  const [rows] = await pool.query('SELECT owner_id FROM matches WHERE id = :id', { id: req.params.id });
  if (!rows[0]) return res.status(404).json({ error: 'Match not found.' });
  if (rows[0].owner_id !== req.userId) return res.status(403).json({ error: 'Not your match.' });

  const m = req.body || {};
  await pool.query(
    `UPDATE matches SET
      name = :name, date = :date, match_type = :matchType, overs_limit = :oversLimit,
      wickets_limit = :wicketsLimit, powerplay_overs = :powerplayOvers, status = :status,
      team_a = :teamA, team_b = :teamB, toss = :toss, innings = :innings, result = :result
     WHERE id = :id`,
    {
      id: req.params.id, name: m.name, date: m.date, matchType: m.matchType,
      oversLimit: m.oversLimit ?? null, wicketsLimit: m.wicketsLimit ?? 10, powerplayOvers: m.powerplayOvers ?? null,
      status: m.status || 'draft', teamA: JSON.stringify(m.teamA), teamB: JSON.stringify(m.teamB),
      toss: m.toss ? JSON.stringify(m.toss) : null, innings: JSON.stringify(m.innings || []),
      result: m.result ? JSON.stringify(m.result) : null
    }
  );
  res.json({ match: { ...m, id: req.params.id } });
}

export async function remove(req, res) {
  const [rows] = await pool.query('SELECT owner_id FROM matches WHERE id = :id', { id: req.params.id });
  if (!rows[0]) return res.status(404).json({ error: 'Match not found.' });
  if (rows[0].owner_id !== req.userId) return res.status(403).json({ error: 'Not your match.' });
  await pool.query('DELETE FROM matches WHERE id = :id', { id: req.params.id });
  res.status(204).end();
}
