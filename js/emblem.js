// ============================================================================
// European emblem — 12 five-pointed stars in a circle, drawn as SVG
// ============================================================================
(function drawEmblem() {
  const svg = document.querySelector(".eu-emblem");
  if (!svg) return;

  const cx = 36, cy = 24, ringR = 15, starR = 3.1;

  function star(x, y, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 === 0 ? r : r * 0.382; // golden inner ratio
      const a = (-Math.PI / 2) + i * Math.PI / 5;
      pts.push(`${(x + rad * Math.cos(a)).toFixed(2)},${(y + rad * Math.sin(a)).toFixed(2)}`);
    }
    return `<polygon points="${pts.join(" ")}" fill="#FFD617"/>`;
  }

  let markup = "";
  for (let i = 0; i < 12; i++) {
    const a = (-Math.PI / 2) + i * (2 * Math.PI / 12);
    markup += star(cx + ringR * Math.cos(a), cy + ringR * Math.sin(a), starR);
  }
  svg.innerHTML = markup;
})();
