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

const STORAGE_KEY = "tabataSessions";
const TIMER_EXPECTED_INTERVAL_MS = 1000;

const toNumber = (value) => Number.parseFloat(value || 0);

const formatDuration = (minutes) => `${minutes.toFixed(1)} min`;
const formatTimestamp = (timestamp) =>
  new Date(timestamp).toLocaleTimeString("fr-FR", { hour12: false });
const formatMs = (value) => `${value.toFixed(1)} ms`;

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
