// weather-cli.js
const { getWeatherByCity, getFiveDayForecastByCity } = require("./weather");

const args = process.argv.slice(2);
const forecastFlag = args.includes("--forecast");
const city = args.find((arg) => !arg.startsWith("--"));

if (!city) {
  console.error("Please provide a city name.");
  process.exit(1);
}

if (forecastFlag) {
  getFiveDayForecastByCity(city)
    .then((data) => {
      console.log(`\n📅 5-Day Forecast for ${data.city}:\n`);
      data.forecast.forEach((day) => {
        console.log(`${day.date}: ${day.minTemp}°C - ${day.description}`);
      });
    })
    .catch((err) => {
      console.error("Error fetching forecast:", err.message);
    });
} else {
  getWeatherByCity(city)
    .then((data) => {
      console.log(`\n🌤 Current Weather in ${data.city}:\n`);
      console.log(`Temperature: ${data.temperature}°C`);
      console.log(`Description: ${data.description}`);
    })
    .catch((err) => {
      console.error("Error fetching current weather:", err.message);
    });
}
