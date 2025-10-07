export const geocodingService = {
  async geocodeEircode(eircode: string): Promise<{ latitude: number; longitude: number } | null> {
    if (!eircode) return null;

    try {
      const cleanEircode = eircode.replace(/\s+/g, '').toUpperCase();

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${cleanEircode},Ireland&limit=1`,
        {
          headers: {
            'User-Agent': 'CoffeeMorningApp/1.0'
          }
        }
      );

      if (!response.ok) {
        console.error('Geocoding API error:', response.status);
        return null;
      }

      const data = await response.json();

      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }

      return null;
    } catch (error) {
      console.error('Error geocoding eircode:', error);
      return null;
    }
  },

  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            'User-Agent': 'CoffeeMorningApp/1.0'
          }
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.address?.postcode || null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
};
