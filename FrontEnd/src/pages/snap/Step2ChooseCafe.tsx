import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import MobileLayout from "@/layouts/MobileLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Clock, Loader2 } from "lucide-react";

interface CoffeeVenue {
  id: string;
  name: string;
  address: string;
  distance: number;
  rating?: number;
  openNow?: boolean;
  priceLevel?: number;
}

export default function Step2ChooseCafe() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { image?: string } };
  const img = state?.image;
  
  const [venues, setVenues] = useState<CoffeeVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);

  useEffect(() => {
    fetchNearbyVenues();
  }, []);

  const fetchNearbyVenues = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      let response;
      
      try {
        // Try to get user's current location first
        const position = await getCurrentLocation();
        
        // Fetch nearby coffee shops from backend with user location
        response = await fetch(
          `${apiUrl}/coffee/venues/nearby?lat=${position.coords.latitude}&lng=${position.coords.longitude}&radius=1500`
        );
      } catch (locationError) {
        console.log('Location access denied or unavailable, using default location');
        
        // Fallback to default location (San Francisco) if geolocation fails
        response = await fetch(
          `${apiUrl}/coffee/venues/nearby?lat=37.7749&lng=-122.4194&radius=5000&fallback=true`
        );
      }
      
      const result = await response.json();
      
      if (result.success) {
        setVenues(result.data.venues);
        if (result.data.usedFallback) {
          setError("Using default location. Enable location access for nearby results.");
        }
      } else {
        throw new Error(result.message || "Failed to find nearby coffee shops");
      }
    } catch (error: any) {
      console.error('Error fetching venues:', error);
      setError("Could not fetch coffee shops. Showing sample venues.");
      // Set fallback venues
      setVenues([
        { id: "fallback_1", name: "Local Coffee Shop", address: "Near you", distance: 100 },
        { id: "fallback_2", name: "Café Central", address: "Downtown", distance: 250 },
        { id: "fallback_3", name: "The Coffee House", address: "Main Street", distance: 400 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { timeout: 10000, maximumAge: 300000 } // 10s timeout, 5min cache
      );
    });
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MobileLayout title="Choose Café">
      <section className="p-4">
        <h1 className="sr-only">Choose Café</h1>
        
        <Input 
          placeholder="Search café" 
          className="rounded-full" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Finding nearby coffee shops...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
            <p className="text-sm text-yellow-800">{error}</p>
            {error.includes("location") && (
              <button
                onClick={() => setShowLocationInput(!showLocationInput)}
                className="mt-2 text-sm text-blue-600 underline hover:text-blue-800"
              >
                {showLocationInput ? "Hide" : "Enter location manually"}
              </button>
            )}
          </div>
        )}
        
        {showLocationInput && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">Enter your city or address:</p>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., San Francisco, CA"
                className="flex-1"
              />
              <Button onClick={() => {
                // TODO: Geocode the address and search
                setShowLocationInput(false);
              }}>
                Search
              </Button>
            </div>
          </div>
        )}
        
        {!loading && (
          <ul className="mt-3 space-y-2">
            {filteredVenues.map((venue) => (
              <li key={venue.id}>
                <button
                  onClick={() => navigate("/snap/review", { 
                    state: { 
                      image: img, 
                      cafe: { name: venue.name, address: venue.address, id: venue.id }
                    } 
                  })}
                  className="w-full text-left bg-card border rounded-2xl p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{venue.name}</p>
                        {venue.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-muted-foreground">{venue.rating}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{venue.address}</p>
                      </div>
                      {venue.openNow !== undefined && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className={`text-xs ${venue.openNow ? 'text-green-600' : 'text-red-600'}`}>
                            {venue.openNow ? 'Open now' : 'Closed'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-primary font-medium">
                        {formatDistance(venue.distance)}
                      </span>
                      {venue.priceLevel && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {'$'.repeat(venue.priceLevel)}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
            
            {filteredVenues.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No cafés found matching your search' : 'No nearby coffee shops found'}
                </p>
              </div>
            )}
          </ul>
        )}
      </section>
    </MobileLayout>
  );
}
