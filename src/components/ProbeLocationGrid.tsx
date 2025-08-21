import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { ProbeLocation } from "./ProbeConfigurationEditor";

interface ProbeLocationGridProps {
  locations: ProbeLocation[];
  positionUnits: string;
  width?: number;
  height?: number;
}

const ProbeLocationGrid: React.FC<ProbeLocationGridProps> = ({
  locations,
  positionUnits,
  width = 400,
  height = 300,
}) => {
  if (locations.length === 0) {
    return (
      <Paper
        elevation={1}
        sx={{
          width,
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "background.paper",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No probe locations to display
        </Typography>
      </Paper>
    );
  }

  // Find bounds for scaling
  const xPositions = locations.map(l => Number(l.position_x));
  const yPositions = locations.map(l => Number(l.position_y));
  
  const minX = Math.min(...xPositions, 0);
  const maxX = Math.max(...xPositions, 100);
  const minY = Math.min(...yPositions, 0);
  const maxY = Math.max(...yPositions, 100);

  // Add padding around the bounds
  const padding = Math.max((maxX - minX) * 0.1, (maxY - minY) * 0.1, 10);
  const boundedMinX = minX - padding;
  const boundedMaxX = maxX + padding;
  const boundedMinY = minY - padding;
  const boundedMaxY = maxY + padding;

  const boundedWidth = boundedMaxX - boundedMinX;
  const boundedHeight = boundedMaxY - boundedMinY;

  // Calculate scale to fit within the SVG
  const margin = 40; // Space for labels and axes
  const scaleX = (width - margin * 2) / boundedWidth;
  const scaleY = (height - margin * 2) / boundedHeight;
  const scale = Math.min(scaleX, scaleY);

  // Transform coordinate function
  const transformX = (x: number) => (x - boundedMinX) * scale + margin;
  const transformY = (y: number) => height - margin - (y - boundedMinY) * scale;

  // Generate grid lines
  const gridLines = [];
  const gridStep = Math.pow(10, Math.floor(Math.log10(Math.max(boundedWidth, boundedHeight) / 5)));
  
  // Vertical grid lines
  for (let x = Math.ceil(boundedMinX / gridStep) * gridStep; x <= boundedMaxX; x += gridStep) {
    gridLines.push(
      <line
        key={`v${x}`}
        x1={transformX(x)}
        y1={margin}
        x2={transformX(x)}
        y2={height - margin}
        stroke="#e0e0e0"
        strokeWidth={0.5}
      />
    );
  }

  // Horizontal grid lines  
  for (let y = Math.ceil(boundedMinY / gridStep) * gridStep; y <= boundedMaxY; y += gridStep) {
    gridLines.push(
      <line
        key={`h${y}`}
        x1={margin}
        y1={transformY(y)}
        x2={width - margin}
        y2={transformY(y)}
        stroke="#e0e0e0"
        strokeWidth={0.5}
      />
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom color="primary">
        Probe Positions ({positionUnits})
      </Typography>
      
      <Box sx={{ position: "relative", display: "inline-block" }}>
        <svg width={width} height={height} style={{ border: "1px solid #ddd" }}>
          {/* Grid */}
          {gridLines}
          
          {/* Axes */}
          <line
            x1={margin}
            y1={height - margin}
            x2={width - margin}
            y2={height - margin}
            stroke="#666"
            strokeWidth={1}
          />
          <line
            x1={margin}
            y1={margin}
            x2={margin}
            y2={height - margin}
            stroke="#666"
            strokeWidth={1}
          />

          {/* Axis labels */}
          <text
            x={width / 2}
            y={height - 5}
            textAnchor="middle"
            fontSize="12"
            fill="#666"
          >
            X Position ({positionUnits})
          </text>
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#666"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            Y Position ({positionUnits})
          </text>

          {/* Origin marker */}
          <circle
            cx={transformX(0)}
            cy={transformY(0)}
            r={2}
            fill="#999"
            opacity={0.7}
          />
          <text
            x={transformX(0) + 5}
            y={transformY(0) - 5}
            fontSize="10"
            fill="#999"
          >
            (0,0)
          </text>

          {/* Probe locations */}
          {locations.map((location, index) => (
            <g key={`probe-${location.name || index}`}>
              {/* Probe circle */}
              <circle
                cx={transformX(Number(location.position_x))}
                cy={transformY(Number(location.position_y))}
                r={8}
                fill="#1976d2"
                stroke="#fff"
                strokeWidth={2}
                opacity={0.8}
              />
              
              {/* Probe name label */}
              <text
                x={transformX(Number(location.position_x))}
                y={transformY(Number(location.position_y)) + 3}
                textAnchor="middle"
                fontSize="9"
                fontWeight="bold"
                fill="white"
              >
                {location.name ? location.name.substring(0, 3) : location.data_column_index}
              </text>

              {/* Coordinate label */}
              <text
                x={transformX(Number(location.position_x))}
                y={transformY(Number(location.position_y)) - 12}
                textAnchor="middle"
                fontSize="9"
                fill="#333"
                fontWeight="500"
              >
                ({Number(location.position_x).toFixed(1)}, {Number(location.position_y).toFixed(1)})
              </text>

              {/* Data column indicator */}
              <text
                x={transformX(Number(location.position_x)) + 12}
                y={transformY(Number(location.position_y)) + 3}
                textAnchor="start"
                fontSize="8"
                fill="#666"
              >
                Col{location.data_column_index}
              </text>
            </g>
          ))}
        </svg>
      </Box>
    </Paper>
  );
};

export default ProbeLocationGrid;