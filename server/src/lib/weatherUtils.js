// Helper file with helpfer functions to be used for tripService.js
const Pollutants = ['co', 'no', 'no2', 'o3', 'so2', 'pm2_5', 'pm10', 'nh3'];

/**
 *  The function gets the daily pollution peaks since pollution is also hourly data on the api key 
 *  This function gets the pollution peaks for the whole day.
*/ 
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

// Function that converts to local date based on timezone. 
export function toLocalDate(dt, timezone) {
    const localMS = (dt + timezone) * 1000;
    return new Date(localMS).toISOString().split('T')[0];
}