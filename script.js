// DOM elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const weatherCard = document.getElementById('weatherCard');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');

// Weather data elements
const locationName = document.getElementById('locationName');
const currentDate = document.getElementById('currentDate');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weatherDescription');
const weatherIcon = document.getElementById('weatherIcon');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const pressure = document.getElementById('pressure');
const forecast = document.getElementById('forecast');

// API URLs
const geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search';
const weatherUrl = 'https://api.open-meteo.com/v1/forecast';

// Event listeners
searchButton.addEventListener('click', searchWeather);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

// Functions
function searchWeather() {
    const city = searchInput.value.trim();
    if (!city) return;

    showLoading();
    hideError();

    // First get coordinates for the city
    fetch(`${geocodingUrl}?name=${city}&count=1`)
        .then(response => {
            if (!response.ok) {
                throw new Error('City not found');
            }
            return response.json();
        })
        .then(data => {
            if (!data.results || data.results.length === 0) {
                throw new Error('City not found');
            }

            const location = data.results[0];
            const { latitude, longitude, name, country } = location;

            // Get weather data using coordinates
            return getWeatherData(latitude, longitude, name, country);
        })
        .then(data => {
            displayWeatherData(data);
            hideLoading();
            weatherCard.classList.add('active');
        })
        .catch(error => {
            hideLoading();
            showError();
            console.error('Error fetching weather data:', error);
        });
}

function getWeatherData(lat, lon, name, country) {
    // Get current weather and forecast
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current_weather: true,
        hourly: 'temperature_2m,relativehumidity_2m,apparent_temperature,surface_pressure,windspeed_10m,weathercode',
        daily: 'weathercode,temperature_2m_max,temperature_2m_min',
        timezone: 'auto'
    });

    return fetch(`${weatherUrl}?${params}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Weather data not available');
            }
            return response.json();
        })
        .then(data => {
            // Add location info to the response
            data.location = {
                name: name,
                country: country
            };
            return data;
        });
}

function displayWeatherData(data) {
    // Display location
    locationName.textContent = `${data.location.name}, ${data.location.country}`;

    // Format current date
    const date = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDate.textContent = date.toLocaleDateString(undefined, options);

    // Current weather
    const currentWeather = data.current_weather;
    temperature.textContent = `${Math.round(currentWeather.temperature)}°C`;

    // Get weather description from code
    const weatherDesc = getWeatherDescription(currentWeather.weathercode);
    weatherDescription.textContent = weatherDesc;

    // Set weather icon
    setWeatherIcon(currentWeather.weathercode);

    // Get hourly data for additional details
    const hourlyData = data.hourly;
    const currentHourIndex = new Date().getHours();

    feelsLike.textContent = `${Math.round(hourlyData.apparent_temperature[currentHourIndex])}°C`;
    humidity.textContent = `${hourlyData.relativehumidity_2m[currentHourIndex]}%`;
    windSpeed.textContent = `${Math.round(hourlyData.windspeed_10m[currentHourIndex])} km/h`;
    pressure.textContent = `${Math.round(hourlyData.surface_pressure[currentHourIndex])} hPa`;

    // Display forecast
    displayForecast(data.daily);
}

function displayForecast(dailyData) {
    // Clear previous forecast
    forecast.innerHTML = '';

    const days = dailyData.time;
    const maxTemps = dailyData.temperature_2m_max;
    const minTemps = dailyData.temperature_2m_min;
    const weatherCodes = dailyData.weathercode;

    // Create forecast cards for each day (limit to 5 days)
    for (let i = 0; i < Math.min(5, days.length); i++) {
        const date = new Date(days[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-day';

        forecastCard.innerHTML = `
                    <div class="forecast-day-name">${dayName}</div>
                    <div class="forecast-icon">${getWeatherIconClass(weatherCodes[i])}</div>
                    <div class="forecast-temp">${Math.round(minTemps[i])}° / ${Math.round(maxTemps[i])}°</div>
                `;

        forecast.appendChild(forecastCard);
    }
}

function setWeatherIcon(weatherCode) {
    weatherIcon.innerHTML = getWeatherIconClass(weatherCode);
}

function getWeatherIconClass(weatherCode) {
    // Map Open-Meteo weather codes to Font Awesome icons
    if (weatherCode === 0) {
        return '<i class="fas fa-sun"></i>'; // Clear sky
    } else if (weatherCode === 1 || weatherCode === 2 || weatherCode === 3) {
        return '<i class="fas fa-cloud-sun"></i>'; // Partly cloudy
    } else if (weatherCode === 45 || weatherCode === 48) {
        return '<i class="fas fa-smog"></i>'; // Fog
    } else if (weatherCode >= 51 && weatherCode <= 57) {
        return '<i class="fas fa-cloud-rain"></i>'; // Drizzle
    } else if (weatherCode >= 61 && weatherCode <= 67) {
        return '<i class="fas fa-cloud-showers-heavy"></i>'; // Rain
    } else if (weatherCode >= 71 && weatherCode <= 77) {
        return '<i class="fas fa-snowflake"></i>'; // Snow
    } else if (weatherCode >= 80 && weatherCode <= 86) {
        return '<i class="fas fa-cloud-showers-heavy"></i>'; // Showers
    } else if (weatherCode === 95) {
        return '<i class="fas fa-bolt"></i>'; // Thunderstorm
    } else if (weatherCode === 96 || weatherCode === 99) {
        return '<i class="fas fa-bolt"></i>'; // Thunderstorm with hail
    } else {
        return '<i class="fas fa-sun"></i>'; // Default
    }
}

function getWeatherDescription(weatherCode) {
    // Map Open-Meteo weather codes to descriptions
    if (weatherCode === 0) {
        return 'Clear sky';
    } else if (weatherCode === 1) {
        return 'Mainly clear';
    } else if (weatherCode === 2) {
        return 'Partly cloudy';
    } else if (weatherCode === 3) {
        return 'Overcast';
    } else if (weatherCode === 45) {
        return 'Fog';
    } else if (weatherCode === 48) {
        return 'Depositing rime fog';
    } else if (weatherCode === 51) {
        return 'Light drizzle';
    } else if (weatherCode === 53) {
        return 'Moderate drizzle';
    } else if (weatherCode === 55) {
        return 'Dense drizzle';
    } else if (weatherCode === 56) {
        return 'Light freezing drizzle';
    } else if (weatherCode === 57) {
        return 'Dense freezing drizzle';
    } else if (weatherCode === 61) {
        return 'Slight rain';
    } else if (weatherCode === 63) {
        return 'Moderate rain';
    } else if (weatherCode === 65) {
        return 'Heavy rain';
    } else if (weatherCode === 66) {
        return 'Light freezing rain';
    } else if (weatherCode === 67) {
        return 'Heavy freezing rain';
    } else if (weatherCode === 71) {
        return 'Slight snow';
    } else if (weatherCode === 73) {
        return 'Moderate snow';
    } else if (weatherCode === 75) {
        return 'Heavy snow';
    } else if (weatherCode === 77) {
        return 'Snow grains';
    } else if (weatherCode === 80) {
        return 'Slight rain showers';
    } else if (weatherCode === 81) {
        return 'Moderate rain showers';
    } else if (weatherCode === 82) {
        return 'Violent rain showers';
    } else if (weatherCode === 85) {
        return 'Slight snow showers';
    } else if (weatherCode === 86) {
        return 'Heavy snow showers';
    } else if (weatherCode === 95) {
        return 'Thunderstorm';
    } else if (weatherCode === 96) {
        return 'Thunderstorm with slight hail';
    } else if (weatherCode === 99) {
        return 'Thunderstorm with heavy hail';
    } else {
        return 'Unknown';
    }
}

function showLoading() {
    loading.classList.add('active');
    weatherCard.classList.remove('active');
}

function hideLoading() {
    loading.classList.remove('active');
}

function showError() {
    errorMessage.style.display = 'block';
}

function hideError() {
    errorMessage.style.display = 'none';
}
