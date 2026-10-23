/**
 * weatherRules.js
 * All weather rules decided by the client. 
 * The server only sends json of numbers. This file decides how to interpret those.
 * 1) Rain -> get umbrella 
 * 2) Temperature -> get advice on what to pack for each temperature (cold/mild/hot) 
 * 3) Air Quality -> which pollutants are above Good and the health risk 
 * 4) Helper functions -> helpers like converting dates and list into readable text 
 */

// 1) Rain Section 

/**
 * The function decides whether the user needs an umbrella 
 * It checks days one at a a time and based on the total rainfall tells the user. 
 */
export function needsUmbrella(days) {
    // Check the days one at a time
    for (const day of days) {
        if (day.rainTotal > 0) {
            return true;              // found a rainy day, so no need to check the rest
        }
    }
    return false;
}
/**
 * The function gives the rain summary of the day for rain 
 * Total mm of rain, how many days are rainy in the forecast, and the wettest day.
 */
export function getRainSummary(days) {
    let totalRain = 0;                    
    let rainyDays = 0;                
    let wettest = days[0];           

    for (const day of days) {
        totalRain = totalRain + day.rainTotal;
        // Count this day if it has any rain
        if (day.rainTotal > 0) {
            rainyDays = rainyDays + 1;
        }
        // If this day is wetter than the wettest so far, it becomes the new wettest
        if (day.rainTotal > wettest.rainTotal) {
            wettest = day;
        }
    }
    return { totalRain: totalRain, rainyDays: rainyDays, wettest: wettest };
}

// 2) Temperature Section 

/**
 * The function is used to get the type of weather the user would need to pack for.
 * However, this does not give advice only what type of weather it is.
 * Cold Mild or Hot based on the sheet's temperature requirements. 
 */
export function getWeatherType(days) {
    let cold = false;
    let mild = false;
    let hot = false;

    for (const day of days) {
        if (day.tempMin < 8) {
            cold = true;
        }
        if (day.tempMax > 24) {
            hot = true;
        }
        if (day.tempMax >= 8 && day.tempMin <= 24) {
            mild = true;
        }
    }
    return { cold: cold, mild: mild, hot: hot };
}

/**
 * The function finds the coldest and hottest day for the given day.
 */
export function getTempExtremes(days) {
    let coldest = days[0];
    let hottest = days[0];

    for (const day of days) {
        if (day.tempMin < coldest.tempMin) {
            coldest = day;            
        }
        if (day.tempMax > hottest.tempMax) {
            hottest = day;            
        }
    }
    return { coldest: coldest, hottest: hottest };
}

// 3) Air Pollution Section 

// The pollutants OpenWeather gives a "Good" level for.
// (NO and NH3 are not in OpenWeather's table, so we don't check them.)
const pollutants = ['so2', 'no2', 'pm10', 'pm2_5', 'o3', 'co'];

// limits of pollutants as per openweather api docs
// structure of list- [good, fair, moderate, poor, very poor] same as Levels desribed belwo 
const limits = {
    so2:   [20, 80, 250, 350],
    no2:   [40, 70, 150, 200],
    pm10:  [20, 50, 100, 200],
    pm2_5: [10, 25, 50, 75],
    o3:    [60, 100, 140, 180],
    co:    [4400, 9400, 12400, 15400],
};

// The level names, in the same order as the limits above
const levels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very poor'];

// The names we show to the user for each pollutant code
const pollutantNames = {
    so2: 'Sulphur dioxide (SO₂)',
    no2: 'Nitrogen dioxide (NO₂)',
    pm10: 'Coarse particles (PM10)',
    pm2_5: 'Fine particles (PM2.5)',
    o3: 'Ozone (O₃)',
    co: 'Carbon monoxide (CO)',
};

// Health effects of each pollutant from WHO
const healthEffects = {
    so2: 'irritates the nose, throat and airways and can trigger asthma symptoms',
    no2: 'inflames the airways and can make asthma and other lung conditions worse',
    pm10: 'are breathed into the airways and can cause coughing and worsen heart and lung conditions',
    pm2_5: 'reach deep into the lungs and bloodstream and can worsen heart and lung conditions',
    o3: 'can cause coughing, a sore throat and chest tightness, especially during exercise',
    co: 'reduces how much oxygen the blood can carry, causing headaches and dizziness at high levels',
};

// Who is affected at each level from WHO.
const healthAdvice = {
    'Fair': "Most people won't notice anything, but very sensitive people may feel it during long outdoor exercise.",
    'Moderate': 'People with asthma, heart or lung conditions, children and older adults should cut down long or intense outdoor activity.',
    'Poor': 'Everyone may start to feel effects. Sensitive groups should avoid strenuous outdoor activity.',
    'Very poor': 'Health warning for everyone: avoid strenuous outdoor activity, and sensitive groups should stay indoors where possible.',
};

/**
 * get the level of pollution from the limits table. 
 */
function getLevel(pollutant, value) {
    const pollutantLimits = limits[pollutant];         // e.g. [60, 100, 140, 180] for ozone

    for (let i = 0; i < pollutantLimits.length; i++) {
        if (value < pollutantLimits[i]) {
            return levels[i];                 // below this edge, so it is this level
        }
    }
    return 'Very poor';
}

/**
 * Find the highest reading of a pollutant across all the days and which day it occurs on.
 */
function getPeak(days, pollutant) {
    let peak = null;                          
    for (const day of days) {

        if (day.pollution !== null) {
            const value = day.pollution[pollutant].value;
            if (peak === null || value > peak.value) {
                peak = { value: value, date: day.date };
            }
        }
    }
    return peak;
}

/**
 * The function builds a warning list for every pollutant that goes above good. 
 */
export function getPollutionWarnings(days) {
    const warnings = [];

    for (const pollutant of pollutants) {
        // 1) get peak of a pollutant 
        const peak = getPeak(days, pollutant);
        if (peak !== null) {
            // 2) Which level that reading falls in
            const level = getLevel(pollutant, peak.value);

            // 3) Only warn if it's above Good
            if (level !== 'Good') {
                const goodLimit = limits[pollutant][0];      
                warnings.push({
                    pollutant: pollutant,
                    name: pollutantNames[pollutant],
                    level: level,
                    value: peak.value,
                    goodLimit: goodLimit,
                    timesLimit: Math.round((peak.value / goodLimit) * 10) / 10,
                    date: peak.date,
                    healthRisk: pollutantNames[pollutant] + ' ' + healthEffects[pollutant] + '. ' + healthAdvice[level],
                });
            }
        }
    }
    return warnings;
}

/**
 * This function lists the pollutants that stayed in the good range. 
 */
export function getGoodPollutants(warnings) {
    const goodPollutants = [];

    for (const pollutant of pollutants) {
        // Check whether the pollutant is in the warning list. 
        let warned = false;
        for (const warning of warnings) {
            if (warning.pollutant === pollutant) {
                warned = true;
            }
        }
        if (warned === false) {
            goodPollutants.push(pollutantNames[pollutant]);
        }
    }

    return goodPollutants;
}

/**
 * Normal error check to see if air pollution data isn't empty 
 */
export function hasAirData(days) {
    for (const day of days) {
        if (day.pollution !== null) {
            return true;
        }
    }
    return false;
}

// 4) Text helpers 

const day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Turn date string to full day name
 */
export function formatDay(date) {
    const d = new Date(date + 'T12:00:00Z');
    return day_names[d.getUTCDay()];
}
/**
 * turn date string into short day
 */
export function formatShortDay(date) {
    return formatDay(date).slice(0, 3);
}
/**
 * turn date string into short date 
 */
export function formatShortDate(date) {
    const d = new Date(date + 'T12:00:00Z');
    return formatShortDay(date) + ' ' + d.getUTCDate() + ' ' + month_names[d.getUTCMonth()];
}

/**
 * combine words into sentece of list 
 */
export function listToText(items) {
    let text = '';

    for (let i = 0; i < items.length; i++) {
        if (i === 0) {
            text = items[i];                   
        } else if (i === items.length - 1) {
            text = text + ' and ' + items[i];   
        } else {
            text = text + ', ' + items[i];         
        }
    }
    return text;
}
