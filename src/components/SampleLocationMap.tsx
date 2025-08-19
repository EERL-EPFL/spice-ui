import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Box, Typography, Card, CardContent } from "@mui/material";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface SampleLocationMapProps {
  latitude: number | string | null;
  longitude: number | string | null;
  sampleName?: string;
  compact?: boolean;
}

export const SampleLocationMap: React.FC<SampleLocationMapProps> = ({
  latitude,
  longitude,
  sampleName,
  compact = false,
}) => {
  // Convert to numbers and validate
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
  const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;

  // Show message if no coordinates are available or invalid
  if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
    if (compact) {
      return null; // Don't render anything in compact mode if no coordinates
    }
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sample Location
          </Typography>
          <Typography color="text.secondary">
            No location coordinates defined
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  if (compact) {
    // Compact mode - just the map without card wrapper
    return (
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div>
              <strong>{sampleName || "Sample Location"}</strong>
              <br />
              Lat: {lat.toFixed(6)}
              <br />
              Lng: {lng.toFixed(6)}
              <br />
              <a 
                href={googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#1976d2', textDecoration: 'underline' }}
              >
                Open in Google Maps
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Sample Location
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
        </Typography>
        <Box sx={{ height: 300, width: "100%" }}>
          <MapContainer
            center={[lat, lng]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]}>
              <Popup>
                <div>
                  <strong>{sampleName || "Sample Location"}</strong>
                  <br />
                  Lat: {lat.toFixed(6)}
                  <br />
                  Lng: {lng.toFixed(6)}
                  <br />
                  <a 
                    href={googleMapsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: '#1976d2', textDecoration: 'underline' }}
                  >
                    Open in Google Maps
                  </a>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SampleLocationMap;