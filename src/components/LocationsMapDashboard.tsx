import React from "react";
import { MapContainer, TileLayer, GeoJSON, Popup, Marker } from "react-leaflet";
import { Box, Typography } from "@mui/material";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface LocationsMapDashboardProps {
  locations: any[];
}

export const LocationsMapDashboard: React.FC<LocationsMapDashboardProps> = ({ locations }) => {
  // Filter locations that have area data
  const locationsWithArea = locations.filter(location => location.area);
  
  // State for managing which projects are visible
  const [hiddenProjects, setHiddenProjects] = React.useState<Set<string>>(new Set());
  
  // Get unique projects for legend
  const uniqueProjects = React.useMemo(() => {
    const projectMap = new Map();
    locationsWithArea.forEach(location => {
      if (location.project_id && location.color) {
        const projectName = location.project_name || `Project ${location.project_id.slice(0, 8)}`;
        projectMap.set(location.project_id, {
          id: location.project_id,
          name: projectName,
          color: location.color
        });
      }
    });
    return Array.from(projectMap.values());
  }, [locationsWithArea]);
  
  // Filter locations based on visibility
  const visibleLocations = locationsWithArea.filter(location => 
    !location.project_id || !hiddenProjects.has(location.project_id)
  );
  
  // Toggle project visibility
  const toggleProject = (projectId: string) => {
    setHiddenProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };
  
  if (locationsWithArea.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography color="text.secondary">
          No location areas available for mapping
        </Typography>
      </Box>
    );
  }

  // Calculate map bounds based on all polygon features
  const getAllCoordinates = () => {
    const allCoords: [number, number][] = [];
    
    locationsWithArea.forEach(location => {
      if (location.area && location.area.coordinates) {
        const coords = location.area.coordinates;
        if (location.area.type === 'Polygon') {
          // Polygon has coordinates as [[[lng, lat], [lng, lat], ...]]
          coords[0].forEach(([lng, lat]: [number, number]) => {
            allCoords.push([lat, lng]);
          });
        } else if (location.area.type === 'MultiPolygon') {
          // MultiPolygon has coordinates as [[[[lng, lat], [lng, lat], ...]], ...]
          coords.forEach((polygon: any) => {
            polygon[0].forEach(([lng, lat]: [number, number]) => {
              allCoords.push([lat, lng]);
            });
          });
        }
      }
    });
    
    return allCoords;
  };

  const allCoords = getAllCoordinates();
  let mapCenter: [number, number] = [46.8182, 8.2275]; // Default to Switzerland
  let mapZoom = 10;

  if (allCoords.length > 0) {
    // Calculate bounds
    const lats = allCoords.map(coord => coord[0]);
    const lngs = allCoords.map(coord => coord[1]);
    
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    // Center on the middle of the bounds
    mapCenter = [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
    
    // Calculate appropriate zoom level
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const maxDiff = Math.max(latDiff, lngDiff);
    
    if (maxDiff < 0.001) mapZoom = 16;
    else if (maxDiff < 0.01) mapZoom = 14;
    else if (maxDiff < 0.1) mapZoom = 12;
    else if (maxDiff < 1) mapZoom = 10;
    else mapZoom = 8;
  }

  // Get polygon style based on location color
  const getPolygonStyle = (location: any) => {
    const baseColor = location.color || '#3f51b5'; // Default blue if no color
    return {
      fillColor: baseColor,
      weight: 2,
      opacity: 1,
      color: baseColor,
      dashArray: '3',
      fillOpacity: 0.3,
    };
  };

  const handleLocationClick = (location: any) => {
    // Navigate to location show page
    window.location.href = `/#/locations/${location.id}/show`;
  };

  // Calculate centroid for polygon to place label
  const getPolygonCentroid = (location: any): [number, number] | null => {
    if (!location.area || !location.area.coordinates) return null;
    
    const coords = location.area.coordinates;
    let allCoords: [number, number][] = [];
    
    if (location.area.type === 'Polygon') {
      // Polygon has coordinates as [[[lng, lat], [lng, lat], ...]]
      allCoords = coords[0];
    } else if (location.area.type === 'MultiPolygon') {
      // MultiPolygon has coordinates as [[[[lng, lat], [lng, lat], ...]], ...]
      // Use the first polygon for simplicity
      if (coords.length > 0) {
        allCoords = coords[0][0];
      }
    }
    
    if (allCoords.length === 0) return null;
    
    // Calculate centroid
    let sumLat = 0;
    let sumLng = 0;
    
    allCoords.forEach(([lng, lat]) => {
      sumLat += lat;
      sumLng += lng;
    });
    
    const centroidLat = sumLat / allCoords.length;
    const centroidLng = sumLng / allCoords.length;
    
    return [centroidLat, centroidLng];
  };

  // Create a custom icon for location labels
  const createLabelIcon = (locationName: string, color: string) => {
    const displayName = locationName || 'Unnamed Location';
    const borderColor = color || '#3f51b5';
    
    // Use dark text for better readability against white background
    const textColor = '#333';
    
    return L.divIcon({
      html: `<span style="background: white; border: 2px solid ${borderColor}; border-radius: 4px; padding: 4px 8px; font-size: 12px; font-weight: bold; color: ${textColor}; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2); cursor: pointer; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${displayName}</span>`,
      className: 'location-label-marker',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  };

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Render location polygons */}
        {visibleLocations.map((location, index) => {
          // Create a key that includes area data to force re-render when polygon changes
          const areaHash = location.area ? JSON.stringify(location.area).slice(0, 50) : 'no-area';
          const uniqueKey = `${location.id || index}-${areaHash}`;
          
          return (
            <GeoJSON
              key={uniqueKey}
              data={location.area}
              style={getPolygonStyle(location)}
              eventHandlers={{
                click: () => handleLocationClick(location),
              }}
            >
              <Popup>
                <div>
                  <strong>{location.name}</strong>
                  <br />
                  <small>Click polygon to view details</small>
                </div>
              </Popup>
            </GeoJSON>
          );
        })}
        
        {/* Render location labels */}
        {visibleLocations.map((location, index) => {
          const centroid = getPolygonCentroid(location);
          if (!centroid) return null;
          
          return (
            <Marker
              key={`label-${location.id || index}`}
              position={centroid}
              icon={createLabelIcon(location.name, location.color)}
              eventHandlers={{
                click: () => handleLocationClick(location),
              }}
            />
          );
        })}
      </MapContainer>
      
      {/* Legend */}
      {uniqueProjects.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(4px)',
            borderRadius: 1,
            border: '1px solid rgba(0, 0, 0, 0.1)',
            p: 1.5,
            minWidth: 120,
            maxWidth: 200,
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
            Projects
          </Typography>
          {uniqueProjects.map((project) => {
            const isHidden = hiddenProjects.has(project.id);
            return (
              <Box
                key={project.id}
                onClick={() => toggleProject(project.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 0.5,
                  cursor: 'pointer',
                  opacity: isHidden ? 0.5 : 1,
                  transition: 'opacity 0.2s ease',
                  '&:last-child': { mb: 0 },
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  },
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 0.5
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    backgroundColor: isHidden ? 'transparent' : project.color,
                    border: `2px solid ${project.color}`,
                    borderRadius: 0.5,
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textDecoration: isHidden ? 'line-through' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {project.name}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </div>
  );
};