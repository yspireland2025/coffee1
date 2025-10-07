export const countyCoordinates: Record<string, { lat: number; lng: number }> = {
  'Carlow': { lat: 52.8408, lng: -6.9262 },
  'Cavan': { lat: 53.9908, lng: -7.3606 },
  'Clare': { lat: 52.9047, lng: -8.9811 },
  'Cork': { lat: 51.8985, lng: -8.4756 },
  'Donegal': { lat: 54.6538, lng: -8.1109 },
  'Dublin': { lat: 53.3498, lng: -6.2603 },
  'Galway': { lat: 53.2707, lng: -9.0568 },
  'Kerry': { lat: 52.1551, lng: -9.5668 },
  'Kildare': { lat: 53.1581, lng: -6.9115 },
  'Kilkenny': { lat: 52.6541, lng: -7.2448 },
  'Laois': { lat: 52.9947, lng: -7.3320 },
  'Leitrim': { lat: 54.0666, lng: -8.0973 },
  'Limerick': { lat: 52.6638, lng: -8.6267 },
  'Longford': { lat: 53.7276, lng: -7.7936 },
  'Louth': { lat: 53.9254, lng: -6.5347 },
  'Mayo': { lat: 53.8544, lng: -9.2967 },
  'Meath': { lat: 53.6055, lng: -6.6565 },
  'Monaghan': { lat: 54.2492, lng: -6.9686 },
  'Offaly': { lat: 53.2367, lng: -7.6431 },
  'Roscommon': { lat: 53.7631, lng: -8.2676 },
  'Sligo': { lat: 54.2766, lng: -8.4761 },
  'Tipperary': { lat: 52.4736, lng: -8.1624 },
  'Waterford': { lat: 52.2593, lng: -7.1101 },
  'Westmeath': { lat: 53.5344, lng: -7.4653 },
  'Wexford': { lat: 52.3369, lng: -6.4633 },
  'Wicklow': { lat: 52.9808, lng: -6.0491 }
};

export function getCoordinatesForCounty(county: string): { lat: number; lng: number } | null {
  const normalized = county.trim();
  return countyCoordinates[normalized] || null;
}

export function getCoordinatesFromLocation(location: string, county?: string): { lat: number; lng: number } | null {
  if (county) {
    return getCoordinatesForCounty(county);
  }

  const parts = location.split(',');
  const lastPart = parts[parts.length - 1]?.trim();

  if (lastPart) {
    return getCoordinatesForCounty(lastPart);
  }

  return null;
}
