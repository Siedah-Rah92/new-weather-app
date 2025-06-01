// Helper to map weather codes to descriptions
function getWeatherDescription(code) {
  const descriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    80: "Rain showers",
    95: "Thunderstorm",
  };
  return descriptions[code] || "Unknown";
}

// Fetch current weather
async function getWeatherByCity(city) {
  try {
    if (!city || typeof city !== 'string') {
      throw new Error("Invalid city name.");
    }

    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    if (!geoRes.ok) throw new Error("Failed to fetch geocoding data.");

    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found.");
    }

    const { name, latitude, longitude } = geoData.results[0];

    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
    if (!weatherRes.ok) throw new Error("Failed to fetch weather data.");

    const weatherData = await weatherRes.json();
    const current = weatherData.current_weather;
    if (!current) throw new Error("Weather data unavailable.");

    const description = getWeatherDescription(current.weathercode);

    return {
      city: name,
      temperature: current.temperature,
      description
    };

  } catch (error) {
    return { error: error.message };
  }
}

// Fetch 5-day forecast
async function getFiveDayForecastByCity(city) {
  try {
    if (!city || typeof city !== 'string') {
      throw new Error("Invalid city name.");
    }

    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    if (!geoRes.ok) throw new Error("Failed to fetch geocoding data.");

    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found.");
    }

    const { name, latitude, longitude } = geoData.results[0];

    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
    );
    if (!forecastRes.ok) throw new Error("Failed to fetch forecast data.");

    const forecastData = await forecastRes.json();
    const { daily } = forecastData;

    if (!daily?.time || daily.time.length === 0) {
      throw new Error("No forecast data available.");
    }

    const forecast = daily.time.slice(0, 5).map((date, i) => ({
      date,
      minTemp: daily.temperature_2m_min[i],
      maxTemp: daily.temperature_2m_max[i],
      description: getWeatherDescription(daily.weathercode[i]),
    }));

    return {
      city: name,
      forecast
    };
  } catch (error) {
    return { error: error.message };
  }
}

document.getElementById('getWeatherBtn').addEventListener('click', async () => {
  const city = document.getElementById('cityInput').value.trim();
  const resultBox = document.getElementById('weatherResult');

  resultBox.textContent = 'Loading...';

  // Fetch current weather and forecast in parallel
  const [weather, forecast] = await Promise.all([
    getWeatherByCity(city),
    getFiveDayForecastByCity(city)
  ]);

  if (weather.error) {
    resultBox.textContent = `❌ ${weather.error}`;
    return;
  }
  if (forecast.error) {
    resultBox.textContent = `❌ ${forecast.error}`;
    return;
  }

  // Build forecast HTML
  const forecastHtml = `
    <h3>5-Day Forecast for ${forecast.city}</h3>
    <ul style="list-style:none;padding:0;">
      ${forecast.forecast.map(day => `
        <li>
          <strong>${day.date}</strong>: 
          ${day.minTemp}°C - ${day.maxTemp}°C, 
          ${day.description}
        </li>
      `).join('')}
    </ul>
  `;

  // Show both current weather and forecast
  resultBox.innerHTML = `
    <strong>${weather.city}</strong><br>
    Temperature: ${weather.temperature}°C<br>
    Description: ${weather.description}
    <hr>
    ${forecastHtml}
  `;
});