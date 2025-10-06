const timeDisplay = document.getElementById('timeDisplay');
const startPauseBtn = document.getElementById('startPause');
const resetBtn = document.getElementById('reset');
const clipBtn = document.getElementById('clip');
const lapsList = document.getElementById('lapsList');
const lapTemplate = document.getElementById('lapTemplate');
const exportBtn = document.getElementById('export');
const voiceToggle = document.getElementById('voiceToggle');
const voiceStatus = document.getElementById('voiceStatus');
const themeToggle = document.getElementById('themeToggle');

const sessionNameInput = document.getElementById('sessionName');
const clipWordInput = document.getElementById('clipWord');
const completePhraseInput = document.getElementById('completePhrase');

let startTimestamp = null;
let elapsed = 0;
let rafId = null;
let running = false;
let laps = [];
let recognition = null;
let voiceActive = false;
let voiceAvailable = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
let lastRecognized = '';

const formatTime = (ms) => {
  const milliseconds = Math.floor(ms % 1000);
  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  return [hours, minutes, seconds]
    .map((unit) => unit.toString().padStart(2, '0'))
    .join(':')
    .concat('.', milliseconds.toString().padStart(3, '0'));
};

const renderLaps = () => {
  lapsList.innerHTML = '';
  laps.forEach((lap, index) => {
    const node = lapTemplate.content.cloneNode(true);
    node.querySelector('.lap-index').textContent = `#${index + 1}`;
    node.querySelector('.lap-time').textContent = lap.display;
    node.querySelector('.lap-diff').textContent = index === 0 ? '—' : `+${lap.delta}`;
    lapsList.appendChild(node);
  });
};

const updateButtons = () => {
  clipBtn.disabled = !running;
  resetBtn.disabled = running || (!running && elapsed === 0 && laps.length === 0);
  exportBtn.disabled = laps.length === 0;
};

const updateTime = () => {
  if (!running) return;
  const now = performance.now();
  const diff = now - startTimestamp;
  timeDisplay.textContent = formatTime(elapsed + diff);
  rafId = requestAnimationFrame(updateTime);
};

const start = () => {
  if (running) return;
  startTimestamp = performance.now();
  running = true;
  startPauseBtn.textContent = 'Pause';
  startPauseBtn.classList.add('active');
  updateButtons();
  rafId = requestAnimationFrame(updateTime);
};

const pause = () => {
  if (!running) return;
  running = false;
  cancelAnimationFrame(rafId);
  const now = performance.now();
  elapsed += now - startTimestamp;
  startPauseBtn.textContent = 'Resume';
  startPauseBtn.classList.remove('active');
  updateButtons();
};

const reset = () => {
  running = false;
  cancelAnimationFrame(rafId);
  elapsed = 0;
  laps = [];
  startTimestamp = null;
  timeDisplay.textContent = formatTime(0);
  startPauseBtn.textContent = 'Start';
  updateButtons();
  renderLaps();
};

const clipLap = (origin = 'manual') => {
  if (!running) return;
  const now = performance.now();
  const total = elapsed + (now - startTimestamp);
  const display = formatTime(total);
  const delta = laps.length === 0 ? 0 : total - laps[laps.length - 1].total;

  laps.push({
    total,
    display,
    delta: formatTime(delta).slice(-8),
    origin,
    spoken: lastRecognized,
  });
  renderLaps();
  exportBtn.disabled = false;
};

const exportSession = () => {
  if (!laps.length) return;
  const sessionName = sessionNameInput.value.trim() || 'Dream-Unlimited-Session';
  const totalElapsedMs = running ? elapsed + (performance.now() - startTimestamp) : elapsed;
  const data = {
    sessionName,
    startedAt: new Date(Date.now() - totalElapsedMs).toISOString(),
    completedAt: new Date().toISOString(),
    clipWord: clipWordInput.value.trim() || null,
    completionPhrase: completePhraseInput.value.trim() || null,
    totalElapsed: formatTime(totalElapsedMs),
    laps: laps.map((lap, index) => ({
      index: index + 1,
      time: lap.display,
      delta: lap.delta,
      origin: lap.origin,
      spokenPhrase: lap.spoken,
    })),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const filename = `${sessionName.replace(/[^a-z0-9\-]+/gi, '-')}--${
    new Date().toISOString().replace(/[:.]/g, '-')
  }.json`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const completeSession = () => {
  pause();
  exportSession();
  voiceStatus.textContent = '✨ Session saved. Ready for another journey.';
};

const toggleTheme = () => {
  document.body.classList.toggle('light');
};

themeToggle.addEventListener('click', toggleTheme);

startPauseBtn.addEventListener('click', () => {
  if (running) {
    pause();
  } else {
    start();
  }
});

resetBtn.addEventListener('click', reset);
clipBtn.addEventListener('click', () => clipLap('manual'));
exportBtn.addEventListener('click', exportSession);

const stopVoice = () => {
  if (recognition && voiceActive) {
    recognition.stop();
    voiceActive = false;
    voiceToggle.setAttribute('aria-pressed', 'false');
    voiceToggle.querySelector('.label').textContent = 'Activate voice listener';
    voiceStatus.textContent = '🎙️ Voice idle';
  }
};

const handleRecognitionResult = (event) => {
  for (const result of event.results) {
    if (!result.isFinal) continue;
    const transcript = result[0].transcript.trim().toLowerCase();
    lastRecognized = transcript;
    const clipWord = clipWordInput.value.trim().toLowerCase();
    const completionPhrase = completePhraseInput.value.trim().toLowerCase() || 'session complete';

    if (clipWord && transcript.includes(clipWord)) {
      clipLap('voice');
      voiceStatus.textContent = `🔮 Heard "${clipWord}" — moment captured!`;
      continue;
    }

    if (transcript.includes(completionPhrase)) {
      voiceStatus.textContent = '🌙 Session ending — saving your journey...';
      completeSession();
      stopVoice();
      break;
    }

    if (transcript.includes('start')) {
      start();
      voiceStatus.textContent = '🚀 Launching the flow';
      continue;
    }

    if (transcript.includes('pause') || transcript.includes('stop')) {
      pause();
      voiceStatus.textContent = '⏸️ Flow paused';
      continue;
    }
  }
};

const initVoice = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceStatus.textContent = '⚠️ Voice capture not supported in this browser.';
    voiceToggle.disabled = true;
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.addEventListener('start', () => {
    voiceActive = true;
    voiceToggle.setAttribute('aria-pressed', 'true');
    voiceToggle.querySelector('.label').textContent = 'Listening — speak your mantra';
    voiceStatus.textContent = '🎧 Listening for your command mantra...';
  });

  recognition.addEventListener('end', () => {
    voiceActive = false;
    voiceToggle.setAttribute('aria-pressed', 'false');
    voiceToggle.querySelector('.label').textContent = 'Activate voice listener';
    if (voiceAvailable) {
      voiceStatus.textContent = '🎙️ Voice idle';
    }
  });

  recognition.addEventListener('error', (event) => {
    voiceStatus.textContent = `⚠️ Voice error: ${event.error}`;
  });

  recognition.addEventListener('result', handleRecognitionResult);
};

voiceToggle.addEventListener('click', () => {
  if (!recognition) {
    initVoice();
  }

  if (!recognition) return;

  if (voiceActive) {
    recognition.stop();
  } else {
    try {
      recognition.start();
    } catch (error) {
      voiceStatus.textContent = `⚠️ Voice could not start: ${error.message}`;
    }
  }
});

window.addEventListener('beforeunload', () => {
  if (voiceActive && recognition) {
    recognition.stop();
  }
});

// Provide default phrases for quick start
clipWordInput.value = 'illuminate';
completePhraseInput.value = 'session complete';
sessionNameInput.value = 'Dream Unlimited Session';

updateButtons();
renderLaps();
