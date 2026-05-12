/* ===== ICET 2025 Quiz App ===== */

let questions = [];
let currentIndex = 0;
let userAnswers = {};  // { qIndex: selectedOption }
let timerInterval = null;
let totalSeconds = 150 * 60; // 150 minutes
let remainingSeconds = totalSeconds;
let quizStarted = false;
let quizEnded = false;
let startTime = null;

let currentShift = null;
const QUIZ_DATA = {
  'shift1': {
    title: 'TG ICET 2025',
    subtitle: '9th June 2025 • Shift 1',
    json: 'questions_shift1.json',
    imagesDir: 'images_shift1/'
  },
  'shift2': {
    title: 'TG ICET 2025',
    subtitle: '8th June 2025 • Shift 2',
    json: 'questions_shift2.json',
    imagesDir: 'images_shift2/'
  }
};

const SECTIONS = [
  { name: 'Analytical Ability', start: 1, end: 75 },
  { name: 'Mathematical Ability', start: 76, end: 145 },
  { name: 'Communication Ability', start: 146, end: 200 }
];

/* ===== SELECTION & LOAD ===== */
function selectQuiz(shiftId) {
  currentShift = QUIZ_DATA[shiftId];
  
  // Update Start Screen UI
  document.getElementById('selected-quiz-title').textContent = currentShift.title;
  document.getElementById('selected-quiz-subtitle').textContent = currentShift.subtitle;
  document.getElementById('quiz-header-title').textContent = currentShift.subtitle;
  
  // Load questions
  loadQuestions(currentShift.json).then(() => {
    // Enable start button
    document.getElementById('start-btn').disabled = false;
  });
  
  // Switch screens
  document.getElementById('selection-screen').classList.remove('active');
  document.getElementById('start-screen').classList.add('active');
}

function goBackToSelection() {
  document.getElementById('start-screen').classList.remove('active');
  document.getElementById('selection-screen').classList.add('active');
  currentShift = null;
  document.getElementById('start-btn').disabled = true;
}

function goToSelection() {
  // From result screen back to main menu
  document.getElementById('result-screen').classList.remove('active');
  document.getElementById('selection-screen').classList.add('active');
  
  // Reset all
  userAnswers = {};
  currentIndex = 0;
  remainingSeconds = totalSeconds;
  quizStarted = false;
  quizEnded = false;
  clearInterval(timerInterval);
  updateTimerDisplay();
  currentShift = null;
  document.getElementById('start-btn').disabled = true;
}

async function loadQuestions(jsonFile) {
  try {
    const res = await fetch(jsonFile);
    questions = await res.json();
    // Ensure all questions have exactly 4 options
    questions.forEach(q => {
      while (q.options.length < 4) {
        q.options.push({ number: q.options.length + 1, images: [], text: String(q.options.length + 1) });
      }
      // Fix option numbers
      q.options = q.options.slice(0, 4);
      q.options.forEach((opt, i) => { opt.number = i + 1; });
    });
    console.log(`Loaded ${questions.length} questions from ${jsonFile}`);
  } catch (e) {
    console.error('Failed to load questions:', e);
    alert('Failed to load quiz data. Please try again.');
  }
}

/* ===== TIMER ===== */
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerDisplay();
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      endQuiz();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const display = document.getElementById('timer-display');
  display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

  const timer = document.getElementById('timer');
  timer.classList.remove('warning', 'danger');
  if (remainingSeconds <= 300) timer.classList.add('danger');
  else if (remainingSeconds <= 600) timer.classList.add('warning');
}

/* ===== SECTION DETECTION ===== */
function getSectionName(qNum) {
  for (const s of SECTIONS) {
    if (qNum >= s.start && qNum <= s.end) return s.name;
  }
  return '';
}

/* ===== RENDER QUESTION ===== */
function renderQuestion() {
  const q = questions[currentIndex];
  if (!q) return;

  // Update header
  document.getElementById('section-name').textContent = getSectionName(q.number);
  document.getElementById('q-number').textContent = `Q.${q.number}`;

  // Update progress
  const pct = ((currentIndex + 1) / questions.length) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-text').textContent = `${currentIndex + 1} / ${questions.length}`;

  // Render question images
  const qImgContainer = document.getElementById('q-images');
  qImgContainer.innerHTML = '';
  if (q.question_images && q.question_images.length > 0) {
    q.question_images.forEach(img => {
      const imgEl = document.createElement('img');
      imgEl.src = currentShift.imagesDir + img;
      imgEl.alt = `Question ${q.number}`;
      imgEl.loading = 'lazy';
      qImgContainer.appendChild(imgEl);
    });
  }

  // Render options
  const optContainer = document.getElementById('options-container');
  optContainer.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];
  const userAnswer = userAnswers[currentIndex];

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.id = `option-${idx}`;

    const optNum = idx + 1;
    let indicatorText = '';

    // Apply states if already answered
    if (userAnswer !== undefined) {
      btn.classList.add('disabled');
      if (userAnswer === optNum) {
        if (optNum === q.correct) {
          btn.classList.add('selected-correct');
          indicatorText = '✓';
        } else {
          btn.classList.add('selected-wrong');
          indicatorText = '✗';
        }
      } else if (optNum === q.correct) {
        btn.classList.add('reveal-correct');
        indicatorText = '✓';
      }
    }

    // Build option content
    let contentHTML = '';
    if (opt.images && opt.images.length > 0) {
      contentHTML = opt.images.map(img =>
        `<img src="${currentShift.imagesDir}${img}" alt="Option ${letters[idx]}" loading="lazy">`
      ).join('');
    } else if (opt.text) {
      contentHTML = `<span>${opt.text}</span>`;
    } else {
      contentHTML = `<span>Option ${letters[idx]}</span>`;
    }

    btn.innerHTML = `
      <span class="opt-letter">${letters[idx]}</span>
      <div class="opt-content">${contentHTML}</div>
      <span class="opt-indicator">${indicatorText}</span>
    `;

    if (userAnswer === undefined) {
      btn.addEventListener('click', () => selectOption(optNum));
    }

    optContainer.appendChild(btn);
  });

  // Feedback
  const feedback = document.getElementById('answer-feedback');
  if (userAnswer !== undefined) {
    feedback.classList.remove('hidden');
    if (userAnswer === q.correct) {
      feedback.className = 'feedback correct';
      feedback.textContent = '✓ Correct! Well done.';
    } else {
      feedback.className = 'feedback wrong';
      const correctLetter = letters[q.correct - 1];
      feedback.textContent = `✗ Incorrect. The correct answer is Option ${correctLetter}.`;
    }
  } else {
    feedback.classList.add('hidden');
  }

  // Navigation buttons
  document.getElementById('prev-btn').disabled = currentIndex === 0;
  document.getElementById('next-btn').textContent = currentIndex === questions.length - 1 ? 'Finish' : 'Next →';

  // Update score
  updateScore();

  // Scroll to top
  document.getElementById('question-area').scrollTop = 0;

  // Re-animate card
  const card = document.querySelector('.question-card');
  card.style.animation = 'none';
  card.offsetHeight; // force reflow
  card.style.animation = 'fade-in 0.3s ease';
}

/* ===== SELECT OPTION ===== */
function selectOption(optNum) {
  if (userAnswers[currentIndex] !== undefined) return;
  userAnswers[currentIndex] = optNum;
  renderQuestion();
}

/* ===== NAVIGATION ===== */
function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    renderQuestion();
  } else {
    endQuiz();
  }
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
}

function goToQuestion(idx) {
  currentIndex = idx;
  renderQuestion();
  closeNavigator();
}

/* ===== SCORE ===== */
function updateScore() {
  let correct = 0;
  for (const idx in userAnswers) {
    if (questions[idx] && userAnswers[idx] === questions[idx].correct) {
      correct++;
    }
  }
  document.getElementById('score-value').textContent = `${correct}/200`;
}

function getStats() {
  let correct = 0, wrong = 0, skipped = 0;
  for (let i = 0; i < questions.length; i++) {
    if (userAnswers[i] === undefined) {
      skipped++;
    } else if (userAnswers[i] === questions[i].correct) {
      correct++;
    } else {
      wrong++;
    }
  }
  return { correct, wrong, skipped };
}

/* ===== NAVIGATOR ===== */
function openNavigator() {
  const modal = document.getElementById('navigator-modal');
  modal.classList.remove('hidden');
  const grid = document.getElementById('nav-grid');
  grid.innerHTML = '';

  for (let i = 0; i < questions.length; i++) {
    const cell = document.createElement('div');
    cell.className = 'nav-cell';
    cell.textContent = i + 1;

    if (i === currentIndex) cell.classList.add('current');
    else if (userAnswers[i] !== undefined) {
      cell.classList.add(userAnswers[i] === questions[i].correct ? 'correct' : 'wrong');
    }

    cell.addEventListener('click', () => goToQuestion(i));
    grid.appendChild(cell);
  }
}

function closeNavigator() {
  document.getElementById('navigator-modal').classList.add('hidden');
}

/* ===== QUIZ LIFECYCLE ===== */
function startQuiz() {
  document.getElementById('start-screen').classList.remove('active');
  document.getElementById('quiz-screen').classList.add('active');
  quizStarted = true;
  startTimer();
  renderQuestion();
}

function endQuiz() {
  if (quizEnded) return;
  quizEnded = true;
  clearInterval(timerInterval);

  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const stats = getStats();

  // Switch to result screen
  document.getElementById('quiz-screen').classList.remove('active');
  document.getElementById('result-screen').classList.add('active');

  // Emoji
  const pct = stats.correct / questions.length;
  let emoji = '🎯';
  if (pct >= 0.8) emoji = '🏆';
  else if (pct >= 0.6) emoji = '🌟';
  else if (pct >= 0.4) emoji = '💪';
  else emoji = '📚';
  document.getElementById('result-emoji').textContent = emoji;

  // Score
  document.getElementById('final-score').textContent = stats.correct;
  document.getElementById('stat-correct').textContent = stats.correct;
  document.getElementById('stat-wrong').textContent = stats.wrong;
  document.getElementById('stat-skipped').textContent = stats.skipped;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  document.getElementById('stat-time').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

  // Animate score circle
  setTimeout(() => {
    const circle = document.getElementById('score-circle');
    const circumference = 2 * Math.PI * 54; // r=54
    const offset = circumference - (pct * circumference);
    circle.style.strokeDashoffset = offset;

    // Color based on performance
    if (pct >= 0.6) circle.style.stroke = 'var(--green)';
    else if (pct >= 0.4) circle.style.stroke = 'var(--yellow)';
    else circle.style.stroke = 'var(--red)';
  }, 100);
}

function reviewQuiz() {
  document.getElementById('result-screen').classList.remove('active');
  document.getElementById('quiz-screen').classList.add('active');
  currentIndex = 0;
  renderQuestion();
}

/* ===== KEYBOARD NAVIGATION ===== */
document.addEventListener('keydown', (e) => {
  if (!quizStarted || quizEnded) return;
  if (e.key === 'ArrowRight') nextQuestion();
  else if (e.key === 'ArrowLeft') prevQuestion();
  else if (e.key >= '1' && e.key <= '4') selectOption(parseInt(e.key));
  else if (e.key === 'a' || e.key === 'A') selectOption(1);
  else if (e.key === 'b' || e.key === 'B') selectOption(2);
  else if (e.key === 'c' || e.key === 'C') selectOption(3);
  else if (e.key === 'd' || e.key === 'D') selectOption(4);
});
