/**
 * This file has a function that takes a weather Client object
 * It gets weather forecast and air pollution for city
 * Based on the city, returns everything the client needs for that trip
 */
import { getDailyPollutionPeaks, toLocalDate } from '../lib/weatherUtils.js';

export function createTripService(weatherClient) {
    async function getTripInfo(city) {
        const daily = await weatherClient.getDailyForecast(city);
        const latitude = daily.city.coord.lat;
        const longitude = daily.city.coord.lon;
        const timezone = daily.city.timezone;
        const pollution = await weatherClient.getAirPollutionForecast(latitude, longitude);
        
        // Keep only next 3 days to be implemented in forecast.js 
        // rest to be implemented after helper files are written
        const days = [] 
        for (const day of daily.list.slice(1,4)) {
            const date = toLocalDate(day.dt, timezone);
            days.push( {
                date,
                tempMin: day.temp.min,
                tempMax: day.temp.max,
                windMax: day.speed,
                rainChance: day.pop,
                rainTotal: day.rain?? 0,
                description: day.weather[0].description,
                icon: day.weather[0].icon,
                pollution: getDailyPollutionPeaks(pollution.list, timezone, date)
            })

        }

        return {
            location : { 
            name: daily.city.name, 
            country: daily.city.country, 
            latitude, 
            longitude, 
            timezone,
            },
            days
        };
    }
    return { getTripInfo };
}