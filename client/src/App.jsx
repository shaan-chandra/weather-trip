
import { useState } from 'react';
import CitySearch from './components/CitySearch.jsx';
import CityForecast, { EmptyState, LoadingState, ErrorMessage } from './components/CityForecast.jsx';
import TripPlanner from './components/TripPlanner.jsx';

const background = 'bg-[#03A9F4]';

// used for the two tabs at top- Single City, Multi city in the app
function ViewTabs({ view, onChange }) {
    const active = 'tab tab-active flex-1 bg-white! text-slate-900!';
    const inactive = 'tab flex-1 text-white/80';
    return (
        <div role="tablist" className="tabs tabs-box mb-5 bg-white/10 p-1">
            <button role="tab" className={view === 'single' ? active : inactive} onClick={() => onChange('single')}>
                Single city
            </button>
            <button role="tab" className={view === 'trip' ? active : inactive} onClick={() => onChange('trip')}>
                Multi-city trip
            </button>
        </div>
    );
}

export default function App() {
    const [view, setView] = useState('single'); 
    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    let content; 

    // function for api call to backend for search 
    async function search(city) {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/trip?city=${encodeURIComponent(city)}`)
            if (res.headers.get('content-type')?.includes('application/json') !== true) {
                throw new Error('Could not reach the server. Is it running?');
            }
            const body = await res.json();
            if (!res.ok) {
                throw new Error(body.error?.message || 'Something went wrong');
            }
            setTrip(body)
        } 
        catch(err) {
            setError(err.message)
            setTrip(null)
        }
        finally{
            setLoading(false)
        }
    }

    if (loading) {
        content = <LoadingState />
    }
    else if (error) {
        content = <ErrorMessage message = {error} />;
    }
    else if (trip) {
        content = <CityForecast trip={trip} />;
    }
    else {
        content = <EmptyState />
    }

    return (
        <div className={`min-h-screen ${background} bg-fixed text-white antialiased`}>
            <main className="mx-auto max-w-md px-4 pb-16 pt-6 md:max-w-4xl">
                <ViewTabs view = {view} onChange = {setView} />

                {view === 'single' ? (
                    <div className="space-y-4">
                        <CitySearch onSearch={search} loading={loading} />
                        {content}
                    </div>
                ) : (
                    <TripPlanner />
                )}
            </main>

            <footer className="mx-auto max-w-md px-4 pb-8 text-center text-xs text-white/50 md:max-w-4xl">
                Weather data from OpenWeather.
            </footer>
        </div>
    );
}
