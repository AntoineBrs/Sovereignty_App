// ============================================================================
// Radar (spider) chart — dependency-free SVG renderer
// ----------------------------------------------------------------------------
// radarSVG(labels, values, options) -> SVG markup string.
//   labels : string[]          axis labels
//   values : number[] (0-100)  one value per axis
// ============================================================================

function radarSVG(labels, values, options) {
  const opt = Object.assign({
    size: 260,          // viewBox size (square)
    labelSpace: 74,     // padding reserved for labels around the plot
    fill: "#004494",
    rings: 4
  }, options || {});

  const size = opt.size;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - opt.labelSpace;
  const n = labels.length;
  // Start at the top (−90°) and go clockwise.
  const angleFor = i => (-Math.PI / 2) + (i * 2 * Math.PI / n);
  const pt = (i, radius) => ({
    x: cx + radius * Math.cos(angleFor(i)),
    y: cy + radius * Math.sin(angleFor(i))
  });

  let svg = `<svg viewBox="0 0 ${size} ${size}" class="radar" role="img" aria-label="Sovereignty radar chart" xmlns="http://www.w3.org/2000/svg">`;

  // Concentric grid rings.
  for (let ring = 1; ring <= opt.rings; ring++) {
    const rr = r * ring / opt.rings;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const p = pt(i, rr);
      pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    svg += `<polygon points="${pts.join(" ")}" class="radar-ring"/>`;
  }

  // Axes (spokes).
  for (let i = 0; i < n; i++) {
    const p = pt(i, r);
    svg += `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" class="radar-axis"/>`;
  }

  // Data polygon.
  const dataPts = [];
  for (let i = 0; i < n; i++) {
    const v = Math.max(0, Math.min(100, values[i])) / 100;
    const p = pt(i, r * v);
    dataPts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  svg += `<polygon points="${dataPts.join(" ")}" class="radar-area" style="fill:${opt.fill}"/>`;
  // Data vertices.
  for (let i = 0; i < n; i++) {
    const v = Math.max(0, Math.min(100, values[i])) / 100;
    const p = pt(i, r * v);
    svg += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2.6" class="radar-dot" style="fill:${opt.fill}"/>`;
  }

  // Axis labels (may wrap over two lines).
  for (let i = 0; i < n; i++) {
    const p = pt(i, r + 14);
    let anchor = "middle";
    if (p.x < cx - 4) anchor = "end";
    else if (p.x > cx + 4) anchor = "start";
    const words = String(labels[i]).split(" ");
    const lines = wrapWords(words, 14);
    const dy0 = -((lines.length - 1) * 5.5);
    let tspans = "";
    lines.forEach((line, idx) => {
      tspans += `<tspan x="${p.x.toFixed(1)}" dy="${idx === 0 ? dy0.toFixed(1) : 11}">${escapeXml(line)}</tspan>`;
    });
    svg += `<text x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" text-anchor="${anchor}" class="radar-label">${tspans}</text>`;
  }

  svg += `</svg>`;
  return svg;
}

// Greedy word-wrap into lines no longer than maxChars.
function wrapWords(words, maxChars) {
  const lines = [];
  let cur = "";
  words.forEach(w => {
    if (!cur.length) { cur = w; }
    else if ((cur + " " + w).length <= maxChars) { cur += " " + w; }
    else { lines.push(cur); cur = w; }
  });
  if (cur.length) lines.push(cur);
  return lines;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
