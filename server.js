// Math Blast server: serves the static game and runs live rooms.
// No dependencies — plain Node http, JSON POSTs, and Server-Sent Events for live updates.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { newPlayerStats, scoreAnswer, scoreSkip } from './public/js/scoring.js';
import { GRADES, topicsForGrade } from './public/js/questions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 3000;

const MAX_PLAYERS = 150;
const ROOM_IDLE_MS = 4 * 60 * 60 * 1000;
const MIN_ANSWER_GAP_MS = 350;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

/** @type {Map<string, any>} */
const rooms = new Map();

function newCode() {
  let code;
  do code = String(crypto.randomInt(100000, 1000000));
  while (rooms.has(code));
  return code;
}

function publicState(room) {
  const players = [...room.players.values()]
    .map(p => ({
      id: p.id, name: p.name, avatar: p.avatar, score: p.score, correct: p.correct,
      answered: p.answered, skipped: p.skipped, streak: p.streak, bestStreak: p.bestStreak,
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return {
    code: room.code,
    grade: room.grade,
    topics: room.topics,
    status: room.status,
    duration: room.duration,
    endsAt: room.endsAt,
    serverNow: Date.now(),
    goal: room.goal,
    classTotal: players.reduce((s, p) => s + p.score, 0),
    goalReachedAt: room.goalReachedAt,
    players,
    feed: room.feed.slice(-10),
  };
}

function send(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// Coalesce bursts of answers into at most one broadcast per interval.
function broadcast(room) {
  if (room.broadcastTimer) return;
  room.broadcastTimer = setTimeout(() => {
    room.broadcastTimer = null;
    const state = publicState(room);
    for (const res of room.clients) send(res, 'state', state);
  }, 200);
}

function pushFeed(room, text, type = 'info') {
  room.feed.push({ id: crypto.randomUUID(), text, type, at: Date.now() });
  if (room.feed.length > 30) room.feed.shift();
}

function endRoom(room) {
  if (room.status === 'ended') return;
  room.status = 'ended';
  room.endsAt = Date.now();
  pushFeed(room, '🏁 Time is up!');
  broadcast(room);
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10_000) throw new Error('Body too large');
  }
  return raw ? JSON.parse(raw) : {};
}

function cleanName(name) {
  return String(name ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16);
}

function uniqueName(room, name) {
  const taken = new Set([...room.players.values()].map(p => p.name.toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  for (let i = 2; ; i++) {
    const candidate = `${name.slice(0, 13)} ${i}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
}

function requireHost(room, key) {
  return room && typeof key === 'string' && key === room.hostKey;
}

const api = {
  'POST /api/rooms': async (req, res) => {
    const body = await readBody(req);
    const grade = GRADES.some(g => g.id === body.grade) ? body.grade : 3;
    const allTopics = topicsForGrade(grade).map(t => t.id);
    let topics = Array.isArray(body.topics) ? body.topics.filter(t => allTopics.includes(t)) : [];
    if (!topics.length) topics = allTopics;
    const duration = [0, 120, 180, 300, 420, 600, 900].includes(body.duration) ? body.duration : 300;
    const goal = Math.min(Math.max(Number(body.goal) || 20000, 1000), 10_000_000);
    const room = {
      code: newCode(), hostKey: crypto.randomUUID(), grade, topics, duration, goal,
      status: 'lobby', endsAt: null, goalReachedAt: null,
      players: new Map(), feed: [], clients: new Set(), lastActive: Date.now(), broadcastTimer: null,
    };
    rooms.set(room.code, room);
    json(res, 200, { code: room.code, hostKey: room.hostKey });
  },

  'GET /api/rooms/:code': (req, res, room) => {
    json(res, 200, publicState(room));
  },

  'POST /api/rooms/:code/join': async (req, res, room) => {
    const body = await readBody(req);
    if (room.status === 'ended') return json(res, 409, { error: 'That game has already ended.' });
    const existing = body.playerId && room.players.get(body.playerId);
    if (existing) return json(res, 200, { playerId: existing.id, name: existing.name });
    if (room.players.size >= MAX_PLAYERS) return json(res, 409, { error: 'This room is full.' });
    const name = cleanName(body.name);
    if (!name) return json(res, 400, { error: 'Please type a nickname.' });
    const player = {
      id: crypto.randomUUID(), name: uniqueName(room, name),
      avatar: String(body.avatar ?? '🦊').slice(0, 8), lastAnswerAt: 0, ...newPlayerStats(),
    };
    room.players.set(player.id, player);
    pushFeed(room, `${player.avatar} ${player.name} joined!`);
    broadcast(room);
    json(res, 200, { playerId: player.id, name: player.name });
  },

  'POST /api/rooms/:code/answer': async (req, res, room) => {
    const body = await readBody(req);
    const player = room.players.get(body.playerId);
    if (!player) return json(res, 404, { error: 'Player not found.' });
    if (room.status !== 'playing') return json(res, 409, { error: 'Game is not running.', status: room.status });
    const now = Date.now();
    if (now - player.lastAnswerAt < MIN_ANSWER_GAP_MS) return json(res, 429, { error: 'Slow down!' });
    player.lastAnswerAt = now;

    let result;
    if (body.skipped === true) {
      result = scoreSkip(player);
      pushFeed(room, `🙈 ${player.name.toUpperCase()} SKIPPED A QUESTION!!`, 'skip');
    } else {
      const ms = Math.max(0, Math.min(Number(body.ms) || 10000, 600000));
      result = scoreAnswer(player, { correct: body.correct === true, ms });
    }
    if (player.streak > 0 && player.streak % 5 === 0) {
      pushFeed(room, `🔥 ${player.name} is on a ${player.streak} streak!`);
    }
    if (result.chest) pushFeed(room, `${result.chest.icon} ${player.name} opened a chest: ${result.chest.label}`);

    const total = [...room.players.values()].reduce((s, p) => s + p.score, 0);
    if (!room.goalReachedAt && total >= room.goal) {
      room.goalReachedAt = now;
      pushFeed(room, '🚀 CLASS GOAL REACHED! Amazing teamwork!');
    }
    broadcast(room);
    json(res, 200, {
      ...result, score: player.score, streak: player.streak, mult: player.mult, multLeft: player.multLeft,
    });
  },

  'POST /api/rooms/:code/start': async (req, res, room) => {
    const body = await readBody(req);
    if (!requireHost(room, body.key)) return json(res, 403, { error: 'Only the host can do that.' });
    if (room.status === 'lobby') {
      room.status = 'playing';
      room.endsAt = room.duration ? Date.now() + room.duration * 1000 : null;
      pushFeed(room, '🎬 Game started — go go go!');
      broadcast(room);
    }
    json(res, 200, { ok: true });
  },

  'POST /api/rooms/:code/end': async (req, res, room) => {
    const body = await readBody(req);
    if (!requireHost(room, body.key)) return json(res, 403, { error: 'Only the host can do that.' });
    endRoom(room);
    json(res, 200, { ok: true });
  },

  'POST /api/rooms/:code/kick': async (req, res, room) => {
    const body = await readBody(req);
    if (!requireHost(room, body.key)) return json(res, 403, { error: 'Only the host can do that.' });
    room.players.delete(body.playerId);
    broadcast(room);
    json(res, 200, { ok: true });
  },

  'GET /api/rooms/:code/stream': (req, res, room) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 2000\n\n');
    send(res, 'state', publicState(room));
    room.clients.add(res);
    const heartbeat = setInterval(() => res.write(': ping\n\n'), 15000);
    req.on('close', () => {
      clearInterval(heartbeat);
      room.clients.delete(res);
    });
  },
};

function matchRoute(method, pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'api' || parts[1] !== 'rooms') return null;
  if (parts.length === 2) return { key: `${method} /api/rooms` };
  const code = parts[2];
  const rest = parts.slice(3).join('/');
  return { key: `${method} /api/rooms/:code${rest ? '/' + rest : ''}`, code };
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end();
    return;
  }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  const route = matchRoute(req.method, pathname);
  if (!route) return serveStatic(req, res, pathname);

  const handler = api[route.key];
  if (!handler) return json(res, 404, { error: 'Unknown endpoint.' });
  let room;
  if (route.code) {
    room = rooms.get(route.code);
    if (!room) return json(res, 404, { error: "We couldn't find a game with that code." });
    room.lastActive = Date.now();
  }
  try {
    await handler(req, res, room);
  } catch (err) {
    json(res, 400, { error: err.message || 'Bad request.' });
  }
});

// End timed games and clean up abandoned rooms.
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (room.status === 'playing' && room.endsAt && now >= room.endsAt) endRoom(room);
    if (now - room.lastActive > ROOM_IDLE_MS && room.clients.size === 0) rooms.delete(code);
  }
}, 500).unref();

server.listen(PORT, () => {
  console.log(`🚀 Math Blast is running at http://localhost:${PORT}`);
});
