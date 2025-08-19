import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import { Box, Typography, Card, CardContent, Button } from "@mui/material";
import { useGetOne, useRedirect } from "react-admin";
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
  const { data: locationData, isLoading: loading, error } = useGetOne(
    'locations',
    { id: locationId },
    { enabled: !!locationId }
  );

  // Show loading state
  if (loading) {
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
  if (!locationData || (!locationData.area && (!locationData.samples || locationData.samples.length === 0))) {
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

  // Calculate map center and zoom based on samples with coordinates
  const samplesWithCoords = (locationData.samples || []).filter((sample: any) => 
    sample.latitude && sample.longitude && 
    !isNaN(parseFloat(sample.latitude)) && !isNaN(parseFloat(sample.longitude))
  );
  let mapCenter: [number, number] = [46.8182, 8.2275]; // Default to Switzerland
  let mapZoom = 13;

  if (samplesWithCoords.length > 0) {
    // Calculate bounds of all sample points
    const lats = samplesWithCoords.map((sample: any) => parseFloat(sample.latitude));
    const lngs = samplesWithCoords.map((sample: any) => parseFloat(sample.longitude));
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Center on the middle of the bounds
    mapCenter = [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
    
    // Calculate appropriate zoom level based on bounds size
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    if (maxDiff < 0.001) mapZoom = 16;
    else if (maxDiff < 0.01) mapZoom = 14;
    else if (maxDiff < 0.1) mapZoom = 12;
    else if (maxDiff < 1) mapZoom = 10;
    else mapZoom = 8;
  }

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
      center={mapCenter}
      zoom={mapZoom}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Render area (convex hull) if available */}
      {locationData.area && (
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