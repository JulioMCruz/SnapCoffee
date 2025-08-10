import { config } from '@/config';
import axios from 'axios';

export interface PlaceLocation {
  lat: number;
  lng: number;
}

export interface CoffeePlace {
  placeId: string;
  name: string;
  address: string;
  location: PlaceLocation;
  rating?: number;
  priceLevel?: number;
  openNow?: boolean;
  photos?: string[];
  distance?: number; // in meters
}

export interface PlacesSearchRequest {
  location: PlaceLocation;
  radius?: number; // in meters, max 50000
  keyword?: string;
  type?: string;
}

export class GooglePlacesService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor() {
    this.apiKey = config.GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Places API key not configured');
    }
  }

  /**
   * Search for coffee shops near a location
   */
  async searchCoffeeShops(request: PlacesSearchRequest): Promise<CoffeePlace[]> {
    try {
      if (!this.apiKey) {
        // Return mock data if API key not configured
        return this.getMockCoffeeShops(request.location);
      }

      const response = await axios.get(`${this.baseUrl}/nearbysearch/json`, {
        params: {
          location: `${request.location.lat},${request.location.lng}`,
          radius: request.radius || 1500, // 1.5km default
          type: 'cafe',
          keyword: 'coffee',
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        console.error('Places API error:', response.data.status);
        return this.getMockCoffeeShops(request.location);
      }

      return this.transformPlacesToCoffeeShops(
        response.data.results,
        request.location
      );
    } catch (error) {
      console.error('Google Places search error:', error);
      return this.getMockCoffeeShops(request.location);
    }
  }

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails(placeId: string): Promise<CoffeePlace | null> {
    try {
      if (!this.apiKey) {
        return null;
      }

      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: placeId,
          fields: 'name,formatted_address,geometry,rating,price_level,opening_hours,photos',
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK' || !response.data.result) {
        return null;
      }

      const place = response.data.result;
      return {
        placeId,
        name: place.name,
        address: place.formatted_address,
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
        },
        rating: place.rating,
        priceLevel: place.price_level,
        openNow: place.opening_hours?.open_now,
        photos: place.photos?.slice(0, 3).map((photo: any) => 
          `${this.baseUrl}/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
        ),
      };
    } catch (error) {
      console.error('Get place details error:', error);
      return null;
    }
  }

  /**
   * Transform Google Places results to our CoffeePlace format
   */
  private transformPlacesToCoffeeShops(
    places: any[],
    userLocation: PlaceLocation
  ): CoffeePlace[] {
    return places
      .filter((place) => 
        place.business_status === 'OPERATIONAL' &&
        place.types.includes('cafe') &&
        !place.permanently_closed
      )
      .map((place) => {
        const coffeePlace: CoffeePlace = {
          placeId: place.place_id,
          name: place.name,
          address: place.vicinity || place.formatted_address,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          rating: place.rating,
          priceLevel: place.price_level,
          openNow: place.opening_hours?.open_now,
        };

        // Calculate distance
        coffeePlace.distance = this.calculateDistance(
          userLocation,
          coffeePlace.location
        );

        return coffeePlace;
      })
      .sort((a, b) => (a.distance || 0) - (b.distance || 0)) // Sort by distance
      .slice(0, 10); // Limit to 10 results
  }

  /**
   * Calculate distance between two points in meters
   */
  private calculateDistance(point1: PlaceLocation, point2: PlaceLocation): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.lat * Math.PI / 180;
    const φ2 = point2.lat * Math.PI / 180;
    const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
    const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return Math.round(R * c); // Distance in meters
  }

  /**
   * Mock coffee shops for development/fallback
   */
  private getMockCoffeeShops(userLocation: PlaceLocation): CoffeePlace[] {
    const mockShops = [
      {
        placeId: 'mock_blue_bottle',
        name: 'Blue Bottle Coffee',
        address: '123 Main St, San Francisco, CA',
        location: {
          lat: userLocation.lat + 0.001,
          lng: userLocation.lng + 0.001,
        },
        rating: 4.5,
        priceLevel: 3,
        openNow: true,
      },
      {
        placeId: 'mock_philz',
        name: 'Philz Coffee',
        address: '456 Market St, San Francisco, CA',
        location: {
          lat: userLocation.lat - 0.002,
          lng: userLocation.lng + 0.002,
        },
        rating: 4.3,
        priceLevel: 2,
        openNow: true,
      },
      {
        placeId: 'mock_ritual',
        name: 'Ritual Coffee Roasters',
        address: '789 Valencia St, San Francisco, CA',
        location: {
          lat: userLocation.lat + 0.003,
          lng: userLocation.lng - 0.001,
        },
        rating: 4.4,
        priceLevel: 2,
        openNow: false,
      },
    ];

    return mockShops.map(shop => ({
      ...shop,
      distance: this.calculateDistance(userLocation, shop.location),
    })).sort((a, b) => a.distance - b.distance);
  }

  /**
   * Validate API key and test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        return false;
      }

      // Test with a simple place details request for a known place
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4', // Google Sydney Office
          fields: 'name',
          key: this.apiKey,
        },
      });

      return response.data.status === 'OK';
    } catch (error) {
      console.error('Google Places API connection test failed:', error);
      return false;
    }
  }
}