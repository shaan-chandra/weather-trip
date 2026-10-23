import { createOpenWeatherUrl } from './services/openWeatherClient.js';
import { createTripService } from './services/tripService.js';
import { createApp } from './app.js';

process.loadEnvFile();

const apiKey = process.env.OPENWEATHER_API_KEY;
const port = process.env.PORT || 4000;

if (!apiKey) {
    console.error('Missing OPENWEATHER_API_KEY in .env');
    process.exit(1);
}

const weatherClient = createOpenWeatherUrl(apiKey);
const tripService = createTripService(weatherClient);
const app = createApp(tripService);

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});