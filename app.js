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

const STORAGE_KEY = "tabataSessions";

const toNumber = (value) => Number.parseFloat(value || 0);

const formatDuration = (minutes) => `${minutes.toFixed(1)} min`;

const createBlock = () => {
  const fragment = blockTemplate.content.cloneNode(true);
  const block = fragment.querySelector(".block-card");
  const removeButton = fragment.querySelector("[data-action='remove']");

  const inputs = block.querySelectorAll("input, select");
  inputs.forEach((input) => {
    input.addEventListener("input", updateTotals);
  });

  removeButton.addEventListener("click", () => {
    block.remove();
    updateTotals();
  });

  blocksContainer.appendChild(fragment);
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

const loadLibrary = () => {
  const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  libraryList.innerHTML = "";

  if (!sessions.length) {
    libraryList.innerHTML = "<p class=\"muted\">Aucune séance enregistrée.</p>";
    return;
  }

  sessions.forEach((session) => {
    const card = document.createElement("div");
    card.className = "library-card";
    card.innerHTML = `
      <h4>${session.name}</h4>
      <p>${session.total} min · ${session.blocks} blocs</p>
      <p>Échauffement ${session.warmup} min · Récupération ${session.cooldown} min</p>
    `;
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
  const sessions = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  sessions.unshift({
    name,
    total,
    blocks: blocks.length,
    warmup: toNumber(warmupInput.value),
    cooldown: toNumber(cooldownInput.value),
    createdAt: new Date().toISOString(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 8)));
  sessionNameInput.value = "";
  loadLibrary();
};

addBlockButton.addEventListener("click", () => {
  createBlock();
  updateTotals();
});

saveButton.addEventListener("click", saveSession);

warmupInput.addEventListener("input", updateTotals);
cooldownInput.addEventListener("input", updateTotals);

createBlock();
createBlock();
updateTotals();
loadLibrary();
