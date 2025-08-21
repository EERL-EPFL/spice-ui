import React, { useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";

const BASE_CIRCLE_RADIUS = 12;
const BASE_SPACING = 30;

export interface ProbePosition {
  probe_number: number;
  column_index: number;
  position_x: number;
  position_y: number;
  name?: string;
}

export interface TrayDisplayProps {
  name: string;
  qtyCols: number; // number of columns (wells horizontally)
  qtyRows: number; // number of rows (wells vertically)
  rotation: number; // rotation in degrees
  wellDiameter?: string; // relative diameter (not used for display but could be)
  maxWidth?: number; // Maximum width constraint
  maxHeight?: number; // Maximum height constraint
  probePositions?: ProbePosition[]; // Optional probe positions to display
  onProbePositionsChange?: (positions: ProbePosition[]) => void; // Callback for probe position changes
  onTrayClick?: (x: number, y: number) => void; // Callback for clicking on tray to add probes
  isAddingProbe?: boolean; // Whether we're in probe adding mode
}

const TrayDisplay: React.FC<TrayDisplayProps> = ({
  name,
  qtyCols,
  qtyRows,
  rotation,
  maxWidth = 500,
  maxHeight = 400,
  probePositions = [],
  onProbePositionsChange,
  onTrayClick,
  isAddingProbe = false,
}) => {
  // State for probe dragging
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    probeIndex: number;
    startX: number;
    startY: number;
  } | null>(null);

  // Generate row letters dynamically based on qtyRows
  const generateRowLetters = (count: number): string[] => {
    const letters = [];
    for (let i = 0; i < count; i++) {
      letters.push(String.fromCharCode(65 + i)); // A, B, C, etc.
    }
    return letters;
  };

  const rowLetters = generateRowLetters(qtyRows);

  // Calculate SVG dimensions and scaling
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const displayCols = isRotated90or270 ? qtyRows : qtyCols;
  const displayRows = isRotated90or270 ? qtyCols : qtyRows;

  // Calculate scale to fit within maxWidth and maxHeight constraints
  const TITLE_HEIGHT = 32;
  const BASE_LABEL_MARGIN = 48; // Increased from 32 to 48 for even more space between labels and wells
  const neededWidth = displayCols * BASE_SPACING + BASE_LABEL_MARGIN * 2;
  const neededHeight =
    displayRows * BASE_SPACING + BASE_LABEL_MARGIN * 2 + TITLE_HEIGHT;

  const scaleX = maxWidth / neededWidth;
  const scaleY = maxHeight / neededHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

  // Adjust margins to allow more space for the tray graphic
  const LABEL_MARGIN = BASE_LABEL_MARGIN * scale; // Margin for axis labels
  const WELL_MARGIN = 8 * scale; // Margin between labels and wells
  const SPACING = BASE_SPACING * scale;
  const CIRCLE_RADIUS = BASE_CIRCLE_RADIUS * scale;

  // SVG size: add space for labels and title
  const svgWidth = displayCols * SPACING + LABEL_MARGIN * 2;
  const svgHeight = displayRows * SPACING + LABEL_MARGIN * 2 + TITLE_HEIGHT;

  // Convert logical (row,col) to display coordinates based on rotation
  const getDisplayIndices = (row: number, col: number) => {
    switch (rotation) {
      case 90:
        return { xIndex: row, yIndex: qtyCols - 1 - col };
      case 180:
        return { xIndex: qtyCols - 1 - col, yIndex: qtyRows - 1 - row };
      case 270:
        return { xIndex: qtyRows - 1 - row, yIndex: col };
      default: // 0 degrees
        return { xIndex: col, yIndex: row };
    }
  };

  // Coordinate conversion functions for probe dragging
  const convertSvgToTrayCoords = useCallback((svgX: number, svgY: number) => {
    // Convert from SVG coordinates back to tray coordinate system (mm)
    const wellAreaWidth = (displayCols - 1) * SPACING;
    const wellAreaHeight = (displayRows - 1) * SPACING;
    
    // Convert SVG coordinates to normalized position within tray area
    const normalizedX = (svgX - LABEL_MARGIN) / wellAreaWidth;
    const normalizedY = (svgY - TITLE_HEIGHT - LABEL_MARGIN) / wellAreaHeight;
    
    // Convert to tray coordinate system (mm)
    const trayWidth = 150; // mm
    const trayHeight = 100; // mm
    
    const trayX = Math.max(0, Math.min(trayWidth, normalizedX * trayWidth));
    const trayY = Math.max(0, Math.min(trayHeight, normalizedY * trayHeight));
    
    return { x: trayX, y: trayY };
  }, [SPACING, LABEL_MARGIN, displayCols, displayRows]);

  // Drag handlers for probe interaction
  const handleProbeMouseDown = useCallback((event: React.MouseEvent, probeIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = (event.currentTarget.parentNode as SVGElement).getBoundingClientRect();
    const svgX = event.clientX - rect.left;
    const svgY = event.clientY - rect.top;
    
    setDragState({
      isDragging: true,
      probeIndex,
      startX: svgX,
      startY: svgY,
    });
  }, []);

  const handleProbeMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragState?.isDragging || !onProbePositionsChange) return;
    
    const rect = (event.currentTarget as SVGElement).getBoundingClientRect();
    const svgX = event.clientX - rect.left;
    const svgY = event.clientY - rect.top;
    
    // Convert SVG coordinates to tray coordinates
    const trayCoords = convertSvgToTrayCoords(svgX, svgY);
    
    // Update the probe position
    const newPositions = [...probePositions];
    newPositions[dragState.probeIndex] = {
      ...newPositions[dragState.probeIndex],
      position_x: Math.round(trayCoords.x * 10) / 10, // Round to 1 decimal place
      position_y: Math.round(trayCoords.y * 10) / 10,
    };
    
    onProbePositionsChange(newPositions);
  }, [dragState, onProbePositionsChange, probePositions, convertSvgToTrayCoords]);

  const handleProbeMouseUp = useCallback(() => {
    setDragState(null);
  }, []);

  // Handle clicking on the SVG to add probes
  const handleSvgClick = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (!isAddingProbe || !onTrayClick) return;

    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const svgX = event.clientX - rect.left;
    const svgY = event.clientY - rect.top;

    // Convert SVG coordinates to tray coordinates
    const trayCoords = convertSvgToTrayCoords(svgX, svgY);
    
    onTrayClick(trayCoords.x, trayCoords.y);
  }, [isAddingProbe, onTrayClick, convertSvgToTrayCoords]);

  // Generate all label positions (no overlap with wells) - ALL 4 SIDES
  const getLabels = () => {
    const topLabels = [];
    const leftLabels = [];
    const bottomLabels = [];
    const rightLabels = [];

    // ENHANCED: Labels on all 4 edges for maximum clarity
    // Calculate what each display position represents based on rotation

    // Helper function to get label for a display column
    const getColumnLabel = (displayCol: number) => {
      switch (rotation) {
        case 0:
          return String(displayCol + 1); // 1,2,3...
        case 90:
          return String.fromCharCode(65 + (qtyRows - 1 - displayCol)); // H,G,F... (corrected)
        case 180:
          return String(qtyCols - displayCol); // 12,11,10...
        case 270:
          return String.fromCharCode(65 + displayCol); // A,B,C... (corrected)
      }
    };

    // Helper function to get label for a display row
    const getRowLabel = (displayRow: number) => {
      switch (rotation) {
        case 0:
          return String.fromCharCode(65 + displayRow); // A,B,C...
        case 90:
          return String(displayRow + 1); // 1,2,3... (corrected)
        case 180:
          return String.fromCharCode(65 + (qtyRows - 1 - displayRow)); // H,G,F...
        case 270:
          return String(qtyCols - displayRow); // 12,11,10... (corrected)
      }
    };

    // Generate labels for all 4 edges with consistent spacing
    const LABEL_DISTANCE = 18 * scale; // Consistent distance from wells for all sides

    for (let displayCol = 0; displayCol < displayCols; displayCol++) {
      const label = getColumnLabel(displayCol);
      const cx = LABEL_MARGIN + displayCol * SPACING;

      // Top labels - consistent distance above wells
      topLabels.push({
        x: cx,
        y: TITLE_HEIGHT + LABEL_MARGIN - CIRCLE_RADIUS - LABEL_DISTANCE,
        label: label,
      });

      // Bottom labels - consistent distance below wells (fixed calculation)
      bottomLabels.push({
        x: cx,
        y:
          TITLE_HEIGHT +
          LABEL_MARGIN +
          (displayRows - 1) * SPACING +
          CIRCLE_RADIUS +
          LABEL_DISTANCE +
          15 * scale,
        label: label,
      });
    }

    for (let displayRow = 0; displayRow < displayRows; displayRow++) {
      const label = getRowLabel(displayRow);
      const cy = TITLE_HEIGHT + LABEL_MARGIN + displayRow * SPACING;

      // Left labels - consistent distance left of wells
      leftLabels.push({
        x: LABEL_MARGIN - CIRCLE_RADIUS - LABEL_DISTANCE,
        y: cy + 4 * scale,
        label: label,
      });

      // Right labels - consistent distance right of wells
      rightLabels.push({
        x:
          LABEL_MARGIN +
          (displayCols - 1) * SPACING +
          CIRCLE_RADIUS +
          LABEL_DISTANCE,
        y: cy + 4 * scale,
        label: label,
      });
    }

    return { topLabels, leftLabels, bottomLabels, rightLabels };
  };

  const wellPositions = (() => {
    const positions = [];
    for (let logicalRow = 0; logicalRow < qtyRows; logicalRow++) {
      for (let logicalCol = 0; logicalCol < qtyCols; logicalCol++) {
        const { xIndex, yIndex } = getDisplayIndices(logicalRow, logicalCol);
        positions.push({
          cx: LABEL_MARGIN + xIndex * SPACING,
          cy: TITLE_HEIGHT + LABEL_MARGIN + yIndex * SPACING,
        });
      }
    }
    return positions;
  })();
  const { topLabels, leftLabels, bottomLabels, rightLabels } = getLabels();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        margin: 0.5,
        maxWidth: maxWidth + "px",
        maxHeight: maxHeight + "px",
      }}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        style={{
          border: "1px solid #ccc",
          background: "#fafafa",
          display: "block",
          cursor: isAddingProbe ? "crosshair" : "default",
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
        onMouseMove={handleProbeMouseMove}
        onMouseUp={handleProbeMouseUp}
        onMouseLeave={handleProbeMouseUp}
        onClick={handleSvgClick}
      >
        {/* Tray name, rotation, well count inside SVG, above wells */}
        <text
          x={svgWidth / 2}
          y={TITLE_HEIGHT / 2.2}
          textAnchor="middle"
          fontSize={18 * scale}
          fontWeight="bold"
          fill="#333"
          style={{ userSelect: "none" }}
        >
          {name} ({rotation}
          <tspan baselineShift="super" fontSize={10 * scale}>
            °
          </tspan>
          )
        </text>
        <text
          x={svgWidth / 2}
          y={TITLE_HEIGHT - 6}
          textAnchor="middle"
          fontSize={13 * scale}
          fill="#666"
          style={{ userSelect: "none" }}
        >
          {qtyCols} × {qtyRows} wells
        </text>
        {/* Top labels */}
        {topLabels.map((label, idx) => (
          <text
            key={`top-${idx}`}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            fontSize={15 * scale}
            fill="#333"
            fontWeight="bold"
            style={{ userSelect: "none" }}
          >
            {label.label}
          </text>
        ))}
        {/* Left labels */}
        {leftLabels.map((label, idx) => (
          <text
            key={`left-${idx}`}
            x={label.x}
            y={label.y + 5 * scale}
            textAnchor="middle"
            fontSize={15 * scale}
            fill="#333"
            fontWeight="bold"
            style={{ userSelect: "none" }}
          >
            {label.label}
          </text>
        ))}
        {/* Bottom labels */}
        {bottomLabels.map((label, idx) => (
          <text
            key={`bottom-${idx}`}
            x={label.x}
            y={label.y}
            textAnchor="middle"
            fontSize={15 * scale}
            fill="#333"
            fontWeight="bold"
            style={{ userSelect: "none" }}
          >
            {label.label}
          </text>
        ))}
        {/* Right labels */}
        {rightLabels.map((label, idx) => (
          <text
            key={`right-${idx}`}
            x={label.x}
            y={label.y + 5 * scale}
            textAnchor="middle"
            fontSize={15 * scale}
            fill="#333"
            fontWeight="bold"
            style={{ userSelect: "none" }}
          >
            {label.label}
          </text>
        ))}
        {/* Draw wells */}
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

        {/* Draw temperature probes */}
        {probePositions.map((probe, index) => {
          // Scale probe positions to the SVG coordinate system
          // We need to map from the probe coordinate system to our SVG coordinate system
          // This assumes probe positions are in the same coordinate space as the wells
          // The wells span from 0,0 to (qtyCols-1)*spacing, (qtyRows-1)*spacing in the display
          
          // Calculate the bounds of the well area
          const wellAreaWidth = (displayCols - 1) * SPACING;
          const wellAreaHeight = (displayRows - 1) * SPACING;
          
          // Map probe position from tray coordinate system (mm) to SVG coordinates
          // Probe coordinates are in millimeters within the tray coordinate space
          // Tray coordinate system: ~0-150mm × 0-100mm (based on freezing-droplets)
          
          let probeX, probeY;
          
          if (probe.position_x !== undefined && probe.position_y !== undefined) {
            // Map from tray coordinate system to SVG display coordinates
            // Tray coordinate space is approximately 150mm × 100mm
            const trayWidth = 150; // mm
            const trayHeight = 100; // mm
            
            probeX = LABEL_MARGIN + (probe.position_x / trayWidth) * wellAreaWidth;
            probeY = TITLE_HEIGHT + LABEL_MARGIN + (probe.position_y / trayHeight) * wellAreaHeight;
          } else {
            // Default center position if no coordinates
            probeX = LABEL_MARGIN + wellAreaWidth / 2;
            probeY = TITLE_HEIGHT + LABEL_MARGIN + wellAreaHeight / 2;
          }
          
          // Clamp to stay within reasonable bounds
          probeX = Math.max(LABEL_MARGIN - 20, Math.min(LABEL_MARGIN + wellAreaWidth + 20, probeX));
          probeY = Math.max(TITLE_HEIGHT + LABEL_MARGIN - 20, Math.min(TITLE_HEIGHT + LABEL_MARGIN + wellAreaHeight + 20, probeY));
          
          return (
            <g key={`probe-${probe.probe_number}`}>
              {/* Probe circle */}
              <circle
                cx={probeX}
                cy={probeY}
                r={10 * scale}
                fill={dragState?.probeIndex === index ? "#ff9800" : "#1976d2"}
                stroke="#fff"
                strokeWidth={2 * scale}
                opacity={0.9}
                style={{ 
                  cursor: onProbePositionsChange ? 'grab' : 'default',
                  userSelect: 'none',
                }}
                onMouseDown={onProbePositionsChange ? (e) => handleProbeMouseDown(e, index) : undefined}
              />
              
              {/* Probe number label */}
              <text
                x={probeX}
                y={probeY + 3 * scale}
                textAnchor="middle"
                fontSize={11 * scale}
                fontWeight="bold"
                fill="white"
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {probe.probe_number}
              </text>

              {/* Probe name label */}
              {probe.name && (
                <text
                  x={probeX}
                  y={probeY - 10 * scale}
                  textAnchor="middle"
                  fontSize={8 * scale}
                  fill="#1976d2"
                  fontWeight="500"
                  style={{ userSelect: "none", pointerEvents: "none" }}
                >
                  {probe.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Box>
  );
};

export default TrayDisplay;
