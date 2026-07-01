// Ad-hoc smoke test for the reactive SeasonRanks view-model over WebSockets.
// Subscribes to a season, registers a match via REST, and asserts a live push.
import { io } from 'socket.io-client';

const BASE = 'http://localhost:3000';
const seasonId = 'ws-season-' + process.pid;

const socket = io(BASE, { transports: ['websocket'] });
let pushes = 0;

const done = (ok, msg) => {
  console.log(ok ? `PASS: ${msg}` : `FAIL: ${msg}`);
  socket.close();
  process.exit(ok ? 0 : 1);
};

socket.on('connect', async () => {
  socket.emit('subscribeSeason', seasonId);
});

socket.on('ranks', async (ranks) => {
  pushes += 1;
  if (pushes === 1) {
    // initial snapshot on subscribe
    console.log('initial snapshot ranks:', ranks.ranks.length);
    await fetch(`${BASE}/seasons/${seasonId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leagueid: 'L', rating: 'basic' }),
    });
    await fetch(`${BASE}/seasons/${seasonId}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchid: 'w1', winners: ['p1'], losers: ['p2'] }),
    });
  } else if (pushes === 2) {
    // live push triggered by the registered match
    const p1 = ranks.ranks.find((r) => r.id === 'p1');
    if (p1 && p1.rank === 1510) done(true, 'received live ranks push after match');
    else done(false, 'live push had unexpected data: ' + JSON.stringify(ranks.ranks));
  }
});

socket.on('connect_error', (e) => done(false, 'connect_error: ' + e.message));
setTimeout(() => done(false, 'timed out waiting for live push'), 8000);
