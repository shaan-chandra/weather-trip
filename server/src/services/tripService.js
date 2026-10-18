/**
 * This file has a function that takes a weather Client object
 * It gets weather forecast and air pollution for city
 * Based on the city, returns everything the client needs for that trip
 */

export function createTripService(weatherClient) {
    async function getTripInfo(city) {
        const forecast = await weatherClient.getWeatherForecast(city);
        const latitude = forecast.city.coord.lat;
        const longitude = forecast.city.coord.lon;
        const timezone = forecast.city.timezone;
        const pollution = await weatherClient.getAirPollutionForecast(latitude, longitude);
        
        // Keep only next 3 days to be implemented in forecast.js 
        // rest to be implemented after helper files are written

        return {
            location : { 
            name: forecast.city.name, 
            country: forecast.city.country, 
            latitude, 
            longitude, 
            timezone
            },
            forecastEntries: forecast.list.length,
            pollutionEntries: pollution.list.length, 
        };
    }
    return { getTripInfo };
}