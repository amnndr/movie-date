/* =====================================================
   CONFIG — edit these
   ===================================================== */
const IG_USERNAME = 'am.nndr';       // <- swap in your Instagram handle
const MOVIE = 'Avengers: Doomsday';
const DATE_TEXT = 'Fri, 18 Dec 2026';

/* =====================================================
   SEAT DATA — update booked seats here
   -----------------------------------------------------
   Seat numbers count left → right along each row as drawn on the map
   (e.g. "J7" = 7th seat from the left in row J). In twin rows each twin
   is one number (J1, J2…). R(a,b) = a..b.
   `sold` = anything you can't pick: sold seats AND the grey "X" seats on TGV.
   To book more seats, add numbers to the row's array.
   ===================================================== */
const R = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

const LOCATIONS = [
  { name: 'TGV Pavilion Kuala Lumpur', short: 'Pavilion KL', showtimes: [
    { time: '4:50 PM', layout: 'pavilion',
      sold: { D:R(6,10), E:R(7,9), F:[5,6,7,8,10,12,13], G:R(3,12), H:[1,2,3,...R(5,13)], J:R(1,12), K:R(1,13),
              L:R(6,19), M:R(6,20), N:R(6,16), P:[4,5,6,7,...R(9,18)], Q:R(6,19) } },
  ]},
  { name: 'TGV Suria KLCC', short: 'KLCC', showtimes: [
    { time: '2:10 PM', layout: 'klcc',
      sold: { C:[9,10], D:R(8,12), E:R(5,16), F:R(3,16), G:[2,...R(4,15)], H:R(1,18),
              J:R(2,7), K:R(1,5) } },                       // J/K are twin seats
    { time: '5:20 PM', layout: 'klcc',
      sold: { B:R(8,12), C:R(4,14), D:[...R(5,12),15,16], E:R(1,18), F:R(1,18), G:R(1,18), H:R(1,18),
              J:R(2,6), K:R(1,5) } },
  ]},
  { name: 'TGV Sunway Putra', short: 'Sunway Putra', showtimes: [
    { time: '4:50 PM', layout: 'sunway',
      sold: { A:R(1,14), B:R(1,28), C:R(1,28),                // A–C are the blocked "X" rows
              H:R(13,17), J:[14,15], K:[9,10,...R(14,18)], L:[10,11,...R(14,18)], M:[8,...R(12,17)],
              N:R(12,17), P:[6,7,8,9,13,14,15,...R(18,21)] } },
  ]},
];

/* Hall shapes — one string per row, one character per grid column:
   s = single seat · TT = a twin seat (2 columns wide) · . = empty */
const s = n => 's'.repeat(n), d = n => '.'.repeat(n), t = n => 'T'.repeat(n * 2);
const fill = (rows, str) => Object.fromEntries(rows.split('').map(r => [r, str]));

const HALLS = {
  pavilion: {
    ...fill('AB',      d(1)+s(4)+d(2)+s(11)+d(1)+s(5)),
    C:                 d(1)+s(2)+d(4)+s(11)+d(1)+s(5),
    ...fill('DEFGHJK', d(3)+s(2)+d(2)+s(11)+d(1)+s(2)+d(3)),
    ...fill('LMNP',    s(5)+d(2)+s(11)+d(1)+s(5)),
    Q:                 d(1)+s(4)+d(1)+s(12)+d(1)+s(4)+d(1),
  },
  klcc: {
    ...fill('ABCDEFGH', s(2)+d(1)+s(14)+d(1)+s(2)),
    J: t(1)+d(3)+t(5)+d(3)+t(1),
    K: d(5)+t(5)+d(5),
  },
  sunway: {
    A: d(8)+s(14)+d(8),
    ...fill('BCDEFGHJKLMNP', s(7)+d(1)+s(14)+d(1)+s(7)),
  },
};

/* =====================================================
   Helpers
   ===================================================== */
const $ = (sel, r = document) => r.querySelector(sel);
const $$ = (sel, r = document) => [...r.querySelectorAll(sel)];
const state = { loc: null, show: null, picked: new Set() };
const layoutOf = () => HALLS[state.show.layout];
const hasTwins = () => Object.values(layoutOf()).some(str => str.includes('T'));

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
   Avengers — location → showtime → seats
   ===================================================== */
const locsEl = $('#locs'), showsEl = $('#shows');

LOCATIONS.forEach((loc, i) => {
  const b = document.createElement('button');
  b.className = 'show';
  b.innerHTML = `<b>${loc.short}</b><span>${loc.name}</span>`;
  b.addEventListener('click', () => pickLocation(i, b));
  locsEl.append(b);
});

function pickLocation(i, btn) {
  $$('.show', locsEl).forEach(x => x.classList.toggle('on', x === btn));
  state.loc = LOCATIONS[i];
  state.show = null;
  state.picked.clear();
  $('#infoLine').textContent = `${DATE_TEXT} · ${state.loc.name}`;

  showsEl.innerHTML = '';
  state.loc.showtimes.forEach((st, j) => {
    const b = document.createElement('button');
    b.className = 'show';
    b.innerHTML = `<b>${st.time}</b>`;                         // time only — no cinema numbers
    b.addEventListener('click', () => pickShow(j, b));
    showsEl.append(b);
  });
  $('#timeLabel').hidden = showsEl.hidden = false;
  $('#mapArea').hidden = true;
  updateSummary();
}

function pickShow(j, btn) {
  $$('.show', showsEl).forEach(x => x.classList.toggle('on', x === btn));
  state.show = state.loc.showtimes[j];
  state.picked.clear();
  renderHall();
  $('#mapArea').hidden = false;
  $('#twinLegend').hidden = !hasTwins();
  updateSummary();
  $('#mapArea').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function seatBtn(row, num, col, span) {
  const label = row + num, sold = (state.show.sold[row] || []).includes(num);
  const b = document.createElement('button');
  b.className = 'seat' + (span > 1 ? ' twin' : '') + (sold ? ' sold' : '');
  b.style.gridColumn = span > 1 ? `${col + 1} / span ${span}` : col + 1;
  b.dataset.label = label;
  b.setAttribute('aria-label', `Seat ${label}${span > 1 ? ' (twin)' : ''}${sold ? ', unavailable' : ''}`);
  if (sold) b.disabled = true;
  else b.addEventListener('click', () => {
    state.picked.has(label) ? state.picked.delete(label) : state.picked.add(label);
    b.classList.toggle('sel');
    updateSummary();
  });
  return b;
}

function renderHall() {
  const hall = $('#hall'), layout = layoutOf(), cols = Math.max(...Object.values(layout).map(r => r.length));
  hall.innerHTML = '';
  hall.style.setProperty('--s', cols > 24 ? 'clamp(18px,2.7vw,24px)' : '');   // wider halls get slightly smaller seats
  Object.entries(layout).forEach(([row, str]) => {
    const grid = document.createElement('div');
    grid.className = 'grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, var(--s))`;
    let n = 0;
    for (let c = 0; c < str.length; c++) {
      if (str[c] === 's') grid.append(seatBtn(row, ++n, c, 1));
      else if (str[c] === 'T') { grid.append(seatBtn(row, ++n, c, 2)); c++; }
    }
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
  const order = Object.keys(layoutOf());
  return [...state.picked]
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]) || a.slice(1) - b.slice(1))
    .map(l => layoutOf()[l[0]].includes('T') ? `${l} (twin)` : l);
}

function updateSummary() {
  const card = $('#summary');
  card.hidden = !(state.show && state.picked.size);
  $('#tip').hidden = true;
  if (card.hidden) return;
  $('#sDate').textContent = DATE_TEXT;
  $('#sLoc').textContent = state.loc.name;
  $('#sTime').textContent = state.show.time;
  $('#sSeats').textContent = seatList().join(', ');
}

function message() {
  return `Hi love 💚 here are my picks for our movie date!\n` +
    `🎬 ${MOVIE}\n📅 ${DATE_TEXT}\n📍 ${state.loc.name}\n🕘 ${state.show.time}\n` +
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
