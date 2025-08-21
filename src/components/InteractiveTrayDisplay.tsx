import React, { useState, useCallback } from "react";
import { Box, Typography, Button, Chip, Tooltip, IconButton } from "@mui/material";
import { Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material";
import { useInput } from "react-admin";

const BASE_CIRCLE_RADIUS = 12;
const BASE_SPACING = 30;

export interface ProbePosition {
  probe_number: number;
  column_index: number;
  position_x: number;
  position_y: number;
  name?: string;
}

export interface InteractiveTrayDisplayProps {
  name: string;
  qtyCols: number;
  qtyRows: number;
  rotation: number;
  wellDiameter?: number;
  maxWidth?: number;
  maxHeight?: number;
  probePositions?: ProbePosition[];
  positionUnits?: string;
  onProbePositionsChange?: (positions: ProbePosition[]) => void;
}

const InteractiveTrayDisplay: React.FC<InteractiveTrayDisplayProps> = ({
  name,
  qtyCols,
  qtyRows,
  rotation,
  maxWidth = 500,
  maxHeight = 400,
  probePositions = [],
  positionUnits = "mm",
  onProbePositionsChange,
}) => {
  const [isAddingProbe, setIsAddingProbe] = useState(false);
  const { field } = useInput({ source: 'probe_locations', defaultValue: [] });

  // Generate row letters dynamically
  const generateRowLetters = (count: number): string[] => {
    const letters = [];
    for (let i = 0; i < count; i++) {
      letters.push(String.fromCharCode(65 + i));
    }
    return letters;
  };

  const rowLetters = generateRowLetters(qtyRows);

  // Calculate SVG dimensions and scaling
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const displayCols = isRotated90or270 ? qtyRows : qtyCols;
  const displayRows = isRotated90or270 ? qtyCols : qtyRows;

  const TITLE_HEIGHT = 32;
  const BASE_LABEL_MARGIN = 48;
  const neededWidth = displayCols * BASE_SPACING + BASE_LABEL_MARGIN * 2;
  const neededHeight = displayRows * BASE_SPACING + BASE_LABEL_MARGIN * 2 + TITLE_HEIGHT;

  const scaleX = maxWidth / neededWidth;
  const scaleY = maxHeight / neededHeight;
  const scale = Math.min(scaleX, scaleY, 1);

  const LABEL_MARGIN = BASE_LABEL_MARGIN * scale;
  const SPACING = BASE_SPACING * scale;
  const CIRCLE_RADIUS = BASE_CIRCLE_RADIUS * scale;

  const svgWidth = displayCols * SPACING + LABEL_MARGIN * 2;
  const svgHeight = displayRows * SPACING + LABEL_MARGIN * 2 + TITLE_HEIGHT;

  // Convert logical coordinates to display coordinates
  const getDisplayIndices = (row: number, col: number) => {
    switch (rotation) {
      case 90:
        return { xIndex: row, yIndex: qtyCols - 1 - col };
      case 180:
        return { xIndex: qtyCols - 1 - col, yIndex: qtyRows - 1 - row };
      case 270:
        return { xIndex: qtyRows - 1 - row, yIndex: col };
      default:
        return { xIndex: col, yIndex: row };
    }
  };

  // Generate well positions
  const wellPositions = (() => {
    const positions = [];
    for (let logicalRow = 0; logicalRow < qtyRows; logicalRow++) {
      for (let logicalCol = 0; logicalCol < qtyCols; logicalCol++) {
        const { xIndex, yIndex } = getDisplayIndices(logicalRow, logicalCol);
        positions.push({
          cx: LABEL_MARGIN + xIndex * SPACING,
          cy: TITLE_HEIGHT + LABEL_MARGIN + yIndex * SPACING,
          logicalRow,
          logicalCol,
        });
      }
    }
    return positions;
  })();

  // Generate labels
  const getLabels = () => {
    const topLabels = [];
    const leftLabels = [];
    const getColumnLabel = (displayCol: number) => {
      switch (rotation) {
        case 0: return String(displayCol + 1);
        case 90: return String.fromCharCode(65 + (qtyRows - 1 - displayCol));
        case 180: return String(qtyCols - displayCol);
        case 270: return String.fromCharCode(65 + displayCol);
      }
    };
    const getRowLabel = (displayRow: number) => {
      switch (rotation) {
        case 0: return String.fromCharCode(65 + displayRow);
        case 90: return String(displayRow + 1);
        case 180: return String.fromCharCode(65 + (qtyRows - 1 - displayRow));
        case 270: return String(qtyCols - displayRow);
      }
    };

    const LABEL_DISTANCE = 18 * scale;
    for (let displayCol = 0; displayCol < displayCols; displayCol++) {
      const label = getColumnLabel(displayCol);
      const cx = LABEL_MARGIN + displayCol * SPACING;
      topLabels.push({
        x: cx,
        y: TITLE_HEIGHT + LABEL_MARGIN - CIRCLE_RADIUS - LABEL_DISTANCE,
        label: label,
      });
    }

    for (let displayRow = 0; displayRow < displayRows; displayRow++) {
      const label = getRowLabel(displayRow);
      const cy = TITLE_HEIGHT + LABEL_MARGIN + displayRow * SPACING;
      leftLabels.push({
        x: LABEL_MARGIN - CIRCLE_RADIUS - LABEL_DISTANCE,
        y: cy + 4 * scale,
        label: label,
      });
    }

    return { topLabels, leftLabels };
  };

  const { topLabels, leftLabels } = getLabels();

  // Handle clicking on the SVG to add probes
  const handleSvgClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isAddingProbe) return;

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Convert SVG coordinates to tray coordinates
    const wellAreaWidth = (displayCols - 1) * SPACING;
    const wellAreaHeight = (displayRows - 1) * SPACING;
    
    // Map click position to tray coordinate system (mm)
    const trayX = ((x - LABEL_MARGIN) / wellAreaWidth) * 150; // Assuming 150mm max range
    const trayY = ((y - TITLE_HEIGHT - LABEL_MARGIN) / wellAreaHeight) * 100; // Assuming 100mm max range
    
    // Clamp to reasonable bounds
    const clampedX = Math.max(0, Math.min(150, trayX));
    const clampedY = Math.max(0, Math.min(100, trayY));

    // Find next probe number
    const currentProbes = field.value || [];
    const nextProbeNumber = currentProbes.length > 0 
      ? Math.max(...currentProbes.map((p: ProbePosition) => p.probe_number)) + 1 
      : 1;
    
    // Find next Excel column
    const nextColumnIndex = currentProbes.length > 0 
      ? Math.max(...currentProbes.map((p: ProbePosition) => p.column_index)) + 1 
      : 2;

    const newProbe: ProbePosition = {
      probe_number: nextProbeNumber,
      column_index: nextColumnIndex,
      position_x: Math.round(clampedX * 10) / 10, // Round to 1 decimal
      position_y: Math.round(clampedY * 10) / 10,
      name: `Probe ${nextProbeNumber}`,
    };

    const updatedProbes = [...currentProbes, newProbe];
    field.onChange(updatedProbes);
    setIsAddingProbe(false);
  }, [isAddingProbe, field, displayCols, displayRows, LABEL_MARGIN, SPACING, TITLE_HEIGHT]);

  // Remove probe
  const removeProbe = useCallback((probeNumber: number) => {
    const currentProbes = field.value || [];
    const updatedProbes = currentProbes.filter((p: ProbePosition) => p.probe_number !== probeNumber);
    field.onChange(updatedProbes);
  }, [field]);

  // Load default probes
  const loadDefaults = useCallback(() => {
    const defaultProbes: ProbePosition[] = [
      { probe_number: 1, column_index: 2, position_x: 4.5, position_y: 13.5, name: "Probe 1" },
      { probe_number: 2, column_index: 3, position_x: 49.5, position_y: 31.5, name: "Probe 2" },
      { probe_number: 3, column_index: 4, position_x: 49.5, position_y: 67.5, name: "Probe 3" },
      { probe_number: 4, column_index: 5, position_x: 4.5, position_y: 94.5, name: "Probe 4" },
      { probe_number: 5, column_index: 6, position_x: 144.5, position_y: 94.5, name: "Probe 5" },
      { probe_number: 6, column_index: 7, position_x: 99.5, position_y: 67.5, name: "Probe 6" },
      { probe_number: 7, column_index: 8, position_x: 99.5, position_y: 31.5, name: "Probe 7" },
      { probe_number: 8, column_index: 9, position_x: 144.5, position_y: 13.5, name: "Probe 8" },
    ];
    field.onChange(defaultProbes);
  }, [field]);

  const currentProbes = field.value || [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Control Panel */}
      <Box sx={{ mb: 2, width: '100%' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="caption" color="text.secondary">
            {currentProbes.length} probe{currentProbes.length !== 1 ? 's' : ''} configured
          </Typography>
          <Box display="flex" gap={0.5}>
            <Chip
              size="small"
              label="8-Probe Default"
              variant="outlined"
              clickable
              onClick={loadDefaults}
              color="primary"
            />
          </Box>
        </Box>
        
        <Box display="flex" gap={1} mb={1}>
          <Button
            size="small"
            variant={isAddingProbe ? "contained" : "outlined"}
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => setIsAddingProbe(!isAddingProbe)}
            fullWidth
          >
            {isAddingProbe ? "Click on tray to place probe" : "Add Probe"}
          </Button>
        </Box>

        {isAddingProbe && (
          <Typography variant="caption" color="primary" sx={{ fontStyle: 'italic' }}>
            Click anywhere on the tray below to place a new temperature probe
          </Typography>
        )}
      </Box>

      {/* Interactive SVG */}
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{
          border: "1px solid #ccc",
          background: "#fafafa",
          cursor: isAddingProbe ? "crosshair" : "default",
          borderRadius: "4px",
        }}
        onClick={handleSvgClick}
      >
        {/* Title */}
        <text
          x={svgWidth / 2}
          y={TITLE_HEIGHT / 2.2}
          textAnchor="middle"
          fontSize={16 * scale}
          fontWeight="bold"
          fill="#333"
        >
          {name} ({rotation}°) - {qtyCols} × {qtyRows} wells
        </text>

        {/* Labels */}
        {topLabels.map((label, idx) => (
          <text
            key={`top-${idx}`}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            fontSize={13 * scale}
            fill="#666"
            fontWeight="bold"
          >
            {label.label}
          </text>
        ))}

        {leftLabels.map((label, idx) => (
          <text
            key={`left-${idx}`}
            x={label.x}
            y={label.y + 4 * scale}
            textAnchor="middle"
            fontSize={13 * scale}
            fill="#666"
            fontWeight="bold"
          >
            {label.label}
          </text>
        ))}

        {/* Wells */}
        {wellPositions.map((pos, idx) => (
          <circle
            key={`well-${idx}`}
            cx={pos.cx}
            cy={pos.cy}
            r={CIRCLE_RADIUS}
            fill="#fff"
            stroke="#333"
            strokeWidth={Math.max(0.8, 1 * scale)}
          />
        ))}

        {/* Temperature Probes */}
        {currentProbes.map((probe: ProbePosition) => {
          const wellAreaWidth = (displayCols - 1) * SPACING;
          const wellAreaHeight = (displayRows - 1) * SPACING;
          
          const probeX = LABEL_MARGIN + (probe.position_x / 150) * wellAreaWidth;
          const probeY = TITLE_HEIGHT + LABEL_MARGIN + (probe.position_y / 100) * wellAreaHeight;
          
          return (
            <g key={`probe-${probe.probe_number}`}>
              {/* Probe circle */}
              <circle
                cx={probeX}
                cy={probeY}
                r={8 * scale}
                fill="#1976d2"
                stroke="#fff"
                strokeWidth={2 * scale}
                opacity={0.9}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Could add probe editing here
                }}
              />
              
              {/* Probe number */}
              <text
                x={probeX}
                y={probeY + 3 * scale}
                textAnchor="middle"
                fontSize={10 * scale}
                fontWeight="bold"
                fill="white"
                style={{ pointerEvents: 'none' }}
              >
                {probe.probe_number}
              </text>

              {/* Probe name/info */}
              <text
                x={probeX}
                y={probeY - 12 * scale}
                textAnchor="middle"
                fontSize={9 * scale}
                fill="#1976d2"
                fontWeight="500"
                style={{ pointerEvents: 'none' }}
              >
                {probe.name || `P${probe.probe_number}`}
              </text>

              {/* Delete button (small x) */}
              <circle
                cx={probeX + 10 * scale}
                cy={probeY - 10 * scale}
                r={6 * scale}
                fill="#d32f2f"
                stroke="white"
                strokeWidth={1}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  removeProbe(probe.probe_number);
                }}
              />
              <text
                x={probeX + 10 * scale}
                y={probeY - 7 * scale}
                textAnchor="middle"
                fontSize={8 * scale}
                fill="white"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                ×
              </text>
            </g>
          );
        })}
      </svg>

      {/* Probe List */}
      {currentProbes.length > 0 && (
        <Box sx={{ mt: 2, width: '100%' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Configured Probes:
          </Typography>
          {currentProbes.map((probe: ProbePosition) => (
            <Box
              key={probe.probe_number}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                p: 0.5,
                fontSize: '0.75rem',
                bgcolor: 'background.paper',
                borderRadius: 1,
                mb: 0.5,
              }}
            >
              <Typography variant="caption">
                {probe.name || `Probe ${probe.probe_number}`}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({probe.position_x}, {probe.position_y}) {positionUnits}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default InteractiveTrayDisplay;