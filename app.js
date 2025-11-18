let scenario = null;
let currentIndex = 0;
let cluePlayer = new Audio();
let sfxPlayer = new Audio();

const stepCounter = document.getElementById('step-counter');
const clueTextEl = document.getElementById('clue-text');
const playClueBtn = document.getElementById('play-clue');
const itemGrid = document.getElementById('item-grid');
const feedbackEl = document.getElementById('feedback');
const nextBtn = document.getElementById('next-btn');

async function init() {
  const res = await fetch('data/scenario.json');
  scenario = await res.json();
  currentIndex = 0;
  localStorage.setItem('jj_foundIngredients', '[]');
  showStep();
}

function showStep() {
  const steps = scenario.steps;
  const step = steps[currentIndex];

  stepCounter.textContent = `Step ${currentIndex + 1} of ${steps.length}`;
  clueTextEl.textContent = step.clueText;
  feedbackEl.textContent = '';
  nextBtn.style.display = 'none';

  playClue(step.clueAudio);

  // Build scan buttons: one correct + one generic decoy
  itemGrid.innerHTML = '';

  const correct = {
    id: step.correctOptionId,
    name: step.name,
    image: step.image,
    correct: true
  };

  // simple decoy: repeat previous ingredient or generic “other item”
  const decoy = {
    id: step.id + '_decoy',
    name: 'Another Nearby Item',
    image: step.image,
    correct: false
  };

  const options = [correct, decoy].sort(() => Math.random() - 0.5);

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'item-btn';
    btn.dataset.correct = opt.correct ? 'true' : 'false';

    const img = document.createElement('img');
    img.src = opt.image;
    img.alt = opt.name;

    const label = document.createElement('span');
    label.textContent = opt.name;

    btn.appendChild(img);
    btn.appendChild(label);

    btn.addEventListener('click', () => handleScan(opt.correct, step));

    itemGrid.appendChild(btn);
  });
}

function playClue(src) {
  cluePlayer.pause();
  cluePlayer.currentTime = 0;
  cluePlayer.src = src;
  cluePlayer.play().catch(() => {});
}

function playSfx(src) {
  sfxPlayer.pause();
  sfxPlayer.currentTime = 0;
  sfxPlayer.src = src;
  sfxPlayer.play().catch(() => {});
}

function handleScan(isCorrect, step) {
  if (isCorrect) {
    feedbackEl.textContent = '✅ You found the right ingredient!';
    playSfx(scenario.audio.correct);

    // store ingredient name for summary
    const stored = JSON.parse(localStorage.getItem('jj_foundIngredients') || '[]');
    if (!stored.includes(step.name)) {
      stored.push(step.name);
      localStorage.setItem('jj_foundIngredients', JSON.stringify(stored));
    }

    if (currentIndex < scenario.steps.length - 1) {
      nextBtn.textContent = 'Next Ingredient';
      nextBtn.style.display = 'block';
      nextBtn.onclick = () => {
        currentIndex += 1;
        showStep();
      };
    } else {
      nextBtn.textContent = 'View My Recipe';
      nextBtn.style.display = 'block';
      nextBtn.onclick = () => {
        window.location.href = 'summary.html';
      };
    }
  } else {
    feedbackEl.textContent = '❌ Almost! Try scanning the other item.';
    playSfx(scenario.audio.tryAgain);
  }
}

playClueBtn.addEventListener('click', () => {
  const step = scenario.steps[currentIndex];
  playClue(step.clueAudio);
});

// Start everything after first tap to satisfy mobile audio rules
document.addEventListener(
  'click',
  () => {
    if (!scenario) {
      init();
    }
  },
  { once: true }
);
