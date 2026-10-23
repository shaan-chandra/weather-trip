/**
 * This file gives the data for the foreast 
 * The file gets the data from the weatherRules and converts them to show to the user.
 */
import { needsUmbrella, getRainSummary, getWeatherType, getTempExtremes, getPollutionWarnings, getGoodPollutants, hasAirData, formatDay, formatShortDay, listToText,} from '../weatherRules.js';
import { Umbrella, Luggage, CalendarDays, Wind } from 'lucide-react';

// To make box kind of like a glassbox, so each box looks the same 
export function GlassCard({ children, className = '' }) {
    return (
        <section className={`rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl ${className}`}>
            {children}
        </section>
    );
}

const icons = {
    umbrella: Umbrella,
    bag: Luggage,
    calendar: CalendarDays,
    air: Wind,
};

// Gives a small icon, and title at top of each card. 
function CardLabel({ icon, children }) {
    const CardIcon = icons[icon];
    return (
        <p className="flex items-center gap-2 text-sm text-white/70">
            <CardIcon className="h-4 w-4" aria-hidden="true" /> {children}
        </p>
    );
}

// This is shown before first search when the app loads. The user has not input anything 
// and this is the basic template. 
export function EmptyState() {
    return (
        <section className="py-10 text-center">
            <p className="text-6xl font-extralight">Where next?</p>
            <p className="mt-3 text-white/75">
                Search a city to see the next 3 days of weather, what to pack, and the air quality.
            </p>
        </section>
    );
}

// This shows when the user searches something
// A loading screen shows using daisyui loading while waiting for the server to respond 
export function LoadingState() {
    return (
        <GlassCard className="p-8 text-center">
            <div role="status">
                <span className="loading loading-spinner loading-lg" />
                <p className="mt-3 text-white/80">Getting the forecast…</p>
            </div>
        </GlassCard>
    );
}

// Shows error message 
export function ErrorMessage({ message }) {
    return (
        <div role="alert" className="alert border-0 bg-red-500/90 text-white">
            <span>{message}</span>
        </div>
    );
}
/**
 * Gives the city name, country, and the first day headline weathers 
 * Props- location, days
 */
function CityDetails({ location, days }) {
    const first = days[0];                  

    // Turn 2 letter coountry code into country name
    const country = new Intl.DisplayNames(['en'], { type: 'region' }).of(location.country);

    return (
        <section className="py-6 text-center">
            <h1 className="text-4xl font-normal">{location.name}</h1>
            <p className="text-sm text-white/70">{country}</p>

            <p className="mt-3 text-sm text-white/70">{formatDay(first.date)}</p>
            <p className="text-8xl font-extralight leading-none">{Math.round(first.tempMax)}°</p>
            <p className="mt-2 text-lg capitalize text-white/85">{first.description}</p>
            <p className="text-white/85">
                H:{Math.round(first.tempMax)}°&nbsp;&nbsp;L:{Math.round(first.tempMin)}°
            </p>
        </section>
    );
}

/**
 * The function tells the user if an umbrella is needed and if there is rain anytime over the next 3 days 
 * If no day has rain card is not shown at all
 */
function UmbrellaAlert({ days }) {
    if (needsUmbrella(days) === false) {
        return null;
    }
    const rain = getRainSummary(days);

    let howMany;
    if (rain.rainyDays === days.length) {
        howMany = 'Rain is forecast on all ' + days.length + ' days';
    } else {
        howMany = 'Rain is forecast on ' + rain.rainyDays + ' of the ' + days.length + ' days';
    }

    return (
        <GlassCard>
            <CardLabel icon="umbrella">Umbrella</CardLabel>
            <p className="mt-2 text-xl font-semibold">Bring an umbrella</p>
            <p className="mt-1 text-white/85">
                {howMany}, {rain.totalRain.toFixed(1)} mm in total.{' '}
                {formatDay(rain.wettest.date)} is the wettest, with {rain.wettest.rainTotal.toFixed(1)} mm.
            </p>
            <ul className="mt-4 space-y-2">
                {days.map(day => (
                    <li key={day.date} className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2">
                        <span>{formatDay(day.date)}</span>
                        <span className="text-white/85">
                            {day.rainTotal > 0 ? day.rainTotal.toFixed(1) + ' mm' : 'Dry'} · {Math.round(day.rainChance * 100)}% chance
                        </span>
                    </li>
                ))}
            </ul>
        </GlassCard>
    );
}

/**
 * The function tells the user if it is cold,mild,hot based on the temperature values from the sheet
 * It also advices the user how to pack from the temperature denoted.
 */
function TemperatureAdvice({ days }) {
    const packingAdvice = getWeatherType(days);      
    const extremes = getTempExtremes(days);           

    const categories = [
        { name: 'cold', label: 'Cold, below 8°C', applies: packingAdvice.cold, colour: 'bg-sky-300 text-sky-950' },
        { name: 'mild', label: 'Mild, 8 to 24°C', applies: packingAdvice.mild, colour: 'bg-emerald-300 text-emerald-950' },
        { name: 'hot', label: 'Hot, above 24°C', applies: packingAdvice.hot, colour: 'bg-orange-300 text-orange-950' },
    ];

    const needed = [];
    for (const category of categories) {
        if (category.applies) {
            needed.push(category.name);
        }
    }

    return (
        <GlassCard>
            <CardLabel icon="bag">What to pack</CardLabel>
            <p className="mt-2 text-xl font-semibold">Pack for {listToText(needed)} weather</p>

            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Weather categories">
                {categories.map(category => {
                    let style = 'border border-white/25 bg-transparent text-white/45';
                    if (category.applies) {
                        style = 'border-0 ' + category.colour;
                    }
                    return (
                        <li key={category.name} className={'badge badge-lg ' + style}>
                            {category.label}
                        </li>
                    );
                })}
            </ul>

            <p className="mt-3 text-white/85">
                Lows of {extremes.coldest.tempMin.toFixed(1)}°C on {formatDay(extremes.coldest.date)} and
                highs of {extremes.hottest.tempMax.toFixed(1)}°C on {formatDay(extremes.hottest.date)}.
            </p>
        </GlassCard>
    );
}

/**
 * This function gives the summary table for the next 3 days 
 * Shows one table row per day with days.map()
 */
function ForecastTable({ days }) {
    return (
        <GlassCard className="self-start">
            <CardLabel icon="calendar">3-day forecast</CardLabel>
            <div className="mt-2 overflow-x-auto">
                <table className="table table-sm text-white">
                    <caption className="sr-only">Temperature, wind speed and rainfall for the next 3 days</caption>
                    <thead>
                        <tr className="border-white/15 text-white/60">
                            <th>Day</th>
                            <th><span className="sr-only">Conditions</span></th>
                            <th>Temp</th>
                            <th>Wind</th>
                            <th>Rainfall</th>
                        </tr>
                    </thead>
                    <tbody>
                        {days.map(day => (
                            <tr key={day.date} className="border-white/10">
                                <th>{formatShortDay(day.date)}</th>
                                <td>
                                    {/* Weather icon from OpenWeather, e.g. 10d = rain */}
                                    <img
                                        src={'https://openweathermap.org/img/wn/' + day.icon + '@2x.png'}
                                        alt={day.description}
                                        width="32"
                                        height="32"
                                        className="-my-2"
                                    />
                                </td>
                                <td className="whitespace-nowrap">
                                    {Math.round(day.tempMin)}° to {Math.round(day.tempMax)}°
                                </td>
                                <td className="whitespace-nowrap">{day.windMax.toFixed(1)} m/s</td>
                                <td className="whitespace-nowrap">{day.rainTotal.toFixed(1)} mm</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    );
}

// Colour for each pollutant level
export const POLLUTANT_LEVEL_COLORS = {
    'Fair': 'bg-yellow-300 text-yellow-950',
    'Moderate': 'bg-orange-400 text-orange-950',
    'Poor': 'bg-red-500 text-white',
    'Very poor': 'bg-purple-500 text-white',
};

/**
 * Function gives the pollutants above good. 
 * As per sheet, shows three points: which pollutant is above good, how much is it, and health risk with it
 */
function PollutantsWarning({ warning }) {
    return (
        <article className="rounded-2xl bg-white/10 p-4">
            {/* Which pollutant + its level */}
            <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{warning.name}</h3>
                <span className={'badge border-0 ' + POLLUTANT_LEVEL_COLORS[warning.level]}>{warning.level}</span>
            </div>

            {/* How Much */}
            <p className="mt-1 text-white/85">
                Peaks at {warning.value.toFixed(1)} µg/m³ on {formatDay(warning.date)}.
                Good is under {warning.goodLimit}, so this is {warning.timesLimit} times the Good limit.
            </p>

            {/* Health risk associated with the pollutant */}
            <p className="mt-3 text-sm text-white/85">
                <span className="font-semibold text-white">Health risk:</span> {warning.healthRisk}
            </p>
        </article>
    );
}

/**
 * Function gives the air pollution card. 
 * This function just warns about no. of pollutants above good. 
 * The PollutantWarning function gives the pollutants which are above good and health risk with it  
 */
function AirQuality({ days }) {
    // The air forecast only covers about 4 days, so there may be no data at all
    if (hasAirData(days) === false) {
        return (
            <GlassCard>
                <CardLabel icon="air">Air quality</CardLabel>
                <p className="mt-2 text-white/85">No air quality data is available for these days.</p>
            </GlassCard>
        );
    }

    const warnings = getPollutionWarnings(days);
    const good = getGoodPollutants(warnings);

    let title;
    if (warnings.length === 0) {
        title = 'Good on all ' + days.length + ' days';
    } else if (warnings.length === 1) {
        title = '1 pollutant above Good';
    } else {
        title = warnings.length + ' pollutants above Good';
    }

    return (
        <GlassCard>
            <CardLabel icon="air">Air quality</CardLabel>
            <p className="mt-2 text-xl font-semibold">{title}</p>

            {/* One warning card per pollutant above Good */}
            <div className="mt-4 grid gap-4">
                {warnings.map(warning => (
                    <PollutantsWarning key={warning.pollutant} warning={warning} />
                ))}
            </div>

            {/* The pollutants that stayed Good */}
            {good.length > 0 && (
                <p className="mt-4 text-sm text-white/65">Good on all days: {listToText(good)}.</p>
            )}
        </GlassCard>
    );
}
/**
 * Get the whole forcast for one city from all the functions described in the file 
 */
export default function CityForecast({ trip }) {
    return (
        <>
            <CityDetails location={trip.location} days={trip.days} />

            <div className="grid gap-4 md:grid-cols-2">
                <UmbrellaAlert days={trip.days} />
                <TemperatureAdvice days={trip.days} />
                <ForecastTable days={trip.days} />
                <AirQuality days={trip.days} />
            </div>
        </>
    );
}
