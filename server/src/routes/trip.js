import { Router } from 'express'; 

export function createTripRouter(tripService) {
    const router = new Router(); 
    router.get('/', async(req, res) => {
        const city = req.query.city; 
        if (typeof city !== 'string' || city.trim() === '') {
            return res.status(400).json({
                error: { code: 'BAD_REQUEST', message: 'Please enter a city name.' }
            })
        }
        const trip = await tripService.getTripInfo(city); 
        res.json(trip); 
    })
    return router; 
}