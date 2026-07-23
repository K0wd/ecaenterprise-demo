// Build a clean, non-technical VISUAL report from the Playwright run.
//
// Each scenario is shown as its BDD steps (Given/When/Then) with the screenshot
// of that exact moment inline underneath, plus the scenario's video. No worker
// IDs, no code — just the journey, so anyone can eyeball the evidence.
//
// Sources:
//   - test-results/results.json  (Playwright JSON: per-scenario status + inline
//                                 base64 step screenshots + video file paths)
//   - features/*.feature         (canonical Gherkin: Background + steps + keywords)
//
// Output:
//   - public/index.html          (self-contained visual report — the landing page)
//   - public/evidence/*.webm     (per-scenario videos)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const RESULTS = process.env.RESULTS || 'test-results/results.json';
const FEATURES_DIR = process.env.FEATURES_DIR || 'features';
const OUT_DIR = process.env.OUT_DIR || 'public';
const REPORT_META = process.env.REPORT_META || ''; // e.g. "Run #5 · main · 2026-07-23"

const KEYWORDS = ['Given', 'When', 'Then', 'And', 'But', '*'];

/** Parse every .feature file into { scenarioName -> { feature, steps:[{keyword,text}] } }. */
function parseFeatures(dir) {
  const map = new Map();
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.feature'))) {
    const lines = readFileSync(join(dir, file), 'utf8').split(/\r?\n/);
    let feature = file.replace('.feature', '');
    let background = [];
    let current = null; // steps array of the scenario being read
    let bucket = null; // 'background' | 'scenario'

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
        // Executed order = background steps first, then scenario steps.
        map.set(name, { feature, steps: current, _background: background });
        continue;
      }
      const step = parseStep(line);
      if (!step) continue;
      if (bucket === 'background') background.push(step);
      else if (bucket === 'scenario' && current) current.push(step);
    }
  }
  // Flatten background into each scenario's step list.
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
        .map((a) => a.body); // base64
      const video = (result.attachments || []).find((a) => a.contentType?.startsWith('video'));
      const status = spec.tests?.[0]?.status;
      scenarios.push({
        name: spec.title,
        ok: spec.ok !== false && status !== 'unexpected',
        flaky: status === 'flaky',
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

// Group scenarios by feature (fall back to "Tests" if unmatched).
const byFeature = new Map();
scenarios.forEach((sc, i) => {
  const meta = features.get(sc.name);
  const featureName = meta?.feature || 'Tests';
  const steps = meta?.steps || sc.shots.map((_, k) => ({ keyword: '*', text: `Step ${k + 1}` }));

  // Copy the video next to the report and reference it locally.
  let videoRel = null;
  if (sc.videoPath) {
    videoRel = `evidence/scenario-${i + 1}.webm`;
    try { copyFileSync(sc.videoPath, join(OUT_DIR, videoRel)); }
    catch (e) { console.warn(`Could not copy video for "${sc.name}":`, e.message); videoRel = null; }
  }

  // Pair each executed step with its screenshot (same execution order).
  const rows = sc.shots.map((body, k) => ({
    keyword: steps[k]?.keyword || '*',
    text: steps[k]?.text || sc.name,
    img: body,
  }));

  if (!byFeature.has(featureName)) byFeature.set(featureName, []);
  byFeature.get(featureName).push({ ...sc, rows, videoRel });
});

const kwClass = (kw) => ({ Given: 'kw-given', When: 'kw-when', Then: 'kw-then' }[kw] || 'kw-and');

let body = '';
for (const [featureName, list] of byFeature) {
  body += `<section class="feature"><h2 class="feature-title">${esc(featureName)}</h2>`;
  for (const sc of list) {
    const pill = sc.ok ? '<span class="pill pass">PASSED</span>' : '<span class="pill fail">FAILED</span>';
    body += `<article class="scenario"><header class="sc-head"><h3>${esc(sc.name)}</h3>${pill}</header>`;
    body += '<ol class="steps">';
    for (const row of sc.rows) {
      body += `<li class="step"><div class="step-text"><span class="kw ${kwClass(row.keyword)}">${esc(row.keyword)}</span> ${esc(row.text)}</div>`;
      if (row.img) body += `<img class="shot" loading="lazy" src="data:image/png;base64,${row.img}" alt="${esc(row.text)}">`;
      body += '</li>';
    }
    body += '</ol>';
    if (sc.videoRel) {
      body += `<details class="video"><summary>▶ Watch the recording</summary><video controls preload="none" src="${sc.videoRel}"></video></details>`;
    }
    body += '</article>';
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
  .scenario { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:18px 20px; margin:18px 0; }
  .sc-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px; }
  .sc-head h3 { margin:0; font-size:1.05rem; }
  .pill { font-size:.7rem; font-weight:700; letter-spacing:.5px; padding:4px 9px; border-radius:999px; }
  .pill.pass { background:rgba(34,197,94,.15); color:var(--pass); }
  .pill.fail { background:rgba(239,68,68,.15); color:var(--fail); }
  ol.steps { list-style:none; margin:0; padding:0; }
  .step { padding:14px 0; border-top:1px dashed var(--line); }
  .step:first-child { border-top:none; }
  .step-text { margin-bottom:10px; }
  .kw { display:inline-block; min-width:52px; text-align:center; font-weight:700; font-size:.75rem;
        padding:2px 8px; border-radius:6px; margin-right:8px; text-transform:uppercase; }
  .kw-given { background:rgba(59,130,246,.18); color:var(--given); }
  .kw-when  { background:rgba(245,158,11,.18); color:var(--when); }
  .kw-then  { background:rgba(34,197,94,.18); color:var(--then); }
  .kw-and   { background:rgba(139,147,181,.18); color:var(--and); }
  img.shot { display:block; width:100%; border:1px solid var(--line); border-radius:10px; cursor:zoom-in; }
  details.video { margin-top:14px; }
  details.video summary { cursor:pointer; color:#8bb4ff; font-weight:600; }
  details.video video { width:100%; margin-top:10px; border-radius:10px; border:1px solid var(--line); }
  /* Lightbox */
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
  <p class="links"><a href="report/">Full Playwright report (video &amp; trace) →</a><a href="https://kimbandeleon.pro/#ci-runs">← Back to portfolio</a></p>
</header>
${body}
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
console.log(`visual report: ${total} scenarios (${passed} passed, ${failed} failed) -> ${join(OUT_DIR, 'index.html')}`);
