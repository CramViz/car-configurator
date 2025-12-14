// URL de l'API FastAPI
const API_BASE = "http://127.0.0.1:8000";

// Description des variables (pour garder la correspondance avec le backend)
const VARIABLES = [
  "model",
  "engine",
  "transmission",
  "drivetrain",
  "color",
  "interior",
  "pack",
];

// Labels lisibles (cohérents avec solver.py backend)
const LABELS = {
  model: {
    civic: "Honda Civic",
    golf: "Volkswagen Golf",
    "330i": "BMW 330i",
    x3: "BMW X3",
    mustang: "Ford Mustang",
  },
  engine: {
    petrol_1_5: "Essence 1.5L (130 ch)",
    petrol_2_0: "Essence 2.0L (180 ch)",
    petrol_3_0: "Essence 3.0L (360 ch)",
    diesel_2_0: "Diesel 2.0L (150 ch)",
    hybrid: "Hybride 2.0L",
  },
  transmission: {
    manual: "Manuelle 6 vitesses",
    automatic: "Automatique 8 vitesses",
  },
  drivetrain: {
    fwd: "Traction avant (FWD)",
    rwd: "Propulsion (RWD)",
    awd: "Transmission intégrale (AWD)",
  },
  color: {
    white: "Blanc pur",
    black: "Noir profond",
    silver: "Argent métallisé",
    blue: "Bleu électrique",
    red: "Rouge vif",
    gray: "Gris titane",
  },
  interior: {
    cloth: "Intérieur tissu",
    leather: "Cuir standard",
    premium_leather: "Cuir premium Nappa",
  },
  pack: {
    base: "Pack Base",
    sport: "Pack Sport",
    luxury: "Pack Luxe",
    amg: "Pack AMG Performance",
  },
};

const form = document.getElementById("config-form");
const statusEl = document.getElementById("status");
const solutionEl = document.getElementById("solution");
const solveBtn = document.getElementById("solve-btn");
const resetBtn = document.getElementById("reset-btn");
const carBadge = document.getElementById("car-badge");
const carDetails = document.getElementById("car-details");
const BRANDS = {
  civic: "Civic",
  golf: "Golf",
  "330i": "330i",
  x3: "X3",
  mustang: "Mustang",
};
const PRESETS = {
  urban: {
    model: "civic",
    engine: "petrol_1_5",
    transmission: "manual",
    drivetrain: "fwd",
    color: "silver",
    interior: "cloth",
    pack: "base",
  },
  family: {
    model: "golf",
    engine: "petrol_2_0",
    transmission: "automatic",
    drivetrain: "fwd",
    color: "gray",
    interior: "leather",
    pack: "sport",
  },
  executive: {
    model: "330i",
    engine: "petrol_2_0",
    transmission: "automatic",
    drivetrain: "rwd",
    color: "black",
    interior: "premium_leather",
    pack: "luxury",
  },
  offroad: {
    model: "x3",
    engine: "petrol_2_0",
    transmission: "automatic",
    drivetrain: "awd",
    color: "blue",
    interior: "leather",
    pack: "sport",
  },
  performance: {
    model: "mustang",
    engine: "petrol_3_0",
    transmission: "automatic",
    drivetrain: "rwd",
    color: "red",
    interior: "premium_leather",
    pack: "amg",
  },
};

const ENGINE_SPECS = {
  petrol_1_5: { hp: 130, accel: 10.2, range: 620, price: 0 },
  petrol_2_0: { hp: 180, accel: 8.1, range: 580, price: 3000 },
  petrol_3_0: { hp: 360, accel: 5.1, range: 520, price: 8500 },
  diesel_2_0: { hp: 150, accel: 9.5, range: 750, price: 2200 },
  hybrid: { hp: 160, accel: 8.8, range: 680, price: 4500 },
};

const MODEL_BASE = {
  civic: { price: 28000, hp: 0, accel: 0, range: 0 },
  golf: { price: 32000, hp: 5, accel: -0.2, range: 50 },
  "330i": { price: 52000, hp: 10, accel: -0.3, range: -40 },
  x3: { price: 58000, hp: 15, accel: -0.4, range: -100 },
  mustang: { price: 65000, hp: 50, accel: -1.0, range: -120 },
};

const PACK_EFFECT = {
  base: { price: 0, hp: 0, accel: 0, range: 0 },
  sport: { price: 2500, hp: 10, accel: -0.3, range: -20 },
  luxury: { price: 4500, hp: 0, accel: 0, range: -10 },
  amg: { price: 6000, hp: 30, accel: -0.6, range: -40 },
};

const DRIVE_EFFECT = {
  fwd: { price: 0, range: 0, accel: 0 },
  rwd: { price: 1200, range: -15, accel: -0.1 },
  awd: { price: 2500, range: -50, accel: 0.2 },
};

// Initialise les selects avec des options vides (remplies après premier /propagate)
function initSelects() {
  VARIABLES.forEach((v) => {
    const select = document.getElementById(v);
    select.innerHTML = "";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "-- (non spécifié) --";
    select.appendChild(opt);
  });
}

// Récupère les affectations courantes du formulaire
function getAssignments() {
  const data = {};
  VARIABLES.forEach((v) => {
    const value = document.getElementById(v).value;
    data[v] = value === "" ? null : value;
  });
  return data;
}

function pickColor(assignments) {
  const colorChoice = assignments.color;
  const colorMap = {
    white: "#f5f5f5",
    black: "#1a1a1a",
    silver: "#c0c0c0",
    blue: "#0066cc",
    red: "#dc143c",
    gray: "#808080",
  };
  return colorChoice && colorMap[colorChoice] ? colorMap[colorChoice] : "#38bdf8";
}

function pickAccent(assignments) {
  if (assignments.pack === "amg") return "#ff0000";
  if (assignments.pack === "luxury") return "#fbbf24";
  if (assignments.pack === "sport") return "#ef4444";
  if (assignments.model === "mustang") return "#ff0000";
  if (assignments.model === "330i" || assignments.model === "x3") return "#0066cc";
  return "#38bdf8";
}

function rideSettings(assignments) {
  let ride = "0px";
  let wheel = "52px";
  let offset = "58px";

  if (assignments.model === "mustang" || assignments.pack === "sport") {
    ride = "6px";
    wheel = "50px";
    offset = "56px";
  }
  if (assignments.model === "x3" || assignments.drivetrain === "awd") {
    ride = "-2px";
    wheel = "54px";
    offset = "60px";
  }
  return { ride, wheel, offset };
}

function computeSpecs(assignments) {
  const engine = ENGINE_SPECS[assignments.engine];
  const model = MODEL_BASE[assignments.model];
  const pack = PACK_EFFECT[assignments.pack || "none"];
  const drive = DRIVE_EFFECT[assignments.drivetrain || "fwd"];

  if (!engine || !model) {
    return { hp: null, accel: null, range: null, price: null };
  }

  let hp = engine.hp + model.hp + pack.hp;
  let accel = engine.accel + model.accel + pack.accel + drive.accel;
  let range = engine.range + model.range + pack.range + drive.range;
  let price = model.price + engine.price + pack.price + drive.price;

  return { hp: Math.round(hp), accel: Math.max(accel, 3.5), range: Math.round(range), price };
}

function fmt(value, suffix) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${value}${suffix}`;
}

function fmtPrice(value) {
  if (!value) return "—";
  return `€${(value / 1000).toFixed(1)}k`;
}

function updateSpecs(assignments) {
  const { hp, accel, range, price } = computeSpecs(assignments);
  document.getElementById("spec-power").textContent = fmt(hp, " ch");
  document.getElementById("spec-accel").textContent = fmt(accel ? accel.toFixed(1) : null, " s");
  document.getElementById("spec-range").textContent = fmt(range, " km");
  document.getElementById("spec-price").textContent = fmtPrice(price);
}

function labelFor(varName, value) {
  const varLabels = LABELS[varName];
  if (!varLabels) return value || "";
  return varLabels[value] || value || "";
}

function updateCarPreview(assignments) {
  const preview = document.querySelector(".car-preview");
  if (!preview) return;
  const bodyColor = pickColor(assignments);
  const accentColor = pickAccent(assignments);
  const { ride, wheel, offset } = rideSettings(assignments);
  preview.style.setProperty("--car-color", bodyColor);
  preview.style.setProperty("--car-accent", accentColor);
  preview.style.setProperty("--car-ride", ride);
  preview.style.setProperty("--car-wheel", wheel);
  preview.style.setProperty("--car-wheel-offset", offset);

  const texts = [];
  if (assignments.model) texts.push(labelFor("model", assignments.model));
  if (assignments.engine) texts.push(labelFor("engine", assignments.engine));
  if (assignments.transmission) texts.push(labelFor("transmission", assignments.transmission));
  if (assignments.drivetrain) texts.push(labelFor("drivetrain", assignments.drivetrain));
  if (assignments.pack) texts.push(labelFor("pack", assignments.pack));

  carBadge.textContent = texts.length ? texts.join(" • ") : "Sélectionnez des options";

  const detailParts = [];
  if (assignments.model) detailParts.push(BRANDS[assignments.model] || assignments.model);
  if (assignments.color) detailParts.push(`Couleur ${labelFor("color", assignments.color)}`);
  if (assignments.interior) detailParts.push(`Intérieur ${labelFor("interior", assignments.interior)}`);
  if (assignments.pack) detailParts.push(`Pack ${labelFor("pack", assignments.pack)}`);

  carDetails.textContent =
    detailParts.length > 0
      ? detailParts.join(" • ")
      : "Le visuel s'adapte à vos choix (couleur, modèle, moteur, pack).";

  updateSpecs(assignments);
}

// Met à jour les options des selects en fonction des domaines renvoyés
function updateSelects(domains, valid, assignments = {}) {
  VARIABLES.forEach((v) => {
    const select = document.getElementById(v);
    const previousValue = select.value || "";
    const allowed = new Set(domains[v] || []);
    const currentAssignment = assignments[v] ?? "";

    // Nettoyer et reconstruire le select
    select.innerHTML = "";

    // option vide
    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "-- (non spécifié) --";
    select.appendChild(emptyOpt);

    const labels = LABELS[v];
    if (!labels) return;

    Object.entries(labels).forEach(([value, label]) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;

      if (!allowed.has(value)) {
        opt.disabled = true;
        opt.classList.add("disabled-option");
      }

      select.appendChild(opt);
    });

    // Remettre la valeur de l'utilisateur si présente, sinon conserver l'ancienne valide
    if (currentAssignment && allowed.has(currentAssignment)) {
      select.value = currentAssignment;
    } else if (previousValue && allowed.has(previousValue)) {
      select.value = previousValue;
    } else {
      select.value = "";
    }
  });

  if (!valid) {
    statusEl.textContent =
      "⚠️ Les choix actuels sont incompatibles (aucune configuration possible).";
    statusEl.className = "status error";
  } else {
    statusEl.textContent =
      "✔️ Configuration partielle compatible. Choisissez d'autres options ou cliquez sur 'Trouver une configuration complète'.";
    statusEl.className = "status ok";
  }

  updateCarPreview(assignments);
}

// Appel API /propagate
async function propagate() {
  const assignments = getAssignments();

  // Toute modification annule la solution précédente
  solutionEl.textContent = "";

  try {
    const res = await fetch(`${API_BASE}/propagate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignments }),
    });

    if (!res.ok) {
      statusEl.textContent = "Erreur lors de la propagation";
      statusEl.className = "status error";
      return;
    }

    const data = await res.json();
    updateSelects(data.domains, data.valid, assignments);
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Impossible de contacter l'API (backend lancé ?)";
    statusEl.className = "status error";
  }
}

// Appel API /solve
async function solve() {
  const assignments = getAssignments();

  try {
    const res = await fetch(`${API_BASE}/solve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignments }),
    });

    if (!res.ok) {
      solutionEl.textContent = "Erreur lors de la résolution.";
      return;
    }

    const data = await res.json();
    if (data.status === "INFEASIBLE" || !data.configuration) {
      solutionEl.textContent =
        "Aucune configuration complète n'est possible avec ces choix.";
      return;
    }

    // Affichage lisible
    const config = data.configuration;
    const lines = ["Configuration trouvée :"];
    VARIABLES.forEach((v) => {
      const value = config[v];
      const label =
        LABELS[v] && LABELS[v][value]
          ? LABELS[v][value]
          : value;
      lines.push(`- ${v} : ${label} (${value})`);
    });

    solutionEl.textContent = lines.join("\n");
  } catch (err) {
    console.error(err);
    solutionEl.textContent =
      "Erreur de communication avec l'API (vérifiez que le backend tourne).";
  }
}

function resetForm() {
  VARIABLES.forEach((v) => {
    const select = document.getElementById(v);
    if (select) select.value = "";
  });
  solutionEl.textContent = "";
  statusEl.textContent = "Sélectionnez des options pour démarrer.";
  statusEl.className = "status";
  updateCarPreview({});
  propagate();
}

function applyPreset(name) {
  const preset = PRESETS[name];
  if (!preset) return;
  VARIABLES.forEach((v) => {
    const select = document.getElementById(v);
    if (!select) return;
    select.value = preset[v] ?? "";
  });
  solutionEl.textContent = "";
  statusEl.textContent = "Preset appliqué, vérification des contraintes...";
  statusEl.className = "status ok";
  propagate();
}

// Écouteurs
VARIABLES.forEach((v) => {
  document.getElementById(v).addEventListener("change", propagate);
});

solveBtn.addEventListener("click", solve);
resetBtn.addEventListener("click", resetForm);
document.querySelectorAll(".preset-card").forEach((el) => {
  el.addEventListener("click", () => applyPreset(el.dataset.preset));
});

// Initialisation
initSelects();
propagate();
