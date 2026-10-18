import { toLocalDate } from './forecast.js';
const Pollutants = ['co', 'no', 'no2', 'o3', 'so2', 'pm2_5', 'pm10', 'nh3'];

export function getDailyPollutionPeaks(pollutionList, timezone, date) {
    const hours = pollutionList.filter(entry => toLocalDate(entry.dt, timezone) === date);
    if (hours.length == 0) {
        return null;
    }
    const peaks = {};
    for (const pollutant of Pollutants) {
        let highest = hours[0]
        for (const hour of hours) {
            if (hour.components[pollutant] > highest.components[pollutant]) {
                highest = hour;
            }
        }
    peaks[pollutant] = {
        value: highest.components[pollutant],
        at: highest.dt 
    } 
    };

    return peaks; 
}
