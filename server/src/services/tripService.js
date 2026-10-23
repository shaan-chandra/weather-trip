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
        
        // Next 3 full days: skip today (index 0) and take indexes 1, 2, 3
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
    /**
     * get stop info for the forceast for one city on a date. 
     * Reuses getTripInfo 
     */
    async function getStopInfo(city, date) {
        const trip = await getTripInfo(city);
        // Find the day that matches the requested date
        let match = null;
        for (const day of trip.days) {
            if (day.date === date) {
                match = day;
            }
        }
        // The date isn't one of the next 3 days, so we have no forecast for it
        if (match === null) {
            throw Object.assign(
                new Error('Pick a date within the next 3 days.'),
                { status: 400, code: 'DATE_OUT_OF_RANGE' }
            );
        }
        return { location: trip.location, day: match };
    }

    return { getTripInfo, getStopInfo };
}