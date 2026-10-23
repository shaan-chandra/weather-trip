/**
 * TripPlanner.jsx — the multi-city trip screen which is the innovation feature. 
 * The user builds a trip of up to 5 stops (city + date), presses "Plan trip",
 * and sees:
 *   TripForm -> the list of stops they can add / remove / edit
 *   TripPacking -> one packing summary for the whole trip
 *   TripTimeline -> one card per stop, in trip order (a failed stop shows in red)
 */
import { useState } from 'react';
import { GlassCard, LoadingState, ErrorMessage, POLLUTANT_LEVEL_COLORS } from './CityForecast.jsx';
import { needsUmbrella, getWeatherType, getPollutionWarnings, formatShortDate, listToText,} from '../weatherRules.js';

const max_stops = 5;    // same limit as the server
/**
 * The function gives n days from today from this computer 
 */
function daysFromToday(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + month + '-' + day;
}

// The forecast covers the next 3 days, so stops can only be on these dates
const first_date = daysFromToday(1);
const last_date = daysFromToday(3);

/**
 * gets date of the next date after previous but never exceeds last_date
 */
function dayAfter(date) {
    const d = new Date(date + 'T12:00:00Z');       // midday UTC, so the date never shifts
    d.setUTCDate(d.getUTCDate() + 1);
    const next = d.toISOString().split('T')[0];
    if (next > last_date) {
        return last_date;
    }
    return next;
}

/**
 * make one row: number, city, date, remove button
 */
function StopRow({ number, destination, canRemove, onChange, onRemove }) {
    const field = 'input input-sm border-white/25 bg-white/15 text-white';
    return (
        <li className="flex items-center gap-2">
            <span className="w-5 text-right text-white/60">{number}</span>
            <input
                className={`${field} min-w-0 flex-1`}
                placeholder="City, e.g. Paris,FR"
                value={destination.city}
                onChange={e => onChange('city', e.target.value)}
                required
                aria-label={`Stop ${number} city`}
            />
            <input
                type="date"
                className={`${field} w-36`}
                value={destination.date}
                min={first_date}
                max={last_date}
                onChange={e => onChange('date', e.target.value)}
                required
                aria-label={`Stop ${number} date`}
            />
            <button
                type="button"
                className="btn btn-ghost btn-sm btn-square text-white/70"
                onClick={onRemove}
                disabled={!canRemove}
                aria-label={`Remove stop ${number}`}
            >
                ✕
            </button>
        </li>
    );
}
/**
 * Contains the whole form: list of rows, add stop and plan trip, stops the page reloading on submit.
 * 
 */
function TripForm({ destinations, loading, onDestinationChange, onAdd, onRemove, onPlan }) {
    // Stop the page reloading on submit, then plan the trip
    function handleSubmit(event) {
        event.preventDefault();
        onPlan();
    }

    return (
        <GlassCard>
            <form onSubmit={handleSubmit}>
                <p className="text-xl font-semibold">Plan a multi-city trip</p>
                <p className="mt-1 text-sm text-white/70">
                    Add up to {max_stops} stops. Dates must be within the next 3 days.
                </p>

                {/* One row per stop. The index tells the parent WHICH stop changed. */}
                <ol className="mt-4 space-y-2">
                    {destinations.map((destination, index) => (
                        <StopRow
                            key={index}
                            number={index + 1}
                            destination={destination}
                            canRemove={destinations.length > 1}
                            onChange={(field, value) => onDestinationChange(index, field, value)}
                            onRemove={() => onRemove(index)}
                        />
                    ))}
                </ol>

                <div className="mt-4 flex gap-2">
                    <button
                        type="button"
                        className="btn btn-sm border-white/25 bg-transparent text-white hover:bg-white/10"
                        onClick={onAdd}
                        disabled={destinations.length >= max_stops}
                    >
                        Add stop
                    </button>
                    <button
                        type="submit"
                        className="btn btn-sm ml-auto border-0 bg-white text-slate-900 hover:bg-white/90"
                        disabled={loading}
                    >
                        {loading ? <span className="loading loading-spinner loading-xs" /> : 'Plan trip'}
                    </button>
                </div>
            </form>
        </GlassCard>
    );
}

/**
 * Get only stops that loaded
 */
function getStops(stops) {
    const okStops = [];
    for (const stop of stops) {
        if (stop.ok) {
            okStops.push(stop);
        }
    }
    return okStops;
}

/**
 * Each line reuses the same rules as the single-city view, one stop at a time.
 * The function gives a whole packing advice for teh trip based on the cities temperatures 
 * It also gives rain warning and if the user needs umbrella
 * And also warns about air quality.
 */
function TripPacking({ stops }) {
    const okStops = getStops(stops);
    if (okStops.length === 0) {
        return null;                  
    }
    const coldCities = [];
    const mildCities = [];
    const hotCities = [];
    const rainCities = [];
    const airLines = [];
    let anyAirData = false;

    for (const stop of okStops) {
        const city = stop.location.name;
        const oneDay = [stop.day];   

        const packing = getWeatherType(oneDay);
        if (packing.cold) coldCities.push(city);
        if (packing.mild) mildCities.push(city);
        if (packing.hot) hotCities.push(city);

        if (needsUmbrella(oneDay)) {
            rainCities.push(city);
        }

        if (stop.day.pollution !== null) {
            anyAirData = true;
            for (const warning of getPollutionWarnings(oneDay)) {
                airLines.push(warning.name + ' is ' + warning.level + ' in ' + city + '.');
            }
        }
    }
    const kinds = [];
    if (coldCities.length > 0) kinds.push('cold');
    if (mildCities.length > 0) kinds.push('mild');
    if (hotCities.length > 0) kinds.push('hot');
    let headline = 'Pack for ' + listToText(kinds) + ' weather';
    if (rainCities.length > 0) {
        headline = headline + ', and bring an umbrella';
    }
    const lines = [];
    if (coldCities.length > 0) lines.push('Cold (below 8°C): ' + listToText(coldCities) + '.');
    if (mildCities.length > 0) lines.push('Mild (8 to 24°C): ' + listToText(mildCities) + '.');
    if (hotCities.length > 0) lines.push('Hot (above 24°C): ' + listToText(hotCities) + '.');

    if (rainCities.length > 0) {
        lines.push('Umbrella: rain expected in ' + listToText(rainCities) + '.');
    } else {
        lines.push('No rain expected at any stop.');
    }

    if (airLines.length > 0) {
        for (const line of airLines) {
            lines.push('Air: ' + line);
        }
    } else if (anyAirData) {
        lines.push('Air quality is Good at every stop.');
    }

    return (
        <GlassCard>
            <p className="text-sm text-white/70">For the whole trip</p>
            <p className="mt-2 text-xl font-semibold">{headline}</p>
            <ul className="mt-3 space-y-1.5 text-white/85">
                {lines.map((line, index) => (
                    <li key={index}>{line}</li>
                ))}
            </ul>
        </GlassCard>
    );
}
/**
 * The coloured badges for one stop's day
 */
function getBadges(day) {
    const badges = [];
    const oneDay = [day];

    const packing = getWeatherType(oneDay);
    if (packing.cold) badges.push({ label: 'Cold', style: 'bg-sky-300 text-sky-950' });
    if (packing.mild) badges.push({ label: 'Mild', style: 'bg-emerald-300 text-emerald-950' });
    if (packing.hot) badges.push({ label: 'Hot', style: 'bg-orange-300 text-orange-950' });

    if (needsUmbrella(oneDay)) {
        badges.push({ label: 'Rain ' + day.rainTotal.toFixed(1) + ' mm', style: 'bg-white/20 text-white' });
    }
    if (day.pollution !== null) {
        const warnings = getPollutionWarnings(oneDay);
        if (warnings.length === 0) {
            badges.push({ label: 'Air good', style: 'bg-emerald-400 text-emerald-950' });
        }
        for (const warning of warnings) {
            badges.push({ label: warning.name + ' ' + warning.level, style: POLLUTANT_LEVEL_COLORS[warning.level] });
        }
    }
    return badges;
}
/**
 * The function loads the date, city, temperature, wind etc
 * If it fails it denotes the error. 
 */
function CityCard({ stop }) {
    const dot = `absolute -left-[31px] top-5 h-3 w-3 rounded-full ${stop.ok ? 'bg-white' : 'bg-red-400'}`;
    const card = stop.ok
        ? 'rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl'
        : 'rounded-3xl border border-red-300 bg-red-500 p-5';
    if (!stop.ok) {
        return (
            <li className="relative">
                <span className={dot} aria-hidden="true" />
                <article className={card}>
                    <p className="text-sm text-white/70">{formatShortDate(stop.date)}</p>
                    <h3 className="text-2xl font-normal">{stop.city}</h3>
                    <p className="mt-1 text-white/85">{stop.error}</p>
                </article>
            </li>
        );
    }
    const day = stop.day;
    return (
        <li className="relative">
            <span className={dot} aria-hidden="true" />
            <article className={card}>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm text-white/70">{formatShortDate(stop.date)}</p>
                        <h3 className="text-2xl font-normal">
                            {stop.location.name}
                            <span className="ml-2 text-base text-white/60">{stop.location.country}</span>
                        </h3>
                        <p className="text-white/80">
                            <span className="capitalize">{day.description}</span> · {Math.round(day.tempMin)}° to {Math.round(day.tempMax)}°
                        </p>
                        <p className="text-sm text-white/70">
                            Wind up to {day.windMax.toFixed(1)} m/s · {Math.round(day.rainChance * 100)}% chance of rain
                        </p>
                    </div>
                    <img
                        className="h-14 w-14"
                        src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                        alt={day.description}
                    />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    {getBadges(day).map(badge => (
                        <span key={badge.label} className={`badge border-0 ${badge.style}`}>{badge.label}</span>
                    ))}
                </div>
            </article>
        </li>
    );
}

/**
 * All the stops in the trip order. 
 */
function TripTimeline({ stops }) {
    return (
        <ol className="relative ml-2 space-y-4 border-l border-white/25 pl-6">
            {stops.map((stop, index) => (
                <CityCard key={index} stop={stop} />
            ))}
        </ol>
    );
}

export default function TripPlanner() {
    const [destinations, setDestinations] = useState([{ city: '', date: first_date }]);
    const [stops, setStops] = useState(null);                             
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    /**
     * Changes one field of one stop.
     */
    function updateStop(index, field, value) {
        const copy = [...destinations];
        const changed = { ...copy[index] };
        changed[field] = value;               // e.g. changed.city = 'Paris'
        copy[index] = changed;
        setDestinations(copy);
    }
    // function adds an empty stop on the day after the last stop
    function addStop() {
        if (destinations.length >= max_stops) {
            return;
        }
        const lastDate = destinations[destinations.length - 1].date;
        setDestinations([...destinations, { city: '', date: dayAfter(lastDate) }]);
    }
    // Removes stop of the given index 
    function removeStop(index) {
        const kept = [];
        for (let i = 0; i < destinations.length; i++) {
            if (i !== index) {
                kept.push(destinations[i]);
            }
        }
        setDestinations(kept);
    }
    // Sends the whole trip to our server in one request
    async function planTrip() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/itinerary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },  
                body: JSON.stringify({ destinations: destinations }),
            });
            if (res.headers.get('content-type')?.includes('application/json') !== true) {
                throw new Error('Could not reach the server. Is it running?');
            }
            const body = await res.json();
            if (!res.ok) {
                throw new Error(body.error?.message || 'Something went wrong');
            }
            setStops(body.stops);
        }
        catch (err) {
            setError(err.message);
            setStops(null);
        }
        finally {
            setLoading(false);
        }
    }
    let status = null;
    if (loading) {
        status = <LoadingState />;
    } else if (error) {
        status = <ErrorMessage message={error} />;
    }
    const showResults = !loading && !error && stops !== null;
    const showSummary = showResults && getStops(stops).length > 0;

    return (
        <div className="space-y-4">
            <TripForm
                destinations={destinations}
                loading={loading}
                onDestinationChange={updateStop}
                onAdd={addStop}
                onRemove={removeStop}
                onPlan={planTrip}
            />
            {status}

            {showResults && (
                <div className="grid items-start gap-4 md:grid-cols-2">
                    {showSummary && <TripPacking stops={stops} />}
                    <div className={showSummary ? '' : 'md:col-span-2'}>
                        <TripTimeline stops={stops} />
                    </div>
                </div>
            )}
        </div>
    );
}
