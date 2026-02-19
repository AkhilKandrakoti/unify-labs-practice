const els = {
  liveDot: document.getElementById("liveDot"),
  liveText: document.getElementById("liveText"),

  searchForm: document.getElementById("searchForm"),
  cityInput: document.getElementById("cityInput"),
  btnUseMyLocation: document.getElementById("btnUseMyLocation"),
  btnRefresh: document.getElementById("btnRefresh"),
  autoRefreshToggle: document.getElementById("autoRefreshToggle"),

  loadingOverlay: document.getElementById("loadingOverlay"),
  errorBox: document.getElementById("errorBox"),
  errorText: document.getElementById("errorText"),

  weatherPanel: document.getElementById("weatherPanel"),
  placeTitle: document.getElementById("placeTitle"),
  placeMeta: document.getElementById("placeMeta"),

  tempValue: document.getElementById("tempValue"),
  humidityValue: document.getElementById("humidityValue"),
  windValue: document.getElementById("windValue"),
  feelsValue: document.getElementById("feelsValue"),
  codeValue: document.getElementById("codeValue"),
  weatherDesc: document.getElementById("weatherDesc"),
  weatherIcon: document.getElementById("weatherIcon"),
  updatedAt: document.getElementById("updatedAt"),
};

let currentLocation = null; // { name, country, lat, lon, timezone }
let refreshTimerId = null;

// ---------- UI Helpers ----------
function setStatus(type, text) {
  els.liveDot.classList.remove("live", "err");
  if (type === "live") els.liveDot.classList.add("live");
  if (type === "err") els.liveDot.classList.add("err");
  els.liveText.textContent = text;
}

function showLoading(show) {
  els.loadingOverlay.classList.toggle("hidden", !show);
}

function showError(message) {
  els.errorText.textContent = message;
  els.errorBox.classList.remove("hidden");
  setStatus("err", "Error");
}

function clearError() {
  els.errorBox.classList.add("hidden");
  els.errorText.textContent = "";
}

function showWeatherPanel(show) {
  els.weatherPanel.classList.toggle("hidden", !show);
}

function fmtTime(isoString, timezone) {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone || undefined,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    }).format(date);
  } catch {
    return isoString;
  }
}

// ---------- API Utilities ----------
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`);
  return res.json();
}

async function geocodeCity(city) {
  const q = encodeURIComponent(city.trim());
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=5&language=en&format=json`;
  const data = await fetchJson(url);

  if (!data.results || data.results.length === 0) {
    throw new Error(`No results found for "${city}". Try "Hyderabad" or "Mumbai".`);
  }

  const best = data.results[0];
  return {
    name: best.name,
    country: best.country,
    admin1: best.admin1 || "",
    lat: best.latitude,
    lon: best.longitude,
    timezone: best.timezone || "auto",
  };
}

async function getCurrentWeather(lat, lon, timezone = "auto") {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code` +
    `&timezone=${encodeURIComponent(timezone)}`;

  const data = await fetchJson(url);
  if (!data.current) throw new Error("Weather data missing in API response.");

  return {
    time: data.current.time,
    tempC: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    feelsC: data.current.apparent_temperature,
    windKmh: data.current.wind_speed_10m,
    code: data.current.weather_code,
    timezone: data.timezone || timezone,
  };
}

// ---------- Code -> Condition ----------
function codeToCondition(code) {
  if (code === 0) return { text: "Clear sky", icon: "☀️" };
  if ([1,2,3].includes(code)) return { text: "Partly cloudy", icon: "⛅" };
  if ([45,48].includes(code)) return { text: "Foggy", icon: "🌫️" };
  if ([51,53,55].includes(code)) return { text: "Drizzle", icon: "🌦️" };
  if ([61,63,65].includes(code)) return { text: "Rain", icon: "🌧️" };
  if ([71,73,75,77].includes(code)) return { text: "Snow", icon: "❄️" };
  if ([80,81,82].includes(code)) return { text: "Rain showers", icon: "🌦️" };
  if ([95,96,99].includes(code)) return { text: "Thunderstorm", icon: "⛈️" };
  return { text: "Conditions", icon: "🌡️" };
}

// ---------- DOM Update ----------
function renderLocation(loc) {
  const title = `${loc.name}${loc.admin1 ? ", " + loc.admin1 : ""}`;
  const meta = `${loc.country} • Lat ${loc.lat.toFixed(2)}, Lon ${loc.lon.toFixed(2)}`;

  els.placeTitle.textContent = title;
  els.placeMeta.textContent = meta;

  // ✅ fill mini header inside weather panel (if present)
  const miniTitle = document.getElementById("placeTitleMini");
  const miniMeta = document.getElementById("placeMetaMini");
  if (miniTitle) miniTitle.textContent = title;
  if (miniMeta) miniMeta.textContent = meta;
}

function renderWeather(w) { 
  const cond = codeToCondition(w.code);

  els.tempValue.textContent = Math.round(w.tempC);
  els.humidityValue.textContent = Math.round(w.humidity);
  els.windValue.textContent = Math.round(w.windKmh);
  els.feelsValue.textContent = Math.round(w.feelsC);
  els.codeValue.textContent = String(w.code);

  els.weatherDesc.textContent = cond.text;
  els.weatherIcon.textContent = cond.icon;

  els.updatedAt.textContent = `Last updated: ${fmtTime(w.time, w.timezone)} (${w.timezone})`;

  showWeatherPanel(true);
  setStatus("live", "Live");
  
}

// ---------- Main Load Flow ----------
async function loadWeatherForLocation(loc, reason = "update") {
  currentLocation = loc;

  clearError();
  renderLocation(loc);

  showLoading(true);
  setStatus("live", reason === "auto" ? "Auto-refreshing…" : "Fetching…");

  try {
    const weather = await getCurrentWeather(loc.lat, loc.lon, loc.timezone);
    renderWeather(weather);
  } catch (err) {
    showWeatherPanel(false);
    showError(err.message || "Unknown error while fetching weather.");
  } finally {
    showLoading(false);
  }
}

// ---------- Auto refresh ----------
function startAutoRefresh() {
  stopAutoRefresh();
  refreshTimerId = setInterval(() => {
    if (els.autoRefreshToggle.checked && currentLocation) {
      loadWeatherForLocation(currentLocation, "auto");
    }
  }, 60_000);
}

function stopAutoRefresh() {
  if (refreshTimerId) clearInterval(refreshTimerId);
  refreshTimerId = null;
}

// ---------- Geolocation ----------
function getBrowserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported in this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      (err) => reject(new Error(err.message || "Location permission denied.")),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

async function useMyLocation() {
  clearError();
  showLoading(true);
  setStatus("live", "Getting location…");

  try {
    const pos = await getBrowserPosition();
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;

    const loc = {
      name: "My Location",
      country: "—",
      admin1: "",
      lat,
      lon,
      timezone: "auto",
    };

    await loadWeatherForLocation(loc, "update");
  } catch (err) {
    showError(err.message || "Failed to get your location.");
  } finally {
    showLoading(false);
  }
}

// ---------- Events ----------
els.searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const city = els.cityInput.value;

  clearError();
  showLoading(true);
  setStatus("live", "Searching…");

  try {
    const loc = await geocodeCity(city);
    await loadWeatherForLocation(loc, "update");
  } catch (err) {
    showWeatherPanel(false);
    showError(err.message || "Failed to search city.");
  } finally {
    showLoading(false);
  }
});

els.btnRefresh.addEventListener("click", () => {
  if (!currentLocation) {
    showError("Search a city (or use your location) first, then refresh.");
    return;
  }
  loadWeatherForLocation(currentLocation, "update");
});

els.btnUseMyLocation.addEventListener("click", useMyLocation);

els.autoRefreshToggle.addEventListener("change", () => {
  if (els.autoRefreshToggle.checked) {
    setStatus("live", "Auto-refresh ON");
    startAutoRefresh();
    if (currentLocation) loadWeatherForLocation(currentLocation, "auto");
  } else {
    setStatus("live", "Auto-refresh OFF");
    stopAutoRefresh();
  }
});

// ---------- Boot ----------
(function boot() {
  setStatus("live", "Ready");
  showWeatherPanel(false);
  clearError();
  startAutoRefresh();

  // preload default for a professional first view
  const defaultCity = "Hyderabad";
  els.cityInput.value = defaultCity;

  geocodeCity(defaultCity)
    .then((loc) => loadWeatherForLocation(loc, "update"))
    .catch(() => setStatus("err", "Offline?"));
})();

function showLeftFillArea() {
  const area = document.getElementById("leftFillArea");
  if (area) area.classList.remove("hidden");
}