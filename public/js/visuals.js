// Visual math: small SVG/HTML builders that return strings. No DOM access, so this also loads in Node.

const C = {
  ink: '#2b2150',
  soft: '#8b86a8',
  line: '#d9d4ee',
  red: '#ff5470',
  blue: '#3d8bff',
  yellow: '#ffc233',
  green: '#1fc98c',
  purple: '#8a5cff',
  orange: '#ff8a3d',
  teal: '#18c2d6',
  pink: '#ff6fb5',
};
export const PALETTE = C;
const PIE_COLORS = [C.red, C.blue, C.yellow, C.green, C.purple, C.orange, C.teal, C.pink];

const svg = (w, h, body, label = '') =>
  `<svg class="viz" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

const text = (x, y, s, { size = 16, fill = C.ink, weight = 700, anchor = 'middle' } = {}) =>
  `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="middle" font-family="Fredoka, Nunito, system-ui, sans-serif">${s}</text>`;

/** Emoji objects in a tidy grid. `crossed` of them are shown as taken away. */
export function emojiGroup(emoji, n, { crossed = 0, cols = 5 } = {}) {
  const items = Array.from({ length: n }, (_, i) =>
    `<span class="emo${i >= n - crossed ? ' crossed' : ''}" style="animation-delay:${i * 40}ms"><span>${emoji}</span></span>`
  ).join('');
  return `<div class="emoji-grid" style="--cols:${Math.min(cols, n || 1)}">${items}</div>`;
}

/** Two emoji groups joined by a + sign. */
export function emojiAdd(emoji, a, b) {
  return `<div class="emoji-sum">${emojiGroup(emoji, a, { cols: Math.min(a, 5) })}<span class="emoji-op">+</span>${emojiGroup(emoji, b, { cols: Math.min(b, 5) })}</div>`;
}

/** Ten frames showing n counters (one frame per ten). */
export function tenFrames(n, { color = C.red, second = 0, secondColor = C.blue } = {}) {
  const frames = Math.max(1, Math.ceil((n + second) / 10));
  const cell = 34, gap = 16, fw = cell * 5;
  let body = '';
  for (let f = 0; f < frames; f++) {
    const ox = f * (fw + gap) + 4;
    body += `<rect x="${ox}" y="4" width="${fw}" height="${cell * 2}" rx="6" fill="#fff" stroke="${C.ink}" stroke-width="2.5"/>`;
    for (let i = 0; i < 10; i++) {
      const cx = ox + (i % 5) * cell, cy = 4 + Math.floor(i / 5) * cell;
      body += `<rect x="${cx}" y="${cy}" width="${cell}" height="${cell}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
      const idx = f * 10 + i;
      if (idx < n + second) {
        const fill = idx < n ? color : secondColor;
        body += `<circle cx="${cx + cell / 2}" cy="${cy + cell / 2}" r="${cell / 2 - 5}" fill="${fill}"/>`;
      }
    }
  }
  return svg(frames * (fw + gap) - gap + 8, cell * 2 + 8, body, `ten frame showing ${n + second}`);
}

/** Base-ten blocks: hundreds flats, tens rods, ones cubes. */
export function baseTen(n) {
  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), o = n % 10;
  const u = 9;
  let x = 4, body = '';
  const square = (sx, sy, fill) => `<rect x="${sx}" y="${sy}" width="${u}" height="${u}" fill="${fill}" stroke="${C.ink}" stroke-width="0.8"/>`;
  for (let k = 0; k < h; k++) {
    for (let i = 0; i < 100; i++) body += square(x + (i % 10) * u, 4 + Math.floor(i / 10) * u, C.blue);
    x += u * 10 + 10;
  }
  for (let k = 0; k < t; k++) {
    for (let i = 0; i < 10; i++) body += square(x, 4 + i * u, C.green);
    x += u + 7;
  }
  if (t) x += 6;
  for (let k = 0; k < o; k++) body += square(x + (k % 2) * (u + 4), 4 + Math.floor(k / 2) * (u + 4), C.yellow);
  if (o) x += 2 * (u + 4);
  return svg(Math.max(x, 40), u * 10 + 8, body, `base ten blocks showing ${n}`);
}

/** Analog clock. */
export function clock(hour, minute) {
  const cx = 90, cy = 90, r = 80;
  let body = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${C.purple}" stroke-width="8"/>`;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const len = i % 5 === 0 ? 10 : 4;
    body += `<line x1="${cx + Math.sin(a) * (r - 6)}" y1="${cy - Math.cos(a) * (r - 6)}" x2="${cx + Math.sin(a) * (r - 6 - len)}" y2="${cy - Math.cos(a) * (r - 6 - len)}" stroke="${C.ink}" stroke-width="${i % 5 === 0 ? 3 : 1.2}"/>`;
  }
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    body += text(cx + Math.sin(a) * (r - 27), cy - Math.cos(a) * (r - 27) + 1, i, { size: 15 });
  }
  const ha = ((hour % 12) + minute / 60) / 12 * Math.PI * 2;
  const ma = minute / 60 * Math.PI * 2;
  body += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(ha) * 40}" y2="${cy - Math.cos(ha) * 40}" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/>`;
  body += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.sin(ma) * 62}" y2="${cy - Math.cos(ma) * 62}" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>`;
  body += `<circle cx="${cx}" cy="${cy}" r="6" fill="${C.ink}"/>`;
  return svg(180, 180, body, 'clock');
}

/** Rows × columns array of dots. */
export function dotArray(rows, cols, color = C.purple) {
  const s = Math.min(34, Math.floor(340 / Math.max(cols, rows)));
  let body = '';
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      body += `<circle cx="${c * s + s / 2 + 2}" cy="${r * s + s / 2 + 2}" r="${s * 0.36}" fill="${color}"/>`;
  return svg(cols * s + 4, rows * s + 4, body, `${rows} rows of ${cols}`);
}

/** Equal groups (circles with dots inside), for division / multiplication. */
export function equalGroups(groups, each) {
  const size = 84, gap = 10;
  const perRow = Math.min(groups, 5);
  const rows = Math.ceil(groups / perRow);
  let body = '';
  for (let g = 0; g < groups; g++) {
    const gx = (g % perRow) * (size + gap) + 2, gy = Math.floor(g / perRow) * (size + gap) + 2;
    body += `<circle cx="${gx + size / 2}" cy="${gy + size / 2}" r="${size / 2 - 2}" fill="#f4f0ff" stroke="${C.purple}" stroke-width="2.5"/>`;
    const cols = Math.ceil(Math.sqrt(each));
    const ds = Math.min(18, 52 / cols);
    const rCount = Math.ceil(each / cols);
    for (let i = 0; i < each; i++) {
      const dx = gx + size / 2 + ((i % cols) - (cols - 1) / 2) * ds;
      const dy = gy + size / 2 + (Math.floor(i / cols) - (rCount - 1) / 2) * ds;
      body += `<circle cx="${dx}" cy="${dy}" r="${ds * 0.36}" fill="${PIE_COLORS[g % PIE_COLORS.length]}"/>`;
    }
  }
  return svg(perRow * (size + gap) - gap + 4, rows * (size + gap) - gap + 4, body, `${groups} groups of ${each}`);
}

/** Pizza-style fraction circle. */
export function fractionPie(num, den, color = C.orange) {
  const cx = 80, cy = 80, r = 72;
  let body = `<circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="#f6d28b"/>`;
  for (let i = 0; i < den; i++) {
    const a0 = (i / den) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / den) * Math.PI * 2 - Math.PI / 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const fill = i < num ? color : '#fff6e3';
    const d = den === 1
      ? `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0`
      : `M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`;
    body += `<path d="${d}" fill="${fill}" stroke="#b5651d" stroke-width="2.5"/>`;
    if (i < num) {
      const am = (a0 + a1) / 2;
      body += `<circle cx="${cx + r * 0.55 * Math.cos(am)}" cy="${cy + r * 0.55 * Math.sin(am)}" r="5" fill="#c0392b"/>`;
    }
  }
  return svg(160, 160, body, `${num} of ${den} slices`);
}

/** Fraction bar(s). Pass several [num, den] pairs to stack them for comparison. */
export function fractionBars(pairs, colors = [C.blue, C.green, C.pink, C.orange]) {
  const w = 320, h = 38, gap = 12;
  let body = '';
  pairs.forEach(([num, den], row) => {
    const y = row * (h + gap) + 2;
    for (let i = 0; i < den; i++) {
      const x = 2 + (i * w) / den;
      body += `<rect x="${x}" y="${y}" width="${w / den}" height="${h}" fill="${i < num ? colors[row % colors.length] : '#fff'}" stroke="${C.ink}" stroke-width="2"/>`;
    }
  });
  return svg(w + 4, pairs.length * (h + gap) - gap + 4, body, 'fraction bars');
}

/** Rectangle on a unit grid (area). */
export function areaGrid(w, h) {
  const s = Math.min(32, Math.floor(320 / Math.max(w, h)));
  let body = '';
  for (let r = 0; r < h; r++)
    for (let c = 0; c < w; c++)
      body += `<rect x="${c * s + 2}" y="${r * s + 2}" width="${s}" height="${s}" fill="${(r + c) % 2 ? '#b8f0da' : '#8fe6c4'}" stroke="${C.green}" stroke-width="1.5"/>`;
  body += `<rect x="2" y="2" width="${w * s}" height="${h * s}" fill="none" stroke="${C.ink}" stroke-width="3"/>`;
  return svg(w * s + 4, h * s + 4, body, `${w} by ${h} rectangle`);
}

/** Rectangle with labelled sides (perimeter / area). */
export function labeledRect(w, h, unit = '') {
  const scale = 200 / Math.max(w, h);
  const rw = Math.max(w * scale, 60), rh = Math.max(h * scale, 50);
  const x0 = 64;
  let body = `<rect x="${x0}" y="22" width="${rw}" height="${rh}" rx="4" fill="#dcecff" stroke="${C.blue}" stroke-width="4"/>`;
  body += text(x0 + rw / 2, 10, `${w}${unit}`);
  body += text(x0 + rw / 2, 22 + rh + 14, `${w}${unit}`);
  body += text(x0 - 8, 22 + rh / 2, `${h}${unit}`, { anchor: 'end' });
  body += text(x0 + rw + 8, 22 + rh / 2, `${h}${unit}`, { anchor: 'start' });
  return svg(rw + x0 * 2, rh + 46, body, `rectangle ${w} by ${h}`);
}

/** Coins (values in cents). */
export function coins(values) {
  const info = {
    1: { r: 19, fill: '#d98b4b', label: '1¢' },
    5: { r: 22, fill: '#c9ced6', label: '5¢' },
    10: { r: 17, fill: '#dfe3ea', label: '10¢' },
    25: { r: 26, fill: '#d4d9e1', label: '25¢' },
  };
  let x = 4, body = '';
  for (const v of values) {
    const c = info[v];
    body += `<circle cx="${x + c.r}" cy="32" r="${c.r}" fill="${c.fill}" stroke="#6b7280" stroke-width="2.5"/>`;
    body += `<circle cx="${x + c.r}" cy="32" r="${c.r - 5}" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="1.5"/>`;
    body += text(x + c.r, 33, c.label, { size: c.r > 20 ? 14 : 11 });
    x += c.r * 2 + 8;
  }
  return svg(x, 64, body, 'coins');
}

/** An angle drawn from a vertex, with arc. */
export function angle(deg) {
  const cx = 120, cy = 130, len = 105;
  const a = (deg * Math.PI) / 180;
  const ex = cx + Math.cos(a) * len, ey = cy - Math.sin(a) * len;
  const ar = 34;
  let body = `<line x1="${cx}" y1="${cy}" x2="${cx + len}" y2="${cy}" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`;
  body += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`;
  if (deg === 90) {
    body += `<path d="M ${cx + 22} ${cy} L ${cx + 22} ${cy - 22} L ${cx} ${cy - 22}" fill="none" stroke="${C.red}" stroke-width="3"/>`;
  } else {
    body += `<path d="M ${cx + ar} ${cy} A ${ar} ${ar} 0 ${deg > 180 ? 1 : 0} 0 ${cx + Math.cos(a) * ar} ${cy - Math.sin(a) * ar}" fill="${C.red}" fill-opacity="0.2" stroke="${C.red}" stroke-width="3"/>`;
  }
  body += `<circle cx="${cx}" cy="${cy}" r="5" fill="${C.ink}"/>`;
  return svg(240, 145, body, 'angle');
}

/** Isometric rectangular prism made of unit cubes. */
export function prism(l, w, h) {
  const s = Math.min(30, 200 / Math.max(l + w, h + 2));
  const ox = w * s * 0.87 + 6;
  const oy = (h * s) + (w * s * 0.5) + 6;
  const px = (x, y, z) => [ox + (x - y) * s * 0.87, oy + (x + y) * s * 0.5 - z * s];
  const poly = (pts, fill) =>
    `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${fill}" stroke="${C.ink}" stroke-width="1.2" stroke-linejoin="round"/>`;
  let body = '';
  // top faces
  for (let x = 0; x < l; x++)
    for (let y = 0; y < w; y++)
      body += poly([px(x, y, h), px(x + 1, y, h), px(x + 1, y + 1, h), px(x, y + 1, h)], '#ffd66b');
  // front-right face (y = w)
  for (let x = 0; x < l; x++)
    for (let z = 0; z < h; z++)
      body += poly([px(x, w, z), px(x + 1, w, z), px(x + 1, w, z + 1), px(x, w, z + 1)], '#ff9f5a');
  // front-left face (x = l)
  for (let y = 0; y < w; y++)
    for (let z = 0; z < h; z++)
      body += poly([px(l, y, z), px(l, y + 1, z), px(l, y + 1, z + 1), px(l, y, z + 1)], '#ff6f61');
  const [bx, by] = px(l, w, 0);
  return svg(bx + l * s * 0.87 + 12, by + 8, body, `${l} by ${w} by ${h} box`);
}

/** Coordinate plane. points: [{x,y,color,label}], line: [[x1,y1],[x2,y2]] */
export function coordPlane({ min = 0, max = 10, points = [], line = null } = {}) {
  const size = 260, pad = 16;
  const n = max - min;
  const s = (size - pad * 2) / n;
  const X = x => pad + (x - min) * s, Y = y => size - pad - (y - min) * s;
  let body = `<rect width="${size}" height="${size}" fill="#fff"/>`;
  for (let i = 0; i <= n; i++) {
    const v = min + i;
    body += `<line x1="${X(v)}" y1="${pad}" x2="${X(v)}" y2="${size - pad}" stroke="${C.line}" stroke-width="1"/>`;
    body += `<line x1="${pad}" y1="${Y(v)}" x2="${size - pad}" y2="${Y(v)}" stroke="${C.line}" stroke-width="1"/>`;
  }
  const x0 = X(Math.max(min, 0)), y0 = Y(Math.max(min, 0));
  body += `<line x1="${pad}" y1="${y0}" x2="${size - pad}" y2="${y0}" stroke="${C.ink}" stroke-width="2.5"/>`;
  body += `<line x1="${x0}" y1="${pad}" x2="${x0}" y2="${size - pad}" stroke="${C.ink}" stroke-width="2.5"/>`;
  for (let v = min; v <= max; v++) {
    if (v === 0 || (n > 10 && v % 2)) continue;
    body += text(X(v), y0 + 10, v, { size: 10, fill: C.soft, weight: 600 });
    body += text(x0 - 9, Y(v), v, { size: 10, fill: C.soft, weight: 600 });
  }
  if (line) {
    const [[x1, y1], [x2, y2]] = line;
    const m = (y2 - y1) / (x2 - x1);
    const ya = y1 + m * (min - x1), yb = y1 + m * (max - x1);
    body += `<clipPath id="cp"><rect x="${pad}" y="${pad}" width="${size - 2 * pad}" height="${size - 2 * pad}"/></clipPath>`;
    body += `<line clip-path="url(#cp)" x1="${X(min)}" y1="${Y(ya)}" x2="${X(max)}" y2="${Y(yb)}" stroke="${C.blue}" stroke-width="4" stroke-linecap="round"/>`;
  }
  for (const p of points) {
    body += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="7" fill="${p.color || C.red}" stroke="#fff" stroke-width="2"/>`;
    if (p.label) body += text(X(p.x) + 14, Y(p.y) - 12, p.label, { size: 14 });
  }
  return svg(size, size, body, 'coordinate plane');
}

/** Number line with a marked point (optionally a question mark label). */
export function numberLine(min, max, marked, { step = 1, labelEvery = 1, hideLabels = [], dots = [] } = {}) {
  const w = 380, pad = 20, y = 40;
  const n = (max - min) / step;
  const X = v => pad + ((v - min) / (max - min)) * (w - pad * 2);
  let body = `<line x1="${pad - 10}" y1="${y}" x2="${w - pad + 10}" y2="${y}" stroke="${C.ink}" stroke-width="3"/>`;
  body += `<path d="M ${pad - 14} ${y} l 8 -6 v 12 z M ${w - pad + 14} ${y} l -8 -6 v 12 z" fill="${C.ink}"/>`;
  for (let i = 0; i <= n; i++) {
    const v = +(min + i * step).toFixed(4);
    const major = i % labelEvery === 0;
    body += `<line x1="${X(v)}" y1="${y - (major ? 9 : 5)}" x2="${X(v)}" y2="${y + (major ? 9 : 5)}" stroke="${C.ink}" stroke-width="2"/>`;
    if (major && !hideLabels.includes(v)) body += text(X(v), y + 24, v, { size: 13, weight: 600 });
  }
  dots.forEach((v, i) => {
    body += `<circle cx="${X(v)}" cy="${y}" r="8" fill="${PIE_COLORS[i % PIE_COLORS.length]}" stroke="#fff" stroke-width="2"/>`;
    body += text(X(v), y - 22, v, { size: 16, fill: PIE_COLORS[i % PIE_COLORS.length] });
  });
  if (marked !== null && marked !== undefined) {
    body += `<circle cx="${X(marked)}" cy="${y}" r="9" fill="${C.red}" stroke="#fff" stroke-width="2.5"/>`;
    body += `<path d="M ${X(marked)} ${y - 14} l -7 -12 h 14 z" fill="${C.red}"/>`;
  }
  return svg(w, 72, body, 'number line');
}

/** 10×10 grid with n squares shaded (percent). */
export function percentGrid(n, color = C.teal) {
  const s = 18;
  let body = '';
  for (let i = 0; i < 100; i++) {
    const r = Math.floor(i / 10), c = i % 10;
    body += `<rect x="${c * s + 2}" y="${r * s + 2}" width="${s}" height="${s}" fill="${i < n ? color : '#fff'}" stroke="${C.ink}" stroke-width="1"/>`;
  }
  return svg(s * 10 + 4, s * 10 + 4, body, `${n} out of 100 shaded`);
}

/** Triangle with base and height labelled. */
export function triangleBH(b, h) {
  const scale = 180 / Math.max(b, h);
  const bw = Math.max(b * scale, 110), hh = Math.max(h * scale, 80); // not to scale for very skinny triangles
  const apexX = 30 + bw * 0.35;
  let body = `<polygon points="30,${hh + 20} ${30 + bw},${hh + 20} ${apexX},20" fill="#ffe3f0" stroke="${C.pink}" stroke-width="4" stroke-linejoin="round"/>`;
  body += `<line x1="${apexX}" y1="20" x2="${apexX}" y2="${hh + 20}" stroke="${C.ink}" stroke-width="2" stroke-dasharray="6 5"/>`;
  body += `<path d="M ${apexX} ${hh + 8} h 12 v 12" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`;
  body += text(30 + bw / 2, hh + 38, `${b}`);
  body += text(apexX - 16, 20 + hh / 2, `${h}`);
  return svg(bw + 60, hh + 50, body, 'triangle');
}

/** Right triangle with legs a, b; hypotenuse labelled c (or '?'). */
export function rightTriangle(a, b, labels = [a, b, '?']) {
  const scale = 190 / Math.max(a, b);
  const w = b * scale, h = a * scale;
  let body = `<polygon points="30,20 30,${h + 20} ${30 + w},${h + 20}" fill="#e2f7ff" stroke="${C.teal}" stroke-width="4" stroke-linejoin="round"/>`;
  body += `<path d="M 30 ${h + 4} h 16 v 16" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
  body += text(14, 20 + h / 2, labels[0]);
  body += text(30 + w / 2, h + 38, labels[1]);
  body += text(40 + w / 2 + 8, 20 + h / 2 - 8, labels[2], { fill: C.red, size: 18 });
  return svg(w + 70, h + 52, body, 'right triangle');
}

/** Circle showing radius. */
export function circleR(r, label = `r = ${r}`) {
  let body = `<circle cx="90" cy="90" r="75" fill="#fff1d6" stroke="${C.orange}" stroke-width="5"/>`;
  body += `<line x1="90" y1="90" x2="165" y2="90" stroke="${C.ink}" stroke-width="3"/>`;
  body += `<circle cx="90" cy="90" r="5" fill="${C.ink}"/>`;
  body += text(127, 76, label, { size: 15 });
  return svg(180, 180, body, 'circle');
}

/** Spinner with coloured sections: [{color, name}] */
export function spinner(sections) {
  const cx = 100, cy = 100, r = 88, n = sections.length;
  let body = '';
  sections.forEach((s, i) => {
    const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
    body += `<path d="M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z" fill="${s.color}" stroke="#fff" stroke-width="3"/>`;
  });
  body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.ink}" stroke-width="4"/>`;
  body += `<path d="M ${cx} ${cy} L ${cx + 8} ${cy - 50} L ${cx} ${cy - 62} L ${cx - 8} ${cy - 50} Z" fill="${C.ink}" transform="rotate(38 ${cx} ${cy})"/>`;
  body += `<circle cx="${cx}" cy="${cy}" r="9" fill="${C.ink}"/>`;
  return svg(200, 200, body, 'spinner');
}

/** Ratio: groups of coloured tiles e.g. 2 red : 3 blue, repeated. */
export function ratioTiles(a, b, groups, colA = C.red, colB = C.blue) {
  const s = 22, gap = 16;
  let x = 2, body = '';
  for (let g = 0; g < groups; g++) {
    for (let i = 0; i < a; i++) body += `<rect x="${x}" y="${2 + i * (s + 4)}" width="${s}" height="${s}" rx="5" fill="${colA}"/>`;
    x += s + 4;
    for (let i = 0; i < b; i++) body += `<rect x="${x}" y="${2 + i * (s + 4)}" width="${s}" height="${s}" rx="11" fill="${colB}"/>`;
    x += s + gap;
  }
  return svg(x - gap + 2, Math.max(a, b) * (s + 4) + 2, body, 'ratio tiles');
}

/** Balance scale for equations: left and right are short text labels. */
export function balance(left, right) {
  let body = `<polygon points="200,60 185,150 215,150" fill="${C.soft}"/>`;
  body += `<rect x="150" y="150" width="100" height="12" rx="6" fill="${C.ink}"/>`;
  body += `<rect x="40" y="54" width="320" height="10" rx="5" fill="${C.ink}"/>`;
  body += `<circle cx="200" cy="59" r="9" fill="${C.yellow}" stroke="${C.ink}" stroke-width="2"/>`;
  for (const [cx, label, fill] of [[95, left, '#e8e0ff'], [305, right, '#d8f7ea']]) {
    body += `<line x1="${cx - 55}" y1="64" x2="${cx - 50}" y2="104" stroke="${C.ink}" stroke-width="2"/>`;
    body += `<line x1="${cx + 55}" y1="64" x2="${cx + 50}" y2="104" stroke="${C.ink}" stroke-width="2"/>`;
    body += `<path d="M ${cx - 70} 104 h 140 a 70 26 0 0 1 -140 0 z" fill="${fill}" stroke="${C.ink}" stroke-width="2.5"/>`;
    body += text(cx, 80, label, { size: 20 });
  }
  return svg(400, 168, body, `${left} equals ${right}`);
}

/** Simple named shape. */
export function shape(name, color = C.purple) {
  const shapes = {
    circle: `<circle cx="80" cy="70" r="60" fill="${color}"/>`,
    square: `<rect x="20" y="10" width="120" height="120" rx="6" fill="${color}"/>`,
    rectangle: `<rect x="5" y="30" width="150" height="80" rx="6" fill="${color}"/>`,
    triangle: `<polygon points="80,8 150,130 10,130" fill="${color}" stroke-linejoin="round"/>`,
    hexagon: `<polygon points="45,10 115,10 150,70 115,130 45,130 10,70" fill="${color}"/>`,
    pentagon: `<polygon points="80,8 150,58 124,132 36,132 10,58" fill="${color}"/>`,
    star: `<polygon points="80,5 98,52 150,55 110,88 124,136 80,108 36,136 50,88 10,55 62,52" fill="${color}"/>`,
    oval: `<ellipse cx="80" cy="70" rx="72" ry="45" fill="${color}"/>`,
    rhombus: `<polygon points="80,5 145,70 80,135 15,70" fill="${color}"/>`,
    octagon: `<polygon points="50,5 110,5 152,47 152,93 110,135 50,135 8,93 8,47" fill="${color}"/>`,
  };
  return svg(160, 140, shapes[name], name);
}

/** Bar graph: data [{label, value, color}] */
export function barGraph(data, { max = null, step = 1 } = {}) {
  const top = max ?? Math.max(...data.map(d => d.value));
  const w = 320, h = 190, left = 30, bottom = 30, bw = (w - left - 10) / data.length;
  let body = '';
  for (let v = 0; v <= top; v += step) {
    const y = h - bottom - (v / top) * (h - bottom - 10);
    body += `<line x1="${left}" y1="${y}" x2="${w - 4}" y2="${y}" stroke="${C.line}"/>`;
    body += text(left - 10, y, v, { size: 11, fill: C.soft });
  }
  data.forEach((d, i) => {
    const bh = (d.value / top) * (h - bottom - 10);
    const x = left + i * bw + bw * 0.18;
    body += `<rect x="${x}" y="${h - bottom - bh}" width="${bw * 0.64}" height="${bh}" rx="5" fill="${d.color || PIE_COLORS[i]}"/>`;
    body += text(x + bw * 0.32, h - bottom + 16, d.label, { size: 18 });
  });
  body += `<line x1="${left}" y1="${h - bottom}" x2="${w - 4}" y2="${h - bottom}" stroke="${C.ink}" stroke-width="2"/>`;
  return svg(w, h, body, 'bar graph');
}

/** Function machine: input → [rule] → ? */
export function machine(input, rule = 'f') {
  let body = `<rect x="4" y="44" width="70" height="52" rx="12" fill="#e8f7ff" stroke="${C.teal}" stroke-width="3"/>`;
  body += text(39, 71, input, { size: 24 });
  body += `<path d="M 80 70 h 30 l -8 -8 m 8 8 l -8 8" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  body += `<rect x="118" y="20" width="124" height="100" rx="18" fill="${C.purple}"/>`;
  body += `<circle cx="146" cy="44" r="10" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="5 4"/>`;
  body += `<circle cx="216" cy="44" r="10" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="5 4"/>`;
  body += text(180, 84, rule, { size: 20, fill: '#fff' });
  body += `<path d="M 248 70 h 30 l -8 -8 m 8 8 l -8 8" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  body += `<rect x="286" y="44" width="70" height="52" rx="12" fill="#fff4d6" stroke="${C.orange}" stroke-width="3"/>`;
  body += text(321, 71, '?', { size: 28, fill: C.orange });
  return svg(360, 130, body, 'function machine');
}

/** Big friendly expression display (for when there is no picture). */
export function bigExpr(s) {
  return `<div class="big-expr">${s}</div>`;
}
