import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cloud, Wind, Droplets, Search, Loader2, RefreshCw, Thermometer } from 'lucide-react';
import type { WeatherData, WeatherResponse } from './types';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const DEFAULT_CITIES = ['London', 'New York', 'Tokyo', 'Paris', 'Sydney'];

function App() {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [error, setError] = useState('');
  const [isCelsius, setIsCelsius] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const convertTemp = (celsius: number): number => {
    return isCelsius ? celsius : (celsius * 9/5) + 32;
  };

  const formatTemp = (temp: number): string => {
    return `${Math.round(temp)}°${isCelsius ? 'C' : 'F'}`;
  };

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  const fetchWeatherData = async (city: string) => {
    try {
      const response = await axios.get<WeatherResponse>(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );

      return {
        id: response.data.id,
        city: response.data.name,
        temperature: response.data.main.temp,
        feelsLike: response.data.main.feels_like,
        description: response.data.weather[0].description,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        icon: response.data.weather[0].icon,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Error fetching weather for ${city}:`, error);
      return null;
    }
  };

  const refreshWeather = async (cityId: number) => {
    const cityToRefresh = weatherData.find(data => data.id === cityId);
    if (!cityToRefresh) return;

    setRetrying(true);
    const updatedData = await fetchWeatherData(cityToRefresh.city);
    setRetrying(false);

    if (updatedData) {
      setWeatherData(prev =>
        prev.map(data => data.id === cityId ? updatedData : data)
      );
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const weatherPromises = DEFAULT_CITIES.map(city => fetchWeatherData(city));
      const results = await Promise.all(weatherPromises);
      setWeatherData(results.filter((data): data is WeatherData => data !== null));
      setLoading(false);
    };

    loadInitialData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity.trim()) return;

    setLoading(true);
    setError('');

    try {
      const newWeatherData = await fetchWeatherData(searchCity);
      if (newWeatherData) {
        setWeatherData(prev => {
          const filtered = prev.filter(item => item.city !== newWeatherData.city);
          return [newWeatherData, ...filtered];
        });
        setSearchCity('');
      } else {
        setError('City not found. Please try again.');
      }
    } catch (error) {
      setError('Failed to fetch weather data. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">
            Weather Forecast Dashboard
          </h1>
          <button
            onClick={() => setIsCelsius(!isCelsius)}
            className="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            <Thermometer size={20} />
            Switch to {isCelsius ? '°F' : '°C'}
          </button>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4 max-w-md mx-auto">
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder="Search for a city..."
              className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              <Search size={20} />
            </button>
          </div>
          {error && (
            <p className="text-red-200 text-center mt-2">{error}</p>
          )}
        </form>

        {loading ? (
          <div className="flex justify-center items-center">
            <Loader2 className="animate-spin text-white" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weatherData.map((weather) => (
              <div
                key={weather.id}
                className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:transform hover:scale-105 transition-transform"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{weather.city}</h2>
                    <p className="text-gray-600 capitalize">{weather.description}</p>
                  </div>
                  <button
                    onClick={() => refreshWeather(weather.id)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={retrying}
                  >
                    <RefreshCw size={20} className={retrying ? 'animate-spin' : ''} />
                  </button>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <div className="text-5xl font-bold text-gray-800">
                    {formatTemp(convertTemp(weather.temperature))}
                  </div>
                  <div className="text-gray-600">
                    Feels like {formatTemp(convertTemp(weather.feelsLike))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Wind size={20} />
                    <span>Wind Speed: {weather.windSpeed} m/s</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Droplets size={20} />
                    <span>Humidity: {weather.humidity}%</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Last updated: {formatTime(weather.lastUpdated)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;