/* =====================================================
   Vector Archery – לוגיקת משחק מלאה
   קובץ: script.js
   עברית: הערות בעברית לנוחות המורה
   ===================================================== */

// =====================================================
// נתוני השלבים
// =====================================================

/**
 * כל שלב מוגדר כאובייקט עם מאפיינים לפי הרמה.
 * קל לשנות, להוסיף או למחוק שלבים כאן.
 */
const LEVELS = {

  // ----- רמה 1: רכיבי וקטור בסיסיים -----
  1: [
    { target: { x: 3, y: 4 }, hint: 'הזן את רכיבי הווקטור לנקודה (3, 4).' },
    { target: { x: 5, y: 2 }, hint: 'הגע לנקודה (5, 2) על ידי הזנת Vx ו-Vy.' },
    { target: { x: -4, y: 3 }, hint: 'המטרה נמצאת ברביע שני: (-4, 3).' },
    { target: { x: 6, y: -3 }, hint: 'שים לב! המטרה מתחת לציר X: (6, -3).' },
    { target: { x: -5, y: -4 }, hint: 'רביע שלישי: (-5, -4). שני הרכיבים שליליים.' },
  ],

  // ----- רמה 2: גודל וזווית -----
  2: [
    { target: { x: 4, y: 3 }, hint: 'הגע ל-(4,3). חשב גודל וזווית, או הזן רכיבים ישירות.' },
    { target: { x: 0, y: 5 }, hint: 'המטרה ישר למעלה – זווית 90°.' },
    { target: { x: 5, y: 5 }, hint: 'זווית 45°, גודל 5√2 ≈ 7.07.' },
    { target: { x: -3, y: 4 }, hint: 'ברביע שני: גודל 5, זווית ≈ 126.87°.' },
    { target: { x: 6, y: -2 }, hint: 'זווית שלילית (מתחת לציר X).' },
  ],

  // ----- רמה 3: רוח צד -----
  3: [
    { target: { x: 5, y: 4 }, wind: { x: 2, y: -1 }, hint: 'הרוח דוחפת את החץ. ירה כך שאחרי הרוח תפגע במטרה.' },
    { target: { x: -3, y: 5 }, wind: { x: -1, y: 2 }, hint: 'רוח אלכסונית. חשב: ווקטור_ירי = מטרה − רוח.' },
    { target: { x: 4, y: -3 }, wind: { x: 3, y: 1 }, hint: 'רוח חזקה לימין. פצה אותה בירי שמאלה.' },
    { target: { x: 6, y: 6 }, wind: { x: -2, y: -3 }, hint: 'הרוח מנגד למטרה. עלה על הרוח!' },
    { target: { x: 0, y: 5 }, wind: { x: 2, y: 0 }, hint: 'רוח אופקית – ירי מעט שמאלה.' },
  ],

  // ----- רמה 4: שתי קשתות -----
  4: [
    {
      target: { x: 7, y: 6 },
      bow1Origin: { x: -3, y: 0 },
      bow2Origin: { x: 0, y: -3 },
      maxRange1: 6,
      maxRange2: 5,
      hint: 'קשת א׳ ירה ראשונה. קשת ב׳ מוסיפה וקטור שני. הסכום חייב להגיע למטרה (7,6).',
    },
    {
      target: { x: 8, y: 5 },
      bow1Origin: { x: -2, y: 0 },
      bow2Origin: { x: 0, y: -2 },
      maxRange1: 6,
      maxRange2: 5,
      hint: 'V1 + V2 חייב להיות (8,5). זכור את מגבלות הטווח!',
    },
    {
      target: { x: -5, y: 7 },
      bow1Origin: { x: 2, y: 0 },
      bow2Origin: { x: 0, y: 2 },
      maxRange1: 6,
      maxRange2: 5,
      hint: 'המטרה ברביע שני. חלק את הווקטור הנדרש בין שתי הקשתות.',
    },
  ],
};

// =====================================================
// הגדרות גלובליות
// =====================================================
const canvas   = document.getElementById('gameCanvas');
const ctx      = canvas.getContext('2d');

// מצב המשחק
let currentLevel    = 1;   // רמה נוכחית (1-4)
let currentStepIdx  = 0;   // אינדקס שלב נוכחי בתוך הרמה
let score           = 0;
let totalAttempts   = 0;
let firedAlready    = false;

// הגדרות ציר – כמה יחידות נראות בכל צד
const GRID_UNITS   = 10;   // ±10 יחידות
let   CELL_SIZE    = 40;   // פיקסלים לכל יחידה (מחושב מחדש בresize)
let   ORIGIN_X, ORIGIN_Y; // מיקום מרכז (0,0) בפיקסלים

// =====================================================
// טיפול בגודל Canvas
// =====================================================
function resizeCanvas() {
  const section = document.getElementById('canvas-section');
  const size    = Math.min(section.clientWidth - 32, section.clientHeight - 32, 580);
  canvas.width  = size;
  canvas.height = size;
  CELL_SIZE = size / (GRID_UNITS * 2);
  ORIGIN_X  = size / 2;
  ORIGIN_Y  = size / 2;
  drawScene();
}

window.addEventListener('resize', resizeCanvas);

// =====================================================
// המרות קואורדינטות
// =====================================================
// ממתמטי (יחידות) לפיקסלים על ה-Canvas
function toPixel(x, y) {
  return {
    px: ORIGIN_X + x * CELL_SIZE,
    py: ORIGIN_Y - y * CELL_SIZE,
  };
}

// =====================================================
// ציור מערכת הצירים והרשת
// =====================================================
function drawGrid() {
  // רשת משבצות
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid-color').trim() || '#c9d4ef';
  ctx.lineWidth   = 0.5;

  for (let i = -GRID_UNITS; i <= GRID_UNITS; i++) {
    const { px } = toPixel(i, 0);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, canvas.height);
    ctx.stroke();

    const { py } = toPixel(0, i);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(canvas.width, py);
    ctx.stroke();
  }

  // ציר X
  ctx.strokeStyle = '#1a3a8f';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(0, ORIGIN_Y);
  ctx.lineTo(canvas.width, ORIGIN_Y);
  ctx.stroke();

  // ציר Y
  ctx.beginPath();
  ctx.moveTo(ORIGIN_X, 0);
  ctx.lineTo(ORIGIN_X, canvas.height);
  ctx.stroke();

  // חצי הצירים
  drawArrowHead(canvas.width - 6, ORIGIN_Y, 0, '#1a3a8f', 8);
  drawArrowHead(ORIGIN_X, 6, Math.PI / 2, '#1a3a8f', 8);

  // תוויות
  ctx.fillStyle   = '#1a3a8f';
  ctx.font        = 'bold 13px Segoe UI';
  ctx.textAlign   = 'left';
  ctx.fillText('X', canvas.width - 18, ORIGIN_Y - 8);
  ctx.textAlign   = 'center';
  ctx.fillText('Y', ORIGIN_X + 12, 16);

  // מספרי ציר
  ctx.font      = '10px Segoe UI';
  ctx.fillStyle = '#8492a6';
  for (let i = -GRID_UNITS; i <= GRID_UNITS; i++) {
    if (i === 0) continue;
    const { px } = toPixel(i, 0);
    ctx.textAlign = 'center';
    ctx.fillText(i, px, ORIGIN_Y + 14);

    const { py } = toPixel(0, i);
    ctx.textAlign = 'right';
    ctx.fillText(i, ORIGIN_X - 6, py + 4);
  }
}

// =====================================================
// פונקציית ציור חץ (ראש חץ)
// =====================================================
/**
 * @param {number} x, y - קצה החץ בפיקסלים
 * @param {number} angle - כיוון (רדיאנים)
 * @param {string} color
 * @param {number} size
 */
function drawArrowHead(x, y, angle, color, size = 10) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle - Math.PI / 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size / 2, size);
  ctx.lineTo( size / 2, size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// =====================================================
// ציור וקטור (חץ מתמטי) על ה-Canvas
// =====================================================
/**
 * @param {number} fromX, fromY - נקודת התחלה (יחידות)
 * @param {number} toX, toY     - נקודת סוף (יחידות)
 * @param {string} color
 * @param {number} width        - עובי קו
 * @param {string} label        - תווית אופציונלית
 * @param {boolean} dashed      - קו מקוקו?
 */
function drawVector(fromX, fromY, toX, toY, color, width = 2, label = '', dashed = false) {
  const from = toPixel(fromX, fromY);
  const to   = toPixel(toX, toY);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle   = color;
  ctx.lineWidth   = width;

  if (dashed) {
    ctx.setLineDash([6, 4]);
  }

  ctx.beginPath();
  ctx.moveTo(from.px, from.py);
  ctx.lineTo(to.px, to.py);
  ctx.stroke();

  ctx.setLineDash([]);

  // ראש החץ
  const angle = Math.atan2(to.py - from.py, to.px - from.px);
  drawArrowHead(to.px, to.py, angle + Math.PI / 2, color, 10);

  // תווית
  if (label) {
    const midX = (from.px + to.px) / 2;
    const midY = (from.py + to.py) / 2;
    ctx.font      = 'bold 12px Segoe UI';
    ctx.textAlign = 'center';
    // רקע לבן לתווית
    const w = ctx.measureText(label).width + 8;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(midX - w / 2, midY - 14, w, 18);
    ctx.fillStyle = color;
    ctx.fillText(label, midX, midY);
  }

  ctx.restore();
}

// =====================================================
// ציור מטרה
// =====================================================
function drawTarget(x, y) {
  const { px, py } = toPixel(x, y);
  const r = CELL_SIZE * 0.6;

  // עיגולים קונצנטריים
  const colors = ['#e84545', '#ffffff', '#e84545', '#ffffff', '#e84545'];
  for (let i = 4; i >= 0; i--) {
    ctx.beginPath();
    ctx.arc(px, py, r * (i + 1) / 5, 0, Math.PI * 2);
    ctx.fillStyle = colors[i];
    ctx.fill();
  }

  // נקודת מרכז
  ctx.beginPath();
  ctx.arc(px, py, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#222';
  ctx.fill();

  // תווית קואורדינטות
  ctx.font      = 'bold 12px Segoe UI';
  ctx.fillStyle = '#1a3a8f';
  ctx.textAlign = 'center';
  ctx.fillText(`(${x}, ${y})`, px, py - r - 6);
}

// =====================================================
// ציור קשת
// =====================================================
function drawBow(cx, cy, color = '#5a6b85', label = '') {
  const { px, py } = toPixel(cx, cy);
  const r  = CELL_SIZE * 0.55;

  // גוף הקשת
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = 3.5;
  ctx.beginPath();
  ctx.arc(px, py, r, -Math.PI * 0.7, Math.PI * 0.7, false);
  ctx.stroke();

  // מיתר
  const topY    = py - r * Math.sin(Math.PI * 0.7);
  const botY    = py + r * Math.sin(Math.PI * 0.7);
  const stringX = px + r * Math.cos(Math.PI * 0.7);
  ctx.beginPath();
  ctx.moveTo(stringX, topY);
  ctx.lineTo(stringX, botY);
  ctx.strokeStyle = '#8b5a00';
  ctx.lineWidth   = 1.5;
  ctx.stroke();

  // נקודת מרכז
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  if (label) {
    ctx.font      = 'bold 11px Segoe UI';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, px, py + r + 16);
  }

  ctx.restore();
}

// =====================================================
// ציור חץ מונפש (ירי)
// =====================================================
/**
 * מציג אנימציה של חץ שטס ממקור לנקודת פגיעה.
 * @param {object} from   { x, y } יחידות
 * @param {object} to     { x, y } יחידות
 * @param {Function} onDone callback לסיום
 */
function animateArrow(from, to, onDone) {
  const FRAMES    = 40;
  let   frame     = 0;
  const fromPx    = toPixel(from.x, from.y);
  const toPx      = toPixel(to.x,   to.y);
  const angle     = Math.atan2(toPx.py - fromPx.py, toPx.px - fromPx.px);
  const arrowLen  = CELL_SIZE * 0.8;

  function step() {
    drawScene(false); // צייר שוב בלי להריץ אנימציה
    const t    = frame / FRAMES;
    const curX = fromPx.px + (toPx.px - fromPx.px) * t;
    const curY = fromPx.py + (toPx.py - fromPx.py) * t;

    // גוף החץ
    ctx.save();
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.moveTo(curX - Math.cos(angle) * arrowLen, curY - Math.sin(angle) * arrowLen);
    ctx.lineTo(curX, curY);
    ctx.stroke();

    // ראש
    drawArrowHead(curX, curY, angle + Math.PI / 2, '#f39c12', 10);
    ctx.restore();

    frame++;
    if (frame <= FRAMES) {
      requestAnimationFrame(step);
    } else {
      onDone();
    }
  }

  requestAnimationFrame(step);
}

// =====================================================
// ציור הסצנה הנוכחית
// =====================================================
/**
 * @param {boolean} withAnimation - האם להפעיל אנימציית ירי?
 */
function drawScene(withAnimation = true) {
  if (!canvas.width) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // רקע לבן
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();

  const level = currentLevel;
  const steps = LEVELS[level];
  if (!steps) return;
  const step  = steps[currentStepIdx];
  if (!step)  return;

  if (level === 1 || level === 2) {
    drawBow(0, 0, '#1a3a8f', 'קשת');
    drawTarget(step.target.x, step.target.y);

  } else if (level === 3) {
    drawBow(0, 0, '#1a3a8f', 'קשת');
    drawTarget(step.target.x, step.target.y);
    // ציור וקטור הרוח מהמרכז
    if (step.wind) {
      drawVector(0, 0, step.wind.x, step.wind.y, '#0ea5e9', 2, '💨 רוח', true);
    }

  } else if (level === 4) {
    const b1 = step.bow1Origin;
    const b2 = step.bow2Origin;
    drawBow(b1.x, b1.y, '#e84545', '🏹 קשת א׳');
    drawBow(b2.x, b2.y, '#1a8f6a', '🏹 קשת ב׳');
    drawTarget(step.target.x, step.target.y);
  }
}

// =====================================================
// עדכון ממשק הקלט לפי הרמה
// =====================================================
function updateInputUI() {
  document.getElementById('input-level1').classList.add('hidden');
  document.getElementById('input-level2').classList.add('hidden');
  document.getElementById('input-level3').classList.add('hidden');
  document.getElementById('input-level4').classList.add('hidden');
  document.getElementById('wind-info').classList.add('hidden');
  document.getElementById('range-info').classList.add('hidden');

  document.getElementById(`input-level${currentLevel}`).classList.remove('hidden');

  const step = LEVELS[currentLevel][currentStepIdx];

  if (currentLevel === 3 && step.wind) {
    document.getElementById('wind-info').classList.remove('hidden');
    document.getElementById('wind-display').textContent =
      `(${step.wind.x}, ${step.wind.y})`;
  }

  if (currentLevel === 4) {
    document.getElementById('range-info').classList.remove('hidden');
    document.getElementById('range1-display').textContent = step.maxRange1 + ' יחידות';
    document.getElementById('range2-display').textContent = step.maxRange2 + ' יחידות';
  }

  // כותרת ותיאור
  document.getElementById('problem-title').textContent =
    `רמה ${currentLevel} – שלב ${currentStepIdx + 1}`;
  document.getElementById('problem-desc').textContent = step.hint;

  // הסתר "שלב הבא" ו"משוב"
  document.getElementById('btn-next').classList.add('hidden');
  document.getElementById('feedback-box').classList.add('hidden');

  firedAlready = false;
}

// =====================================================
// קריאת קלט ממשתמש
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
    const mode = document.querySelector('input[name="l2mode"]:checked').value;
    if (mode === 'components') {
      return {
        type: 'single',
        vx: parseFloat(document.getElementById('l2-vx').value) || 0,
        vy: parseFloat(document.getElementById('l2-vy').value) || 0,
      };
    } else {
      const mag   = parseFloat(document.getElementById('l2-mag').value) || 0;
      const angle = parseFloat(document.getElementById('l2-angle').value) || 0;
      const rad   = angle * Math.PI / 180;
      return {
        type: 'polar',
        mag, angle,
        vx: mag * Math.cos(rad),
        vy: mag * Math.sin(rad),
      };
    }
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
// חישוב מרחק בין שתי נקודות
// =====================================================
function dist(ax, ay, bx, by) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// =====================================================
// חישוב ניקוד לפי מרחק
// =====================================================
function calcScore(distance) {
  if (distance <= 0.4) return { pts: 100, label: '🎯 פגיעה מדויקת!', color: '#2ecc71' };
  if (distance <= 1.0) return { pts: 70,  label: '🟡 פגיעה קרובה מאוד', color: '#f39c12' };
  if (distance <= 2.5) return { pts: 40,  label: '🔶 פגיעה קרובה',       color: '#e67e22' };
  return { pts: 0, label: '❌ פספוס', color: '#e84545' };
}

// =====================================================
// לוגיקת ירייה ראשית
// =====================================================
function fire() {
  if (firedAlready) return;
  firedAlready = true;
  totalAttempts++;
  document.getElementById('hud-attempts').textContent = totalAttempts;

  const input = getUserVector();
  const step  = LEVELS[currentLevel][currentStepIdx];
  const tgt   = step.target;

  let hitX, hitY; // נקודת פגיעה בפועל
  let feedbackRows = [];
  let scoreResult;

  // ---------------------------------------------------
  // רמה 1 ורמה 2: ירי ישיר
  // ---------------------------------------------------
  if (currentLevel === 1 || currentLevel === 2) {
    hitX = input.vx;
    hitY = input.vy;

    const d          = dist(hitX, hitY, tgt.x, tgt.y);
    scoreResult      = calcScore(d);
    const correctMag = Math.sqrt(tgt.x ** 2 + tgt.y ** 2).toFixed(2);
    const correctAng = (Math.atan2(tgt.y, tgt.x) * 180 / Math.PI).toFixed(1);
    const userMag    = Math.sqrt(hitX ** 2 + hitY ** 2).toFixed(2);
    const userAng    = (Math.atan2(hitY, hitX) * 180 / Math.PI).toFixed(1);

    feedbackRows = [
      { label: 'ווקטור שהזנת', value: `(${hitX.toFixed(2)}, ${hitY.toFixed(2)})`, cls: '' },
      { label: 'ווקטור נכון',  value: `(${tgt.x}, ${tgt.y})`,                     cls: 'fb-correct' },
      { label: 'מרחק מהמטרה', value: d.toFixed(2) + ' יחידות',                     cls: d <= 0.4 ? 'fb-correct' : 'fb-wrong' },
      { label: '|V| שהזנת',   value: userMag,                                       cls: '' },
      { label: '|V| נכון',    value: correctMag,                                    cls: 'fb-info' },
      { label: 'זווית שהזנת', value: userAng + '°',                                 cls: '' },
      { label: 'זווית נכונה', value: correctAng + '°',                              cls: 'fb-info' },
    ];

    if (currentLevel === 2 && input.type === 'polar') {
      feedbackRows.unshift(
        { label: 'Vx מחושב', value: input.vx.toFixed(3), cls: 'fb-info' },
        { label: 'Vy מחושב', value: input.vy.toFixed(3), cls: 'fb-info' },
      );
    }

    feedbackRows.push({
      label: 'הסבר',
      value: `כדי להגיע ל-(${tgt.x}, ${tgt.y}), הרכיבים הם בדיוק Vx=${tgt.x}, Vy=${tgt.y}`,
      cls: 'fb-info',
    });
  }

  // ---------------------------------------------------
  // רמה 3: ירי + רוח
  // ---------------------------------------------------
  if (currentLevel === 3) {
    const wind = step.wind || { x: 0, y: 0 };
    hitX = input.vx + wind.x;
    hitY = input.vy + wind.y;

    // הוקטור הנכון לירות (לפני רוח)
    const correctFireX = tgt.x - wind.x;
    const correctFireY = tgt.y - wind.y;

    const d     = dist(hitX, hitY, tgt.x, tgt.y);
    scoreResult = calcScore(d);

    feedbackRows = [
      { label: 'ווקטור ירי שלך', value: `(${input.vx}, ${input.vy})`, cls: '' },
      { label: 'ווקטור רוח',     value: `(${wind.x}, ${wind.y})`,      cls: 'fb-info' },
      { label: 'ווקטור שקול',    value: `(${hitX.toFixed(2)}, ${hitY.toFixed(2)})`, cls: '' },
      { label: 'ווקטור ירי נכון', value: `(${correctFireX}, ${correctFireY})`,      cls: 'fb-correct' },
      { label: 'מרחק מהמטרה',   value: d.toFixed(2) + ' יחידות',                    cls: d <= 0.4 ? 'fb-correct' : 'fb-wrong' },
      { label: 'הסבר', value: 'ווקטור_ירי + רוח = מיקום_סופי. לכן: ווקטור_ירי = מטרה − רוח.', cls: 'fb-info' },
    ];
  }

  // ---------------------------------------------------
  // רמה 4: שתי קשתות
  // ---------------------------------------------------
  if (currentLevel === 4) {
    const totalX   = input.v1x + input.v2x;
    const totalY   = input.v1y + input.v2y;
    hitX = totalX;
    hitY = totalY;

    const mag1      = Math.sqrt(input.v1x ** 2 + input.v1y ** 2).toFixed(2);
    const mag2      = Math.sqrt(input.v2x ** 2 + input.v2y ** 2).toFixed(2);
    const within1   = parseFloat(mag1) <= step.maxRange1 + 0.01;
    const within2   = parseFloat(mag2) <= step.maxRange2 + 0.01;
    const d         = dist(totalX, totalY, tgt.x, tgt.y);

    if (!within1 || !within2) {
      scoreResult = { pts: 0, label: '⚠️ חריגת טווח!', color: '#e84545' };
    } else {
      scoreResult = calcScore(d);
    }

    feedbackRows = [
      { label: 'V1 (קשת א׳)',       value: `(${input.v1x}, ${input.v1y})`,      cls: '' },
      { label: '|V1|',              value: mag1 + (within1 ? ' ✅' : ' ❌ חורג'), cls: within1 ? 'fb-correct' : 'fb-wrong' },
      { label: 'V2 (קשת ב׳)',       value: `(${input.v2x}, ${input.v2y})`,      cls: '' },
      { label: '|V2|',              value: mag2 + (within2 ? ' ✅' : ' ❌ חורג'), cls: within2 ? 'fb-correct' : 'fb-wrong' },
      { label: 'V1 + V2',           value: `(${totalX.toFixed(2)}, ${totalY.toFixed(2)})`, cls: 'fb-info' },
      { label: 'מטרה',              value: `(${tgt.x}, ${tgt.y})`,              cls: 'fb-info' },
      { label: 'מרחק מהמטרה',      value: d.toFixed(2) + ' יחידות',             cls: d <= 0.4 ? 'fb-correct' : 'fb-wrong' },
      { label: 'הסבר', value: 'בחיבור וקטורים מחברים Vx בנפרד ו-Vy בנפרד: (V1x+V2x, V1y+V2y).', cls: 'fb-info' },
    ];
  }

  // ---------------------------------------------------
  // ציור וקטורים לאחר הירייה
  // ---------------------------------------------------
  function showVectorsAfterFire() {
    const step = LEVELS[currentLevel][currentStepIdx];
    const tgt  = step.target;

    if (currentLevel === 1 || currentLevel === 2) {
      drawVector(0, 0, hitX, hitY, '#f39c12', 3, 'V שלך');
      if (Math.abs(hitX - tgt.x) > 0.3 || Math.abs(hitY - tgt.y) > 0.3) {
        drawVector(0, 0, tgt.x, tgt.y, '#2ecc71', 2.5, 'V נכון', true);
      }

    } else if (currentLevel === 3) {
      const wind = step.wind || { x: 0, y: 0 };
      drawVector(0, 0, input.vx, input.vy, '#e84545', 3, 'ירי');
      drawVector(input.vx, input.vy, input.vx + wind.x, input.vy + wind.y, '#0ea5e9', 2.5, 'רוח');
      drawVector(0, 0, hitX, hitY, '#7c3aed', 2.5, 'שקול', true);

    } else if (currentLevel === 4) {
      const b1 = step.bow1Origin;
      // V1 מנקודת המוצא של קשת א׳
      const v1EndX = b1.x + input.v1x;
      const v1EndY = b1.y + input.v1y;
      drawVector(b1.x, b1.y, v1EndX, v1EndY, '#e84545', 3, 'V1');
      // V2 מסוף V1 (ראש-לזנב)
      const v2EndX = v1EndX + input.v2x;
      const v2EndY = v1EndY + input.v2y;
      drawVector(v1EndX, v1EndY, v2EndX, v2EndY, '#1a8f6a', 3, 'V2');
      // ווקטור שקול מנקודת מוצא קשת א׳
      drawVector(b1.x, b1.y, v2EndX, v2EndY, '#7c3aed', 2.5, 'שקול', true);
    }
  }

  // ---------------------------------------------------
  // הפעל אנימציה ואז הצג תוצאות
  // ---------------------------------------------------
  const bowOrigin = (currentLevel === 4)
    ? LEVELS[currentLevel][currentStepIdx].bow1Origin
    : { x: 0, y: 0 };

  animateArrow(bowOrigin, { x: hitX, y: hitY }, () => {
    showVectorsAfterFire();

    // סמן נקודת פגיעה
    const { px, py } = toPixel(hitX, hitY);
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fillStyle = scoreResult.pts === 100 ? '#2ecc71' : '#e84545';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // עדכן ניקוד
    score += scoreResult.pts;
    document.getElementById('hud-score').textContent = score;

    // הצג משוב
    showFeedback(scoreResult, feedbackRows);

    // הצג אנימציית הצלחה
    if (scoreResult.pts === 100) showSuccessOverlay(scoreResult.label, scoreResult.pts);

    // כפתור "שלב הבא"
    document.getElementById('btn-next').classList.remove('hidden');
  });
}

// =====================================================
// הצגת משוב מתמטי
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
    row.className = `fb-row ${r.cls || ''}`;
    row.innerHTML = `<span class="fb-label">${r.label}</span><span class="fb-value">${r.value}</span>`;
    mathDiv.appendChild(row);
  });
}

// =====================================================
// אנימציית הצלחה
// =====================================================
function showSuccessOverlay(label, pts) {
  const overlay = document.getElementById('success-overlay');
  overlay.classList.remove('hidden');
  document.getElementById('success-text').textContent = label;
  document.getElementById('success-points').textContent = `+${pts} נקודות`;

  setTimeout(() => overlay.classList.add('hidden'), 2200);
}

// =====================================================
// הצגת פתרון
// =====================================================
function showSolution() {
  const step = LEVELS[currentLevel][currentStepIdx];
  const tgt  = step.target;
  let rows   = [];

  if (currentLevel === 1 || currentLevel === 2) {
    const mag = Math.sqrt(tgt.x ** 2 + tgt.y ** 2).toFixed(3);
    const ang = (Math.atan2(tgt.y, tgt.x) * 180 / Math.PI).toFixed(1);
    rows = [
      { label: 'Vx נכון', value: String(tgt.x), cls: 'fb-correct' },
      { label: 'Vy נכון', value: String(tgt.y), cls: 'fb-correct' },
      { label: '|V|',     value: mag + ' יחידות', cls: 'fb-info' },
      { label: 'זווית',   value: ang + '°',        cls: 'fb-info' },
    ];

  } else if (currentLevel === 3) {
    const wind = step.wind || { x: 0, y: 0 };
    rows = [
      { label: 'ווקטור ירי נכון', value: `(${tgt.x - wind.x}, ${tgt.y - wind.y})`, cls: 'fb-correct' },
      { label: 'רוח',             value: `(${wind.x}, ${wind.y})`,                  cls: 'fb-info' },
      { label: 'שקול',            value: `(${tgt.x}, ${tgt.y})`,                    cls: 'fb-correct' },
    ];

  } else if (currentLevel === 4) {
    rows = [
      { label: 'דוגמה: V1', value: `(${Math.ceil(tgt.x / 2)}, ${Math.ceil(tgt.y / 2)})`, cls: 'fb-info' },
      { label: 'דוגמה: V2', value: `(${Math.floor(tgt.x / 2)}, ${Math.floor(tgt.y / 2)})`, cls: 'fb-info' },
      { label: 'סכום',       value: `(${tgt.x}, ${tgt.y})`,                                cls: 'fb-correct' },
      { label: 'שים לב',     value: 'בדוק שכל ווקטור בטווח המותר!',                        cls: 'fb-info' },
    ];
  }

  showFeedback({ pts: 0, label: '💡 פתרון', color: '#1a3a8f' }, rows);
  drawScene(false);

  // ציור ווקטור הפתרון
  if (currentLevel === 1 || currentLevel === 2) {
    drawVector(0, 0, tgt.x, tgt.y, '#2ecc71', 3, 'V נכון');
  } else if (currentLevel === 3) {
    const wind = step.wind || { x: 0, y: 0 };
    const fx = tgt.x - wind.x, fy = tgt.y - wind.y;
    drawVector(0, 0, fx, fy, '#e84545', 3, 'ירי נכון');
    drawVector(fx, fy, tgt.x, tgt.y, '#0ea5e9', 2.5, 'רוח');
    drawVector(0, 0, tgt.x, tgt.y, '#2ecc71', 2.5, 'שקול', true);
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

  // ניקוי שדות קלט
  ['l1-vx','l1-vy','l2-vx','l2-vy','l2-mag','l2-angle',
   'l3-vx','l3-vy','l4-v1x','l4-v1y','l4-v2x','l4-v2y']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

  drawScene();
}

// =====================================================
// מעבר לשלב הבא
// =====================================================
function nextStep() {
  const steps = LEVELS[currentLevel];
  currentStepIdx++;

  if (currentStepIdx >= steps.length) {
    // סיום הרמה – הודעה קצרה ואיפוס
    currentStepIdx = 0;
    document.getElementById('success-overlay').classList.remove('hidden');
    document.getElementById('success-emoji').textContent = '🏆';
    document.getElementById('success-text').textContent  = `כל הכבוד! סיימת רמה ${currentLevel}`;
    document.getElementById('success-points').textContent = `ניקוד: ${score}`;
    setTimeout(() => {
      document.getElementById('success-overlay').classList.add('hidden');
    }, 3000);
  }

  retryStep();
  updateInputUI();
  drawScene();
  document.getElementById('hud-level').textContent = `${currentLevel}-${currentStepIdx + 1}`;
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
// מצב תצוגה של קלט רמה 2 (רכיבים / קוטבי)
// =====================================================
function setupLevel2Toggle() {
  document.querySelectorAll('input[name="l2mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const mode = radio.value;
      document.getElementById('l2-components').classList.toggle('hidden', mode !== 'components');
      document.getElementById('l2-polar').classList.toggle('hidden', mode !== 'polar');
    });
  });
}

// =====================================================
// חיבור מאזיני אירועים
// =====================================================
function bindEvents() {
  document.getElementById('btn-fire').addEventListener('click', fire);
  document.getElementById('btn-solution').addEventListener('click', showSolution);
  document.getElementById('btn-retry').addEventListener('click', retryStep);
  document.getElementById('btn-next').addEventListener('click', nextStep);

  document.getElementById('level-select').addEventListener('change', e => {
    changeLevel(e.target.value);
  });

  // Enter מקש מוביל לירי
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') fire();
  });
}

// =====================================================
// אתחול
// =====================================================
function init() {
  bindEvents();
  setupLevel2Toggle();
  resizeCanvas();
  updateInputUI();
  drawScene();
}

// הפעל לאחר טעינת הדף
document.addEventListener('DOMContentLoaded', init);
