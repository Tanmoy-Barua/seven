import bcrypt from 'bcryptjs';
import cors from 'cors';
import crypto from 'node:crypto';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, todayKey } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getUserFromRequest(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.username, u.start_date
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
    )
    .get(token);
  return row || null;
}

function requireAuth(req, res, next) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'Please log in.' });
    return;
  }
  req.user = user;
  next();
}

function loadStateForUser(user) {
  const dayRows = db
    .prepare(
      `SELECT date, habits_json, schedule_json, hard_thing_note, focus_minutes, notes
       FROM day_logs WHERE user_id = ? ORDER BY date ASC`,
    )
    .all(user.id);

  const days = {};
  for (const row of dayRows) {
    days[row.date] = {
      date: row.date,
      habits: JSON.parse(row.habits_json || '{}'),
      scheduleDone: JSON.parse(row.schedule_json || '{}'),
      hardThingNote: row.hard_thing_note || '',
      focusMinutes: row.focus_minutes || 0,
      notes: row.notes || '',
    };
  }

  const triggers = db
    .prepare(
      `SELECT id, identity, trigger_text AS trigger, created_at AS createdAt
       FROM triggers WHERE user_id = ? ORDER BY created_at DESC`,
    )
    .all(user.id)
    .map((t) => ({
      id: t.id,
      identity: t.identity,
      trigger: t.trigger,
      createdAt: t.createdAt,
    }));

  return {
    days,
    triggers,
    startDate: user.start_date,
  };
}

function saveStateForUser(userId, state) {
  const upsertDay = db.prepare(`
    INSERT INTO day_logs (user_id, date, habits_json, schedule_json, hard_thing_note, focus_minutes, notes, updated_at)
    VALUES (@user_id, @date, @habits_json, @schedule_json, @hard_thing_note, @focus_minutes, @notes, datetime('now'))
    ON CONFLICT(user_id, date) DO UPDATE SET
      habits_json = excluded.habits_json,
      schedule_json = excluded.schedule_json,
      hard_thing_note = excluded.hard_thing_note,
      focus_minutes = excluded.focus_minutes,
      notes = excluded.notes,
      updated_at = datetime('now')
  `);

  const deleteTriggers = db.prepare(`DELETE FROM triggers WHERE user_id = ?`);
  const insertTrigger = db.prepare(`
    INSERT INTO triggers (id, user_id, identity, trigger_text, created_at)
    VALUES (@id, @user_id, @identity, @trigger_text, @created_at)
  `);

  const updateStart = db.prepare(`UPDATE users SET start_date = ? WHERE id = ?`);

  const tx = db.transaction(() => {
    if (state.startDate) {
      updateStart.run(state.startDate, userId);
    }

    const days = state.days || {};
    for (const day of Object.values(days)) {
      upsertDay.run({
        user_id: userId,
        date: day.date,
        habits_json: JSON.stringify(day.habits || {}),
        schedule_json: JSON.stringify(day.scheduleDone || {}),
        hard_thing_note: day.hardThingNote || '',
        focus_minutes: day.focusMinutes || 0,
        notes: day.notes || '',
      });
    }

    deleteTriggers.run(userId);
    for (const t of state.triggers || []) {
      insertTrigger.run({
        id: t.id,
        user_id: userId,
        identity: t.identity,
        trigger_text: t.trigger,
        created_at: t.createdAt || new Date().toISOString(),
      });
    }
  });

  tx();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (username.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  const existing = db.prepare(`SELECT id FROM users WHERE username = ?`).get(username);
  if (existing) {
    res.status(409).json({ error: 'That username is taken.' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const startDate = todayKey();
  const info = db
    .prepare(`INSERT INTO users (username, password_hash, start_date) VALUES (?, ?, ?)`)
    .run(username, passwordHash, startDate);

  const token = createToken();
  db.prepare(`INSERT INTO sessions (token, user_id) VALUES (?, ?)`).run(token, info.lastInsertRowid);

  res.status(201).json({
    token,
    user: { id: info.lastInsertRowid, username, startDate },
  });
});

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  const user = db
    .prepare(`SELECT id, username, password_hash, start_date FROM users WHERE username = ?`)
    .get(username);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Wrong username or password.' });
    return;
  }

  const token = createToken();
  db.prepare(`INSERT INTO sessions (token, user_id) VALUES (?, ?)`).run(token, user.id);

  res.json({
    token,
    user: { id: user.id, username: user.username, startDate: user.start_date },
  });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
  }
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      startDate: req.user.start_date,
    },
  });
});

app.get('/api/state', requireAuth, (req, res) => {
  res.json(loadStateForUser(req.user));
});

app.put('/api/state', requireAuth, (req, res) => {
  const state = req.body;
  if (!state || typeof state !== 'object') {
    res.status(400).json({ error: 'Invalid state payload.' });
    return;
  }
  saveStateForUser(req.user.id, state);
  res.json(loadStateForUser(req.user));
});

app.get('/api/history', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT date, habits_json, hard_thing_note, focus_minutes, updated_at
       FROM day_logs WHERE user_id = ? ORDER BY date DESC LIMIT 90`,
    )
    .all(req.user.id)
    .map((row) => {
      const habits = JSON.parse(row.habits_json || '{}');
      const completed = Object.values(habits).filter(Boolean).length;
      return {
        date: row.date,
        completed,
        total: 7,
        hardThingNote: row.hard_thing_note || '',
        focusMinutes: row.focus_minutes || 0,
        updatedAt: row.updated_at,
      };
    });

  res.json({ history: rows });
});

if (isProd) {
  const dist = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(dist, 'index.html'));
    });
  }
}

app.listen(PORT, () => {
  console.log(`SEVEN API listening on http://127.0.0.1:${PORT}`);
});
