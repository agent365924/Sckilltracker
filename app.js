/* ═══════════════════════════════════════════════════════════
   SC Killtracker — app.js  (ES module)
   ═══════════════════════════════════════════════════════════ */

import { initializeApp }                     from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword,
         onAuthStateChanged }                from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getDatabase, ref, set, remove,
         onValue }                           from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

/* ── Firebase ────────────────────────────────────────────── */
const firebaseConfig = {
  apiKey:            'AIzaSyDcKYqnA2zCk9PiX0-vQM9i7eHI2Gz9Hnw',
  authDomain:        'sckilltracker-ec3d7.firebaseapp.com',
  projectId:         'sckilltracker-ec3d7',
  storageBucket:     'sckilltracker-ec3d7.firebasestorage.app',
  messagingSenderId: '648348318794',
  appId:             '1:648348318794:web:a8dc06931813ffda7bfab3',
  databaseURL:       'https://sckilltracker-ec3d7-default-rtdb.europe-west1.firebasedatabase.app',
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

/* ── Theme ───────────────────────────────────────────────── */
const THEME_KEY = 'pvp_theme';
const SUN_SVG   = `<circle cx="12" cy="12" r="5"/>
  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
const MOON_SVG  = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;

function applyTheme(dark) {
  document.documentElement.classList.toggle('dark', dark);
  const icon = document.getElementById('theme-icon-svg');
  if (icon) icon.innerHTML = dark ? MOON_SVG : SUN_SVG;
}
function toggleTheme() {
  const isDark = !document.documentElement.classList.contains('dark');
  localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  applyTheme(isDark);
}
applyTheme(localStorage.getItem(THEME_KEY) === 'dark');

/* ── Auth ────────────────────────────────────────────────── */
onAuthStateChanged(auth, (user) => {
  const overlay = document.getElementById('login-overlay');
  if (user) {
    overlay.style.transition = 'opacity 0.4s ease';
    overlay.style.opacity    = '0';
    setTimeout(() => overlay.classList.add('hidden'), 400);
    startDatabase();
  } else {
    overlay.classList.remove('hidden');
    overlay.style.opacity = '1';
    document.getElementById('email-input').focus();
  }
});

async function doLogin() {
  const email    = document.getElementById('email-input').value.trim();
  const password = document.getElementById('password-input').value;
  const errorEl  = document.getElementById('login-error');
  const btn      = document.getElementById('login-btn');

  errorEl.classList.remove('visible');
  btn.disabled    = true;
  btn.textContent = '…';

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    errorEl.textContent = 'Incorrect email or password.';
    errorEl.classList.add('visible');
    const pw = document.getElementById('password-input');
    pw.value = '';
    pw.classList.add('shake');
    pw.addEventListener('animationend', () => pw.classList.remove('shake'), { once: true });
    pw.focus();
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Enter';
  }
}

/* ── Status banner ───────────────────────────────────────── */
function setStatus(type, text) {
  const banner = document.getElementById('status-banner');
  banner.className = 'status-banner ' + type;
  document.getElementById('status-text').textContent = text;
  if (type === 'success') setTimeout(() => banner.classList.add('hidden'), 3000);
}

/* ── State ───────────────────────────────────────────────── */
let entries       = [];
let sortColumn    = null;
let sortDirection = 'asc';
let dbStarted     = false;

/* ── Database ────────────────────────────────────────────── */
function startDatabase() {
  if (dbStarted) return;
  dbStarted = true;
  onValue(ref(db, '/'), (snapshot) => {
    const data = snapshot.val();
    entries = data
      ? Object.entries(data).map(([key, val]) => ({ ...val, id: val.id !== undefined ? val.id : key }))
      : [];
    renderTable();
    document.getElementById('add-btn').disabled = false;
    setStatus('success', `Loaded ${entries.length} entries`);
  }, (err) => setStatus('error', 'Database error: ' + err.message));
}

/* ── Helpers ─────────────────────────────────────────────── */
function kdRatio(kills, deaths) {
  return deaths === 0 ? kills.toFixed(2) : (kills / deaths).toFixed(2);
}

// Returns top N most common non-empty strings from an array
function topN(arr, n = 3) {
  const counts = {};
  arr.filter(v => v && v.trim()).forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([val, count]) => ({ val, count }));
}

function mostCommon(arr) {
  const top = topN(arr, 1);
  return top.length ? `${top[0].val} (${top[0].count})` : '—';
}

/* ── Stats ───────────────────────────────────────────────── */
function updateStats() {
  const kills  = entries.filter(e => e.status === 'kill').length;
  const deaths = entries.filter(e => e.status === 'death').length;

  // Overall K/D
  document.getElementById('total-kills').textContent   = kills;
  document.getElementById('total-deaths').textContent  = deaths;
  document.getElementById('kd-ratio').textContent      = kdRatio(kills, deaths);
  document.getElementById('total-entries').textContent = entries.length;

  // FPS K/D
  const fpsTypes  = ['fps', 'eva'];
  const fpsKills  = entries.filter(e => e.status === 'kill'  && fpsTypes.includes((e.type || '').toLowerCase())).length;
  const fpsDeaths = entries.filter(e => e.status === 'death' && fpsTypes.includes((e.type || '').toLowerCase())).length;
  document.getElementById('kd-fps').textContent = kdRatio(fpsKills, fpsDeaths);

  // S2S K/D
  const s2sKills  = entries.filter(e => e.status === 'kill'  && (e.type || '').toLowerCase() === 's2s').length;
  const s2sDeaths = entries.filter(e => e.status === 'death' && (e.type || '').toLowerCase() === 's2s').length;
  document.getElementById('kd-s2s').textContent = kdRatio(s2sKills, s2sDeaths);

  // FPS kill count
  document.getElementById('fps-count').textContent = fpsKills + fpsDeaths;

  // Ship stats — fixed list, count substring matches in weaponShip across all entries
  const SHIP_GROUPS = [
    { label: 'Gladius',          terms: ['gladius'] },
    { label: 'Sabre',            terms: ['sabre'] },
    { label: 'Vanguard/Warden',  terms: ['vanguard', 'warden'] },
    { label: 'Avenger/Titan',    terms: ['avenger', 'titan'] },
    { label: 'Arrow',            terms: ['arrow'] },
  ];
  const shipCounts = SHIP_GROUPS.map(({ label, terms }) => ({
    val:   label,
    count: entries.filter(e => {
      const w = (e.weaponShip || '').toLowerCase();
      return terms.some(t => w.includes(t));
    }).length,
  })).filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count);
  renderWeaponSection('section-s2s-weapons', shipCounts, 'badge-ship', 'No ship data');

  // Top 3 FPS weapons
  const fpsWeapons = entries
    .filter(e => fpsTypes.includes((e.type || '').toLowerCase()))
    .map(e => (e.weaponShip || '').trim());
  renderWeaponSection('section-fps-weapons', topN(fpsWeapons), 'badge-fps', '');

  // Bottom stats
  document.getElementById('top-opponent').textContent   = mostCommon(entries.map(e => (e.opposingShip || '').trim()));
  document.getElementById('top-death-type').textContent = mostCommon(entries.filter(e => e.status === 'death').map(e => (e.type || '').trim()));
  document.getElementById('top-location').textContent   = mostCommon(entries.map(e => (e.location || '').trim()));

  drawKDGraph();
}

function renderWeaponSection(id, topWeapons, badgeClass, emptyText) {
  const el = document.getElementById(id);
  if (!topWeapons.length) {
    el.innerHTML = emptyText ? `<span class="info-box-label" style="opacity:0.5;">${emptyText}</span>` : '';
    return;
  }
  el.innerHTML = topWeapons.map(({ val, count }) => `
    <div class="info-box-stat">
      <span class="info-box-label">${val}</span>
      <span class="${badgeClass}">${count}</span>
    </div>
  `).join('');
}

/* ── K/D Graph ───────────────────────────────────────────── */
function parseEntryDate(str) {
  if (!str) return null;
  const dp = str.trim().split(' ')[0].split('.');
  if (dp.length < 3) return null;
  return new Date(parseInt(dp[2]), parseInt(dp[1]) - 1, parseInt(dp[0]));
}

function drawKDGraph() {
  const canvas = document.getElementById('kd-canvas');
  if (!canvas) return;
  const card = canvas.parentElement;
  canvas.width  = card.offsetWidth;
  canvas.height = card.offsetHeight;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const dated = entries
    .map(e => ({ date: parseEntryDate(e.dateTime), status: e.status }))
    .filter(e => e.date)
    .sort((a, b) => a.date - b.date);
  if (dated.length < 2) return;

  let k = 0, d = 0;
  const points = dated.map(e => {
    if (e.status === 'kill')  k++;
    if (e.status === 'death') d++;
    return { date: e.date, kd: d === 0 ? k : k / d };
  });

  const W = canvas.width, H = canvas.height;
  const PB = 22, PX = 8, cH = H - PB;
  const minKD = Math.min(...points.map(p => p.kd));
  const maxKD = Math.max(...points.map(p => p.kd));
  const kdR   = maxKD - minKD || 1;
  const minD  = points[0].date.getTime();
  const maxD  = points[points.length - 1].date.getTime();
  const dR    = maxD - minD || 1;

  const toX = dt => PX + ((dt.getTime() - minD) / dR) * (W - PX * 2);
  const toY = v  => PB + (1 - (v - minKD) / kdR) * (cH - PB - 8);

  // Filled area — brighter blue
  ctx.beginPath();
  ctx.moveTo(toX(points[0].date), cH);
  points.forEach(p => ctx.lineTo(toX(p.date), toY(p.kd)));
  ctx.lineTo(toX(points[points.length - 1].date), cH);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, 0, cH);
  g.addColorStop(0, 'rgba(96,165,250,0.75)');
  g.addColorStop(1, 'rgba(96,165,250,0.05)');
  ctx.fillStyle = g; ctx.fill();

  // Line — brighter, thicker
  ctx.beginPath();
  points.forEach((p, i) => i === 0 ? ctx.moveTo(toX(p.date), toY(p.kd)) : ctx.lineTo(toX(p.date), toY(p.kd)));
  ctx.strokeStyle = 'rgba(147,197,253,0.95)';
  ctx.lineWidth   = 2;
  ctx.lineJoin    = 'round';
  ctx.stroke();

  // Year labels
  const y0 = points[0].date.getFullYear(), y1 = points[points.length - 1].date.getFullYear();
  ctx.fillStyle = 'rgba(148,163,184,0.9)'; ctx.font = '9px -apple-system,sans-serif';
  for (let y = y0; y <= y1; y++) {
    const x = toX(new Date(y, 0, 1));
    if (x > PX && x < W - PX) {
      ctx.textAlign = 'center'; ctx.fillText(y, x, H - 5);
      ctx.beginPath(); ctx.moveTo(x, cH); ctx.lineTo(x, cH + 3);
      ctx.strokeStyle = 'rgba(148,163,184,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  ctx.textAlign = 'left';  ctx.fillText(y0, PX, H - 5);
  if (y0 !== y1) { ctx.textAlign = 'right'; ctx.fillText(y1, W - PX, H - 5); }
}

/* ── Sorting ─────────────────────────────────────────────── */
function parseDateTime(str) {
  if (!str) return new Date(0);
  const [date, time = '0000'] = str.trim().split(' ');
  const [d, m, y] = date.split('.');
  return new Date(+y || 2000, (+m || 1) - 1, +d || 1, +time.slice(0,2) || 0, +time.slice(2,4) || 0);
}

function getSortedEntries() {
  if (!sortColumn) return entries;
  return [...entries].sort((a, b) => {
    let av = a[sortColumn], bv = b[sortColumn];
    if (sortColumn === 'dateTime') {
      return sortDirection === 'asc' ? parseDateTime(av) - parseDateTime(bv) : parseDateTime(bv) - parseDateTime(av);
    }
    av = (av || '').toLowerCase(); bv = (bv || '').toLowerCase();
    return sortDirection === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

function sortTable(column) {
  document.querySelectorAll('.sort-icon').forEach(i => { i.classList.remove('active'); i.textContent = '⇅'; });
  sortDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
  sortColumn    = column;
  const icon = document.getElementById('sort-' + column);
  if (icon) { icon.classList.add('active'); icon.textContent = sortDirection === 'asc' ? '↑' : '↓'; }
  renderTable();
}

/* ── Render table ────────────────────────────────────────── */
function renderTable() {
  const tbody  = document.getElementById('table-body');
  const sorted = getSortedEntries();

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state">
      <div class="icon">⚔️</div>No entries yet. Add your first engagement!
    </div></td></tr>`;
    updateStats();
    return;
  }

  // Column order: result, name, weapon, opponent ship, type, location, date, details, delete
  tbody.innerHTML = sorted.map(e => `
    <tr>
      <td class="w-24">
        <span class="badge badge-${e.status}">
          ${e.status === 'kill' ? '⚔ Kill' : e.status === 'death' ? '💀 Death' : '— Neutral'}
        </span>
      </td>
      <td class="name-cell">
        ${e.name ? `<a href="https://robertsspaceindustries.com/en/citizens/${e.name}" target="_blank" rel="noopener noreferrer" class="citizen-link">${e.name}</a>` : ''}
      </td>
      <td>${e.weaponShip || ''}</td>
      <td>${e.opposingShip || ''}</td>
      <td class="w-20"><span class="badge-type">${e.type || ''}</span></td>
      <td>${e.location || ''}</td>
      <td>${e.dateTime || ''}</td>
      <td class="truncate">${e.details || ''}</td>
      <td class="w-12"><button class="delete-btn" data-id="${e.id}" title="Delete">🗑️</button></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', () => deleteEntry(btn.dataset.id))
  );
  updateStats();
}

/* ── Add / Delete ────────────────────────────────────────── */
async function saveEntry(ev) {
  ev.preventDefault();
  const btn = document.getElementById('submit-btn');
  btn.disabled = true; btn.textContent = 'Saving…';

  const entry = {
    dateTime:     document.getElementById('dateTime').value,
    status:       document.getElementById('status').value,
    name:         document.getElementById('name').value,
    opposingShip: document.getElementById('opposingShip').value,
    type:         document.getElementById('type').value,
    weaponShip:   document.getElementById('weaponShip').value,
    location:     document.getElementById('location').value,
    details:      document.getElementById('details').value,
    createdAt:    Date.now(),
  };

  try {
    const nextKey = entries.length ? Math.max(...entries.map(e => parseInt(e.id) || 0)) + 1 : 0;
    await set(ref(db, '/' + nextKey), entry);
    closeModal();
    setStatus('success', 'Entry saved');
  } catch (err) {
    setStatus('error', 'Failed to save: ' + err.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Save Entry';
  }
}

async function deleteEntry(id) {
  if (!confirm('Delete this entry?')) return;
  try {
    await remove(ref(db, '/' + id));
    setStatus('success', 'Entry deleted');
  } catch (err) {
    setStatus('error', 'Failed to delete: ' + err.message);
  }
}

/* ── Modal ───────────────────────────────────────────────── */
function openModal()  { document.getElementById('modal').classList.add('active'); }
function closeModal() {
  document.getElementById('modal').classList.remove('active');
  document.getElementById('entry-form').reset();
}

/* ── Wire all events ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn').addEventListener('click', doLogin);
  document.getElementById('email-input').addEventListener('keydown',    e => { if (e.key === 'Enter') doLogin(); });
  document.getElementById('password-input').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });

  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('add-btn').addEventListener('click', openModal);

  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

  document.getElementById('entry-form').addEventListener('submit', saveEntry);

  document.querySelector('#data-table thead').addEventListener('click', e => {
    const th = e.target.closest('th[data-sort]');
    if (th) sortTable(th.dataset.sort);
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  window.addEventListener('resize', drawKDGraph);
});
