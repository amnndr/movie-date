/* =====================================================
   CONFIG — edit these
   ===================================================== */
const IG_USERNAME = 'YOUR_IG_USERNAME';       // <- swap in your Instagram handle
const MOVIE = 'Avengers: Doomsday';
const DATE_TEXT = 'Sun, 20 Dec 2026';
const CINEMA = 'TGV Pavilion Kuala Lumpur';

/* Seat numbers count left → right along each row as drawn on the map
   (e.g. "J7" = 7th seat from the left in row J). Twin rows number each twin (Q1, Q2…).
   To mark more seats as booked, add numbers to the row's array. R(a,b) = a..b. */
const R = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const SHOWTIMES = [
  { time: '9:00 PM',  hall: 'Cinema 2', layout: 'hall2',
    sold: { G:[8], H:R(7,10), J:R(6,10), K:R(6,9), L:R(9,12), M:R(10,12), N:R(7,12), P:[10,11], Q:R(10,12) } },
  { time: '11:15 PM', hall: 'Cinema 3', layout: 'hall3',
    sold: { J:[7,8], Q:[4,5] } },                                  // Q4 + Q5 are twin seats
  { time: '12:10 AM', hall: 'Cinema 2', layout: 'hall2',
    sold: { E:R(7,10), F:R(6,9), G:R(7,9), H:R(5,11), J:[1,2,...R(5,10)], K:[1,2,...R(5,11)],
            L:R(7,14), M:R(6,14), N:R(6,15), P:[...R(6,13),15,16], Q:[6,7,8,...R(10,13),15,16] } },
];

/* Hall shapes: each row = [[firstCol,lastCol], ...] blocks on a 24-column grid */
const ROWS = 'ABCDEFGHJKLMNPQ'.split('');
function buildHall(mid, right, qRow) {
  const h = {};
  'AB'.split('').forEach(r => h[r] = [[1,4], mid, right]);
  h.C = [[1,2], mid, right];
  'DEFGHJK'.split('').forEach(r => h[r] = [[3,4], mid, [right[0], right[0]+1]]);
  'LMNP'.split('').forEach(r => h[r] = [[0,4], mid, [right[0], right[0]+4]]);
  h.Q = qRow;
  return h;
}
const HALLS = {
  hall2: buildHall([7,17], [19,23], [[1,4],[6,17],[19,22]]),
  hall3: buildHall([6,16], [18,21], { twins: [3,6,8,10,12,14,18] }),
};

/* =====================================================
   Helpers
   ===================================================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const state = { show: null, picked: new Set() };

/* =====================================================
   PAGE 1 — dodging buttons
   ===================================================== */
const bubble = $('#bubble');
const lines = ['hehe, too slow 💚', 'that one is shy today', 'nope, try again 🫣', 'it ran away!', 'psst… why not both? 👀'];
let dodges = 0;

function dodge(btn) {
  const r = btn.getBoundingClientRect(), both = $('#bothBtn').getBoundingClientRect(), pad = 12;
  if (!btn.classList.contains('dodging')) {            // pin in place first so it can glide
    btn.style.left = r.left + 'px'; btn.style.top = r.top + 'px';
    btn.classList.add('dodging'); void btn.offsetWidth;
  }
  let x, y, n = 0;
  do {
    x = pad + Math.random() * Math.max(innerWidth - r.width - pad * 2, 0);
    y = pad + Math.random() * Math.max(innerHeight - r.height - pad * 2, 0);
  } while (++n < 20 && (Math.hypot(x - r.left, y - r.top) < 120 ||
           (x < both.right + 10 && x + r.width > both.left - 10 && y < both.bottom + 10 && y + r.height > both.top - 10)));
  btn.style.left = x + 'px'; btn.style.top = y + 'px';
  bubble.textContent = ++dodges >= 3 && Math.random() < .5 ? lines[4] : lines[Math.floor(Math.random() * 4)];
}

$$('.shy').forEach(b => {
  b.addEventListener('pointerenter', e => e.pointerType === 'mouse' && dodge(b));
  b.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { e.preventDefault(); dodge(b); } });
  b.addEventListener('click', e => { e.preventDefault(); dodge(b); });   // keyboard / fast clicks
});
addEventListener('resize', () => $$('.shy.dodging').forEach(b => {
  const r = b.getBoundingClientRect();
  b.style.left = Math.max(8, Math.min(r.left, innerWidth - r.width - 8)) + 'px';
  b.style.top  = Math.max(8, Math.min(r.top, innerHeight - r.height - 8)) + 'px';
}));

$('#bothBtn').addEventListener('click', () => {
  bubble.textContent = 'correct!! both it is 💚✨';
  setTimeout(() => {
    $('#page1').classList.remove('active');
    $('#page2').classList.add('active');
    scrollTo(0, 0);
  }, 900);
});

/* =====================================================
   PAGE 2 — tabs
   ===================================================== */
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => { x.classList.toggle('on', x === t); x.setAttribute('aria-selected', x === t); });
  $$('.panel').forEach(p => p.classList.toggle('on', p.id === 'tab-' + t.dataset.tab));
}));

/* =====================================================
   Avengers — showtimes + seat map
   ===================================================== */
const showsEl = $('#shows');
SHOWTIMES.forEach((s, i) => {
  const b = document.createElement('button');
  b.className = 'show';
  b.innerHTML = `<b>${s.time}</b><span>${s.hall}</span>`;
  b.addEventListener('click', () => pickShow(i, b));
  showsEl.append(b);
});

function pickShow(i, btn) {
  $$('.show').forEach(x => x.classList.toggle('on', x === btn));
  state.show = SHOWTIMES[i];
  state.picked.clear();
  renderHall();
  $('#mapArea').hidden = false;
  $('#twinLegend').hidden = !HALLS[state.show.layout].Q.twins;
  updateSummary();
  $('#mapArea').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function seatBtn(row, num, col, span) {
  const label = row + num, sold = (state.show.sold[row] || []).includes(num);
  const b = document.createElement('button');
  b.className = 'seat' + (span > 1 ? ' twin' : '') + (sold ? ' sold' : '');
  b.style.gridColumn = span > 1 ? `${col + 1} / span ${span}` : col + 1;
  b.dataset.label = label;
  b.setAttribute('aria-label', `Seat ${label}${span > 1 ? ' (twin)' : ''}${sold ? ', sold' : ''}`);
  if (sold) b.disabled = true;
  else b.addEventListener('click', () => {
    state.picked.has(label) ? state.picked.delete(label) : state.picked.add(label);
    b.classList.toggle('sel');
    updateSummary();
  });
  return b;
}

function renderHall() {
  const hall = $('#hall'), layout = HALLS[state.show.layout];
  hall.innerHTML = '';
  ROWS.forEach(row => {
    const spec = layout[row], grid = document.createElement('div');
    grid.className = 'grid';
    if (spec.twins) spec.twins.forEach((c, i) => grid.append(seatBtn(row, i + 1, c, 2)));
    else { let n = 0; spec.forEach(([a, z]) => R(a, z).forEach(c => grid.append(seatBtn(row, ++n, c, 1)))); }
    const line = document.createElement('div');
    line.className = 'row';
    line.innerHTML = `<b>${row}</b>`;
    line.append(grid);
    line.insertAdjacentHTML('beforeend', `<b>${row}</b>`);
    hall.append(line);
  });
}

/* =====================================================
   Summary + sharing
   ===================================================== */
function seatList() {
  const twin = !!HALLS[state.show.layout].Q.twins;
  return [...state.picked]
    .sort((a, b) => ROWS.indexOf(a[0]) - ROWS.indexOf(b[0]) || a.slice(1) - b.slice(1))
    .map(l => twin && l[0] === 'Q' ? `${l} (twin)` : l);
}

function updateSummary() {
  const card = $('#summary');
  card.hidden = !state.picked.size;
  $('#tip').hidden = true;
  if (!state.picked.size) return;
  $('#sDate').textContent = DATE_TEXT;
  $('#sTime').textContent = `${state.show.time} · ${state.show.hall} (${CINEMA})`;
  $('#sSeats').textContent = seatList().join(', ');
}

function message() {
  return `Hi love 💚 here are my picks for our movie date!\n` +
    `🎬 ${MOVIE}\n📅 ${DATE_TEXT}\n🕘 ${state.show.time} · ${state.show.hall} (${CINEMA})\n` +
    `💺 Seats: ${seatList().join(', ')}\nCan't wait! 🥹`;
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  fallbackCopy(text);
}
function fallbackCopy(text) {
  const t = document.createElement('textarea');
  t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
  document.body.append(t); t.select();
  try { document.execCommand('copy'); } catch (e) {}
  t.remove();
}

$('#copyBtn').addEventListener('click', e => {
  copyText(message());
  const b = e.currentTarget;
  b.textContent = 'Copied! ✓';
  setTimeout(() => b.textContent = 'Copy My Picks', 2000);
});

$('#dmBtn').addEventListener('click', () => {
  copyText(message());
  window.open(`https://ig.me/m/${IG_USERNAME}`, '_blank', 'noopener');   // called inside the click so popups aren't blocked
  const tip = $('#tip');
  tip.hidden = false;
  setTimeout(() => tip.hidden = true, 5000);
});
