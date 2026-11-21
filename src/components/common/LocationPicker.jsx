import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Navigation, AlertCircle, Loader2, Check, RefreshCw } from 'lucide-react';

// Crisp, high-contrast custom SVG Marker Icon to avoid bundler image asset 404s
const customMarkerIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `
    <div style="position: relative; width: 36px; height: 42px; transform: translate(-50%, -100%);">
      <svg viewBox="0 0 24 24" width="36" height="42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C7.58 2 4 5.58 4 10C4 15.25 12 22 12 22C12 22 20 15.25 20 10C20 5.58 16.42 2 12 2Z" fill="#0d9488" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="10" r="3.5" fill="#ffffff"/>
      </svg>
      <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 8px; height: 3px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1px);"></div>
    </div>
  `,
  iconSize: [36, 42],
  iconAnchor: [18, 42]
});

// Map controller to smoothly pan/zoom when coordinates change
function MapCenterController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.lat && center.lng) {
      map.flyTo([center.lat, center.lng], zoom || map.getZoom(), { duration: 0.8 });
    }
  }, [center, zoom, map]);
  return null;
}

// Map click handler component
function MapClickHandler({ onLocationSelected }) {
  useMapEvents({
    click(e) {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// Memory cache to avoid duplicate geocoding calls
const geocodeCache = new Map();
const reverseGeocodeCache = new Map();

// Default fallback location: Bengaluru center (Vidhana Soudha vicinity)
const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 };

export default function LocationPicker({
  value = '',
  coordinates = null,
  onChange,
  onCoordinatesChange
}) {
  const [address, setAddress] = useState(value || '');
  const [currentCoords, setCurrentCoords] = useState(coordinates || DEFAULT_CENTER);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorNotice, setErrorNotice] = useState(null);
  const [mapZoom, setMapZoom] = useState(14);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchDebounceRef = useRef(null);
  const lastRequestTimeRef = useRef(0);
  const abortControllerRef = useRef(null);

  // Sync incoming props
  useEffect(() => {
    if (value && value !== address) {
      setAddress(value);
    }
  }, [value]);

  useEffect(() => {
    if (coordinates && (coordinates.lat !== currentCoords.lat || coordinates.lng !== currentCoords.lng)) {
      setCurrentCoords(coordinates);
    }
  }, [coordinates]);

  // Rate-limited reverse geocoding via OpenStreetMap Nominatim
  const performReverseGeocoding = useCallback(async (lat, lng) => {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (reverseGeocodeCache.has(cacheKey)) {
      const cachedAddress = reverseGeocodeCache.get(cacheKey);
      setAddress(cachedAddress);
      onChange?.(cachedAddress);
      return;
    }

    try {
      setIsReverseGeocoding(true);
      setErrorNotice(null);

      // Respect Nominatim usage policy: min 1 sec spacing
      const now = Date.now();
      const elapsed = now - lastRequestTimeRef.current;
      if (elapsed < 1000) {
        await new Promise(r => setTimeout(r, 1000 - elapsed));
      }
      lastRequestTimeRef.current = Date.now();

      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en'
        }
      });

      if (!response.ok) {
        throw new Error(`Reverse geocoding HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data && data.display_name) {
        // Clean and format address for citizens
        const addrObj = data.address || {};
        const road = addrObj.road || addrObj.pedestrian || addrObj.suburb || '';
        const neighborhood = addrObj.neighbourhood || addrObj.residential || addrObj.suburb || '';
        const city = addrObj.city || addrObj.town || addrObj.county || 'Bengaluru';
        const postcode = addrObj.postcode ? ` - ${addrObj.postcode}` : '';

        let formatted = [road, neighborhood, city].filter(Boolean).join(', ') + postcode;
        if (!formatted || formatted.length < 5) {
          formatted = data.display_name;
        }

        reverseGeocodeCache.set(cacheKey, formatted);
        setAddress(formatted);
        onChange?.(formatted);
      }
    } catch (err) {
      console.warn('Reverse geocoding unavailable; keeping manual/coordinates input:', err.message);
      // Fail gracefully: citizen can always enter address manually
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [onChange]);

  // Handle marker move / map click
  const handleLocationSelected = useCallback((lat, lng, skipReverseGeocode = false) => {
    const newCoords = { lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    setCurrentCoords(newCoords);
    onCoordinatesChange?.(newCoords);

    if (!skipReverseGeocode) {
      performReverseGeocoding(newCoords.lat, newCoords.lng);
    }
  }, [onCoordinatesChange, performReverseGeocoding]);

  // Search places via Nominatim with debouncing & caching
  const searchPlaces = useCallback(async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const trimmed = query.trim().toLowerCase();
    if (geocodeCache.has(trimmed)) {
      setSearchResults(geocodeCache.get(trimmed));
      setShowSearchResults(true);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setIsSearching(true);
      setErrorNotice(null);

      // Respect Nominatim rate limit
      const now = Date.now();
      const elapsed = now - lastRequestTimeRef.current;
      if (elapsed < 1000) {
        await new Promise(r => setTimeout(r, 1000 - elapsed));
      }
      lastRequestTimeRef.current = Date.now();

      // Search prioritizing South India / Bengaluru bounding box, but accepting any location
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5&addressdetails=1`;
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Accept-Language': 'en'
        }
      });

      if (!response.ok) {
        throw new Error(`Search error ${response.status}`);
      }

      const results = await response.json();
      geocodeCache.set(trimmed, results);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('Geocoding search error:', err.message);
      }
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input typing with 600ms debounce
  const handleSearchInputChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      searchPlaces(q);
    }, 600);
  };

  // Select a suggestion from search results
  const handleSelectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const selectedName = result.display_name;

    setAddress(selectedName);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    onChange?.(selectedName);
    handleLocationSelected(lat, lng, true); // skip reverse geocode because search already gave full name
    setMapZoom(16);
  };

  // Browser Geolocation ("Use My Current Location")
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorNotice('Geolocation is not supported by your browser. Please type or click the map.');
      return;
    }

    setIsLocating(true);
    setErrorNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        handleLocationSelected(lat, lng, false);
        setMapZoom(16);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Could not retrieve your location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please allow location access in your browser or select on the map.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location signal unavailable. Please click on the map to set the location.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out. Please try again or select on the map.';
        }
        setErrorNotice(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Drag handler for marker
  const markerEventHandlers = {
    dragend(e) {
      const marker = e.target;
      const position = marker.getLatLng();
      handleLocationSelected(position.lat, position.lng, false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Input with Autocomplete */}
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-teal-600" />
              )}
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
              placeholder="Search landmark, street, or area (e.g. 12th Main Indiranagar)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 text-slate-900 text-xs sm:text-sm font-medium bg-white"
            />
          </div>

          {/* "Use My Location" Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="px-3.5 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-300 font-bold text-xs flex items-center gap-1.5 transition shrink-0 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
            title="Detect your device GPS location"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            ) : (
              <Navigation className="w-4 h-4 text-teal-600" />
            )}
            <span className="hidden sm:inline">Use My Location</span>
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto">
            {searchResults.map((res, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSearchResult(res)}
                className="w-full px-4 py-2.5 text-left text-xs hover:bg-teal-50 hover:text-teal-950 border-b border-slate-100 last:border-b-0 flex items-start gap-2 transition"
              >
                <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span className="truncate">{res.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Leaflet Map */}
      <div className="rounded-xl overflow-hidden border border-slate-300 shadow-sm relative z-0">
        <div className="h-56 sm:h-64 w-full">
          <MapContainer
            center={[currentCoords.lat, currentCoords.lng]}
            zoom={mapZoom}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker
              position={[currentCoords.lat, currentCoords.lng]}
              draggable={true}
              eventHandlers={markerEventHandlers}
              icon={customMarkerIcon}
            />
            <MapCenterController center={currentCoords} zoom={mapZoom} />
            <MapClickHandler onLocationSelected={handleLocationSelected} />
          </MapContainer>
        </div>

        {/* Map Instructions Badge */}
        <div className="bg-slate-50 border-t border-slate-200 px-3 py-1.5 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>Tap/click map or drag marker to pinpoint issue location</span>
          </span>
          {currentCoords && (
            <span className="font-mono text-slate-500 text-[10px]">
              GPS: {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
            </span>
          )}
        </div>
      </div>

      {/* Manual Editable Address Field & Reverse Geocode Status */}
      <div>
        <label className="block text-xs font-bold text-navy-900 mb-1">
          Confirmed Location / Address:
        </label>
        <div className="relative">
          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              onChange?.(e.target.value);
            }}
            placeholder="Selected address will appear here. You can also edit or type manually."
            className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm font-medium bg-white text-slate-800"
          />
          {isReverseGeocoding && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-teal-700 font-semibold bg-white px-2 py-0.5 rounded">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-600" />
              <span>Fetching address...</span>
            </div>
          )}
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Coordinates and address are stored to power accurate community impact grouping.
        </p>
      </div>

      {/* Error notice */}
      {errorNotice && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span className="flex-1">{errorNotice}</span>
          <button
            type="button"
            onClick={() => setErrorNotice(null)}
            className="text-amber-700 hover:text-amber-950 font-bold"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
