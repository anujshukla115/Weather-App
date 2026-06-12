// ==================== GLOBAL CONFIG ====================
const API_KEY = "1e3e8f230b6064d27976e41163a82b77";

// ==================== CUSTOM WEATHER ICONS ====================
function getWeatherIconUrl(condition) {
    const cond = condition.toLowerCase();

    if (cond.includes("clear")) {
        return "icons/sun.png";
    }

    if (cond.includes("cloud")) {
        return "icons/cloud.png";
    }

    if (cond.includes("rain") || cond.includes("drizzle")) {
        return "icons/rain.png";
    }

    if (cond.includes("snow")) {
        return "icons/snow.png";
    }

    if (cond.includes("thunder")) {
        return "icons/thunderstorm.png";
    }

    if (
        cond.includes("mist") ||
        cond.includes("fog") ||
        cond.includes("haze") ||
        cond.includes("smoke")
    ) {
        return "icons/mist.png";
    }

    if (cond.includes("wind")) {
        return "icons/wind.png";
    }

    return "icons/cloud.png";
}

// ==================== HOME PAGE LOGIC ====================
async function fetchWeatherByCoords(lat, lon) {
    try {
        const geoUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
        const geoResp = await fetch(geoUrl);
        const geoData = await geoResp.json();
        const cityName = geoData[0]?.name || "Unknown";
        document.getElementById("homeCityName").innerText = cityName;
        
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=metric&appid=${API_KEY}`;
        const resp = await fetch(forecastUrl);
        const data = await resp.json();
        if (data.cod !== "200") throw new Error();
        updateHomeUI(data, cityName);
    } catch (e) {
        document.getElementById("homeCityName").innerText = "Weather Unavailable";
        console.error(e);
        fetchWeatherByCity("London");
    }
}

async function fetchWeatherByCity(cityName) {
    try {
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=metric&appid=${API_KEY}`;
        const resp = await fetch(forecastUrl);
        const data = await resp.json();
        if (data.cod !== "200") throw new Error();
        document.getElementById("homeCityName").innerText = data.city.name;
        updateHomeUI(data, data.city.name);
    } catch (e) {
        document.getElementById("homeCityName").innerText = "Error loading";
        console.error(e);
    }
}

function updateHomeUI(data, city) {
    const current = data.list[0];
    document.getElementById("homeTemp").innerText = Math.floor(current.main.temp);
    document.getElementById("homeDesc").innerText = current.weather[0].description;
    document.getElementById("homeHumidity").innerText = current.main.humidity;
    document.getElementById("homeFeels").innerText = Math.floor(current.main.feels_like);
    document.getElementById("homeWind").innerText = current.wind.speed;
    const minT = Math.floor(current.main.temp_min);
    const maxT = Math.floor(current.main.temp_max);
    document.getElementById("homeMinMax").innerText = `${maxT}° / ${minT}°`;
    const condition = current.weather[0].main;
    document.getElementById("homeWeatherIcon").src = getWeatherIconUrl(condition);
    
    const dailyMap = new Map();
    data.list.forEach(item => {
        const dateKey = item.dt_txt.split(' ')[0];
        if (!dailyMap.has(dateKey)) {
            const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const dayIndex = new Date(dateKey).getDay();
            dailyMap.set(dateKey, {
                day: dayNames[dayIndex],
                temp: Math.floor(item.main.temp),
                desc: item.weather[0].description,
                condition: item.weather[0].main.toLowerCase()
            });
        }
    });
    const uniqueForecasts = Array.from(dailyMap.values()).slice(1, 6);
    const forecastContainer = document.getElementById('futureForecastContainer');
    forecastContainer.innerHTML = uniqueForecasts.map(f => `
        <div class="forecast-card">
            <div class="forecast-day">${f.day}</div>
            <img class="forecast-icon" src="${getWeatherIconUrl(f.condition)}" alt="icon">
            <div class="forecast-temp">${f.temp}°</div>
            <div class="forecast-desc">${f.desc.substring(0, 12)}</div>
        </div>
    `).join('');
    
    const today = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    document.getElementById("homeDate").innerText = `${months[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
}

// Initialize home with geolocation
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        async (pos) => { await fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude); },
        () => { fetchWeatherByCity("London"); }
    );
} else {
    fetchWeatherByCity("London");
}

// ==================== SEARCH PAGE LOGIC ====================
async function performSearch(query) {
    if (!query || !query.trim()) {
        alert("Please enter a city name");
        return;
    }
    
    const normalMsg = document.getElementById('searchNormalMsg');
    const errorMsg = document.getElementById('searchErrorMsg');
    const resultBox = document.getElementById('searchResultBox');
    
    normalMsg.style.display = 'none';
    errorMsg.style.display = 'none';
    resultBox.style.display = 'none';
    
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${encodeURIComponent(query.trim())}&appid=${API_KEY}`;
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("City not found");
        
        const data = await res.json();
        
        resultBox.style.display = 'block';
        
        document.getElementById('searchCityName').innerText = data.name;
        document.getElementById('searchTemp').innerText = Math.floor(data.main.temp) + "°";
        document.getElementById('searchWind').innerText = data.wind.speed;
        document.getElementById('searchPressure').innerText = data.main.pressure;
        document.getElementById('searchHumidity').innerText = data.main.humidity;
        
        const sunriseTime = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const sunsetTime = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('searchSunrise').innerText = sunriseTime;
        document.getElementById('searchSunset').innerText = sunsetTime;
        document.getElementById('searchWeatherImg').src = getWeatherIconUrl(data.weather[0].main);
        
        document.getElementById('searchInput').value = '';
        
    } catch (e) {
        console.error("Search error:", e);
        errorMsg.style.display = 'block';
        setTimeout(() => {
            if (errorMsg.style.display === 'block') {
                errorMsg.style.display = 'none';
                normalMsg.style.display = 'block';
            }
        }, 3000);
    }
}

// Search event listeners
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch(searchInput.value);
        }
    });
}

if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        performSearch(searchInput.value);
    });
}

// ==================== WORLD PAGE LOGIC ====================
let worldCities = ["London", "Paris", "New York", "Tokyo", "Sydney"];

async function fetchSingleCityWeather(cityName) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${encodeURIComponent(cityName)}&appid=${API_KEY}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return { name: data.name, temp: Math.floor(data.main.temp), condition: data.weather[0].main };
    } catch { return null; }
}

async function refreshWorldCities() {
    const container = document.getElementById('citiesContainer');
    container.innerHTML = '<div class="loading-spinner">Loading cities...</div>';
    const weatherPromises = worldCities.map(city => fetchSingleCityWeather(city));
    const results = await Promise.all(weatherPromises);
    container.innerHTML = '';
    let hasValid = false;
    
    for (let i = 0; i < results.length; i++) {
        const w = results[i];
        if (w) {
            hasValid = true;
            const card = document.createElement('div');
            card.className = 'world-city-card';
            card.innerHTML = `
                <div class="world-city-info">
                    <div class="city-name-w">${w.name}</div>
                    <div class="world-temp">${w.temp}°</div>
                    <div style="font-size:12px; text-transform:capitalize;">${w.condition}</div>
                    <div class="remove-city-btn" data-city="${w.name}"><i class="fa-regular fa-trash-can"></i> Remove</div>
                </div>
                <img src="${getWeatherIconUrl(w.condition)}" style="width: 50px;">
            `;
            container.appendChild(card);
        }
    }
    
    if (!hasValid) container.innerHTML = '<div class="info-message">Add cities using + button</div>';
    
    document.querySelectorAll('.remove-city-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const cityToRemove = btn.getAttribute('data-city');
            worldCities = worldCities.filter(c => c !== cityToRemove);
            refreshWorldCities();
            saveWorldCities();
        });
    });
}

async function addWorldCity(city) {
    const weatherData = await fetchSingleCityWeather(city);
    if (!weatherData) return false;
    if (!worldCities.includes(weatherData.name)) {
        worldCities.push(weatherData.name);
        saveWorldCities();
        await refreshWorldCities();
        return true;
    }
    return false;
}

function saveWorldCities() {
    localStorage.setItem('nebula_world_cities', JSON.stringify(worldCities));
}

function loadWorldCities() {
    const saved = localStorage.getItem('nebula_world_cities');
    if (saved) {
        try {
            worldCities = JSON.parse(saved);
        } catch(e) {}
    }
}

function updateWorldDate() {
    const d = new Date();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dateSpan = document.getElementById('worldDate');
    if (dateSpan) dateSpan.innerText = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Toggle add panel
const addToggleBtn = document.getElementById('addCityToggleBtn');
const addPanel = document.getElementById('addPanel');
if (addToggleBtn) {
    addToggleBtn.addEventListener('click', () => {
        addPanel.style.display = addPanel.style.display === 'none' ? 'block' : 'none';
    });
}

const worldSearchInput = document.getElementById('worldSearchInput');
const worldMsgNormal = document.getElementById('worldMsgNormal');
const worldMsgError = document.getElementById('worldMsgError');
const worldMsgAdded = document.getElementById('worldMsgAdded');

if (worldSearchInput) {
    worldSearchInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            worldMsgNormal.style.display = 'none';
            worldMsgError.style.display = 'none';
            worldMsgAdded.style.display = 'none';
            const success = await addWorldCity(worldSearchInput.value);
            if (success) {
                worldMsgAdded.style.display = 'block';
                worldSearchInput.value = '';
                setTimeout(() => worldMsgAdded.style.display = 'none', 2000);
            } else {
                worldMsgError.style.display = 'block';
                setTimeout(() => worldMsgError.style.display = 'none', 2000);
            }
        }
    });
}

// ==================== NAVIGATION SYSTEM ====================
const pages = {
    home: document.getElementById('homePage'),
    search: document.getElementById('searchPage'),
    world: document.getElementById('worldPage')
};

function setActivePage(pageId) {
    Object.keys(pages).forEach(id => {
        pages[id].style.display = id === pageId ? 'block' : 'none';
    });
    
    document.querySelectorAll('.nav-item').forEach(link => {
        const linkPage = link.getAttribute('data-page');
        if (linkPage === pageId) link.classList.add('active');
        else link.classList.remove('active');
    });
    
    if (pageId === 'world') {
        refreshWorldCities();
        updateWorldDate();
    }
    
    if (pageId === 'search') {
        document.getElementById('searchResultBox').style.display = 'none';
        document.getElementById('searchNormalMsg').style.display = 'block';
        document.getElementById('searchErrorMsg').style.display = 'none';
        if (searchInput) searchInput.value = '';
    }
}

document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const page = btn.getAttribute('data-page');
        if (page) setActivePage(page);
    });
});

// Initialize
loadWorldCities();
setActivePage('home');
refreshWorldCities();
updateWorldDate();

// Update world date every minute
setInterval(() => {
    if (pages.world.style.display !== 'none') updateWorldDate();
}, 60000);