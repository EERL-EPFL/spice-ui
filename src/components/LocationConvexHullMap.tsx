import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from "react-leaflet";
import { Box, Typography, Card, CardContent, Button } from "@mui/material";
import { useGetOne, useRedirect, useDataProvider } from "react-admin";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { SampleTypeChip } from "./SampleTypeChips";

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to handle map bounds fitting for location data
const LocationMapBoundsHandler: React.FC<{ locationData: any; samplesWithCoords: any[] }> = ({ locationData, samplesWithCoords }) => {
  const map = useMap();
  
  useEffect(() => {
    const bounds: [number, number][] = [];
    
    // Add polygon coordinates if area exists
    if (locationData?.area && locationData.area.coordinates) {
      const coords = locationData.area.coordinates;
      if (locationData.area.type === 'Polygon') {
        coords[0].forEach(([lng, lat]: [number, number]) => {
          bounds.push([lat, lng]);
        });
      } else if (locationData.area.type === 'MultiPolygon') {
        coords.forEach((polygon: any) => {
          polygon[0].forEach(([lng, lat]: [number, number]) => {
            bounds.push([lat, lng]);
          });
        });
      }
    }
    
    // Add sample point coordinates
    samplesWithCoords.forEach(sample => {
      const lat = parseFloat(sample.latitude);
      const lng = parseFloat(sample.longitude);
      bounds.push([lat, lng]);
    });
    
    if (bounds.length > 0) {
      // Use Leaflet's fitBounds method with padding
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, locationData, samplesWithCoords]);
  
  return null;
};

// Component for popup content to properly handle redirect
interface SamplePopupContentProps {
  sample: any;
  lat: number;
  lng: number;
  onViewSample: () => void;
}

const SamplePopupContent: React.FC<SamplePopupContentProps> = ({ 
  sample, 
  lat, 
  lng, 
  onViewSample 
}) => {
  const handleClick = () => {
    // Use window.location to navigate directly
    window.location.href = `/#/samples/${sample.id}/show`;
  };

  return (
    <Box>
      <Typography variant="body2" component="div">
        <strong>{sample.name || "Sample"}</strong>
        <br />
        <Box sx={{ my: 1, display: "flex", alignItems: "center", gap: 1 }}>
          Type: <SampleTypeChip sampleType={sample.type || "Unknown"} size="small" />
        </Box>
        Lat: {lat.toFixed(6)}
        <br />
        Lng: {lng.toFixed(6)}
        <br />
        <Button 
          size="small" 
          variant="outlined"
          onClick={handleClick}
          sx={{ mt: 1 }}
        >
          View Sample
        </Button>
      </Typography>
    </Box>
  );
};

interface LocationConvexHullMapProps {
  locationId: string;
  locationName?: string;
  compact?: boolean;
}

interface LocationData {
  id: string;
  name: string;
  area?: any;
  samples?: any[];
}

export const LocationConvexHullMap: React.FC<LocationConvexHullMapProps> = ({
  locationId,
  locationName,
  compact = false,
}) => {
  const dataProvider = useDataProvider();
  // Use standard react-admin data fetching with caching for location
  const { data: locationData, isLoading: loading, error } = useGetOne('locations', { id: locationId });
  
  // Fetch samples separately using the custom dataProvider method
  const [samples, setSamples] = useState<any[]>([]);
  const [samplesLoading, setSamplesLoading] = useState(true);

  useEffect(() => {
    if (locationId) {
      dataProvider.getLocationSamples('locations', { locationId })
        .then(response => {
          console.log('Location samples API response:', response.data);
          const samplesArray = Array.isArray(response.data) ? response.data : [];
          setSamples(samplesArray);
          setSamplesLoading(false);
        })
        .catch(error => {
          console.error('Error fetching location samples:', error);
          setSamples([]);
          setSamplesLoading(false);
        });
    }
  }, [locationId, dataProvider]);

  // Show loading state
  if (loading || samplesLoading) {
    if (compact) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body2" color="text.secondary">Loading map...</Typography>
        </Box>
      );
    }
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Location Map</Typography>
          <Typography color="text.secondary">Loading map...</Typography>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    if (compact) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <Typography variant="body2" color="error">Failed to load map</Typography>
        </Box>
      );
    }
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Location Map</Typography>
          <Typography color="error">Failed to load map: {error.message || 'Unknown error'}</Typography>
        </CardContent>
      </Card>
    );
  }

  // No data case
  if (!locationData || (!locationData.area && samples.length === 0)) {
    if (compact) {
      return null; // Don't render anything in compact mode if no data
    }
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Location Map</Typography>
          <Typography color="text.secondary">No sample locations to display</Typography>
        </CardContent>
      </Card>
    );
  }

  // Filter samples with valid coordinates and set default map values
  const samplesWithCoords = samples.filter((sample: any) => 
    sample.latitude && sample.longitude && 
    !isNaN(parseFloat(sample.latitude)) && !isNaN(parseFloat(sample.longitude))
  );
  
  console.log('LocationConvexHullMap Debug:', {
    locationId,
    samplesCount: samples.length,
    samplesWithCoordsCount: samplesWithCoords.length,
    locationHasArea: !!locationData?.area,
    samplesWithCoords: samplesWithCoords.map(s => ({ id: s.id, name: s.name, lat: s.latitude, lng: s.longitude }))
  });
  
  // Default map center and zoom - will be overridden by LocationMapBoundsHandler
  const defaultCenter: [number, number] = [39.8283, -98.5795]; // Geographic center of USA
  const defaultZoom = 4;
  
  // World bounds to prevent map wrapping/duplication and grey areas
  const worldBounds: [[number, number], [number, number]] = [
    [-85.051129, -180], // Southwest corner (south, west) - Web Mercator limit
    [85.051129, 180]    // Northeast corner (north, east) - Web Mercator limit
  ];

  const convexHullStyle = {
    fillColor: '#3f51b5',
    weight: 2,
    opacity: 1,
    color: '#1976d2',
    dashArray: '3',
    fillOpacity: 0.1,
  };

  const renderMap = () => (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      minZoom={2}
      maxBounds={worldBounds}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Bounds handler to fit map to location data */}
      <LocationMapBoundsHandler locationData={locationData} samplesWithCoords={samplesWithCoords} />
      
      {/* Render area (convex hull) if available */}
      {locationData?.area && (
        <GeoJSON
          key={`area-${locationId}-${JSON.stringify(locationData.area).slice(0, 50)}`}
          data={locationData.area}
          style={convexHullStyle}
        />
      )}
      
      {/* Render individual sample points if available */}
      {samplesWithCoords.map((sample: any, index: number) => {
        const lat = parseFloat(sample.latitude);
        const lng = parseFloat(sample.longitude);
        
        return (
          <Marker key={sample.id || index} position={[lat, lng]}>
            <Popup>
              <SamplePopupContent 
                sample={sample} 
                lat={lat} 
                lng={lng} 
                onViewSample={() => {}}
              />
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );

  if (compact) {
    return renderMap();
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {locationData.name || locationName || "Location"} Sample Map
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {samplesWithCoords.length} sample{samplesWithCoords.length !== 1 ? 's' : ''} in this location
          {locationData.area && " with area boundary"}
        </Typography>
        <Box sx={{ height: 400, width: "100%" }}>
          {renderMap()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default LocationConvexHullMap;