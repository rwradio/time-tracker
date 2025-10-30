const modeDisplay = document.getElementById('mode-display');
const timeDisplay = document.getElementById('time-display');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const resetButton = document.getElementById('reset-button');
const workDurationInput = document.getElementById('work-duration');
const restDurationInput = document.getElementById('rest-duration');
const autoRestCheckbox = document.getElementById('auto-rest-checkbox');
const paidRestCheckbox = document.getElementById('paid-rest-checkbox');
const stepDurationSelect = document.getElementById('step-duration');
const hourlyRateInput = document.getElementById('hourly-rate');
const timerProgress = document.querySelector('.timer-progress');
const container = document.querySelector('.container');
const toggleSettingsButton = document.getElementById('toggle-settings-button');
const backButton = document.getElementById('back-button');
const settingsContainer = document.querySelector('.settings-container');
const timerEndSound = document.getElementById('timer-end-sound');
const lastSessionDisplay = document.getElementById('last-session-display');
const finishWorkButton = document.getElementById('finish-work-button');
const playButtonContainer = document.getElementById('play-button-container');
const playPauseButton = document.getElementById('play-pause-button');
const radioPlayer = document.getElementById('radio-player');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const workModeIcon = document.getElementById('work-mode-icon');
const rubyIcon = document.getElementById('ruby-icon');
const wineIcon = document.getElementById('wine-icon');

// Timer Variables
let timerInterval;
let isRunning = false;
let currentMode = 'work'; // 'work' or 'rest'
let timeLeft = 0; // in seconds
let workDuration = 25 * 60; // in seconds
let restDuration = 5 * 60; // in seconds
let stepDuration = 5 * 60; // in seconds
let hourlyRate = 10;
let audioUnlocked = false; // Flag to track if audio is unlocked
let totalWorkTime = 0; // in seconds, for accumulated work time

// Radio Player Variables
const radioStreamUrl = 'https://stream.zeno.fm/pcbduafehg0uv';
radioPlayer.src = radioStreamUrl;
let isRadioPlaying = false;

// SVG Circle properties for animation
const circumference = 2 * Math.PI * timerProgress.r.baseVal.value;
timerProgress.style.strokeDasharray = circumference;

function saveSettings() {
    const settings = {
        workDuration: workDurationInput.value,
        restDuration: restDurationInput.value,
        autoRest: autoRestCheckbox.checked,
        paidRest: paidRestCheckbox.checked,
        stepDuration: stepDurationSelect.value,
        hourlyRate: hourlyRateInput.value
    };
    localStorage.setItem('timerSettings', JSON.stringify(settings));
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('timerSettings'));
    if (settings) {
        workDurationInput.value = settings.workDuration || '25';
        restDurationInput.value = settings.restDuration || '5';
        autoRestCheckbox.checked = settings.autoRest || false;
        paidRestCheckbox.checked = settings.paidRest || false;
        stepDurationSelect.value = settings.stepDuration || '5';
        hourlyRateInput.value = settings.hourlyRate || '10';
    }
}

function populateWorkDurationOptions() {
    const currentStep = parseInt(stepDurationSelect.value);
    workDurationInput.innerHTML = ''; // Clear existing options
    for (let i = currentStep; i <= 60; i += currentStep) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `${i} минут`;
        workDurationInput.appendChild(option);
    }
    if (workDurationInput.value === '') {
        workDurationInput.value = currentStep;
    }
    workDurationInput.dispatchEvent(new Event('change'));
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatAccumulatedTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')} ч ${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} м`;
}

function roundDurationToStep(durationSeconds, stepSeconds) {
    if (stepSeconds === 0) return durationSeconds;
    const remainder = durationSeconds % stepSeconds;
    if (remainder === 0) {
        return durationSeconds;
    } else {
        return durationSeconds + (stepSeconds - remainder);
    }
}

function updateTimerDisplay() {
    timeDisplay.textContent = formatTime(timeLeft);
    const hoursWorked = totalWorkTime / 3600;
    const cost = (hoursWorked * hourlyRate).toFixed(2);
    lastSessionDisplay.textContent = `Накоплено: ${formatAccumulatedTime(totalWorkTime)} ($${cost})`;

    const totalDuration = (currentMode === 'work' ? workDuration : restDuration);
    const progress = (timeLeft / totalDuration);
    const offset = circumference * (1 - progress);
    timerProgress.style.strokeDashoffset = offset;
}

function playSound() {
    if (audioUnlocked) {
        timerEndSound.play().catch(error => {
            console.warn('Audio play failed (after unlock attempt):', error);
        });
    } else {
        console.warn('Audio not unlocked yet, cannot play sound.');
    }
}

function showPlayButton() {
    playButtonContainer.style.display = 'flex';
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
}

function hidePlayButtonAndStopRadio() {
    playButtonContainer.style.display = 'none';
    radioPlayer.pause();
    isRadioPlaying = false;
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
}

function updateModeDisplay(mode) {
    if (mode === 'work') {
        modeDisplay.textContent = 'Режим: Работа';
        workModeIcon.style.display = 'none';
        rubyIcon.style.display = 'none';
        wineIcon.style.display = 'none';
    } else if (mode === 'rest') {
        modeDisplay.textContent = 'Режим: Отдых';
        workModeIcon.style.display = 'none';
        rubyIcon.style.display = 'none';
        wineIcon.style.display = 'none';
    } else if (mode === 'finished') {
        modeDisplay.textContent = 'Работа завершена!';
        workModeIcon.style.display = 'none';
        rubyIcon.style.display = 'none';
        wineIcon.style.display = 'block';
    } else if (mode === 'working') {
        modeDisplay.textContent = 'Работаем';
        workModeIcon.style.display = 'block';
        rubyIcon.style.display = 'block';
        wineIcon.style.display = 'none';
    }
}

function switchMode() {
    playSound();
    clearInterval(timerInterval);
    isRunning = false;

    if (currentMode === 'work') {
        currentMode = 'rest';
        timeLeft = restDuration;
        updateModeDisplay('rest');
        timerProgress.style.stroke = '#2196F3'; // Blue for rest
        showPlayButton();
        if (autoRestCheckbox.checked) {
            startTimer();
        }
    } else {
        currentMode = 'work';
        timeLeft = workDuration;
        updateModeDisplay('work');
        timerProgress.style.stroke = '#4CAF50'; // Green for work
        hidePlayButtonAndStopRadio();
    }
    updateTimerDisplay();
}

function startTimer() {
    if (isRunning) return;

    if (!audioUnlocked) {
        timerEndSound.play().then(() => {
            timerEndSound.pause();
            timerEndSound.currentTime = 0;
            audioUnlocked = true;
        }).catch(error => {
            console.warn('Audio unlock attempt failed:', error);
            audioUnlocked = true;
        });
    }

    isRunning = true;
    if (timeLeft === 0) {
        timeLeft = currentMode === 'work' ? workDuration : restDuration;
    }

    if (currentMode === 'work') {
        updateModeDisplay('working');
        hidePlayButtonAndStopRadio();
    }

    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            switchMode();
            return;
        }
        if (currentMode === 'work' || (currentMode === 'rest' && paidRestCheckbox.checked)) {
            totalWorkTime++;
        }
        timeLeft--;
        updateTimerDisplay();
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerInterval);
}

function resetTimer() {
    isRunning = false;
    clearInterval(timerInterval);
    currentMode = 'work';
    timeLeft = workDuration;
    updateModeDisplay('work');
    timerProgress.style.stroke = '#4CAF50';
    lastSessionDisplay.textContent = `Накоплено: ${formatTime(totalWorkTime)}`;
    updateTimerDisplay();
    hidePlayButtonAndStopRadio();
}

function finishWork() {
    isRunning = false;
    clearInterval(timerInterval);
    
    const finalRoundedTotal = roundDurationToStep(totalWorkTime, stepDuration);
    const hoursWorked = finalRoundedTotal / 3600;
    const cost = (hoursWorked * hourlyRate).toFixed(2);

    updateModeDisplay('finished');
    lastSessionDisplay.textContent = `Итого: ${formatAccumulatedTime(finalRoundedTotal)} $${cost}`;
    
    totalWorkTime = 0;
    currentMode = 'work';
    timeLeft = workDuration;
    timerProgress.style.stroke = '#4CAF50';
    showPlayButton();
}

// Event Listeners
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);
finishWorkButton.addEventListener('click', finishWork);
autoRestCheckbox.addEventListener('change', saveSettings);
paidRestCheckbox.addEventListener('change', saveSettings);

playPauseButton.addEventListener('click', () => {
    if (isRadioPlaying) {
        radioPlayer.pause();
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
    } else {
        radioPlayer.play();
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
    }
    isRadioPlaying = !isRadioPlaying;
});

workDurationInput.addEventListener('change', () => {
    workDuration = parseInt(workDurationInput.value) * 60;
    if (!isRunning) {
        resetTimer();
    }
    saveSettings();
});

restDurationInput.addEventListener('change', () => {
    restDuration = parseInt(restDurationInput.value) * 60;
    if (!isRunning) {
        resetTimer();
    }
    saveSettings();
});

stepDurationSelect.addEventListener('change', () => {
    stepDuration = parseInt(stepDurationSelect.value) * 60;
    populateWorkDurationOptions();
    saveSettings();
});

hourlyRateInput.addEventListener('change', () => {
    hourlyRate = parseInt(hourlyRateInput.value);
    saveSettings();
});

// Initial setup
loadSettings();
populateWorkDurationOptions();
workDurationInput.dispatchEvent(new Event('change'));
restDurationInput.dispatchEvent(new Event('change'));
stepDurationSelect.dispatchEvent(new Event('change'));
hourlyRateInput.dispatchEvent(new Event('change'));
resetTimer();

function toggleSettings() {
    container.classList.toggle('settings-active');
}

toggleSettingsButton.addEventListener('click', toggleSettings);
backButton.addEventListener('click', toggleSettings);

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered: ', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed: ', error);
            });
    });
}