const demoAccount = {
  username: "student",
  password: "orchid72"
};

const defaultWordlist = [
  "password",
  "student",
  "letmein",
  "welcome",
  "qwerty",
  "summer2026",
  "cyber123",
  "orchid72",
  "admin123"
];

const state = {
  failedAttempts: 0,
  locked: false,
  running: false,
  stopRequested: false,
  startedAt: 0,
  timer: null
};

const loginForm = document.querySelector("#login-form");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const loginStatus = document.querySelector("#login-status");
const wordlistInput = document.querySelector("#wordlist");
const startButton = document.querySelector("#start-attack");
const stopButton = document.querySelector("#stop-attack");
const resetButton = document.querySelector("#reset-button");
const rateLimitToggle = document.querySelector("#rate-limit-toggle");
const lockoutToggle = document.querySelector("#lockout-toggle");
const attemptCount = document.querySelector("#attempt-count");
const elapsedTime = document.querySelector("#elapsed-time");
const defenseState = document.querySelector("#defense-state");
const attemptLog = document.querySelector("#attempt-log");

wordlistInput.value = defaultWordlist.join("\n");

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = checkLogin(usernameInput.value.trim(), passwordInput.value);
  showLoginResult(result, passwordInput.value);
});

startButton.addEventListener("click", runSimulation);
stopButton.addEventListener("click", () => {
  state.stopRequested = true;
  addLog("Stop requested. Finishing current attempt...", "blocked");
});
resetButton.addEventListener("click", resetLab);
rateLimitToggle.addEventListener("change", updateDefenseState);
lockoutToggle.addEventListener("change", updateDefenseState);

function checkLogin(username, password) {
  if (state.locked) {
    return { ok: false, blocked: true, message: "Account is locked. Reset the lab to try again." };
  }

  const ok = username === demoAccount.username && password === demoAccount.password;

  if (ok) {
    state.failedAttempts = 0;
    return { ok: true, blocked: false, message: "Login successful." };
  }

  state.failedAttempts += 1;

  if (lockoutToggle.checked && state.failedAttempts >= 5) {
    state.locked = true;
    return { ok: false, blocked: true, message: "Account locked after 5 failed attempts." };
  }

  return { ok: false, blocked: false, message: "Wrong username or password." };
}

function showLoginResult(result, password) {
  loginStatus.className = "status-box";

  if (result.ok) {
    loginStatus.classList.add("success");
    loginStatus.textContent = `Success. Password "${password}" opened the demo account.`;
    return;
  }

  if (result.blocked) {
    loginStatus.classList.add("warning");
    loginStatus.textContent = result.message;
    return;
  }

  loginStatus.classList.add("danger");
  loginStatus.textContent = result.message;
}

async function runSimulation() {
  if (state.running) return;

  const candidates = wordlistInput.value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!candidates.length) {
    addLog("Add at least one password to the wordlist.", "blocked");
    return;
  }

  resetAttemptDisplay();
  state.running = true;
  state.stopRequested = false;
  state.startedAt = performance.now();
  startButton.disabled = true;
  stopButton.disabled = false;
  state.timer = window.setInterval(updateElapsedTime, 100);

  for (const candidate of candidates) {
    if (state.stopRequested) break;

    if (rateLimitToggle.checked) {
      await wait(650);
    } else {
      await wait(120);
    }

    const result = checkLogin(demoAccount.username, candidate);
    attemptCount.textContent = String(Number(attemptCount.textContent) + 1);

    if (result.ok) {
      addLog(`Tried "${candidate}" -> success`, "ok");
      showLoginResult(result, candidate);
      break;
    }

    if (result.blocked) {
      addLog(`Tried "${candidate}" -> blocked: ${result.message}`, "blocked");
      showLoginResult(result, candidate);
      break;
    }

    addLog(`Tried "${candidate}" -> failed`, "bad");
  }

  finishSimulation();
}

function finishSimulation() {
  state.running = false;
  startButton.disabled = false;
  stopButton.disabled = true;
  window.clearInterval(state.timer);
  updateElapsedTime();
  updateDefenseState();
}

function resetLab() {
  state.failedAttempts = 0;
  state.locked = false;
  state.running = false;
  state.stopRequested = false;
  window.clearInterval(state.timer);
  passwordInput.value = "";
  loginStatus.className = "status-box neutral";
  loginStatus.innerHTML = "Demo account: <strong>student</strong>. The password is hidden in the lab data.";
  resetAttemptDisplay();
  startButton.disabled = false;
  stopButton.disabled = true;
  updateDefenseState();
}

function resetAttemptDisplay() {
  attemptCount.textContent = "0";
  elapsedTime.textContent = "0.0s";
  attemptLog.innerHTML = "";
}

function addLog(message, type) {
  const item = document.createElement("li");
  item.className = type;
  item.textContent = message;
  attemptLog.appendChild(item);
  attemptLog.scrollTop = attemptLog.scrollHeight;
}

function updateElapsedTime() {
  if (!state.startedAt) {
    elapsedTime.textContent = "0.0s";
    return;
  }

  const seconds = (performance.now() - state.startedAt) / 1000;
  elapsedTime.textContent = `${seconds.toFixed(1)}s`;
}

function updateDefenseState() {
  if (state.locked) {
    defenseState.textContent = "Locked";
    return;
  }

  if (rateLimitToggle.checked && lockoutToggle.checked) {
    defenseState.textContent = "Protected";
    return;
  }

  if (rateLimitToggle.checked || lockoutToggle.checked) {
    defenseState.textContent = "Partial";
    return;
  }

  defenseState.textContent = "Vulnerable";
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

updateDefenseState();
