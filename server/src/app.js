import express from 'express';
import cors from 'cors';
import { createTripRouter } from './routes/trip.js';
import { createItineraryRouter } from './routes/itinerary.js';

export function createApp(tripService) {
    const app = express(); 

    app.disable('x-powered-by');
    app.use(cors({origin: 'http://localhost:8000'}));
    app.use(express.json());

    // routes- 
    app.get('/api/health', (req, res) => {
        res.json({status: 'ok'});
    });
    app.use('/api/trip', createTripRouter(tripService));
    app.use('/api/itinerary', createItineraryRouter(tripService));   // innovation: multi-city trip

    app.use((req, res) => {
        res.status(404).json({
            error: {code: 'NOT_FOUND', message: 'Route Not found'}
        });
    });
    
    // Error handler 
    app.use((err, req, res, next) => {
        if (err.status) {
            return res.status(err.status).json({error: {code: err.code || "ERROR", message:err.message}});
        }
        console.error(err);
        res.status(500).json(
            {
                error: {code: "INTERNAL_ERROR", message: "Server is down"}
            }
        )
    })
    return app;
}