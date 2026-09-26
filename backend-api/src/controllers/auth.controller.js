import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { uid } from '../utils/id.js';
import { signToken } from '../middleware/auth.js';

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email, mobile: row.mobile, guest: false };
}

export async function signup(req, res) {
  const { name, email, mobile, password } = req.body || {};
  if (!name?.trim()) return res.status(400).json({ error: 'Name is required.' });
  if (!email?.trim() && !mobile?.trim()) return res.status(400).json({ error: 'Email or mobile is required.' });
  if (!password || password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters.' });

  const [existing] = await pool.query(
    'SELECT id FROM users WHERE (email IS NOT NULL AND email = :email) OR (mobile IS NOT NULL AND mobile = :mobile)',
    { email: email || null, mobile: mobile || null }
  );
  if (existing.length) return res.status(409).json({ error: 'An account with that email/mobile already exists.' });

  const id = uid('u');
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO users (id, name, email, mobile, password_hash) VALUES (:id, :name, :email, :mobile, :hash)',
    { id, name: name.trim(), email: email?.trim() || null, mobile: mobile?.trim() || null, hash: passwordHash }
  );

  const token = signToken(id);
  res.status(201).json({ token, user: { id, name: name.trim(), email: email || null, mobile: mobile || null, guest: false } });
}

export async function login(req, res) {
  const { identifier, password } = req.body || {};
  if (!identifier || !password) return res.status(400).json({ error: 'Identifier and password are required.' });

  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = :id OR mobile = :id LIMIT 1',
    { id: identifier.trim() }
  );
  const row = rows[0];
  if (!row) return res.status(401).json({ error: 'No matching account. Check your details.' });

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'No matching account. Check your details.' });

  const token = signToken(row.id);
  res.json({ token, user: publicUser(row) });
}

export async function me(req, res) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = :id', { id: req.userId });
  if (!rows[0]) return res.status(404).json({ error: 'User not found.' });
  res.json({ user: publicUser(rows[0]) });
}
