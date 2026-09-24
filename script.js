const timeElement = document.getElementById("time");
const timeLabel = document.getElementById("timeLabel");
const statusElement = document.getElementById("status");
const progressElement = document.getElementById("progress");
const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");
const minutesInput = document.getElementById("minutes");
const secondsInput = document.getElementById("seconds");
const noticeElement = document.getElementById("notice");
const circumference = 2 * Math.PI * 53;

let totalSeconds = 25 * 60;
let remainingSeconds = totalSeconds;
let timerId = null;

progressElement.style.strokeDasharray = circumference;

function updateDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  timeElement.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  progressElement.style.strokeDashoffset = circumference * (1 - (totalSeconds ? remainingSeconds / totalSeconds : 0));
  document.title = `${timeElement.textContent} | Focus Timer`;
}

function setDuration(minutes, seconds = 0) {
  totalSeconds = Math.max(1, minutes * 60 + seconds);
  remainingSeconds = totalSeconds;
  minutesInput.value = minutes;
  secondsInput.value = String(seconds).padStart(2, "0");
  noticeElement.textContent = "";
  timeLabel.textContent = "Ready when you are";
  updateDisplay();
}

function playFinishSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    [0, 0.18, 0.36].forEach((delay, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = [880, 1175, 1568][index];
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.22, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.18);
    });

    setTimeout(() => ctx.close(), 800);
  } catch (e) {
    // Ignore audio errors in unsupported browsers.
  }
}

function finishTimer() {
  clearInterval(timerId);
  timerId = null;
  remainingSeconds = 0;
  updateDisplay();
  playFinishSound();
  startButton.textContent = "Start again";
  statusElement.textContent = "Session complete";
  statusElement.classList.remove("is-running");
  timeLabel.textContent = "Well done today";
  noticeElement.textContent = "セッションが完了しました。少し休憩しましょう。";

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    new Notification("Time Tracker", { body: "セッションが完了しました。" });
  }
}

function toggleTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
    startButton.textContent = "Resume timer";
    statusElement.textContent = "Paused";
    statusElement.classList.remove("is-running");
    timeLabel.textContent = "Paused for now";
    return;
  }

  if (remainingSeconds <= 0) {
    setDuration(Number(minutesInput.value) || 25, Number(secondsInput.value) || 0);
  }

  timerId = setInterval(() => {
    remainingSeconds -= 1;
    updateDisplay();

    if (remainingSeconds <= 0) {
      finishTimer();
    }
  }, 1000);

  startButton.textContent = "Pause timer";
  statusElement.textContent = "In focus";
  statusElement.classList.add("is-running");
  timeLabel.textContent = "Keep going";
}

function applyCustomDuration() {
  if (timerId) return;

  const minutes = Math.min(999, Math.max(0, Number(minutesInput.value) || 0));
  const seconds = Math.min(59, Math.max(0, Number(secondsInput.value) || 0));

  setDuration(minutes, seconds);
  document.querySelectorAll(".preset").forEach((preset) => preset.classList.remove("active"));
}

startButton.addEventListener("click", toggleTimer);

resetButton.addEventListener("click", () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }

  setDuration(Number(minutesInput.value) || 25, Number(secondsInput.value) || 0);
  startButton.textContent = "Start timer";
  statusElement.textContent = "Ready to focus";
  statusElement.classList.remove("is-running");
});

document.querySelectorAll(".preset").forEach((preset) => {
  preset.addEventListener("click", () => {
    if (timerId) return;

    document.querySelectorAll(".preset").forEach((item) => item.classList.remove("active"));
    preset.classList.add("active");
    setDuration(Number(preset.dataset.minutes));
  });
});

minutesInput.addEventListener("change", applyCustomDuration);
secondsInput.addEventListener("change", applyCustomDuration);

document.addEventListener("keydown", (event) => {
  if (event.code === "Space" && event.target.tagName !== "INPUT") {
    event.preventDefault();
    toggleTimer();
  }
});

updateDisplay();
