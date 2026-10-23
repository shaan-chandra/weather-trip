/**
 * The endpoint for the innovation feature 
 * The body takes destination : {city, date} and return stops 
 * one result per stop 
 * Every stop is fetched in parallel with Promise.allSettled, so one bad city doesnt break code. 
 */
import { Router } from 'express';

const max_stops = 5;

/**
 * Checks the request body and returns an error message, or null if it is valid.
 * 
 */
function checkDestinations(destinations) {
    if (!Array.isArray(destinations) || destinations.length === 0) {
        return 'Add at least one stop to your trip.';
    }
    if (destinations.length > max_stops) {
        return 'A trip can have at most ' + max_stops + ' stops.';
    }
    for (const destination of destinations) {
        if (typeof destination !== 'object' || destination === null) {
            return 'Every stop needs a city and a date.';
        }
        if (typeof destination.city !== 'string' || destination.city.trim() === '') {
            return 'Every stop needs a city name.';
        }
        if (typeof destination.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(destination.date)) {
            return 'Every stop needs a date.';
        }
    }
    return null;
}

export function createItineraryRouter(tripService) {
    const router = Router();

    router.post('/', async (req, res) => {
        // req.body is undefined if the client didn't send JSON
        const destinations = req.body ? req.body.destinations : undefined;

        // 1. Validate the whole request first
        const problem = checkDestinations(destinations);
        if (problem !== null) {
            return res.status(400).json({
                error: { code: 'BAD_REQUEST', message: problem },
            });
        }

        // 2. Start every stop's request at once
        const requests = [];
        for (const destination of destinations) {
            requests.push(tripService.getStopInfo(destination.city.trim(), destination.date));
        }

        // 3. Wait for all of them Promise.allSettled
        const results = await Promise.allSettled(requests);

        // 4. Turn each result into a stop for the client, in the same order as the destinations
        const stops = [];
        for (let i = 0; i < results.length; i++) {
            const destination = destinations[i];
            const result = results[i];

            if (result.status === 'fulfilled') {
                stops.push({
                    ok: true,
                    city: destination.city,
                    date: destination.date,
                    location: result.value.location,
                    day: result.value.day,
                });
            } else {
                const error = result.reason;
                stops.push({
                    ok: false,
                    city: destination.city,
                    date: destination.date,
                    error: error.status ? error.message : 'Could not get the forecast for this stop.',
                });
            }
        }
        res.json({ stops });
    });
    return router;
}
