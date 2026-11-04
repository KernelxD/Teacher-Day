// Geometry for the wishing tree on the homepage (design: "Teacher Day Wish Tree", option A).
// Everything here is deterministic: the same seeds always draw the same tree and put the
// tags in the same places, so every visitor sees the same picture.
// The SVG works in a 1200 x 800 coordinate box.

function makeRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const SETTINGS = { seed: 77, maxDepth: 7, trunk: 130, shrink: 0.79, wide: 1.4, bias: 0.07 };

function buildTree() {
  const r = makeRandom(SETTINGS.seed);
  const segs = [];

  const grow = (x, y, ang, L, w, d) => {
    const x1 = x + L * Math.cos(ang);
    const y1 = y + L * Math.sin(ang);
    const bend = (r() - 0.5) * 0.36;
    segs.push({ x, y, x1, y1, w0: w, w1: w * 0.7, bend, L, ang, d });
    if (d >= SETTINGS.maxDepth) return;

    let spread;
    if (d === 0) spread = [-0.62, 0.55];
    else if (r() < 0.3) {
      const s = 0.36 + r() * 0.2;
      spread = [-s, (r() - 0.5) * 0.2, s];
    } else {
      const s = (0.3 + r() * 0.22) * (d <= 2 ? SETTINGS.wide : 1);
      spread = [-s, s];
    }

    for (const offset of spread) {
      let a = ang + offset + (r() - 0.5) * 0.16;
      a = a + (-Math.PI / 2 - a) * SETTINGS.bias;
      a = Math.max(-Math.PI + 0.06, Math.min(-0.06, a));
      grow(x1, y1, a, L * (SETTINGS.shrink + r() * 0.08), w * 0.7, d + 1);
    }
  };
  grow(600, 716, -Math.PI / 2, SETTINGS.trunk, 44, 0);

  const f = (n) => n.toFixed(1);
  const normal = (ax, ay, bx, by) => {
    const dx = bx - ax;
    const dy = by - ay;
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  };

  let limbs = "";
  let joints = "";
  for (const s of segs) {
    const cx = (s.x + s.x1) / 2 - Math.sin(s.ang) * s.L * s.bend * 0.5;
    const cy = (s.y + s.y1) / 2 + Math.cos(s.ang) * s.L * s.bend * 0.5;
    const n0 = normal(s.x, s.y, cx, cy);
    const n1 = normal(cx, cy, s.x1, s.y1);
    let mx = n0[0] + n1[0];
    let my = n0[1] + n1[1];
    const ml = Math.hypot(mx, my) || 1;
    mx /= ml;
    my /= ml;
    const h0 = s.w0 / 2;
    const h1 = s.w1 / 2;
    const hm = (h0 + h1) / 2;

    limbs +=
      "M" + f(s.x + n0[0] * h0) + " " + f(s.y + n0[1] * h0) +
      "Q" + f(cx + mx * hm) + " " + f(cy + my * hm) + " " + f(s.x1 + n1[0] * h1) + " " + f(s.y1 + n1[1] * h1) +
      "L" + f(s.x1 - n1[0] * h1) + " " + f(s.y1 - n1[1] * h1) +
      "Q" + f(cx - mx * hm) + " " + f(cy - my * hm) + " " + f(s.x - n0[0] * h0) + " " + f(s.y - n0[1] * h0) + "Z";

    if (s.d < SETTINGS.maxDepth) {
      joints +=
        "M" + f(s.x1 - h1) + " " + f(s.y1) +
        "a" + f(h1) + " " + f(h1) + " 0 1 0 " + f(2 * h1) + " 0" +
        "a" + f(h1) + " " + f(h1) + " 0 1 0 " + f(-2 * h1) + " 0Z";
    }
  }

  return { segs, limbs, joints };
}

// Places where a wish tag can hang, spread along the outer branches.
// Positions use cqw (percent of the tree box width) so they scale with the tree.
function buildTagSpots(segs, count = 640) {
  const r = makeRandom(1120);
  const gauss = () => {
    let u = 0;
    while (u === 0) u = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  };

  const outer = segs.filter((s) => s.d >= 4);
  const total = outer.reduce((sum, s) => sum + s.L, 0);
  const pick = () => {
    let k = r() * total;
    for (const s of outer) {
      k -= s.L;
      if (k <= 0) return s;
    }
    return outer[outer.length - 1];
  };

  const spots = [];
  let guard = 0;
  while (spots.length < count && guard < 6000) {
    guard++;
    const s = pick();
    const t = r() < 0.35 ? 0.85 + r() * 0.15 : 0.1 + r() * 0.9;
    const px = -Math.sin(s.ang);
    const py = Math.cos(s.ang);
    const off = (r() - 0.5) * 8;
    const x = s.x + (s.x1 - s.x) * t + px * off;
    const y = s.y + (s.y1 - s.y) * t + py * off;
    if (y > 410) continue;

    const w = 0.6 + r() * 0.16;
    const h = 1.35 + r() * 0.4;
    spots.push({
      x,
      y,
      left: (x / 12).toFixed(3) + "cqw",
      top: (y / 8).toFixed(3) + "%",
      w: w.toFixed(2) + "cqw",
      h: h.toFixed(2) + "cqw",
      ml: (-w / 2).toFixed(3) + "cqw",
      rot: Math.round(Math.max(-48, Math.min(48, gauss() * 22))),
      swayDuration: (3 + r() * 2.4).toFixed(2) + "s",
      swayDelay: (-r() * 5).toFixed(2) + "s",
      tone: r(),
    });
  }
  return spots;
}

export const TREE = buildTree();
export const TAG_SPOTS = buildTagSpots(TREE.segs);
