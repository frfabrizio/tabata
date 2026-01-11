const blocksContainer = document.getElementById("blocks-container");
const blockTemplate = document.getElementById("block-template");
const totalDurationEl = document.getElementById("total-duration");
const warmupInput = document.getElementById("warmup-duration");
const cooldownInput = document.getElementById("cooldown-duration");
const addBlockButton = document.getElementById("add-block");
const saveButton = document.getElementById("save-session");
const sessionNameInput = document.getElementById("session-name");
const saveError = document.getElementById("save-error");
const libraryList = document.getElementById("library-list");
const timerStartButton = document.getElementById("timer-start");
const timerStopButton = document.getElementById("timer-stop");
const exportJsonButton = document.getElementById("export-json");
const exportCsvButton = document.getElementById("export-csv");
const timerSummary = document.getElementById("timer-summary");
const timerLogList = document.getElementById("timer-log-list");
const interruptSelect = document.getElementById("interrupt-type");
const interruptButton = document.getElementById("log-interrupt");
const homeCreateButton = document.getElementById("home-create-session");
const homeLoadButton = document.getElementById("home-load-session");
const warmupSection = document.querySelector("[aria-labelledby='warmup-title']");
const librarySection = document.querySelector("[aria-labelledby='library-title']");
const sessionStartButton = document.getElementById("session-start");
const sessionPauseButton = document.getElementById("session-pause");
const sessionResetButton = document.getElementById("session-reset");
const sessionCurrent = document.getElementById("session-current");
const sessionNext = document.getElementById("session-next");
const sessionRemaining = document.getElementById("session-remaining");
const sessionTotalRemaining = document.getElementById("session-total-remaining");
const sessionTimeline = document.getElementById("session-timeline");
const sessionStatus = document.getElementById("session-status");
const sessionProgressFill = document.getElementById("session-progress-fill");

const STORAGE_KEY = "tabataSessions";
const TIMER_EXPECTED_INTERVAL_MS = 1000;

const toNumber = (value) => Number.parseFloat(value || 0);

const formatDuration = (minutes) => `${minutes.toFixed(1)} min`;
const formatTimestamp = (timestamp) =>
  new Date(timestamp).toLocaleTimeString("fr-FR", { hour12: false });
const formatMs = (value) => `${value.toFixed(1)} ms`;
const formatClock = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

const createBlock = (data = {}) => {
  const fragment = blockTemplate.content.cloneNode(true);
  const block = fragment.querySelector(".block-card");
  const removeButton = fragment.querySelector("[data-action='remove']");

  const inputs = block.querySelectorAll("input, select");
  const typeInput = block.querySelector("[data-field='type']");
  const repsInput = block.querySelector("[data-field='reps']");
  const intervalInput = block.querySelector("[data-field='interval']");
  const adjustmentInput = block.querySelector("[data-field='adjustment']");

  typeInput.value = data.type ?? typeInput.value;
  repsInput.value = data.reps ?? repsInput.value;
  intervalInput.value = data.interval ?? intervalInput.value;
  adjustmentInput.value = data.adjustment ?? adjustmentInput.value;

  inputs.forEach((input) => {
    input.addEventListener("input", updateTotals);
  });

  removeButton.addEventListener("click", () => {
    block.remove();
    updateTotals();
  });

  blocksContainer.appendChild(fragment);
  return block;
};

const getBlocksData = () => {
  return Array.from(blocksContainer.querySelectorAll(".block-card")).map((block) => {
    return {
      type: block.querySelector("[data-field='type']").value,
      reps: toNumber(block.querySelector("[data-field='reps']").value),
      interval: toNumber(block.querySelector("[data-field='interval']").value),
      adjustment: toNumber(block.querySelector("[data-field='adjustment']").value),
      summary: block.querySelector("[data-summary]"),
      errors: {
        reps: block.querySelector("[data-error-field='reps']"),
        interval: block.querySelector("[data-error-field='interval']"),
      },
      inputs: {
        reps: block.querySelector("[data-field='reps']"),
        interval: block.querySelector("[data-field='interval']"),
      },
    };
  });
};

const validateMainDuration = (input, errorEl) => {
  const value = toNumber(input.value);
  if (value < 1) {
    input.classList.add("invalid");
    errorEl.textContent = "La durée doit être supérieure ou égale à 1.";
    return false;
  }
  input.classList.remove("invalid");
  errorEl.textContent = "";
  return true;
};

const updateTotals = () => {
  const blocks = getBlocksData();
  const warmupOk = validateMainDuration(
    warmupInput,
    document.querySelector("[data-error-for='warmup-duration']")
  );
  const cooldownOk = validateMainDuration(
    cooldownInput,
    document.querySelector("[data-error-for='cooldown-duration']")
  );

  let isValid = warmupOk && cooldownOk;
  let blockTotal = 0;

  blocks.forEach((block) => {
    const repsValid = block.reps >= 1;
    block.inputs.reps.classList.toggle("invalid", !repsValid);
    block.errors.reps.textContent = repsValid
      ? ""
      : "Les répétitions doivent être ≥ 1.";

    const intervalValid = block.interval >= 1;
    block.inputs.interval.classList.toggle("invalid", !intervalValid);
    block.errors.interval.textContent = intervalValid
      ? ""
      : "L'intervalle doit être ≥ 1.";

    if (!repsValid || !intervalValid) {
      isValid = false;
    }

    const intervalTotal = Math.max(block.interval + block.adjustment, 0);
    const total = intervalTotal * block.reps;
    block.summary.textContent = `${block.type} · ${block.reps} x ${intervalTotal.toFixed(
      1
    )} min = ${total.toFixed(1)} min`;
    blockTotal += total;
  });

  const warmup = toNumber(warmupInput.value);
  const cooldown = toNumber(cooldownInput.value);
  const total = (warmup || 0) + (cooldown || 0) + blockTotal;
  totalDurationEl.textContent = formatDuration(total);

  saveButton.disabled = !isValid || blocks.length === 0;
  updateSessionPreview(isValid);
};

const saveSessions = (sessions) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

const getSessions = () => {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
};

const clearBlocks = () => {
  blocksContainer.innerHTML = "";
};

const resetSession = () => {
  const warmupDefault = warmupInput.getAttribute("value") ?? "5";
  const cooldownDefault = cooldownInput.getAttribute("value") ?? "5";
  warmupInput.value = warmupDefault;
  cooldownInput.value = cooldownDefault;
  sessionNameInput.value = "";
  clearBlocks();
  createBlock();
  createBlock();
  updateTotals();
};

const scrollToSection = (section) => {
  if (!section) {
    return;
  }
  section.scrollIntoView({ behavior: "smooth", block: "start" });
};

const applySession = (session) => {
  warmupInput.value = session.warmup ?? warmupInput.value;
  cooldownInput.value = session.cooldown ?? cooldownInput.value;
  sessionNameInput.value = session.name ?? sessionNameInput.value;

  clearBlocks();
  if (session.blocksDetails && session.blocksDetails.length) {
    session.blocksDetails.forEach((block) => createBlock(block));
  } else {
    createBlock();
    createBlock();
  }
  updateTotals();
};

const renderBlocksDetails = (blocks) => {
  if (!blocks || !blocks.length) {
    return "<p class=\"muted\">Détails de blocs indisponibles.</p>";
  }
  const items = blocks
    .map((block) => {
      const intervalTotal = Math.max(block.interval + block.adjustment, 0);
      return `<li>${block.type} · ${block.reps} x ${intervalTotal.toFixed(
        1
      )} min</li>`;
    })
    .join("");
  return `<ul class="library-blocks">${items}</ul>`;
};

const loadLibrary = () => {
  const sessions = getSessions();
  libraryList.innerHTML = "";

  if (!sessions.length) {
    libraryList.innerHTML = "<p class=\"muted\">Aucune séance enregistrée.</p>";
    return;
  }

  sessions.forEach((session) => {
    const sessionId = session.id ?? session.createdAt ?? session.name;
    const card = document.createElement("div");
    card.className = "library-card";
    card.innerHTML = `
      <h4>${session.name}</h4>
      <p>${session.total} min · ${session.blocks} blocs</p>
      <p>Échauffement ${session.warmup} min · Récupération ${session.cooldown} min</p>
      ${renderBlocksDetails(session.blocksDetails)}
      <div class="library-actions">
        <button type="button" class="secondary" data-action="load">Charger</button>
        <button type="button" class="ghost" data-action="delete">Supprimer</button>
      </div>
    `;
    card.querySelector("[data-action='load']").addEventListener("click", () => {
      applySession(session);
    });
    card.querySelector("[data-action='delete']").addEventListener("click", () => {
      const remaining = getSessions().filter((item) => {
        const itemId = item.id ?? item.createdAt ?? item.name;
        return itemId !== sessionId;
      });
      saveSessions(remaining);
      loadLibrary();
    });
    libraryList.appendChild(card);
  });
};

const saveSession = () => {
  const name = sessionNameInput.value.trim();
  if (!name) {
    saveError.textContent = "Veuillez donner un nom à la séance.";
    return;
  }
  saveError.textContent = "";

  const blocks = getBlocksData();
  const total = totalDurationEl.textContent.replace(" min", "");
  const sessions = getSessions();
  sessions.unshift({
    id: window.crypto?.randomUUID?.() ?? `${Date.now()}`,
    name,
    total,
    blocks: blocks.length,
    warmup: toNumber(warmupInput.value),
    cooldown: toNumber(cooldownInput.value),
    blocksDetails: blocks.map((block) => ({
      type: block.type,
      reps: block.reps,
      interval: block.interval,
      adjustment: block.adjustment,
    })),
    createdAt: new Date().toISOString(),
  });
  saveSessions(sessions.slice(0, 8));
  sessionNameInput.value = "";
  loadLibrary();
};

const sessionState = {
  timeline: [],
  currentIndex: -1,
  phaseRemainingSeconds: 0,
  totalDurationSeconds: 0,
  phaseStartMs: null,
  timerId: null,
  isRunning: false,
  isPaused: false,
};

const buildTimeline = () => {
  const timeline = [];
  const warmupMinutes = toNumber(warmupInput.value);
  const cooldownMinutes = toNumber(cooldownInput.value);
  if (warmupMinutes > 0) {
    timeline.push({
      label: "Échauffement",
      durationSeconds: Math.round(warmupMinutes * 60),
    });
  }
  getBlocksData().forEach((block) => {
    const intervalTotal = Math.max(block.interval + block.adjustment, 0);
    for (let i = 1; i <= block.reps; i += 1) {
      timeline.push({
        label: `${block.type} · rep ${i}/${block.reps}`,
        durationSeconds: Math.round(intervalTotal * 60),
      });
    }
  });
  if (cooldownMinutes > 0) {
    timeline.push({
      label: "Récupération",
      durationSeconds: Math.round(cooldownMinutes * 60),
    });
  }
  return timeline.filter((item) => item.durationSeconds > 0);
};

const totalDurationSeconds = (timeline) =>
  timeline.reduce((sum, item) => sum + item.durationSeconds, 0);

const renderTimeline = (timeline) => {
  if (!sessionTimeline) {
    return;
  }
  sessionTimeline.innerHTML = "";
  if (!timeline.length) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "muted";
    emptyItem.textContent = "Aucune phase disponible.";
    sessionTimeline.appendChild(emptyItem);
    return;
  }
  timeline.forEach((item, index) => {
    const listItem = document.createElement("li");
    listItem.dataset.index = `${index}`;
    listItem.innerHTML = `
      <span>${item.label}</span>
      <span>${formatClock(item.durationSeconds)}</span>
    `;
    sessionTimeline.appendChild(listItem);
  });
};

const updateTimelineHighlight = () => {
  if (!sessionTimeline) {
    return;
  }
  const items = sessionTimeline.querySelectorAll("li");
  items.forEach((item) => {
    const index = Number(item.dataset.index);
    item.classList.toggle("active", index === sessionState.currentIndex);
  });
};

const updateSessionControls = (isValid) => {
  if (!sessionStartButton) {
    return;
  }
  const hasTimeline = sessionState.timeline.length > 0;
  sessionStartButton.disabled = !isValid || !hasTimeline || sessionState.isRunning;
  sessionPauseButton.disabled = !sessionState.isRunning;
  sessionResetButton.disabled = !hasTimeline;
};

const updateSessionDisplay = (remainingSeconds = 0) => {
  if (!sessionCurrent) {
    return;
  }
  const currentItem =
    sessionState.currentIndex >= 0
      ? sessionState.timeline[sessionState.currentIndex]
      : null;
  const nextItem =
    sessionState.currentIndex >= 0
      ? sessionState.timeline[sessionState.currentIndex + 1]
      : sessionState.timeline[0];
  const totalRemaining =
    sessionState.currentIndex < 0
      ? Math.ceil(remainingSeconds)
      : sessionState.timeline
          .slice(sessionState.currentIndex + 1)
          .reduce(
            (sum, item) => sum + item.durationSeconds,
            Math.ceil(remainingSeconds)
          );
  sessionCurrent.textContent = currentItem ? currentItem.label : "Prêt";
  sessionNext.textContent = nextItem ? nextItem.label : "—";
  sessionRemaining.textContent = formatClock(remainingSeconds);
  sessionTotalRemaining.textContent = formatClock(
    Math.max(totalRemaining, 0)
  );
  const completed =
    sessionState.totalDurationSeconds > 0
      ? sessionState.totalDurationSeconds - totalRemaining
      : 0;
  const progress = sessionState.totalDurationSeconds
    ? (completed / sessionState.totalDurationSeconds) * 100
    : 0;
  if (sessionProgressFill) {
    sessionProgressFill.style.width = `${Math.min(progress, 100)}%`;
  }
  if (sessionStatus) {
    sessionStatus.textContent = sessionState.isRunning
      ? sessionState.isPaused
        ? "Séance en pause"
        : "Séance en cours"
      : "Prêt à démarrer";
  }
  updateTimelineHighlight();
};

const resetSessionTimer = (timeline) => {
  if (sessionState.timerId) {
    window.clearInterval(sessionState.timerId);
  }
  sessionState.timerId = null;
  sessionState.timeline = timeline;
  sessionState.currentIndex = -1;
  sessionState.phaseRemainingSeconds = 0;
  sessionState.totalDurationSeconds = totalDurationSeconds(timeline);
  sessionState.phaseStartMs = null;
  sessionState.isRunning = false;
  sessionState.isPaused = false;
  updateSessionDisplay(sessionState.totalDurationSeconds);
};

const startSessionTimer = () => {
  const timeline = buildTimeline();
  if (!timeline.length) {
    return;
  }
  sessionState.timeline = timeline;
  sessionState.totalDurationSeconds = totalDurationSeconds(timeline);
  sessionState.currentIndex = 0;
  sessionState.phaseRemainingSeconds = timeline[0].durationSeconds;
  sessionState.phaseStartMs = performance.now();
  sessionState.isRunning = true;
  sessionState.isPaused = false;
  sessionPauseButton.textContent = "Pause";
  updateSessionDisplay(sessionState.phaseRemainingSeconds);
  updateSessionControls(true);
  sessionState.timerId = window.setInterval(() => {
    if (!sessionState.isRunning || sessionState.isPaused) {
      return;
    }
    const now = performance.now();
    const elapsedSeconds = (now - sessionState.phaseStartMs) / 1000;
    const remaining = Math.max(
      sessionState.phaseRemainingSeconds - elapsedSeconds,
      0
    );
    if (remaining <= 0) {
      const nextIndex = sessionState.currentIndex + 1;
      if (nextIndex >= sessionState.timeline.length) {
        sessionState.isRunning = false;
        window.clearInterval(sessionState.timerId);
        sessionState.timerId = null;
        sessionState.currentIndex = sessionState.timeline.length - 1;
        updateSessionDisplay(0);
        updateSessionControls(true);
        sessionPauseButton.textContent = "Pause";
        return;
      }
      sessionState.currentIndex = nextIndex;
      sessionState.phaseRemainingSeconds =
        sessionState.timeline[nextIndex].durationSeconds;
      sessionState.phaseStartMs = now;
      updateSessionDisplay(sessionState.phaseRemainingSeconds);
      return;
    }
    updateSessionDisplay(remaining);
  }, 250);
};

const pauseSessionTimer = () => {
  if (!sessionState.isRunning || sessionState.isPaused) {
    return;
  }
  const now = performance.now();
  const elapsedSeconds = (now - sessionState.phaseStartMs) / 1000;
  sessionState.phaseRemainingSeconds = Math.max(
    sessionState.phaseRemainingSeconds - elapsedSeconds,
    0
  );
  sessionState.isPaused = true;
  updateSessionDisplay(sessionState.phaseRemainingSeconds);
  updateSessionControls(true);
};

const resumeSessionTimer = () => {
  if (!sessionState.isRunning || !sessionState.isPaused) {
    return;
  }
  sessionState.phaseStartMs = performance.now();
  sessionState.isPaused = false;
  updateSessionDisplay(sessionState.phaseRemainingSeconds);
  updateSessionControls(true);
};

const updateSessionPreview = (isValid) => {
  if (sessionState.isRunning) {
    updateSessionControls(isValid);
    return;
  }
  const timeline = buildTimeline();
  renderTimeline(timeline);
  resetSessionTimer(timeline);
  updateSessionControls(isValid);
};

const timerState = {
  timerId: null,
  startTime: null,
  lastTick: null,
  driftMs: 0,
  tickCount: 0,
  sumDelta: 0,
};

const timerMetrics = [];

const updateTimerSummary = () => {
  if (!timerSummary) {
    return;
  }
  const averageDelta =
    timerState.tickCount > 0 ? timerState.sumDelta / timerState.tickCount : 0;
  const lastEntry = timerMetrics[timerMetrics.length - 1];
  const lastState =
    lastEntry && (lastEntry.type === "state" || lastEntry.type === "interrupt")
      ? lastEntry.label
      : "Aucun";
  timerSummary.textContent = `Ticks: ${timerState.tickCount} · Delta moyen: ${formatMs(
    averageDelta
  )} · Drift cumulé: ${formatMs(timerState.driftMs)} · Dernier état: ${lastState}`;
};

const setExportEnabled = () => {
  const hasMetrics = timerMetrics.length > 0;
  exportJsonButton.disabled = !hasMetrics;
  exportCsvButton.disabled = !hasMetrics;
};

const appendLogEntry = (entry) => {
  if (!timerLogList) {
    return;
  }
  const item = document.createElement("li");
  item.textContent = entry.message;
  timerLogList.prepend(item);
};

const logMetric = (entry) => {
  timerMetrics.push(entry);
  appendLogEntry(entry);
  updateTimerSummary();
  setExportEnabled();
};

const logStateChange = (state) => {
  const timestamp = Date.now();
  logMetric({
    type: "state",
    timestamp,
    label: state,
    message: `[${formatTimestamp(timestamp)}] État: ${state}`,
  });
};

const logInterrupt = (kind) => {
  const timestamp = Date.now();
  logMetric({
    type: "interrupt",
    timestamp,
    label: kind,
    message: `[${formatTimestamp(timestamp)}] Interruption: ${kind}`,
  });
};

const logTick = (deltaMs, driftMs) => {
  const timestamp = Date.now();
  logMetric({
    type: "tick",
    timestamp,
    deltaMs,
    driftMs,
    message: `[${formatTimestamp(timestamp)}] Tick: Δ ${formatMs(
      deltaMs
    )} · Drift cumulé ${formatMs(driftMs)}`,
  });
};

const startTimer = () => {
  if (timerState.timerId) {
    return;
  }
  timerState.startTime = performance.now();
  timerState.lastTick = timerState.startTime;
  timerState.driftMs = 0;
  timerState.tickCount = 0;
  timerState.sumDelta = 0;
  logStateChange("timer démarré");
  timerState.timerId = window.setInterval(() => {
    const now = performance.now();
    const deltaMs = now - timerState.lastTick;
    timerState.lastTick = now;
    timerState.tickCount += 1;
    timerState.sumDelta += deltaMs;
    timerState.driftMs += deltaMs - TIMER_EXPECTED_INTERVAL_MS;
    logTick(deltaMs, timerState.driftMs);
  }, TIMER_EXPECTED_INTERVAL_MS);
  timerStartButton.disabled = true;
  timerStopButton.disabled = false;
};

const stopTimer = () => {
  if (!timerState.timerId) {
    return;
  }
  window.clearInterval(timerState.timerId);
  timerState.timerId = null;
  logStateChange("timer arrêté");
  timerStartButton.disabled = false;
  timerStopButton.disabled = true;
};

const buildCsv = () => {
  const header = [
    "type",
    "timestamp",
    "iso_time",
    "delta_ms",
    "drift_ms",
    "label",
  ];
  const rows = timerMetrics.map((entry) => [
    entry.type,
    entry.timestamp,
    new Date(entry.timestamp).toISOString(),
    entry.deltaMs ?? "",
    entry.driftMs ?? "",
    entry.label ?? "",
  ]);
  return [header, ...rows].map((row) => row.join(",")).join("\n");
};

const downloadFile = (filename, content, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const exportJson = () => {
  const payload = {
    generatedAt: new Date().toISOString(),
    expectedIntervalMs: TIMER_EXPECTED_INTERVAL_MS,
    metrics: timerMetrics,
  };
  downloadFile(
    "timer-metrics.json",
    JSON.stringify(payload, null, 2),
    "application/json"
  );
};

const exportCsv = () => {
  downloadFile("timer-metrics.csv", buildCsv(), "text/csv");
};

addBlockButton.addEventListener("click", () => {
  createBlock();
  updateTotals();
});

saveButton.addEventListener("click", saveSession);
sessionStartButton.addEventListener("click", () => {
  if (sessionState.isRunning) {
    return;
  }
  startSessionTimer();
});
sessionPauseButton.addEventListener("click", () => {
  if (!sessionState.isRunning) {
    return;
  }
  if (sessionState.isPaused) {
    resumeSessionTimer();
  } else {
    pauseSessionTimer();
  }
  sessionPauseButton.textContent = sessionState.isPaused ? "Reprendre" : "Pause";
});
sessionResetButton.addEventListener("click", () => {
  const timeline = buildTimeline();
  renderTimeline(timeline);
  resetSessionTimer(timeline);
  sessionPauseButton.textContent = "Pause";
});
timerStartButton.addEventListener("click", startTimer);
timerStopButton.addEventListener("click", stopTimer);
exportJsonButton.addEventListener("click", exportJson);
exportCsvButton.addEventListener("click", exportCsv);
interruptButton.addEventListener("click", () => {
  logInterrupt(interruptSelect.value);
});

warmupInput.addEventListener("input", updateTotals);
cooldownInput.addEventListener("input", updateTotals);

document.addEventListener("visibilitychange", () => {
  const state =
    document.visibilityState === "hidden"
      ? "passage en background"
      : "retour en foreground";
  logStateChange(state);
});

createBlock();
createBlock();
updateTotals();
loadLibrary();
updateTimerSummary();
setExportEnabled();

homeCreateButton.addEventListener("click", () => {
  resetSession();
  scrollToSection(warmupSection);
});

homeLoadButton.addEventListener("click", () => {
  loadLibrary();
  scrollToSection(librarySection);
});
