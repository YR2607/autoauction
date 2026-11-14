// Generates stylized SVG vehicle placeholders in public/seed-images/.
// Replace with licensed photography before production.
import fs from "node:fs";
import path from "node:path";

const outDir = path.join(process.cwd(), "public", "seed-images");
fs.mkdirSync(outDir, { recursive: true });

// Generic car silhouette path (stylized sports sedan profile).
const CAR = `M60 210 L70 168 Q95 152 160 148 L205 105 Q215 96 240 94 L430 92 Q470 93 505 118 L545 148 Q610 152 660 162 Q700 170 705 190 L708 210 L680 210 A38 38 0 0 0 604 210 L262 210 A38 38 0 0 0 186 210 Z M210 148 L245 108 Q250 102 262 102 L420 100 Q452 101 480 122 L512 148 Z`;

const PALETTES = [
  ["#1e293b", "#0f172a", "#64748b"],
  ["#17202b", "#0b1220", "#3b82f6"],
  ["#22272e", "#14181d", "#94a3b8"],
  ["#1c1917", "#0c0a09", "#78716c"],
  ["#111827", "#030712", "#4b5563"],
  ["#1a2233", "#0e1524", "#2563eb"],
  ["#201d26", "#131017", "#a78bfa"],
  ["#14201c", "#0a120f", "#34d399"],
  ["#241a1a", "#150e0e", "#f87171"],
  ["#1b2029", "#0d1117", "#fbbf24"],
  ["#161b26", "#0a0e18", "#60a5fa"],
  ["#1f2937", "#111827", "#9ca3af"],
];

function svg(i) {
  const [a, b, accent] = PALETTES[i % PALETTES.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/>
    </linearGradient>
    <linearGradient id="car" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${b}" />
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.65" r="0.6">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.25"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1280" height="800" fill="url(#bg)"/>
  <rect width="1280" height="800" fill="url(#glow)"/>
  <g transform="translate(255,215) scale(1.0)">
    <path d="${CAR}" fill="url(#car)"/>
    <circle cx="224" cy="210" r="34" fill="${b}" stroke="${accent}" stroke-width="4"/>
    <circle cx="642" cy="210" r="34" fill="${b}" stroke="${accent}" stroke-width="4"/>
  </g>
</svg>`;
}

for (let i = 0; i < 36; i++) {
  fs.writeFileSync(path.join(outDir, `car-${String(i + 1).padStart(2, "0")}.svg`), svg(i));
}
console.log("wrote 36 seed images to public/seed-images/");
