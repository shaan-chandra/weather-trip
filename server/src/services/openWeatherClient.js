
// service logic for OpenWeather API 
/**
 * The file calls the API of OpenWeather 
 */
const baseUrl = 'https://api.openweathermap.org';

export function createOpenWeatherUrl(apiKey) {

    async function getJson(url) {
        const res = await fetch(url); 
        if (!res.ok) {
            throw new Error(`OpenWeather error: ${res.status}`)

        }
        const data = await res.json();
        return data; 
    }

    async function getDailyForecast(city) {
        const url = `${baseUrl}/data/2.5/forecast/daily?q=${encodeURIComponent(city)}&cnt=4&units=metric&appid=${apiKey}`;
        return getJson(url);
    }
    // Get weather forecast of city for 3 hours 
    async function getWeatherForecast(city) {
        const url = `${baseUrl}/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
        return getJson(url);
    }
    // Get air pollution forecast 
    async function getAirPollutionForecast(latitude, longitude) {
        const url = `${baseUrl}/data/2.5/air_pollution/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;
        return getJson(url);
    }
    return { getDailyForecast, getWeatherForecast, getAirPollutionForecast };
}