/**
 * Turns Open weather's 3 hourly forecast into day summaries for the enxt 3 days.
 * helper file for handling service logic 
 */
export function toLocalDate(dt, timezone) {
    const localMS = (dt + timezone) * 1000;
    return new Date(localMS).toISOString().split('T')[0];
}

export function getNextThreeDaysForecast(list, timezone, now = Math.floor(Date.now() / 1000)) {
    const one_day = 24 * 60 * 60; //one day in seconds 
    const days = [] 
    for (let i = 1; i <= 3; i++) {
        const date = toLocalDate(now + i * one_day, timezone); 
        const entries = list.filter(entry => toLocalDate(entry.dt, timezone) === date);
        days.push({ date, entries });
    }
    return days 
}
export function summariseDay(entries) {
    const tempMin = Math.min(...entries.map(entry => entry.main.temp_min)); 
    const tempMax = Math.max(...entries.map(entry => entry.main.temp_max));
    const windMax = Math.max(...entries.map(entry => entry.wind.speed));
    const rainChance = Math.max(...entries.map(entry => entry.pop));

    let rainTotal = 0;
    const round1 = value => Math.round(value * 10) / 10; 
    for (const entry of entries) {
        rainTotal += entry.rain?.['3h'] ?? 0; 
    }
    return {
        tempMin: round1(tempMin), 
        tempMax: round1(tempMax), 
        windMax: round1(windMax), 
        rainTotal: round1(rainTotal), 
        rainChance,
    };
}