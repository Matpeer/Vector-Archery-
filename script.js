/* =====================================================
   Vector Archery – לוגיקת משחק מלאה (גרסה 2)
   קובץ: script.js
   ===================================================== */

// =====================================================
// נתוני השלבים
// =====================================================
const LEVELS = {

  // ----- רמה 1: רכיבי וקטור -----
  1: [
    { target: { x: 3,  y: 4  }, hint: 'הזן את רכיבי הווקטור כדי להגיע למטרה.' },
    { target: { x: 5,  y: 2  }, hint: 'המטרה נמצאת ימינה ומעלה – Vx חיובי, Vy חיובי.' },
    { target: { x: -4, y: 3  }, hint: 'המטרה ברביע שני – Vx שלילי, Vy חיובי.' },
    { target: { x: 6,  y: -3 }, hint: 'המטרה מתחת לציר X – Vy שלילי.' },
    { target: { x: -5, y: -4 }, hint: 'רביע שלישי – שני הרכיבים שליליים.' },
  ],

  // ----- רמה 2: גודל וזווית בלבד -----
  2: [
    { target: { x: 4,  y: 3  }, hint: 'חשב: |V| = √(Vx²+Vy²) וזווית = atan2(Vy,Vx). השתמש במחשבון!' },
    { target: { x: 0,  y: 5  }, hint: 'המטרה ישר למעלה. ציר Y – מה הזווית?' },
    { target: { x: 5,  y: 5  }, hint: 'שני הרכיבים שווים – כלומר זווית 45°.' },
    { target: { x: -3, y: 4  }, hint: 'ברביע שני – הזווית גדולה מ-90°.' },
    { target: { x: 6,  y: -2 }, hint: 'מתחת לציר X – זווית שלילית. השתמש במחשבון.' },
  ],

  // ----- רמה 3: רוח צד -----
  3: [
    { target: { x: 5,  y: 4  }, wind: { x:  2, y: -1 }, hint: 'הרוח משנה את מסלול החץ. ירה כך שאחרי הרוח תגיע למטרה.' },
    { target: { x: -3, y: 5  }, wind: { x: -1, y:  2 }, hint: 'רוח אלכסונית. חשב: ווקטור_ירי = מטרה − רוח.' },
    { target: { x: 4,  y: -3 }, wind: { x:  3, y:  1 }, hint: 'רוח חזקה לימין. פצה אותה בירי שמאלה.' },
    { target: { x: 6,  y: 6  }, wind: { x: -2, y: -3 }, hint: 'הרוח מנגד למטרה – ירה חזק יותר!' },
    { target: { x: 0,  y: 5  }, wind: { x:  2, y:  0 }, hint: 'רוח אופקית בלבד.' },
  ],

  // ----- רמה 4: שתי קשתות -----
  4: [
    {
      target: { x: 7, y: 6 },
      bow1Origin: { x: -3, y: 0 }, bow2Origin: { x: 0, y: -3 },
      maxRange1: 6, maxRange2: 5,
      hint: 'V1 + V2 חייב להיות: Vx = 7, Vy = 6. בדוק מגבלות טווח!',
    },
    {
      target: { x: 8, y: 5 },
      bow1Origin: { x: -2, y: 0 }, bow2Origin: { x: 0, y: -2 },
      maxRange1: 6, maxRange2: 5,
      hint: 'V1 + V2 חייב להגיע: Vx = 8, Vy = 5. חלק חכם!',
    },
    {
      target: { x: -5, y: 7 },
      bow1Origin: { x: 2, y: 0 }, bow2Origin: { x: 0, y: 2 },
      maxRange1: 6, maxRange2: 5,
      hint: 'המטרה ברביע שני – Vx שלילי. V1 + V2: Vx = -5, Vy = 7.',
    },
  ],
};

// =====================================================
// גלובליות
// =====================================================
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

let currentLevel   = 1;
let currentStepIdx = 0;
let score          = 0;
let totalAttempts  = 0;
let firedAlready   = false;

const GRID_UNITS = 10;
let CELL_SIZE, ORIGIN_X, ORIGIN_Y;

// =====================================================
// Resize
// =====================================================
function resizeCanvas() {
  const section = document.getElementById('canvas-section');
  const size = Math.min(section.clientWidth - 32, section.clientHeight - 32, 580);
  canvas.width  = size;
  canvas.height = size;
  CELL_SIZE = size / (GRID_UNITS * 2);
  ORIGIN_X  = size / 2;
  ORIGIN_Y  = size / 2;
  drawScene();
}
window.addEventListener('resize', resizeCanvas);

// =====================================================
// קואורדינטות
// =====================================================
function toPixel(x, y) {
  return { px: ORIGIN_X + x * CELL_SIZE, py: ORIGIN_Y - y * CELL_SIZE };
}

// =====================================================
// ציור רשת
// =====================================================
function drawGrid() {
  ctx.strokeStyle = '#c9d4ef';
  ctx.lineWidth   = 0.5;
  for (let i = -GRID_UNITS; i <= GRID_UNITS; i++) {
    const { px } = toPixel(i, 0);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, canvas.height); ctx.stroke();
    const { py } = toPixel(0, i);
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(canvas.width, py); ctx.stroke();
  }

  // צירים
  ctx.strokeStyle = '#1a3a8f'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, ORIGIN_Y); ctx.lineTo(canvas.width, ORIGIN_Y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ORIGIN_X, 0); ctx.lineTo(ORIGIN_X, canvas.height); ctx.stroke();

  drawArrowHead(canvas.width - 6, ORIGIN_Y, 0, '#1a3a8f', 9);
  drawArrowHead(ORIGIN_X, 6, Math.PI / 2, '#1a3a8f', 9);

  ctx.fillStyle = '#1a3a8f'; ctx.font = 'bold 13px Segoe UI';
  ctx.textAlign = 'left';   ctx.fillText('X', canvas.width - 16, ORIGIN_Y - 9);
  ctx.textAlign = 'center'; ctx.fillText('Y', ORIGIN_X + 13, 15);

  ctx.font = '10px Segoe UI'; ctx.fillStyle = '#8492a6';
  for (let i = -GRID_UNITS; i <= GRID_UNITS; i++) {
    if (i === 0) continue;
    const { px } = toPixel(i, 0);
    ctx.textAlign = 'center'; ctx.fillText(i, px, ORIGIN_Y + 14);
    const { py } = toPixel(0, i);
    ctx.textAlign = 'right'; ctx.fillText(i, ORIGIN_X - 6, py + 4);
  }
}

// =====================================================
// ראש חץ
// =====================================================
function drawArrowHead(x, y, angle, color, size = 10) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle - Math.PI / 2);
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(-size / 2, size); ctx.lineTo(size / 2, size);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// =====================================================
// ציור וקטור
// =====================================================
function drawVector(fromX, fromY, toX, toY, color, width = 2, label = '', dashed = false) {
  const from = toPixel(fromX, fromY);
  const to   = toPixel(toX, toY);

  ctx.save();
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(from.px, from.py); ctx.lineTo(to.px, to.py); ctx.stroke();
  ctx.setLineDash([]);

  const angle = Math.atan2(to.py - from.py, to.px - from.px);
  drawArrowHead(to.px, to.py, angle + Math.PI / 2, color, 10);

  if (label) {
    const mx = (from.px + to.px) / 2, my = (from.py + to.py) / 2;
    ctx.font = 'bold 11px Segoe UI'; ctx.textAlign = 'center';
    const w = ctx.measureText(label).width + 8;
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.fillRect(mx - w / 2, my - 14, w, 18);
    ctx.fillStyle = color; ctx.fillText(label, mx, my);
  }
  ctx.restore();
}

// =====================================================
// ציור מטרה
// =====================================================
function drawTarget(x, y) {
  const { px, py } = toPixel(x, y);
  const r = CELL_SIZE * 0.6;
  const colors = ['#e84545','#ffffff','#e84545','#ffffff','#e84545'];
  for (let i = 4; i >= 0; i--) {
    ctx.beginPath(); ctx.arc(px, py, r * (i + 1) / 5, 0, Math.PI * 2);
    ctx.fillStyle = colors[i]; ctx.fill();
  }
  ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#222'; ctx.fill();
}

// =====================================================
// ציור קשת
// =====================================================
function drawBow(cx, cy, color = '#5a6b85', label = '') {
  const { px, py } = toPixel(cx, cy);
  const r = CELL_SIZE * 0.52;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 3.5;
  ctx.beginPath(); ctx.arc(px, py, r, -Math.PI * 0.7, Math.PI * 0.7, false); ctx.stroke();
  const topY = py - r * Math.sin(Math.PI * 0.7);
  const botY = py + r * Math.sin(Math.PI * 0.7);
  const sx   = px + r * Math.cos(Math.PI * 0.7);
  ctx.beginPath(); ctx.moveTo(sx, topY); ctx.lineTo(sx, botY);
  ctx.strokeStyle = '#8b5a00'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  if (label) {
    ctx.font = 'bold 10px Segoe UI'; ctx.fillStyle = color; ctx.textAlign = 'center';
    ctx.fillText(label, px, py + r + 15);
  }
  ctx.restore();
}

// =====================================================
// אנימציית חץ
// =====================================================
function animateArrow(from, to, onDone) {
  const FRAMES  = 42;
  let   frame   = 0;
  const fromPx  = toPixel(from.x, from.y);
  const toPx    = toPixel(to.x, to.y);
  const angle   = Math.atan2(toPx.py - fromPx.py, toPx.px - fromPx.px);
  const arLen   = CELL_SIZE * 0.8;

  function step() {
    drawScene(false);
    const t = frame / FRAMES;
    const cx = fromPx.px + (toPx.px - fromPx.px) * t;
    const cy = fromPx.py + (toPx.py - fromPx.py) * t;
    ctx.save();
    ctx.strokeStyle = '#f39c12'; ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - Math.cos(angle) * arLen, cy - Math.sin(angle) * arLen);
    ctx.lineTo(cx, cy); ctx.stroke();
    drawArrowHead(cx, cy, angle + Math.PI / 2, '#f39c12', 10);
    ctx.restore();
    frame++;
    if (frame <= FRAMES) requestAnimationFrame(step);
    else onDone();
  }
  requestAnimationFrame(step);
}

// =====================================================
// ציור הסצנה
// =====================================================
function drawScene(withAnim = true) {
  if (!canvas.width) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  const steps = LEVELS[currentLevel];
  if (!steps) return;
  const step = steps[currentStepIdx];
  if (!step) return;

  if (currentLevel === 1 || currentLevel === 2) {
    drawBow(0, 0, '#1a3a8f', 'קשת');
    drawTarget(step.target.x, step.target.y);

  } else if (currentLevel === 3) {
    drawBow(0, 0, '#1a3a8f', 'קשת');
    drawTarget(step.target.x, step.target.y);
    if (step.wind) {
      drawVector(0, 0, step.wind.x, step.wind.y, '#0ea5e9', 2, '💨 רוח', true);
    }

  } else if (currentLevel === 4) {
    const b1 = step.bow1Origin, b2 = step.bow2Origin;
    drawBow(b1.x, b1.y, '#e84545', 'קשת א׳');
    drawBow(b2.x, b2.y, '#1a8f6a', 'קשת ב׳');
    drawTarget(step.target.x, step.target.y);
  }
}

// =====================================================
// עדכון ממשק לפי רמה
// =====================================================
function updateInputUI() {
  [1,2,3,4].forEach(n =>
    document.getElementById(`input-level${n}`).classList.add('hidden')
  );
  document.getElementById('wind-info').classList.add('hidden');
  document.getElementById('range-info').classList.add('hidden');

  document.getElementById(`input-level${currentLevel}`).classList.remove('hidden');

  const step = LEVELS[currentLevel][currentStepIdx];
  const tgt  = step.target;

  // תיבת קואורדינטות מטרה – מציגה Vx ו-Vy בנפרד
  const coordBox = document.getElementById('target-coords');
  coordBox.innerHTML =
    `🎯 מטרה: &nbsp; Vx = <strong>${tgt.x}</strong> &nbsp;|&nbsp; Vy = <strong>${tgt.y}</strong>`;

  if (currentLevel === 3 && step.wind) {
    document.getElementById('wind-info').classList.remove('hidden');
    document.getElementById('wind-x').textContent = step.wind.x;
    document.getElementById('wind-y').textContent = step.wind.y;
  }

  if (currentLevel === 4) {
    document.getElementById('range-info').classList.remove('hidden');
    document.getElementById('range1-display').textContent = step.maxRange1 + ' יחידות';
    document.getElementById('range2-display').textContent = step.maxRange2 + ' יחידות';
  }

  document.getElementById('problem-title').textContent =
    `רמה ${currentLevel} – שלב ${currentStepIdx + 1}`;
  document.getElementById('problem-desc').textContent = step.hint;

  document.getElementById('btn-next').classList.add('hidden');
  document.getElementById('feedback-box').classList.add('hidden');
  firedAlready = false;
}

// =====================================================
// קריאת קלט
// =====================================================
function getUserVector() {
  const l = currentLevel;

  if (l === 1) {
    return {
      type: 'single',
      vx: parseFloat(document.getElementById('l1-vx').value) || 0,
      vy: parseFloat(document.getElementById('l1-vy').value) || 0,
    };
  }

  if (l === 2) {
    const mag   = parseFloat(document.getElementById('l2-mag').value) || 0;
    const angle = parseFloat(document.getElementById('l2-angle').value) || 0;
    const rad   = angle * Math.PI / 180;
    return { type: 'polar', mag, angle, vx: mag * Math.cos(rad), vy: mag * Math.sin(rad) };
  }

  if (l === 3) {
    return {
      type: 'wind',
      vx: parseFloat(document.getElementById('l3-vx').value) || 0,
      vy: parseFloat(document.getElementById('l3-vy').value) || 0,
    };
  }

  if (l === 4) {
    return {
      type: 'dual',
      v1x: parseFloat(document.getElementById('l4-v1x').value) || 0,
      v1y: parseFloat(document.getElementById('l4-v1y').value) || 0,
      v2x: parseFloat(document.getElementById('l4-v2x').value) || 0,
      v2y: parseFloat(document.getElementById('l4-v2y').value) || 0,
    };
  }
}

// =====================================================
// עזר
// =====================================================
function dist(ax, ay, bx, by) { return Math.sqrt((ax-bx)**2 + (ay-by)**2); }

function calcScore(d) {
  if (d <= 0.4) return { pts: 100, label: '🎯 פגיעה מדויקת!',     color: '#2ecc71' };
  if (d <= 1.0) return { pts: 70,  label: '🟡 פגיעה קרובה מאוד', color: '#f39c12' };
  if (d <= 2.5) return { pts: 40,  label: '🔶 פגיעה קרובה',       color: '#e67e22' };
  return           { pts: 0,   label: '❌ פספוס',                 color: '#e84545' };
}

// =====================================================
// ירי
// =====================================================
function fire() {
  if (firedAlready) return;
  firedAlready = true;
  totalAttempts++;
  document.getElementById('hud-attempts').textContent = totalAttempts;

  const input = getUserVector();
  const step  = LEVELS[currentLevel][currentStepIdx];
  const tgt   = step.target;

  let hitX, hitY, feedbackRows = [], scoreResult;

  // ---- רמה 1 ----
  if (currentLevel === 1) {
    hitX = input.vx; hitY = input.vy;
    const d = dist(hitX, hitY, tgt.x, tgt.y);
    scoreResult = calcScore(d);
    const correctMag = Math.sqrt(tgt.x**2 + tgt.y**2).toFixed(2);
    const correctAng = (Math.atan2(tgt.y, tgt.x) * 180 / Math.PI).toFixed(1);
    feedbackRows = [
      { label: 'Vx שהזנת',   value: hitX.toFixed(2),           cls: '' },
      { label: 'Vy שהזנת',   value: hitY.toFixed(2),           cls: '' },
      { label: 'Vx נכון',    value: String(tgt.x),              cls: 'fb-correct' },
      { label: 'Vy נכון',    value: String(tgt.y),              cls: 'fb-correct' },
      { label: 'מרחק',       value: d.toFixed(2) + ' יחידות',   cls: d<=0.4?'fb-correct':'fb-wrong' },
      { label: '|V| הנכון',  value: correctMag + ' יחידות',     cls: 'fb-info' },
      { label: 'זווית נכונה',value: correctAng + '°',            cls: 'fb-info' },
      { label: 'הסבר',       value: 'לנקודה (x,y) הרכיבים הם Vx=x, Vy=y', cls: 'fb-info' },
    ];
  }

  // ---- רמה 2 ----
  else if (currentLevel === 2) {
    hitX = input.vx; hitY = input.vy;
    const d = dist(hitX, hitY, tgt.x, tgt.y);
    scoreResult = calcScore(d);
    const correctMag = Math.sqrt(tgt.x**2 + tgt.y**2).toFixed(3);
    const correctAng = (Math.atan2(tgt.y, tgt.x) * 180 / Math.PI).toFixed(2);
    feedbackRows = [
      { label: 'גודל שהזנת',  value: input.mag.toFixed(3),      cls: '' },
      { label: 'זווית שהזנת', value: input.angle.toFixed(2)+'°', cls: '' },
      { label: 'Vx מחושב',    value: hitX.toFixed(3),            cls: 'fb-info' },
      { label: 'Vy מחושב',    value: hitY.toFixed(3),            cls: 'fb-info' },
      { label: 'גודל נכון',   value: correctMag + ' יחידות',     cls: 'fb-correct' },
      { label: 'זווית נכונה', value: correctAng + '°',            cls: 'fb-correct' },
      { label: 'Vx נכון',     value: String(tgt.x),              cls: 'fb-correct' },
      { label: 'Vy נכון',     value: String(tgt.y),              cls: 'fb-correct' },
      { label: 'מרחק',        value: d.toFixed(2) + ' יחידות',   cls: d<=0.4?'fb-correct':'fb-wrong' },
      { label: 'נוסחה',       value: 'Vx=|V|·cos(θ), Vy=|V|·sin(θ)', cls: 'fb-info' },
    ];
  }

  // ---- רמה 3 ----
  else if (currentLevel === 3) {
    const wind = step.wind || { x:0, y:0 };
    hitX = input.vx + wind.x;
    hitY = input.vy + wind.y;
    const correctFx = tgt.x - wind.x, correctFy = tgt.y - wind.y;
    const d = dist(hitX, hitY, tgt.x, tgt.y);
    scoreResult = calcScore(d);
    feedbackRows = [
      { label: 'Vx ירי שלך',  value: String(input.vx),           cls: '' },
      { label: 'Vy ירי שלך',  value: String(input.vy),           cls: '' },
      { label: 'Vx רוח',      value: String(wind.x),             cls: 'fb-info' },
      { label: 'Vy רוח',      value: String(wind.y),             cls: 'fb-info' },
      { label: 'Vx שקול',     value: hitX.toFixed(2),            cls: '' },
      { label: 'Vy שקול',     value: hitY.toFixed(2),            cls: '' },
      { label: 'Vx ירי נכון', value: String(correctFx),          cls: 'fb-correct' },
      { label: 'Vy ירי נכון', value: String(correctFy),          cls: 'fb-correct' },
      { label: 'מרחק',        value: d.toFixed(2) + ' יחידות',   cls: d<=0.4?'fb-correct':'fb-wrong' },
      { label: 'הסבר',        value: 'ירי + רוח = שקול → ירי = מטרה − רוח', cls: 'fb-info' },
    ];
  }

  // ---- רמה 4 ----
  else if (currentLevel === 4) {
    const totalX = input.v1x + input.v2x;
    const totalY = input.v1y + input.v2y;
    hitX = totalX; hitY = totalY;
    const mag1 = Math.sqrt(input.v1x**2 + input.v1y**2);
    const mag2 = Math.sqrt(input.v2x**2 + input.v2y**2);
    const ok1  = mag1 <= step.maxRange1 + 0.01;
    const ok2  = mag2 <= step.maxRange2 + 0.01;
    const d    = dist(totalX, totalY, tgt.x, tgt.y);
    scoreResult = (!ok1 || !ok2) ? { pts:0, label:'⚠️ חריגת טווח!', color:'#e84545' } : calcScore(d);
    feedbackRows = [
      { label: 'V1x',          value: String(input.v1x),              cls: '' },
      { label: 'V1y',          value: String(input.v1y),              cls: '' },
      { label: '|V1|',         value: mag1.toFixed(2)+(ok1?' ✅':' ❌ חורג'), cls: ok1?'fb-correct':'fb-wrong' },
      { label: 'V2x',          value: String(input.v2x),              cls: '' },
      { label: 'V2y',          value: String(input.v2y),              cls: '' },
      { label: '|V2|',         value: mag2.toFixed(2)+(ok2?' ✅':' ❌ חורג'), cls: ok2?'fb-correct':'fb-wrong' },
      { label: 'Vx שקול',      value: totalX.toFixed(2),              cls: 'fb-info' },
      { label: 'Vy שקול',      value: totalY.toFixed(2),              cls: 'fb-info' },
      { label: 'Vx מטרה',      value: String(tgt.x),                  cls: 'fb-correct' },
      { label: 'Vy מטרה',      value: String(tgt.y),                  cls: 'fb-correct' },
      { label: 'מרחק',         value: d.toFixed(2) + ' יחידות',       cls: d<=0.4?'fb-correct':'fb-wrong' },
      { label: 'הסבר',         value: 'V1x+V2x ו-V1y+V2y בנפרד', cls: 'fb-info' },
    ];
  }

  // ---- ציור וקטורים אחרי הירי ----
  function showVectors() {
    if (currentLevel === 1 || currentLevel === 2) {
      drawVector(0,0,hitX,hitY,'#f39c12',3,'V שלך');
      if (Math.abs(hitX-tgt.x)>0.3 || Math.abs(hitY-tgt.y)>0.3)
        drawVector(0,0,tgt.x,tgt.y,'#2ecc71',2.5,'V נכון',true);

    } else if (currentLevel === 3) {
      const w = step.wind||{x:0,y:0};
      drawVector(0,0,input.vx,input.vy,'#e84545',3,'ירי');
      drawVector(input.vx,input.vy,input.vx+w.x,input.vy+w.y,'#0ea5e9',2.5,'רוח');
      drawVector(0,0,hitX,hitY,'#7c3aed',2.5,'שקול',true);

    } else if (currentLevel === 4) {
      const b1 = step.bow1Origin;
      const v1ex = b1.x+input.v1x, v1ey = b1.y+input.v1y;
      drawVector(b1.x,b1.y,v1ex,v1ey,'#e84545',3,'V1');
      const v2ex = v1ex+input.v2x, v2ey = v1ey+input.v2y;
      drawVector(v1ex,v1ey,v2ex,v2ey,'#1a8f6a',3,'V2');
      drawVector(b1.x,b1.y,v2ex,v2ey,'#7c3aed',2.5,'שקול',true);
    }
  }

  const bowOrigin = (currentLevel===4) ? LEVELS[currentLevel][currentStepIdx].bow1Origin : {x:0,y:0};

  animateArrow(bowOrigin, {x:hitX,y:hitY}, () => {
    showVectors();
    // נקודת פגיעה
    const {px,py} = toPixel(hitX,hitY);
    ctx.beginPath(); ctx.arc(px,py,6,0,Math.PI*2);
    ctx.fillStyle = scoreResult.pts===100 ? '#2ecc71' : '#e84545';
    ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();

    score += scoreResult.pts;
    document.getElementById('hud-score').textContent = score;
    showFeedback(scoreResult, feedbackRows);
    if (scoreResult.pts===100) showSuccessOverlay(scoreResult.label, scoreResult.pts);
    document.getElementById('btn-next').classList.remove('hidden');
  });
}

// =====================================================
// הצגת משוב
// =====================================================
function showFeedback(scoreResult, rows) {
  const box = document.getElementById('feedback-box');
  box.classList.remove('hidden');
  document.getElementById('feedback-header').innerHTML =
    `<span style="color:${scoreResult.color}">${scoreResult.label}</span>` +
    (scoreResult.pts > 0 ? ` &nbsp;+${scoreResult.pts} נקודות` : '');
  const mathDiv = document.getElementById('feedback-math');
  mathDiv.innerHTML = '';
  rows.forEach(r => {
    const row = document.createElement('div');
    row.className = `fb-row ${r.cls||''}`;
    row.innerHTML = `<span class="fb-label">${r.label}</span><span class="fb-value">${r.value}</span>`;
    mathDiv.appendChild(row);
  });
}

// =====================================================
// הצגת הצלחה
// =====================================================
function showSuccessOverlay(label, pts) {
  const ov = document.getElementById('success-overlay');
  ov.classList.remove('hidden');
  document.getElementById('success-text').textContent  = label;
  document.getElementById('success-points').textContent = `+${pts} נקודות`;
  setTimeout(() => ov.classList.add('hidden'), 2200);
}

// =====================================================
// הצגת פתרון
// =====================================================
function showSolution() {
  const step = LEVELS[currentLevel][currentStepIdx];
  const tgt  = step.target;
  let rows   = [];

  if (currentLevel === 1) {
    const mag = Math.sqrt(tgt.x**2+tgt.y**2).toFixed(3);
    const ang = (Math.atan2(tgt.y,tgt.x)*180/Math.PI).toFixed(2);
    rows = [
      { label: 'Vx נכון',    value: String(tgt.x), cls: 'fb-correct' },
      { label: 'Vy נכון',    value: String(tgt.y), cls: 'fb-correct' },
      { label: '|V|',        value: mag,            cls: 'fb-info' },
      { label: 'זווית',      value: ang + '°',       cls: 'fb-info' },
    ];

  } else if (currentLevel === 2) {
    const mag = Math.sqrt(tgt.x**2+tgt.y**2).toFixed(3);
    const ang = (Math.atan2(tgt.y,tgt.x)*180/Math.PI).toFixed(2);
    rows = [
      { label: 'גודל |V|',   value: mag,             cls: 'fb-correct' },
      { label: 'זווית θ',    value: ang + '°',        cls: 'fb-correct' },
      { label: 'Vx מחושב',   value: String(tgt.x),   cls: 'fb-info' },
      { label: 'Vy מחושב',   value: String(tgt.y),   cls: 'fb-info' },
      { label: 'נוסחה גודל', value: '√('+tgt.x+'²+'+tgt.y+'²)', cls: 'fb-info' },
      { label: 'נוסחה זווית',value: 'atan2('+tgt.y+', '+tgt.x+')', cls: 'fb-info' },
    ];

  } else if (currentLevel === 3) {
    const w = step.wind||{x:0,y:0};
    rows = [
      { label: 'Vx ירי נכון', value: String(tgt.x-w.x), cls: 'fb-correct' },
      { label: 'Vy ירי נכון', value: String(tgt.y-w.y), cls: 'fb-correct' },
      { label: 'Vx רוח',      value: String(w.x),        cls: 'fb-info' },
      { label: 'Vy רוח',      value: String(w.y),        cls: 'fb-info' },
      { label: 'Vx שקול',     value: String(tgt.x),      cls: 'fb-correct' },
      { label: 'Vy שקול',     value: String(tgt.y),      cls: 'fb-correct' },
    ];

  } else if (currentLevel === 4) {
    const v1x = Math.ceil(tgt.x/2), v1y = Math.ceil(tgt.y/2);
    const v2x = tgt.x-v1x,          v2y = tgt.y-v1y;
    rows = [
      { label: 'V1x',  value: String(v1x),  cls: 'fb-info' },
      { label: 'V1y',  value: String(v1y),  cls: 'fb-info' },
      { label: 'V2x',  value: String(v2x),  cls: 'fb-info' },
      { label: 'V2y',  value: String(v2y),  cls: 'fb-info' },
      { label: 'Vx שקול', value: String(tgt.x), cls: 'fb-correct' },
      { label: 'Vy שקול', value: String(tgt.y), cls: 'fb-correct' },
      { label: 'שים לב', value: 'בדוק מגבלות טווח!', cls: 'fb-info' },
    ];
  }

  showFeedback({ pts:0, label:'💡 פתרון', color:'#1a3a8f' }, rows);
  drawScene(false);

  if (currentLevel === 1 || currentLevel === 2) {
    drawVector(0,0,tgt.x,tgt.y,'#2ecc71',3,'V נכון');
  } else if (currentLevel === 3) {
    const w = step.wind||{x:0,y:0};
    const fx=tgt.x-w.x, fy=tgt.y-w.y;
    drawVector(0,0,fx,fy,'#e84545',3,'ירי נכון');
    drawVector(fx,fy,tgt.x,tgt.y,'#0ea5e9',2.5,'רוח');
    drawVector(0,0,tgt.x,tgt.y,'#2ecc71',2.5,'שקול',true);
  }
}

// =====================================================
// ניסיון נוסף
// =====================================================
function retryStep() {
  firedAlready = false;
  document.getElementById('feedback-box').classList.add('hidden');
  document.getElementById('btn-next').classList.add('hidden');
  document.getElementById('success-overlay').classList.add('hidden');
  ['l1-vx','l1-vy','l2-mag','l2-angle',
   'l3-vx','l3-vy','l4-v1x','l4-v1y','l4-v2x','l4-v2y']
    .forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  drawScene();
}

// =====================================================
// שלב הבא
// =====================================================
function nextStep() {
  currentStepIdx++;
  if (currentStepIdx >= LEVELS[currentLevel].length) {
    currentStepIdx = 0;
    document.getElementById('success-overlay').classList.remove('hidden');
    document.getElementById('success-emoji').textContent  = '🏆';
    document.getElementById('success-text').textContent   = `כל הכבוד! סיימת רמה ${currentLevel}`;
    document.getElementById('success-points').textContent = `ניקוד כולל: ${score}`;
    setTimeout(() => document.getElementById('success-overlay').classList.add('hidden'), 3000);
  }
  retryStep();
  updateInputUI();
  drawScene();
  document.getElementById('hud-level').textContent = `${currentLevel}-${currentStepIdx+1}`;
}

// =====================================================
// החלפת רמה
// =====================================================
function changeLevel(lvl) {
  currentLevel   = parseInt(lvl);
  currentStepIdx = 0;
  firedAlready   = false;
  document.getElementById('hud-level').textContent = `${currentLevel}-1`;
  retryStep();
  updateInputUI();
  drawScene();
}

// =====================================================
// מחשבון פיתגורס / זווית
// =====================================================
function openCalc() {
  document.getElementById('calc-modal').classList.remove('hidden');
  document.getElementById('calc-vx').focus();
}

function closeCalc() {
  document.getElementById('calc-modal').classList.add('hidden');
}

function computeCalc() {
  const vx  = parseFloat(document.getElementById('calc-vx').value) || 0;
  const vy  = parseFloat(document.getElementById('calc-vy').value) || 0;
  const mag  = Math.sqrt(vx**2 + vy**2);
  const ang  = Math.atan2(vy, vx) * 180 / Math.PI;

  document.getElementById('calc-mag-out').textContent   = mag.toFixed(4);
  document.getElementById('calc-angle-out').textContent = ang.toFixed(4);
  document.getElementById('calc-result').classList.remove('hidden');
}

function copyCalcToFields() {
  const mag = parseFloat(document.getElementById('calc-mag-out').textContent) || 0;
  const ang = parseFloat(document.getElementById('calc-angle-out').textContent) || 0;
  const magEl = document.getElementById('l2-mag');
  const angEl = document.getElementById('l2-angle');
  if (magEl) magEl.value = mag.toFixed(4);
  if (angEl) angEl.value = ang.toFixed(4);
  closeCalc();
}

// =====================================================
// מסך סיום – ציור "אלוף הקשתות"
// =====================================================
function drawChampion(c, scoreVal) {
  const ctx2 = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx2.clearRect(0,0,W,H);

  // רמות ייצוג:
  // 0-199:   ימי הביניים – קשת עץ, גלימה חומה
  // 200-399: רנסנס – קשת מעוטרת, בגד צבעוני
  // 400-599: מודרני – קשת ספורטיבית, בגד אולימפי
  // 600+:    עתידני – חליפת נאנו, קשת אנרגיה

  const tier = scoreVal >= 600 ? 3 : scoreVal >= 400 ? 2 : scoreVal >= 200 ? 1 : 0;

  // רקע gradient לפי טייר
  const bgGrads = [
    ['#6b4c2a','#3d2810'],   // ימי הביניים – חום
    ['#8b6914','#4a3200'],   // רנסנס – זהב עתיק
    ['#1a3a8f','#0a1e50'],   // מודרני – כחול אולימפי
    ['#0a0020','#1a0050'],   // עתידני – חשוך
  ];
  const grad = ctx2.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, bgGrads[tier][0]);
  grad.addColorStop(1, bgGrads[tier][1]);
  ctx2.fillStyle = grad;
  ctx2.fillRect(0,0,W,H);

  // כוכבים / נצנצים לפי טייר
  if (tier >= 2) {
    ctx2.fillStyle = '#ffd70055';
    for (let i=0;i<30;i++) {
      const sx = Math.random()*W, sy = Math.random()*H*0.5;
      ctx2.beginPath(); ctx2.arc(sx,sy,Math.random()*1.8+0.5,0,Math.PI*2); ctx2.fill();
    }
  }
  if (tier === 3) {
    // קרני אנרגיה
    ctx2.save(); ctx2.globalAlpha=0.18;
    for (let i=0;i<6;i++) {
      const ang2 = (i/6)*Math.PI*2;
      const gx = W/2+Math.cos(ang2)*120, gy = H/2+Math.sin(ang2)*120;
      const rg = ctx2.createLinearGradient(W/2,H/2,gx,gy);
      rg.addColorStop(0,'#00ffff'); rg.addColorStop(1,'transparent');
      ctx2.strokeStyle=rg; ctx2.lineWidth=18;
      ctx2.beginPath(); ctx2.moveTo(W/2,H/2); ctx2.lineTo(gx,gy); ctx2.stroke();
    }
    ctx2.restore();
  }

  // --- גוף הדמות ---
  const cx = W/2, headY = H*0.22, bodyTop = headY+42, bodyBot = H*0.68;
  const legLen = H*0.22;

  // צבעי לבוש
  const clothColors = [
    { robe:'#5a3010', skin:'#c8845a', belt:'#3d2000', detail:'#7a4820' }, // ימי הביניים
    { robe:'#8b2020', skin:'#c8845a', belt:'#d4a800', detail:'#ffd700' }, // רנסנס
    { robe:'#0057a8', skin:'#c8845a', belt:'#ffffff', detail:'#e8c000' }, // מודרני
    { robe:'#002040', skin:'#40c0ff', belt:'#00ffff', detail:'#ffffff' }, // עתידני
  ];
  const cc = clothColors[tier];

  // ראש
  ctx2.beginPath(); ctx2.arc(cx, headY, 22, 0, Math.PI*2);
  ctx2.fillStyle = cc.skin; ctx2.fill();
  ctx2.strokeStyle = tier===3?'#00ffff':'#3d2810'; ctx2.lineWidth=2; ctx2.stroke();

  // עיניים
  ctx2.fillStyle = tier===3?'#00ffff':'#222';
  ctx2.beginPath(); ctx2.arc(cx-7, headY-2, 3, 0, Math.PI*2); ctx2.fill();
  ctx2.beginPath(); ctx2.arc(cx+7, headY-2, 3, 0, Math.PI*2); ctx2.fill();

  // פה
  ctx2.beginPath(); ctx2.arc(cx, headY+8, 7, 0, Math.PI);
  ctx2.strokeStyle = '#5a2a00'; ctx2.lineWidth=1.5; ctx2.stroke();

  // כיסוי ראש לפי טייר
  if (tier===0) {
    // קסדה מדורגת
    ctx2.fillStyle='#4a3010';
    ctx2.fillRect(cx-22,headY-20,44,14);
    ctx2.beginPath(); ctx2.arc(cx,headY-20,22,Math.PI,0,false);
    ctx2.fill();
  } else if (tier===1) {
    // כובע בד
    ctx2.fillStyle='#8b2020';
    ctx2.beginPath(); ctx2.ellipse(cx,headY-18,26,10,0,Math.PI,0,true); ctx2.fill();
    ctx2.fillRect(cx-18,headY-28,36,12);
  } else if (tier===2) {
    // סרט אולימפי
    ctx2.strokeStyle='#ffd700'; ctx2.lineWidth=5;
    ctx2.beginPath(); ctx2.arc(cx,headY,24,-Math.PI*0.8,-Math.PI*0.2,false); ctx2.stroke();
  } else {
    // קסדת עתיד
    const hg = ctx2.createLinearGradient(cx-22,headY-30,cx+22,headY);
    hg.addColorStop(0,'#00c8ff'); hg.addColorStop(1,'#0040a0');
    ctx2.fillStyle=hg;
    ctx2.beginPath(); ctx2.arc(cx,headY-8,26,-Math.PI,0,false); ctx2.fill();
    ctx2.fillStyle='rgba(0,255,255,0.25)';
    ctx2.beginPath(); ctx2.arc(cx,headY+4,26,Math.PI*1.1,Math.PI*1.9,false); ctx2.fill();
  }

  // גוף (גלימה / חולצה)
  const bodyW = 44;
  ctx2.fillStyle = cc.robe;
  ctx2.beginPath();
  ctx2.moveTo(cx-bodyW/2, bodyTop);
  ctx2.lineTo(cx+bodyW/2, bodyTop);
  ctx2.lineTo(cx+bodyW/2+8, bodyBot);
  ctx2.lineTo(cx-bodyW/2-8, bodyBot);
  ctx2.closePath(); ctx2.fill();

  // חגורה / פס
  ctx2.fillStyle = cc.belt;
  ctx2.fillRect(cx-bodyW/2-4, bodyTop+(bodyBot-bodyTop)*0.55, bodyW+8, 8);

  // פרטים על גלימה
  if (tier===1) {
    ctx2.fillStyle=cc.detail;
    ctx2.fillRect(cx-5, bodyTop+10, 10, bodyBot-bodyTop-30);
  }
  if (tier===2) {
    // פסים אולימפיים
    const stripes=['#0081C8','#000','#EE334E','#FCB131','#00A651'];
    for(let i=0;i<5;i++){
      ctx2.fillStyle=stripes[i];
      ctx2.fillRect(cx-22+i*9,bodyTop+6,8,6);
    }
  }
  if (tier===3) {
    // פרטי נאנו
    ctx2.strokeStyle='#00ffff'; ctx2.lineWidth=1; ctx2.globalAlpha=0.5;
    for(let i=0;i<5;i++){
      ctx2.beginPath();
      ctx2.moveTo(cx-20, bodyTop+18+i*14);
      ctx2.lineTo(cx+20, bodyTop+18+i*14); ctx2.stroke();
    }
    ctx2.globalAlpha=1;
  }

  // רגליים
  const legCol = tier===3 ? '#001030' : cc.robe;
  ctx2.fillStyle = legCol;
  // רגל שמאל
  ctx2.fillRect(cx-bodyW/2-4, bodyBot, 18, legLen);
  // רגל ימין
  ctx2.fillRect(cx+bodyW/2-14, bodyBot, 18, legLen);

  // ידיים
  ctx2.strokeStyle = cc.skin; ctx2.lineWidth=10; ctx2.lineCap='round';
  // יד ימין (קדימה)
  ctx2.beginPath(); ctx2.moveTo(cx+bodyW/2-4, bodyTop+20); ctx2.lineTo(cx+bodyW/2+18, bodyTop+55); ctx2.stroke();
  // יד שמאל (אחורה)
  ctx2.beginPath(); ctx2.moveTo(cx-bodyW/2+4, bodyTop+20); ctx2.lineTo(cx-bodyW/2-18, bodyTop+55); ctx2.stroke();

  // ---- ציור קשת ----
  const bx = cx+bodyW/2+18, by = bodyTop+40;
  if (tier===0) {
    // קשת עץ פשוטה
    ctx2.strokeStyle='#5a3010'; ctx2.lineWidth=5; ctx2.lineCap='round';
    ctx2.beginPath(); ctx2.arc(bx,by,32,-1.1,1.1,false); ctx2.stroke();
    ctx2.strokeStyle='#8b5a00'; ctx2.lineWidth=1.5;
    const t1y=by-32*Math.sin(1.1), t2y=by+32*Math.sin(1.1);
    const tx=bx+32*Math.cos(1.1);
    ctx2.beginPath(); ctx2.moveTo(tx,t1y); ctx2.lineTo(tx,t2y); ctx2.stroke();
  } else if (tier===1) {
    // קשת רנסנס מעוטרת
    ctx2.strokeStyle='#6b2020'; ctx2.lineWidth=5;
    ctx2.beginPath(); ctx2.arc(bx,by,32,-1.1,1.1,false); ctx2.stroke();
    ctx2.strokeStyle='#ffd700'; ctx2.lineWidth=2;
    ctx2.beginPath(); ctx2.arc(bx,by,32,-1.1,1.1,false); ctx2.stroke();
    ctx2.strokeStyle='#8b5a00'; ctx2.lineWidth=1.5;
    const t1y2=by-32*Math.sin(1.1), t2y2=by+32*Math.sin(1.1), tx2=bx+32*Math.cos(1.1);
    ctx2.beginPath(); ctx2.moveTo(tx2,t1y2); ctx2.lineTo(tx2,t2y2); ctx2.stroke();
  } else if (tier===2) {
    // קשת ספורטיבית
    ctx2.strokeStyle='#0057a8'; ctx2.lineWidth=7;
    ctx2.beginPath(); ctx2.arc(bx,by,34,-1.1,1.1,false); ctx2.stroke();
    ctx2.strokeStyle='#ffd700'; ctx2.lineWidth=3;
    ctx2.beginPath(); ctx2.arc(bx,by,34,-0.4,0.4,false); ctx2.stroke();
    ctx2.strokeStyle='#333'; ctx2.lineWidth=1.5;
    const t1y3=by-34*Math.sin(1.1),t2y3=by+34*Math.sin(1.1),tx3=bx+34*Math.cos(1.1);
    ctx2.beginPath(); ctx2.moveTo(tx3,t1y3); ctx2.lineTo(tx3,t2y3); ctx2.stroke();
  } else {
    // קשת אנרגיה – גלואינג
    const gBow = ctx2.createLinearGradient(bx-36,by-36,bx+36,by+36);
    gBow.addColorStop(0,'#00ffff'); gBow.addColorStop(1,'#7c3aed');
    ctx2.strokeStyle=gBow; ctx2.lineWidth=6;
    ctx2.shadowColor='#00ffff'; ctx2.shadowBlur=18;
    ctx2.beginPath(); ctx2.arc(bx,by,34,-1.2,1.2,false); ctx2.stroke();
    ctx2.shadowBlur=0;
    ctx2.strokeStyle='rgba(0,255,255,0.5)'; ctx2.lineWidth=1.5;
    const t1y4=by-34*Math.sin(1.2),t2y4=by+34*Math.sin(1.2),tx4=bx+34*Math.cos(1.2);
    ctx2.beginPath(); ctx2.moveTo(tx4,t1y4); ctx2.lineTo(tx4,t2y4); ctx2.stroke();
  }

  // חץ מוכן לירי
  const arrowColor = tier===3?'#00ffff':'#8b5a00';
  ctx2.strokeStyle=arrowColor; ctx2.lineWidth=2.5; ctx2.lineCap='round';
  if(tier===3){ctx2.shadowColor='#00ffff';ctx2.shadowBlur=10;}
  ctx2.beginPath(); ctx2.moveTo(bx+34,by-20); ctx2.lineTo(bx+34,by+20); ctx2.stroke();
  ctx2.shadowBlur=0;

  // מדליה / תג
  if (tier>=2) {
    const medalY = bodyBot - 10;
    const medalColors=['','','#c0c0c0','#ffd700'];
    ctx2.beginPath(); ctx2.arc(cx,medalY,13,0,Math.PI*2);
    ctx2.fillStyle=medalColors[tier]||'#c0c0c0'; ctx2.fill();
    ctx2.strokeStyle='#555'; ctx2.lineWidth=1.5; ctx2.stroke();
    ctx2.fillStyle='#333'; ctx2.font='bold 10px Segoe UI'; ctx2.textAlign='center';
    ctx2.fillText(tier===3?'🥇':'🥈',cx,medalY+4);
  }

  // כותרת תחתית
  const rankNames = ['קשת ימי הביניים','קשת הרנסנס','קשת אולימפי','קשת העתיד'];
  ctx2.fillStyle='rgba(0,0,0,0.55)';
  ctx2.fillRect(0, H-40, W, 40);
  ctx2.fillStyle='#ffd700'; ctx2.font='bold 15px Segoe UI'; ctx2.textAlign='center';
  ctx2.fillText(rankNames[tier], W/2, H-16);
}

// =====================================================
// פתיחת מסך סיום
// =====================================================
function endGame() {
  const endScreen = document.getElementById('end-screen');
  endScreen.classList.remove('hidden');
  document.getElementById('end-score-display').textContent = `ניקוד: ${score}`;
  const rankLabels = [
    'ניקוד 0-199: קשת ימי הביניים',
    'ניקוד 200-399: קשת הרנסנס',
    'ניקוד 400-599: קשת אולימפי',
    'ניקוד 600+: קשת העתיד – הגיבור הנצחי!',
  ];
  const tier = score >= 600 ? 3 : score >= 400 ? 2 : score >= 200 ? 1 : 0;
  document.getElementById('end-rank-label').textContent = rankLabels[tier];

  const cc = document.getElementById('champion-canvas');
  // נצייר אחרי רגע קצר לוודא שה-DOM נטען
  setTimeout(() => drawChampion(cc, score), 50);
}

function restartGame() {
  score = 0; totalAttempts = 0; currentLevel = 1; currentStepIdx = 0; firedAlready = false;
  document.getElementById('end-screen').classList.add('hidden');
  document.getElementById('hud-score').textContent   = '0';
  document.getElementById('hud-attempts').textContent = '0';
  document.getElementById('hud-level').textContent    = '1-1';
  document.getElementById('level-select').value       = '1';
  retryStep(); updateInputUI(); drawScene();
}

// =====================================================
// חיבור אירועים
// =====================================================
function bindEvents() {
  document.getElementById('btn-fire').addEventListener('click', fire);
  document.getElementById('btn-solution').addEventListener('click', showSolution);
  document.getElementById('btn-retry').addEventListener('click', retryStep);
  document.getElementById('btn-next').addEventListener('click', nextStep);
  document.getElementById('btn-end-game').addEventListener('click', endGame);
  document.getElementById('btn-restart').addEventListener('click', restartGame);

  document.getElementById('level-select').addEventListener('change', e => changeLevel(e.target.value));

  // מחשבון
  document.getElementById('btn-calc').addEventListener('click', openCalc);
  document.getElementById('calc-close').addEventListener('click', closeCalc);
  document.getElementById('calc-compute').addEventListener('click', computeCalc);
  document.getElementById('calc-copy').addEventListener('click', copyCalcToFields);

  // סגירת מודלים בלחיצה על רקע
  document.getElementById('calc-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('calc-modal')) closeCalc();
  });
  document.getElementById('end-screen').addEventListener('click', e => {
    if (e.target === document.getElementById('end-screen')) {
      document.getElementById('end-screen').classList.add('hidden');
    }
  });

  // Enter לירי
  document.addEventListener('keydown', e => { if(e.key==='Enter') fire(); });
  // Escape לסגירת מחשבון
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeCalc(); });
}

// =====================================================
// אתחול
// =====================================================
function init() {
  bindEvents();
  resizeCanvas();
  updateInputUI();
  drawScene();
}

document.addEventListener('DOMContentLoaded', init);
