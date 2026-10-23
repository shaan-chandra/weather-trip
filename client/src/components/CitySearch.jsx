/**
 * This file is used for the search box for the app.
 * Uses useState set city to '' and onSearch set it to the city name. 
 */
import { useState } from 'react';
export default function CitySearch({ onSearch, loading }) {
    const [city, setCity] = useState('');
    function handleSubmit(e) {
        e.preventDefault()
        onSearch(city)
    }
    return (
        <>
            <form className="join w-full" role="search" onSubmit = {handleSubmit}>
                <label htmlFor="city" className="sr-only">Destination city</label>
                <input
                    id="city"
                    className="input join-item w-full border-white/25 bg-white/15 text-white placeholder:text-white/60"
                    placeholder="Search a city, like Dublin,IE"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                />
                <button type="submit" className="btn join-item border-white/25 bg-white text-slate-900 hover:bg-white/90">
                {loading && <span className="loading loading-spinner loading-sm" />}
                    Search
                </button>
            </form>
            <p className="-mt-2 px-1 text-xs text-white/60">
                Add a country code if the name is shared, like Paris,FR.
            </p>
        </>
    );
}
