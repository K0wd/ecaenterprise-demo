// Build a clean, non-technical VISUAL report from the Playwright run.
//
// Each scenario is shown as its BDD steps (Given/When/Then). Each step's screenshot
// is foldable (collapsed by default) so the journey stays scannable. One stitched
// video of the ENTIRE suite plays at the bottom, always visible.
//
// Sources:
//   - test-results/results.json  (Playwright JSON: per-scenario status + inline
//                                 base64 step screenshots + video file paths)
//   - features/*.feature         (canonical Gherkin: Background + steps + keywords)
//
// Output:
//   - public/index.html            (self-contained visual report — the landing page)
//   - public/evidence/journey-N.webm + manifest.txt  (ordered clips for the CI stitch)
//   The workflow then stitches them into public/evidence/full-journey.webm.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RESULTS = process.env.RESULTS || 'test-results/results.json';
const FEATURES_DIR = process.env.FEATURES_DIR || 'features';
const OUT_DIR = process.env.OUT_DIR || 'public';
const REPORT_META = process.env.REPORT_META || ''; // e.g. "Run #5 · main · 2026-07-23"

// Logical narrative order for features (lower = earlier). Others fall to the end.
const FEATURE_ORDER = { Login: 1, 'Shopping cart': 2, Checkout: 3 };
const featureRank = (name) => FEATURE_ORDER[name] ?? 99;

/** Parse every .feature file into { scenarioName -> { feature, steps:[{keyword,text}] } }. */
function parseFeatures(dir) {
  const map = new Map();
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.feature'))) {
    const lines = readFileSync(join(dir, file), 'utf8').split(/\r?\n/);
    let feature = file.replace('.feature', '');
    let background = [];
    let current = null;
    let bucket = null;

    const parseStep = (line) => {
      const m = line.match(/^(Given|When|Then|And|But|\*)\s+(.*)$/);
      return m ? { keyword: m[1], text: m[2].trim() } : null;
    };

    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      if (line.startsWith('Feature:')) { feature = line.slice(8).trim(); continue; }
      if (line.startsWith('Background:')) { bucket = 'background'; background = []; continue; }
      if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
        const name = line.replace(/^Scenario( Outline)?:/, '').trim();
        current = [];
        bucket = 'scenario';
        map.set(name, { feature, steps: current, _background: background });
        continue;
      }
      const step = parseStep(line);
      if (!step) continue;
      if (bucket === 'background') background.push(step);
      else if (bucket === 'scenario' && current) current.push(step);
    }
  }
  for (const entry of map.values()) {
    entry.steps = [...entry._background, ...entry.steps];
    delete entry._background;
  }
  return map;
}

/** Collect scenarios from the Playwright JSON, preserving suite order. */
function collectScenarios(report) {
  const scenarios = [];
  const walk = (suite) => {
    for (const spec of suite.specs || []) {
      const result = (spec.tests || [])[0]?.results?.[0] || {};
      const shots = (result.attachments || [])
        .filter((a) => a.name?.startsWith('Step: ') && a.contentType === 'image/png' && a.body)
        .map((a) => a.body);
      const video = (result.attachments || []).find((a) => a.contentType?.startsWith('video'));
      const status = spec.tests?.[0]?.status;
      scenarios.push({
        name: spec.title,
        ok: spec.ok !== false && status !== 'unexpected',
        shots,
        videoPath: video?.path || null,
      });
    }
    for (const child of suite.suites || []) walk(child);
  };
  for (const suite of report.suites || []) walk(suite);
  return scenarios;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---- Build ----
const report = JSON.parse(readFileSync(RESULTS, 'utf8'));
const features = parseFeatures(FEATURES_DIR);
const scenarios = collectScenarios(report);

mkdirSync(join(OUT_DIR, 'evidence'), { recursive: true });

const total = scenarios.length;
const passed = scenarios.filter((s) => s.ok).length;
const failed = total - passed;

// Attach feature + steps, then sort into logical narrative order (stable within a feature).
const enriched = scenarios.map((sc) => {
  const meta = features.get(sc.name);
  return { ...sc, feature: meta?.feature || 'Tests', steps: meta?.steps || sc.shots.map((_, k) => ({ keyword: '*', text: `Step ${k + 1}` })) };
});
enriched.sort((a, b) => featureRank(a.feature) - featureRank(b.feature));

// Copy each scenario's video in narrative order and record it for the stitched journey.
const manifest = [];
enriched.forEach((sc, i) => {
  if (!sc.videoPath) return;
  const clip = `journey-${i + 1}.webm`;
  try {
    copyFileSync(sc.videoPath, join(OUT_DIR, 'evidence', clip));
    manifest.push(`file '${clip}'`);
  } catch (e) {
    console.warn(`Could not copy video for "${sc.name}":`, e.message);
  }
});
writeFileSync(join(OUT_DIR, 'evidence', 'manifest.txt'), manifest.join('\n') + '\n');

// Group (already ordered) scenarios by feature for rendering.
const byFeature = new Map();
for (const sc of enriched) {
  if (!byFeature.has(sc.feature)) byFeature.set(sc.feature, []);
  byFeature.get(sc.feature).push(sc);
}

const kwClass = (kw) => ({ Given: 'kw-given', When: 'kw-when', Then: 'kw-then' }[kw] || 'kw-and');

let body = '';
for (const [featureName, list] of byFeature) {
  body += `<section class="feature"><h2 class="feature-title">${esc(featureName)}</h2>`;
  for (const sc of list) {
    const pill = sc.ok ? '<span class="pill pass">PASSED</span>' : '<span class="pill fail">FAILED</span>';
    body += `<details class="scenario"><summary class="sc-head"><h3>${esc(sc.name)}</h3>${pill}</summary><ol class="steps">`;
    sc.shots.forEach((img, k) => {
      const kw = sc.steps[k]?.keyword || '*';
      const text = sc.steps[k]?.text || sc.name;
      body += `<li class="step"><div class="step-text"><span class="kw ${kwClass(kw)}">${esc(kw)}</span> ${esc(text)}</div>`;
      if (img) {
        body += `<details class="shot-wrap"><summary>Screenshot</summary>`
          + `<img class="shot" loading="lazy" src="data:image/png;base64,${img}" alt="${esc(text)}"></details>`;
      }
      body += '</li>';
    });
    body += '</ol></details>';
  }
  body += '</section>';
}

const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>ecaenterprise — Test Journey</title>
<style>
  :root { --bg:#0f1223; --card:#181c31; --line:#282d45; --text:#e8eaf2; --muted:#9aa0bd;
          --given:#3b82f6; --when:#f59e0b; --then:#22c55e; --and:#8b93b5; --pass:#22c55e; --fail:#ef4444; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--text); font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif; }
  .wrap { max-width:900px; margin:0 auto; padding:32px 20px 80px; }
  header.top { margin-bottom:28px; }
  h1 { font-size:1.7rem; margin:0 0 6px; }
  .sub { color:var(--muted); margin:0 0 14px; }
  .summary { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:8px; }
  .stat { background:var(--card); border:1px solid var(--line); border-radius:10px; padding:8px 14px; font-weight:600; }
  .stat b { font-size:1.15rem; }
  .stat.pass b { color:var(--pass); } .stat.fail b { color:var(--fail); }
  .links a { color:#8bb4ff; margin-right:16px; font-size:.9rem; }
  .feature { margin-top:36px; }
  .feature-title { font-size:1.25rem; border-bottom:2px solid var(--line); padding-bottom:8px; }
  .scenario { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:6px 20px; margin:18px 0; }
  .sc-head { display:flex; align-items:center; gap:12px; padding:12px 0; cursor:pointer; list-style:none; }
  .sc-head::-webkit-details-marker { display:none; }
  .sc-head::before { content:'▸'; color:var(--muted); font-size:.85rem; transition:transform .15s; }
  .scenario[open] .sc-head::before { transform:rotate(90deg); }
  .sc-head h3 { margin:0; font-size:1.05rem; flex:1; }
  .scenario[open] .sc-head { border-bottom:1px dashed var(--line); margin-bottom:6px; }
  .pill { font-size:.7rem; font-weight:700; letter-spacing:.5px; padding:4px 9px; border-radius:999px; }
  .pill.pass { background:rgba(34,197,94,.15); color:var(--pass); }
  .pill.fail { background:rgba(239,68,68,.15); color:var(--fail); }
  ol.steps { list-style:none; margin:0; padding:0; }
  .step { padding:12px 0; border-top:1px dashed var(--line); }
  .step:first-child { border-top:none; }
  .step-text { }
  .kw { display:inline-block; min-width:52px; text-align:center; font-weight:700; font-size:.75rem;
        padding:2px 8px; border-radius:6px; margin-right:8px; text-transform:uppercase; }
  .kw-given { background:rgba(59,130,246,.18); color:var(--given); }
  .kw-when  { background:rgba(245,158,11,.18); color:var(--when); }
  .kw-then  { background:rgba(34,197,94,.18); color:var(--then); }
  .kw-and   { background:rgba(139,147,181,.18); color:var(--and); }
  .shot-wrap { margin-top:8px; }
  .shot-wrap summary { cursor:pointer; color:#8bb4ff; font-size:.82rem; font-weight:600; margin-left:60px; list-style:none; }
  .shot-wrap summary::before { content:'▸ '; }
  .shot-wrap[open] summary::before { content:'▾ '; }
  img.shot { display:block; width:100%; margin-top:10px; border:1px solid var(--line); border-radius:10px; cursor:zoom-in; }
  section.journey { margin-top:48px; padding-top:24px; border-top:2px solid var(--line); }
  section.journey h2 { font-size:1.35rem; margin:0 0 4px; }
  section.journey video { width:100%; margin-top:14px; border-radius:12px; border:1px solid var(--line); background:#000; }
  #lb { position:fixed; inset:0; background:rgba(0,0,0,.9); display:none; align-items:center; justify-content:center; padding:20px; cursor:zoom-out; z-index:50; }
  #lb img { max-width:100%; max-height:100%; border-radius:8px; }
</style></head>
<body><div class="wrap">
<header class="top">
  <h1>ecaenterprise — Test Journey</h1>
  <p class="sub">SauceDemo end-to-end suite · Playwright + Cucumber (BDD)${REPORT_META ? ' · ' + esc(REPORT_META) : ''}</p>
  <div class="summary">
    <span class="stat">Total <b>${total}</b></span>
    <span class="stat pass">Passed <b>${passed}</b></span>
    <span class="stat fail">Failed <b>${failed}</b></span>
  </div>
  <p class="links"><a href="report/">Full Playwright report (trace) →</a><a href="https://kimbandeleon.pro/#ci-runs">← Back to portfolio</a></p>
</header>
${body}
<section class="journey">
  <h2>Full test journey recording</h2>
  <p class="sub">The entire suite, start to finish, stitched into one video — press play to watch the whole run.</p>
  <video controls preload="metadata" src="evidence/full-journey.webm"></video>
</section>
</div>
<div id="lb"><img alt=""></div>
<script>
  var lb = document.getElementById('lb'), lbImg = lb.querySelector('img');
  document.addEventListener('click', function(e){
    if (e.target.classList.contains('shot')) { lbImg.src = e.target.src; lb.style.display = 'flex'; }
    else if (e.target === lb || e.target === lbImg) { lb.style.display = 'none'; lbImg.src = ''; }
  });
</script>
</body></html>`;

writeFileSync(join(OUT_DIR, 'index.html'), html);
console.log(`visual report: ${total} scenarios (${passed} passed, ${failed} failed), ${manifest.length} clips to stitch -> ${join(OUT_DIR, 'index.html')}`);
