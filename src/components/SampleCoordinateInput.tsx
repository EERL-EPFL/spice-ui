import React, { useState, useEffect, Suspense } from 'react';
import { NumberInput, useRecordContext } from 'react-admin';
import { MapContainer, TileLayer, Marker, GeoJSON } from 'react-leaflet';
import { useFormContext } from 'react-hook-form';
import { Box, Typography, CircularProgress } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet's default icon issue
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}

interface SampleCoordinateInputProps {
  disabled?: boolean;
  locationArea?: any; // Optional location polygon to overlay
}

export const SampleCoordinateInput: React.FC<SampleCoordinateInputProps> = ({ 
  disabled = false,
  locationArea 
}) => {
  const { setValue, watch } = useFormContext();
  const record = useRecordContext();
  
  // Watch the latitude and longitude fields
  const watchLatitude = watch('latitude');
  const watchLongitude = watch('longitude');
  
  // Default center (Switzerland)
  const defaultCenter: [number, number] = [46.8182, 8.2275];
  const defaultZoom = 8;
  
  // Current marker position
  const [position, setPosition] = useState<[number, number] | null>(() => {
    if (watchLatitude && watchLongitude) {
      return [parseFloat(watchLatitude), parseFloat(watchLongitude)];
    }
    if (record?.latitude && record?.longitude) {
      return [parseFloat(record.latitude), parseFloat(record.longitude)];
    }
    return null;
  });

  // Initial map center - only set once, don't change when coordinates update
  const [mapCenter] = useState<[number, number]>(() => {
    if (watchLatitude && watchLongitude) {
      return [parseFloat(watchLatitude), parseFloat(watchLongitude)];
    }
    if (record?.latitude && record?.longitude) {
      return [parseFloat(record.latitude), parseFloat(record.longitude)];
    }
    return defaultCenter;
  });

  // Initial zoom - only set once based on whether we have coordinates
  const [mapZoom] = useState<number>(() => {
    return position ? 12 : defaultZoom;
  });

  // Update marker position when form values change (but don't re-center map)
  useEffect(() => {
    if (watchLatitude && watchLongitude) {
      const lat = parseFloat(watchLatitude);
      const lng = parseFloat(watchLongitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setPosition([lat, lng]);
      }
    } else {
      setPosition(null);
    }
  }, [watchLatitude, watchLongitude]);

  // Handle map click to place marker
  const handleMapClick = (event: any) => {
    if (disabled) return;
    const { lat, lng } = event.latlng;
    setPosition([lat, lng]);
    setValue('latitude', lat, { shouldValidate: true });
    setValue('longitude', lng, { shouldValidate: true });
  };

  // Handle marker drag
  const handleMarkerDrag = (event: any) => {
    const { lat, lng } = event.target.getLatLng();
    setPosition([lat, lng]);
    setValue('latitude', lat, { shouldValidate: true });
    setValue('longitude', lng, { shouldValidate: true });
  };

  // Debug logging
  console.log('SampleCoordinateInput render:', {
    watchLatitude,
    watchLongitude,
    position,
    record: record?.latitude ? { lat: record.latitude, lng: record.longitude } : null,
  });

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Sample Coordinates
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Enter coordinates manually or click on the map to set location
      </Typography>
      
      <div style={{ display: 'flex', gap: '16px', flexDirection: 'row' }}>
        {/* Coordinate inputs */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <NumberInput 
            source="latitude" 
            label="Latitude (°)" 
            fullWidth 
            disabled={disabled}
          />
          <div style={{ marginTop: '8px' }}>
            <NumberInput 
              source="longitude" 
              label="Longitude (°)" 
              fullWidth 
              disabled={disabled}
            />
          </div>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {position ? 'Click map or drag marker to update' : 'Click on map to place marker'}
          </Typography>
        </div>
        
        {/* Map Container */}
        <div style={{ flex: 1 }}>
          <div 
            id="sample-map-container"
            style={{ 
              height: '300px', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              backgroundColor: '#f0f0f0',
              position: 'relative'
            }}
          >
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
              whenReady={(mapInstance) => {
                mapInstance.target.on('click', handleMapClick);
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Show marker if position is set */}
              {position && (
                <Marker
                  position={position}
                  draggable={!disabled}
                  eventHandlers={{
                    dragend: handleMarkerDrag,
                  }}
                />
              )}
            </MapContainer>
          </div>
        </div>
      </div>
    </Box>
  );
};

export default SampleCoordinateInput;