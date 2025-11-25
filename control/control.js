const categoryButtons = document.querySelectorAll(".category");
const panels = document.querySelectorAll("[data-category-panel]");
const statePill = document.querySelector("#system-state");
const log = document.querySelector("#event-log");
const configOutput = document.querySelector("#config-output");
const lastUpdate = document.querySelector("#last-update");
const resetBtn = document.querySelector("#reset-config");
const copyBtn = document.querySelector("#copiar-config");
const linkBtn = document.querySelector("#link-json");
const panelTitle = document.querySelector("#panel-title");
const brightnessLabel = document.querySelector("#brightness-value");
const chromaLabel = document.querySelector("#chroma-value");
const camaraZoomLabel = document.querySelector("#camara-zoom-value");
const camaraBrilloLabel = document.querySelector("#camara-brillo-value");
const camaraContrasteLabel = document.querySelector("#camara-contraste-value");
const camaraTransparenciaLabel = document.querySelector("#camara-transparencia-value");
const chatOpacidadLabel = document.querySelector("#chat-opacidad-value");
const chatFondoHueLabel = document.querySelector("#chat-fondoHue-value");
const chatFondoTransparenciaLabel = document.querySelector("#chat-fondoTransparencia-value");
const contadoresList = document.querySelector("#contadores-list");
const addContadorBtn = document.querySelector("#add-contador");
const fileStatus = document.querySelector("#file-status");
const linkStatus = document.querySelector("#link-status");

const CONFIG_FILE = "cnfg.json";

const baseConfig = {
  layout: { mode: "grid" },
  pantalla: { estado: "activo", brillo: 80, chroma: 50 },
  camara: { zoom: 1, brillo: 50, contraste: 50, transparencia: 100 },
  chat: { visible: true, opacidad: 100, fondoHue: 0, fondoTransparencia: 80 },
  contadores: [{ nombre: "Contador 1", valor: 0 }],
  escenas: { activa: "intro" },
};

let config = structuredClone(baseConfig);
let activeCategory = "layout";
let fileHandle = null;

const formatTime = (date = new Date()) =>
  date
    .toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(",", "");

const updateFileStatus = (message) => {
  if (fileStatus) fileStatus.textContent = message;
};

const updateLinkStatus = (isLinked, fileName = "") => {
  if (linkStatus) {
    if (isLinked) {
      linkStatus.textContent = `✓ Vinculado${fileName ? `: ${fileName}` : ""}`;
      linkStatus.parentElement.classList.add("is-linked");
    } else {
      linkStatus.textContent = "Vincular cnfg.json";
      linkStatus.parentElement.classList.remove("is-linked");
    }
  }
};

const pushLog = (message) => {
  const li = document.createElement("li");
  li.innerHTML = `<strong>${formatTime()}</strong><span>${message}</span>`;
  log.prepend(li);
  log.scrollTo({ top: 0 });
};

const deepMerge = (target, source) => {
  Object.keys(source).forEach((key) => {
    if (
      typeof source[key] === "object" &&
      source[key] !== null &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  });
  return target;
};

const renderConfig = () => {
  if (configOutput) {
    configOutput.textContent = JSON.stringify(config, null, 2);
  }
};

const parseValue = (value) => {
  if (value === "true" || value === "false") return value === "true";
  const number = Number(value);
  return Number.isNaN(number) ? value : number;
};

const setNestedValue = (path, value) => {
  const keys = path.split(".");
  let current = config;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
    } else {
      current[key] = current[key] ?? {};
      current = current[key];
    }
  });
};

const markSelectedButtons = (path, value) => {
  document.querySelectorAll(`[data-setting="${path}"]`).forEach((el) => {
    if (el.tagName.toLowerCase() === "input") return;
    el.classList.toggle("is-selected", parseValue(el.dataset.value) === value);
  });
};

const triggerDownload = (payload) => {
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = CONFIG_FILE;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  updateFileStatus("Descarga generada. Vincula cnfg.json para guardar automáticamente.");
};

const requestFileHandle = async () => {
  if (!window.showOpenFilePicker) return null;
  try {
    const [handle] = await window.showOpenFilePicker({
      multiple: false,
      types: [
        {
          description: "Archivo de configuración",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    return handle;
  } catch (error) {
    return null;
  }
};

const saveConfigToFile = async () => {
  const payload = JSON.stringify(config, null, 2);

  if (!fileHandle && window.showOpenFilePicker) {
    fileHandle = await requestFileHandle();
    if (fileHandle) {
      updateFileStatus(`cnfg.json vinculado (${fileHandle.name})`);
      updateLinkStatus(true, fileHandle.name);
    }
  }

  if (fileHandle?.createWritable) {
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(payload);
      await writable.close();
      updateFileStatus(`cnfg.json sincronizado (${formatTime()})`);
      return true;
    } catch (error) {
      console.error("Error al escribir:", error);
      fileHandle = null;
      updateLinkStatus(false);
    }
  }

  triggerDownload(payload);
  return false;
};

const registerChange = async (message) => {
  if (lastUpdate) lastUpdate.textContent = formatTime();
  if (statePill) statePill.textContent = "Enviado";
  renderConfig();
  await saveConfigToFile();
  if (log) pushLog(message);
};

const handleSettingChange = async (path, rawValue, label) => {
  const value = parseValue(rawValue);
  setNestedValue(path, value);
  markSelectedButtons(path, value);
  
  // Actualizar labels de sliders
  if (path === "pantalla.brillo" && typeof value === "number") {
    brightnessLabel.textContent = `${value}%`;
  } else if (path === "pantalla.chroma" && typeof value === "number") {
    chromaLabel.textContent = `${value}%`;
  } else if (path === "camara.zoom" && typeof value === "number") {
    camaraZoomLabel.textContent = `${value.toFixed(1)}x`;
  } else if (path === "camara.brillo" && typeof value === "number") {
    camaraBrilloLabel.textContent = `${value}%`;
  } else if (path === "camara.contraste" && typeof value === "number") {
    camaraContrasteLabel.textContent = `${value}%`;
  } else if (path === "camara.transparencia" && typeof value === "number") {
    camaraTransparenciaLabel.textContent = `${value}%`;
  } else if (path === "chat.opacidad" && typeof value === "number") {
    chatOpacidadLabel.textContent = `${value}%`;
  } else if (path === "chat.fondoHue" && typeof value === "number") {
    chatFondoHueLabel.textContent = `${value}°`;
  } else if (path === "chat.fondoTransparencia" && typeof value === "number") {
    chatFondoTransparenciaLabel.textContent = `${value}%`;
  }
  
  await registerChange(`${label} → ${String(value)}`);
};

const switchCategory = (category) => {
  activeCategory = category;
  categoryButtons.forEach((button) =>
    button.classList.toggle("is-active", button.dataset.category === category)
  );
  panels.forEach((panel) =>
    panel.classList.toggle(
      "is-hidden",
      panel.dataset.categoryPanel !== category
    )
  );
  panelTitle.textContent =
    category === "escenas"
      ? "Escenas especiales"
      : category.charAt(0).toUpperCase() + category.slice(1);
};

const syncControlsWithConfig = () => {
  document
    .querySelectorAll(".state-pill")
    .forEach((pill) => pill.classList.remove("is-selected"));

  Object.entries(config).forEach(([section, values]) => {
    if (section === "contadores" && Array.isArray(values)) {
      renderContadores();
      return;
    }
    if (typeof values === "object" && values !== null) {
      Object.entries(values).forEach(([key, value]) => {
        const path = `${section}.${key}`;
        markSelectedButtons(path, value);
        const slider = document.querySelector(`[data-setting="${path}"]`);
        if (slider) {
          slider.value = value;
          // Actualizar labels
          if (path === "pantalla.brillo") {
            brightnessLabel.textContent = `${value}%`;
          } else if (path === "pantalla.chroma") {
            chromaLabel.textContent = `${value}%`;
          } else if (path === "camara.zoom") {
            camaraZoomLabel.textContent = `${value.toFixed(1)}x`;
          } else if (path === "camara.brillo") {
            camaraBrilloLabel.textContent = `${value}%`;
          } else if (path === "camara.contraste") {
            camaraContrasteLabel.textContent = `${value}%`;
          } else if (path === "camara.transparencia") {
            camaraTransparenciaLabel.textContent = `${value}%`;
          } else if (path === "chat.opacidad") {
            chatOpacidadLabel.textContent = `${value}%`;
          } else if (path === "chat.fondoHue") {
            chatFondoHueLabel.textContent = `${value}°`;
          } else if (path === "chat.fondoTransparencia") {
            chatFondoTransparenciaLabel.textContent = `${value}%`;
          }
        }
      });
    }
  });
};

const renderContadores = () => {
  if (!contadoresList) return;
  contadoresList.innerHTML = "";
  
  if (!Array.isArray(config.contadores)) {
    config.contadores = structuredClone(baseConfig.contadores);
  }
  
  config.contadores.forEach((contador, index) => {
    const item = document.createElement("div");
    item.className = "contador-item";
    item.innerHTML = `
      <div class="contador-controls">
        <input type="text" class="contador-nombre" data-index="${index}" value="${contador.nombre || `Contador ${index + 1}`}" placeholder="Nombre" />
        <div class="contador-valor-controls">
          <button class="contador-btn" data-index="${index}" data-action="decrement">-</button>
          <input type="number" class="contador-valor" data-index="${index}" value="${contador.valor || 0}" />
          <button class="contador-btn" data-index="${index}" data-action="increment">+</button>
        </div>
        <button class="contador-remove" data-index="${index}">×</button>
      </div>
    `;
    contadoresList.appendChild(item);
  });
  
  // Event listeners para contadores
  contadoresList.querySelectorAll(".contador-nombre").forEach((input) => {
    input.addEventListener("input", (e) => {
      const index = parseInt(e.target.dataset.index);
      config.contadores[index].nombre = e.target.value || `Contador ${index + 1}`;
      registerChange(`Contador ${index + 1} nombre actualizado`);
    });
  });
  
  contadoresList.querySelectorAll(".contador-valor").forEach((input) => {
    input.addEventListener("input", (e) => {
      const index = parseInt(e.target.dataset.index);
      const value = parseInt(e.target.value) || 0;
      config.contadores[index].valor = value;
      registerChange(`Contador ${index + 1} valor → ${value}`);
    });
  });
  
  contadoresList.querySelectorAll(".contador-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      const action = e.target.dataset.action;
      const input = contadoresList.querySelector(`.contador-valor[data-index="${index}"]`);
      let value = parseInt(input.value) || 0;
      
      if (action === "increment") {
        value++;
      } else if (action === "decrement") {
        value--;
      }
      
      input.value = value;
      config.contadores[index].valor = value;
      registerChange(`Contador ${index + 1} → ${value}`);
    });
  });
  
  contadoresList.querySelectorAll(".contador-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      if (config.contadores.length > 1) {
        config.contadores.splice(index, 1);
        renderContadores();
        registerChange(`Contador ${index + 1} eliminado`);
      }
    });
  });
};

const loadConfigFromDisk = async () => {
  try {
    const response = await fetch(`./${CONFIG_FILE}?t=${Date.now()}`);
    if (!response.ok) throw new Error("No se pudo leer cnfg.json");
    const fileConfig = await response.json();
    config = deepMerge(structuredClone(baseConfig), fileConfig);
    // Asegurar que contadores es un array
    if (!Array.isArray(config.contadores)) {
      config.contadores = structuredClone(baseConfig.contadores);
    }
    pushLog("cnfg.json cargado.");
  } catch (error) {
    console.warn(error);
    config = structuredClone(baseConfig);
    pushLog("No se pudo cargar cnfg.json. Usando valores base.");
  } finally {
    renderConfig();
    syncControlsWithConfig();
  }
};

categoryButtons.forEach((button) =>
  button.addEventListener("click", () =>
    switchCategory(button.dataset.category)
  )
);

document.querySelectorAll("[data-setting]").forEach((control) => {
  const path = control.dataset.setting;
  const label =
    control.closest(".control-card")?.querySelector("h3")?.textContent ?? path;

  if (control.tagName.toLowerCase() === "input") {
    control.addEventListener("input", (event) => {
      handleSettingChange(path, event.target.value, `${label} (slider)`).catch(
        (error) => console.error(error)
      );
    });
  } else {
    control.addEventListener("click", () => {
      handleSettingChange(
        path,
        control.dataset.value,
        control.textContent.trim()
      ).catch((error) => console.error(error));
    });
  }
});

resetBtn?.addEventListener("click", async () => {
  config = structuredClone(baseConfig);
  syncControlsWithConfig();
  await registerChange("Configuración restaurada a la base");
  statePill.textContent = "Operativo";
});

copyBtn?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    pushLog("JSON copiado al portapapeles");
  } catch (error) {
    pushLog("No se pudo copiar el JSON");
    console.error(error);
  }
});

linkBtn?.addEventListener("click", async () => {
  if (!window.showOpenFilePicker) {
    pushLog("⚠️ Este navegador no soporta escritura directa. Se generará descarga automática.");
    updateLinkStatus(false);
    await saveConfigToFile();
    return;
  }

  try {
    fileHandle = await requestFileHandle();
    if (fileHandle) {
      updateLinkStatus(true, fileHandle.name);
      updateFileStatus(`✓ Archivo vinculado: ${fileHandle.name}`);
      await saveConfigToFile();
      pushLog(`✓ cnfg.json vinculado: ${fileHandle.name}`);
    } else {
      updateFileStatus("Vinculación cancelada.");
      pushLog("Vinculación cancelada por el usuario.");
    }
  } catch (error) {
    console.error("Error al vincular archivo:", error);
    updateFileStatus("Error al vincular archivo.");
    pushLog("Error al vincular archivo.");
  }
});

addContadorBtn?.addEventListener("click", () => {
  if (!Array.isArray(config.contadores)) {
    config.contadores = structuredClone(baseConfig.contadores);
  }
  const nuevoIndex = config.contadores.length;
  config.contadores.push({
    nombre: `Contador ${nuevoIndex + 1}`,
    valor: 0,
  });
  renderContadores();
  registerChange(`Nuevo contador agregado`);
});

const init = async () => {
  switchCategory(activeCategory);
  await loadConfigFromDisk();
  renderContadores();
  pushLog("Panel listo. Configuración cargada.");
};

init();

