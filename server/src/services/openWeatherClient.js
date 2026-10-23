
// service logic for OpenWeather API 
/**
 * The file calls the API of OpenWeather 
 */
const baseUrl = 'https://api.openweathermap.org';

// this function is just called once in index.js to make the url and check if it works 
export function createOpenWeatherUrl(apiKey) {

    async function getJson(url) {
        const res = await fetch(url); 
        if (!res.ok) {
        if (res.status === 404) {
          throw Object.assign(new Error('City not found'), { status: 404, code: 'CITY_NOT_FOUND' });
      }
      throw Object.assign(new Error('Weather service unavailable'), { status: 502, code: 'WEATHER_API_ERROR' });
    }
      return res.json();
    }

    // function that gets the daily forecast based on the city provided.
    async function getDailyForecast(city) {
        const url = `${baseUrl}/data/2.5/forecast/daily?q=${encodeURIComponent(city)}&cnt=4&units=metric&appid=${apiKey}`;
        return getJson(url);
    }
    // Get air pollution forecast 
    async function getAirPollutionForecast(latitude, longitude) {
        const url = `${baseUrl}/data/2.5/air_pollution/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;
        return getJson(url);
    }
    return { getDailyForecast, getAirPollutionForecast };
}