const { getWeatherByCity } = require("../weather");
const fetch = require("node-fetch");

jest.mock("node-fetch");

describe("Weather App Edge Cases", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should handle API rate limit exceeded (429)", async () => {
    fetch.mockResolvedValueOnce({ ok: false, status: 429 });
    await expect(getWeatherByCity("New York")).rejects.toThrow("Geocoding API error: 429");
  });

  test(
    "should timeout if network is slow",
    async () => {
      const error = new Error("Aborted");
      error.name = "AbortError";
      fetch.mockImplementation(() => Promise.reject(error));

      await expect(getWeatherByCity("Slowtown")).rejects.toThrow("Request timed out");
    },
    10000
  );

  test("should throw an error when city input is empty", async () => {
    await expect(getWeatherByCity("")).rejects.toThrow("City name is required");
  });
  
  test("should throw an error when city is not found", async () => {
  // Simulate geocoding API returning no results
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ results: [] })
  });

  await expect(getWeatherByCity("Narnia")).rejects.toThrow("City not found");
});
  
});

