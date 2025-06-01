const fetch = require("node-fetch");

/**
 * Fetch current weather for a city using Open-Meteo API.
 * @param {string} city - City name.
 * @returns {Promise<Object>} - Weather info: city, temperature, description.
 * @throws {Error} If city not provided, not found, API errors, or timeout.
 */
async function getWeatherByCity(city) {
  if (!city) throw new Error("City name is required");

  const timeoutMs = 5000; // 5 seconds timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Geocoding API call
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!geoRes.ok) throw new Error(`Geocoding API error: ${geoRes.status}`);

    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found");
    }

    const { latitude, longitude, name: cityName } = geoData.results[0];

    // Weather API call
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`,
      { signal: controller.signal }
    );

    if (!weatherRes.ok) throw new Error(`Weather API error: ${weatherRes.status}`);

    const weatherData = await weatherRes.json();

    const temperature = weatherData.current_weather?.temperature;
    const weathercode = weatherData.current_weather?.weathercode;
    const description = getWeatherDescription(weathercode);

    return {
      city: cityName,
      temperature,
      description,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  }
}

/**
 * Fetches a 5-day weather forecast for the specified city using the Open-Meteo API.
 *
 * @param {string} city - The name of the city to get the forecast for.
 * @returns {Promise<Object>} An object containing the city name and daily forecasts.
 * @throws {Error} If city is invalid, data is unavailable, or request fails.
 *
 * @example
 * getFiveDayForecastByCity("New York")
 *   .then(data => console.log(data))
 *   .catch(err => console.error(err.message));
 */
async function getFiveDayForecastByCity(city) {
  if (!city) throw new Error("City name is required");

  const timeoutMs = 5000; // 5 seconds timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Geocoding API call
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!geoRes.ok) throw new Error(`Geocoding API error: ${geoRes.status}`);

    const geoData = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found");
    }

    const { latitude, longitude, name: cityName } = geoData.results[0];

    // Forecast API call
    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`,
      { signal: controller.signal }
    );

    if (!forecastRes.ok) throw new Error(`Forecast API error: ${forecastRes.status}`);

    const forecastData = await forecastRes.json();
    const { daily } = forecastData;

    if (!daily?.time || daily.time.length === 0) {
      throw new Error("No forecast data available");
    }

    const forecast = daily.time.map((date, i) => ({
      date,
      minTemp: daily.temperature_2m_min[i],
      maxTemp: daily.temperature_2m_max[i],
      description: getWeatherDescription(daily.weathercode[i]),
    }));

    return {
      city: cityName,
      forecast: forecast.slice(0, 5), // Limit to 5 days
    };
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  }
}

/**
 * Converts weather code to a description string.
 * @param {number} code - Weather code from Open-Meteo API.
 * @returns {string} Description of the weather.
 */
function getWeatherDescription(code) {
  const descriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    // Add more codes as needed
  };
  return descriptions[code] || "Unknown";
}

module.exports = {
  getWeatherByCity,
  getFiveDayForecastByCity,
};
