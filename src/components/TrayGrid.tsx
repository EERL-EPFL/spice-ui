import React, { useState } from "react";
import { Tooltip } from "@mui/material";
import { buildRotatedWellGrid } from "../utils/matrixTransform";

//
// Renders a dynamic tray of wells with deep, colorblind-safe overlays.
// Supports any dimensions and orientation based on tray configuration.
// Labels (letters and numbers) remain in fixed positions: letters on top, numbers on left.
//
// Props:
//   - tray: string (tray name)
//   - qtyCols: number (columns)
//   - qtyRows: number (rows)
//   - orientation: 0 | 90 | 180 | 270
//   - onRegionSelect: ({ tray, upperLeft: Cell, lowerRight: Cell }) => void
//   - existingRegions?: Array<{ upperLeft: Cell; lowerRight: Cell; name: string; color: string; onRemove: () => void; }>
//
// A "Cell" is { row: 0..qtyRows-1, col: 0..qtyCols-1 } in logical coordinates.
//

// Generate dynamic column letters based on tray dimensions
const generateColumnLetters = (maxCols: number): string[] => {
  const letters = [];
  for (let i = 0; i < maxCols; i++) {
    letters.push(String.fromCharCode(65 + i)); // A, B, C, etc.
  }
  return letters;
};

const CIRCLE_RADIUS = 12;
const SPACING = 30;

// Logical well coordinate
export interface Cell {
  row: number;
  col: number;
}

// Overlay metadata
export interface ExistingRegion {
  upperLeft: Cell;
  lowerRight: Cell;
  name: string;
  color: string;
  onRemove: () => void;
}

export type Orientation = 0 | 90 | 180 | 270;

// Interface for well summary data from time point visualization
export interface WellSummary {
  row_letter: string;
  column_number: number;
  coordinate: string;
  tray_id?: string;
  tray_name?: string;
  first_phase_change_time: string | null;
  first_phase_change_seconds: number | null;
  first_phase_change_temperature_probes?: {
    probe_1: string;
    probe_2: string;
    probe_3: string;
    probe_4: string;
    probe_5: string;
    probe_6: string;
    probe_7: string;
    probe_8: string;
    average: string;
  };
  final_state: string;
  image_filename_at_freeze?: string | null; // Image filename at time of first phase change
  image_asset_id?: string | null; // UUID of the S3 asset for freeze-time image
  sample_name: string | null;
  treatment_name: string | null;
  treatment_id?: string;
  dilution_factor: number | null;
  // Full objects with UUIDs for UI linking
  sample?: {
    id: string;
    name: string;
    type?: string;
    location_id?: string;
    [key: string]: any; // Allow for additional sample fields
  };
  treatment?: {
    id: string;
    name: string;
    notes?: string;
    enzyme_volume_litres?: number;
    sample?: {
      id: string;
      name: string;
      location?: {
        id: string;
        name: string;
      };
    };
  };
  sample?: {
    id: string;
    name: string;
    location?: {
      id: string;
      name: string;
    };
  };
}

export interface TrayGridProps {
  tray: string;
  qtyCols: number;
  qtyRows: number;
  orientation: Orientation;
  onRegionSelect: (region: {
    tray: string;
    upperLeft: Cell;
    lowerRight: Cell;
    hasOverlap?: boolean;
  }) => void;
  existingRegions?: ExistingRegion[];
  readOnly?: boolean; // Add explicit readOnly prop
  // Time point visualization props
  wellSummaryMap?: Map<string, WellSummary>;
  colorScale?: (value: number | null) => string;
  onWellClick?: (well: WellSummary) => void;
  showTimePointVisualization?: boolean;
  viewMode?: "regions" | "results";
  selectedWell?: WellSummary | null; // Add selected well for highlighting
}

const TrayGrid: React.FC<TrayGridProps> = ({
  tray,
  qtyCols,
  qtyRows,
  orientation,
  onRegionSelect,
  existingRegions = [],
  readOnly = false,
  wellSummaryMap,
  colorScale,
  onWellClick,
  showTimePointVisualization = false,
  viewMode = "regions",
  selectedWell = null,
}) => {
  // Build well grid using matrix transformations with proper naming
  const wellGrid = React.useMemo(() => {
    // Note: qtyCols represents columns, qtyRows represents rows
    const cols = qtyCols; // number of columns (1-12 typical)
    const rows = qtyRows; // number of rows (A-H typical)

    return buildRotatedWellGrid(orientation, cols, rows);
  }, [tray, orientation, qtyCols, qtyRows]);
  // Helper function to format seconds as minutes and seconds
  const formatSeconds = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };
  const [isDragging, setIsDragging] = useState(false);
  const [startCell, setStartCell] = useState<Cell | null>(null);
  const [endCell, setEndCell] = useState<Cell | null>(null);
  const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);

  // Use the explicit readOnly prop instead of trying to detect it
  const isDisplayMode = readOnly;

  const columnLetters = generateColumnLetters(qtyCols);

  // Helper function to get well summary for a cell
  const getWellSummary = (
    row: number,
    col: number,
  ): WellSummary | undefined => {
    if (!showTimePointVisualization || !wellSummaryMap) return undefined;
    // Use the matrix-based coordinate transformation
    const coordinate = wellGrid[row]?.[col] || "ERR";
    if (coordinate === "ERR") return undefined;

    const well = wellSummaryMap.get(coordinate);
    return well;
  };

  // Check if a cell would cause overlap if selected
  const wouldCauseOverlap = (row: number, col: number) => {
    if (!startCell || !endCell) return false;

    // Check if this cell is in current selection
    const minRow = Math.min(startCell.row, endCell.row);
    const maxRow = Math.max(startCell.row, endCell.row);
    const minCol = Math.min(startCell.col, endCell.col);
    const maxCol = Math.max(startCell.col, endCell.col);
    const inSelection =
      row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;

    if (!inSelection) return false;

    // Convert to storage coordinates to check overlap (same logic as handleMouseUp)
    const { xIndex, yIndex } = getDisplayIndices(row, col);
    let storageRow: number;
    let storageCol: number;

    switch (orientation) {
      case 90:
        storageRow = xIndex;
        storageCol = yIndex;
        break;
      case 270:
        storageRow = xIndex;
        storageCol = qtyCols - 1 - yIndex;
        break;
      case 180:
        storageRow = qtyRows - 1 - yIndex;
        storageCol = qtyCols - 1 - xIndex;
        break;
      default: // 0°
        storageRow = yIndex;
        storageCol = xIndex;
        break;
    }

    // Check if storage coordinates overlap with existing regions
    return existingRegions.some((region) => {
      const { upperLeft, lowerRight } = region;
      return (
        storageRow >= upperLeft.row &&
        storageRow <= lowerRight.row &&
        storageCol >= upperLeft.col &&
        storageCol <= lowerRight.col
      );
    });
  };

  // Helper function to get well background color
  const getWellColor = (
    row: number,
    col: number,
    selected: boolean,
    hovered: boolean,
  ): string => {
    // Check for overlap during selection - show red for invalid overlap
    if (selected && wouldCauseOverlap(row, col)) {
      return "rgba(220,38,38,0.7)"; // Red for overlap conflict
    } else if (selected) {
      return "rgba(0,128,255,0.6)"; // Blue for normal selection
    } else if (hovered) {
      return "rgba(0,128,255,0.3)"; // More visible hover
    } else if (showTimePointVisualization && colorScale) {
      const well = getWellSummary(row, col);
      if (
        well?.first_phase_change_seconds !== null &&
        well?.first_phase_change_seconds !== undefined
      ) {
        return colorScale(well.first_phase_change_seconds);
      }
      return "#ffcccc";
    }
    return viewMode === "regions" ? "rgba(255,255,255,0.9)" : "#fff"; // Slightly transparent wells in regions mode
  };

  // Calculate display dimensions based on orientation
  const isRotated90or270 = orientation === 90 || orientation === 270;
  const displayCols = isRotated90or270 ? qtyRows : qtyCols;
  const displayRows = isRotated90or270 ? qtyCols : qtyRows;

  // Convert a logical (row,col) → displayed (xIndex,yIndex) depending on orientation:
  const getDisplayIndices = (row: number, col: number) => {
    switch (orientation) {
      case 90:
        // Swapped: was 270° logic
        return { xIndex: qtyRows - 1 - row, yIndex: col };
      case 180:
        return { xIndex: qtyCols - 1 - col, yIndex: qtyRows - 1 - row };
      case 270:
        // Swapped: was 90° logic
        return { xIndex: row, yIndex: qtyCols - 1 - col };
      default: // 0 degrees
        return { xIndex: col, yIndex: row };
    }
  };

  // Check if a cell is covered by any existing region
  const isCellCovered = (row: number, col: number) => {
    return existingRegions.some((region) => {
      const { upperLeft, lowerRight } = region;
      return (
        row >= upperLeft.row &&
        row <= lowerRight.row &&
        col >= upperLeft.col &&
        col <= lowerRight.col
      );
    });
  };

  const handleMouseDown = (row: number, col: number) => {
    // If in time point visualization mode and there's a well click handler, handle click
    if (showTimePointVisualization && onWellClick) {
      const well = getWellSummary(row, col);
      if (well) {
        onWellClick(well);
        return;
      }
    }

    // Allow selection even on covered cells - users can overlap regions if needed

    // The row, col passed here are logical coordinates from the well rendering loops
    // These should be stored directly as they represent the actual well positions
    setStartCell({ row, col });
    setEndCell({ row, col });
    setIsDragging(true);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!isDragging) {
      setHoveredCell({ row, col });
      return;
    }
    // Allow extending selection over any cells for more fluid experience
    setEndCell({ row, col });
  };

  const handleMouseLeaveCell = () => {
    if (!isDragging) {
      setHoveredCell(null);
    }
  };

  const handleMouseUp = () => {
    if (startCell && endCell) {
      // Check for overlap in the current selection
      let hasOverlap = false;
      const minRow = Math.min(startCell.row, endCell.row);
      const maxRow = Math.max(startCell.row, endCell.row);
      const minCol = Math.min(startCell.col, endCell.col);
      const maxCol = Math.max(startCell.col, endCell.col);

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          if (isCellCovered(row, col)) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) break;
      }

      // RESTORE: Convert coordinates back to correct storage coordinates
      const convertToStorageCoords = (cell: Cell): Cell => {
        const { xIndex, yIndex } = getDisplayIndices(cell.row, cell.col);
        let storageRow: number;
        let storageCol: number;

        switch (orientation) {
          case 90:
            // This was WORKING for P1 - restore it
            storageRow = xIndex;
            storageCol = yIndex;
            break;
          case 270:
            // For 270° rotation: the tray is rotated clockwise 270°
            // What appears at top-left visually was originally at top-right
            // Click position (row=1,col=0) with display indices (xIndex=6,yIndex=0)
            // Should map to storage that represents G12 (row=6,col=11)
            storageRow = xIndex;
            storageCol = qtyCols - 1 - yIndex;
            break;
          case 180:
            storageRow = qtyRows - 1 - yIndex;
            storageCol = qtyCols - 1 - xIndex;
            break;
          default: // 0°
            storageRow = yIndex;
            storageCol = xIndex;
            break;
        }

        return { row: storageRow, col: storageCol };
      };

      const convertedStart = convertToStorageCoords(startCell);
      const convertedEnd = convertToStorageCoords(endCell);

      const upperLeft: Cell = {
        row: Math.min(convertedStart.row, convertedEnd.row),
        col: Math.min(convertedStart.col, convertedEnd.col),
      };
      const lowerRight: Cell = {
        row: Math.max(convertedStart.row, convertedEnd.row),
        col: Math.max(convertedStart.col, convertedEnd.col),
      };

      onRegionSelect({ tray, upperLeft, lowerRight, hasOverlap });
    }
    setIsDragging(false);
    setStartCell(null);
    setEndCell(null);
  };

  const handleMouseLeave = () => {
    // Always reset drag state when leaving the SVG area
    setIsDragging(false);
    setStartCell(null);
    setEndCell(null);
    setHoveredCell(null);
  };

  // True if (row,col) lies in the current click‐drag rectangle
  const isCellInSelection = (row: number, col: number) => {
    if (!startCell || !endCell) return false;
    const minRow = Math.min(startCell.row, endCell.row);
    const maxRow = Math.max(startCell.row, endCell.row);
    const minCol = Math.min(startCell.col, endCell.col);
    const maxCol = Math.max(startCell.col, endCell.col);
    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  };

  // True if this cell should show hover effect
  const isCellHovered = (row: number, col: number) => {
    return hoveredCell?.row === row && hoveredCell?.col === col && !isDragging;
  };

  // SVG size: asymmetric margins for visual centering
  const LABEL_DISTANCE = 18;
  const leftMargin = LABEL_DISTANCE + 25; // Good left spacing
  const topMargin = leftMargin + 10; // Extra top margin to match left margin visually
  const rightMargin = LABEL_DISTANCE + 10; // Reduced right margin
  const bottomMargin = LABEL_DISTANCE + 10; // Reduced bottom margin
  const svgWidth = displayCols * SPACING + leftMargin + rightMargin;
  const svgHeight = displayRows * SPACING + topMargin + bottomMargin;

  // Generate all label positions (ALL 4 SIDES) with correct rotation handling (same as TrayDisplay)
  const getLabels = () => {
    const topLabels = [];
    const leftLabels = [];
    const bottomLabels = [];
    const rightLabels = [];

    // Use consistent label distance from wells (same as TrayDisplay component)
    const LABEL_DISTANCE = 18; // Consistent distance from wells for all sides

    // Helper function to get label for a display column - EXACT SAME LOGIC as TrayDisplay
    const getColumnLabel = (displayCol: number) => {
      switch (orientation) {
        case 0:
          return String(displayCol + 1); // 1,2,3...
        case 90:
          return String.fromCharCode(65 + (qtyRows - 1 - displayCol)); // H,G,F...
        case 180:
          return String(qtyCols - displayCol); // 12,11,10...
        case 270:
          return String.fromCharCode(65 + displayCol); // A,B,C...
        default:
          return String(displayCol + 1);
      }
    };

    // Helper function to get label for a display row - EXACT SAME LOGIC as TrayDisplay
    const getRowLabel = (displayRow: number) => {
      switch (orientation) {
        case 0:
          return String.fromCharCode(65 + displayRow); // A,B,C...
        case 90:
          return String(displayRow + 1); // 1,2,3...
        case 180:
          return String.fromCharCode(65 + (qtyRows - 1 - displayRow)); // H,G,F...
        case 270:
          return String(qtyCols - displayRow); // 12,11,10...
        default:
          return String.fromCharCode(65 + displayRow);
      }
    };

    // Generate labels for ALL 4 EDGES with consistent spacing
    for (let displayCol = 0; displayCol < displayCols; displayCol++) {
      const label = getColumnLabel(displayCol);
      const cx = leftMargin + displayCol * SPACING;

      // Top labels - consistent distance above wells with extra top margin
      topLabels.push({
        x: cx,
        y: topMargin - CIRCLE_RADIUS - LABEL_DISTANCE,
        label: label,
      });

      // Bottom labels - consistent distance below wells
      bottomLabels.push({
        x: cx,
        y:
          topMargin +
          (displayRows - 1) * SPACING +
          CIRCLE_RADIUS +
          LABEL_DISTANCE +
          15,
        label: label,
      });
    }

    for (let displayRow = 0; displayRow < displayRows; displayRow++) {
      const label = getRowLabel(displayRow);
      const cy = topMargin + displayRow * SPACING;

      // Left labels - consistent distance left of wells
      leftLabels.push({
        x: leftMargin - CIRCLE_RADIUS - LABEL_DISTANCE,
        y: cy + 4, // Small adjustment for centering
        label: label,
      });

      // Right labels - consistent distance right of wells
      rightLabels.push({
        x:
          leftMargin +
          (displayCols - 1) * SPACING +
          CIRCLE_RADIUS +
          LABEL_DISTANCE,
        y: cy + 4, // Small adjustment for centering
        label: label,
      });
    }

    return { topLabels, leftLabels, bottomLabels, rightLabels };
  };

  const { topLabels, leftLabels, bottomLabels, rightLabels } = getLabels();

  // Create wells render function to use in two places
  const renderWells = (onTop = false) =>
    Array.from({ length: qtyRows }).map((_, rowIdx) =>
      Array.from({ length: qtyCols }).map((_, colIdx) => {
        const { xIndex, yIndex } = getDisplayIndices(rowIdx, colIdx);
        const cx = leftMargin + xIndex * SPACING;
        const cy = topMargin + yIndex * SPACING;

        const selected = !isDisplayMode && isCellInSelection(rowIdx, colIdx);
        const hovered = !isDisplayMode && isCellHovered(rowIdx, colIdx);
        const well = getWellSummary(rowIdx, colIdx);

        const fillColor = getWellColor(rowIdx, colIdx, selected, hovered);

        // Use the matrix-based coordinate generation
        // rowIdx and colIdx are the logical grid positions (what we're iterating through)
        // The wellGrid tells us what well coordinate should appear at each position
        const matrixCoordinate = wellGrid[rowIdx]?.[colIdx] || "ERR";

        // Use well data coordinate if available, otherwise use matrix-generated
        const coordinate = well?.coordinate || matrixCoordinate;

        // Capture well data at render time to prevent race conditions
        const currentWell = well;
        const tooltipContent =
          currentWell && showTimePointVisualization ? (
            <div style={{ fontSize: "12px", lineHeight: "1.3" }}>
              <div style={{ fontWeight: "bold" }}>
                {currentWell.tray_name
                  ? `${currentWell.tray_name}: ${coordinate}`
                  : coordinate}
              </div>
              {currentWell.first_phase_change_temperature_probes?.average && (
                <div>
                  {currentWell.first_phase_change_temperature_probes.average}°C
                </div>
              )}
              <div>{formatSeconds(currentWell.first_phase_change_seconds)}</div>
            </div>
          ) : null;

        return (
          <Tooltip
            key={`tooltip-${onTop ? "top-" : ""}${rowIdx}-${colIdx}`}
            title={tooltipContent || ""}
            enterDelay={500}
            leaveDelay={200}
            followCursor
            disableHoverListener={!tooltipContent}
          >
            <g>
              {/* Invisible square hit box for easier selection */}
              <rect
                x={cx - SPACING / 2}
                y={cy - SPACING / 2}
                width={SPACING}
                height={SPACING}
                fill="transparent"
                style={{
                  cursor: isDisplayMode
                    ? showTimePointVisualization && well
                      ? "pointer"
                      : "default"
                    : "crosshair",
                  pointerEvents: "all", // Ensure pointer events are enabled
                }}
                onMouseDown={
                  isDisplayMode
                    ? showTimePointVisualization
                      ? () => handleMouseDown(rowIdx, colIdx)
                      : undefined
                    : () => handleMouseDown(rowIdx, colIdx)
                }
                onMouseEnter={
                  isDisplayMode
                    ? undefined
                    : () => handleMouseEnter(rowIdx, colIdx)
                }
                onMouseLeave={isDisplayMode ? undefined : handleMouseLeaveCell}
              />
              {/* Visible circle well */}
              <circle
                cx={cx}
                cy={cy}
                r={CIRCLE_RADIUS}
                fill={fillColor}
                stroke={(() => {
                  // Check if this well is selected for highlighting
                  // Match by coordinate AND ensure it's from the same tray
                  const isSelected =
                    selectedWell &&
                    well &&
                    selectedWell.coordinate === well.coordinate &&
                    selectedWell.tray_name === tray; // Only highlight in the matching tray

                  if (isSelected) {
                    return "#ff6b35"; // Bold orange border for selected well
                  }
                  if (selected || hovered) {
                    return "#0080ff"; // Blue border for selection/hover
                  }
                  return showTimePointVisualization && well ? "#666" : "#333";
                })()}
                strokeWidth={(() => {
                  // Check if this well is selected for highlighting
                  // Match by coordinate AND ensure it's from the same tray
                  const isSelected =
                    selectedWell &&
                    well &&
                    selectedWell.coordinate === well.coordinate &&
                    selectedWell.tray_name === tray; // Only highlight in the matching tray

                  if (isSelected) {
                    return 4; // Bold border width for selected well
                  }
                  if (selected) {
                    return 2; // Thicker border for selection
                  }
                  return showTimePointVisualization && well ? 2 : 1;
                })()}
                style={{ pointerEvents: "none" }} // Let the rect handle all mouse events
              />
            </g>
          </Tooltip>
        );
      }),
    );

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      style={{ border: "1px solid #ccc", background: "#fafafa" }}
      onMouseUp={isDisplayMode ? undefined : handleMouseUp}
      onMouseLeave={isDisplayMode ? undefined : handleMouseLeave}
      onMouseDown={
        isDisplayMode
          ? undefined
          : (e) => {
              // If clicking on SVG background (not a well), clear any selection
              if (e.target === e.currentTarget) {
                setIsDragging(false);
                setStartCell(null);
                setEndCell(null);
              }
            }
      }
    >
      {/* 1) Draw wells first (they will be under regions if not in time point mode) */}
      {!showTimePointVisualization && renderWells(false)}

      {/* 2) Top Labels */}
      {topLabels.map((label, idx) => (
        <text
          key={`top-label-${idx}`}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          fontSize="12"
          fill="#333"
          fontWeight="bold"
          style={{ userSelect: "none" }}
        >
          {label.label}
        </text>
      ))}

      {/* 3) Left Labels */}
      {leftLabels.map((label, idx) => (
        <text
          key={`left-label-${idx}`}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          fontSize="12"
          fill="#333"
          fontWeight="bold"
          style={{ userSelect: "none" }}
        >
          {label.label}
        </text>
      ))}

      {/* 4) Bottom Labels */}
      {bottomLabels.map((label, idx) => (
        <text
          key={`bottom-label-${idx}`}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          fontSize="12"
          fill="#333"
          fontWeight="bold"
          style={{ userSelect: "none" }}
        >
          {label.label}
        </text>
      ))}

      {/* 5) Right Labels */}
      {rightLabels.map((label, idx) => (
        <text
          key={`right-label-${idx}`}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          fontSize="12"
          fill="#333"
          fontWeight="bold"
          style={{ userSelect: "none" }}
        >
          {label.label}
        </text>
      ))}

      {/* 6) Existing Region Overlays */}
      {existingRegions.map((region, idx) => {
        const { upperLeft, lowerRight } = region;

        // Since we now store corrected coordinates, we need to reverse-engineer the display positions
        // The stored coordinates are already in the "storage" coordinate system that we designed
        // We need to convert them directly to display positions without using getDisplayIndices

        // For regions created with the new coordinate system, the stored coordinates
        // represent the logical positions that should map directly to display positions
        let x1: number, y1: number, x2: number, y2: number;

        switch (orientation) {
          case 90:
            // For 90°: storage row maps to display xIndex, storage col maps to display yIndex
            x1 = upperLeft.row;
            y1 = upperLeft.col;
            x2 = lowerRight.row;
            y2 = lowerRight.col;
            break;
          case 270:
            // For 270°: When storing, we used: storageRow = xIndex, storageCol = qtyCols - 1 - yIndex
            // To draw stored coordinates back:
            // xIndex = storageRow, yIndex = qtyCols - 1 - storageCol
            x1 = upperLeft.row;
            y1 = qtyCols - 1 - upperLeft.col;
            x2 = lowerRight.row;
            y2 = qtyCols - 1 - lowerRight.col;
            break;
          case 180:
            x1 = qtyCols - 1 - upperLeft.col;
            y1 = qtyRows - 1 - upperLeft.row;
            x2 = qtyCols - 1 - lowerRight.col;
            y2 = qtyRows - 1 - lowerRight.row;
            break;
          default: // 0°
            x1 = upperLeft.col;
            y1 = upperLeft.row;
            x2 = lowerRight.col;
            y2 = lowerRight.row;
            break;
        }

        // Calculate exact boundaries to hug only the selected wells
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        // Position rectangle to hug the wells more tightly
        const rectX = leftMargin + minX * SPACING - CIRCLE_RADIUS;
        const rectY = topMargin + minY * SPACING - CIRCLE_RADIUS;
        const rectW = (maxX - minX) * SPACING + 2 * CIRCLE_RADIUS;
        const rectH = (maxY - minY) * SPACING + 2 * CIRCLE_RADIUS;

        // Adjust opacity based on view mode
        const fillOpacity = viewMode === "results" ? 0.25 : 0.3;
        const strokeOpacity = viewMode === "results" ? 0.8 : 1.0;
        const textVisible = viewMode === "regions";

        return (
          <g key={`overlay-${idx}`}>
            <rect
              x={rectX}
              y={rectY}
              width={rectW}
              height={rectH}
              fill={region.color}
              fillOpacity={fillOpacity}
              stroke={region.color}
              strokeOpacity={strokeOpacity}
              strokeWidth={2}
              rx={CIRCLE_RADIUS}
              ry={CIRCLE_RADIUS}
              style={{ pointerEvents: "none" }} // Allow clicks to pass through to wells
            />
            {textVisible && (
              <text
                x={rectX + rectW / 2}
                y={rectY + rectH / 2}
                textAnchor="middle"
                fontSize="12"
                fontFamily="Arial, sans-serif"
                fontWeight="600"
                fill="#000"
                fillOpacity={1.0}
                stroke="#fff"
                strokeWidth="2"
                strokeOpacity={1.0}
                paintOrder="stroke fill"
                style={{ pointerEvents: "none", userSelect: "none" }} // Prevent text selection
              >
                {(region.name || "Unnamed")
                  .split("\n")
                  .map((line, index, lines) => (
                    <tspan
                      key={index}
                      x={rectX + rectW / 2}
                      dy={index === 0 ? -(lines.length - 1) * 6 : 12}
                      fontSize={index === 0 ? "12" : "10"}
                      fontWeight={index === 0 ? "600" : "400"}
                    >
                      {line}
                    </tspan>
                  ))}
              </text>
            )}
            {!readOnly && textVisible && (
              <>
                <circle
                  cx={rectX + rectW - 12}
                  cy={rectY + 12}
                  r={10}
                  fill="rgba(255,255,255,0.95)"
                  fillOpacity={showTimePointVisualization ? 0.7 : 1.0}
                  stroke={region.color}
                  strokeOpacity={showTimePointVisualization ? 0.7 : 1.0}
                  strokeWidth={2}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    region.onRemove();
                  }}
                />
                <text
                  x={rectX + rectW - 12}
                  y={rectY + 17}
                  textAnchor="middle"
                  fontSize="16"
                  fontFamily="Arial, sans-serif"
                  fill={region.color}
                  fillOpacity={showTimePointVisualization ? 0.7 : 1.0}
                  fontWeight="bold"
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    region.onRemove();
                  }}
                >
                  ×
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* 7) Draw wells on top when in time point mode */}
      {showTimePointVisualization && renderWells(true)}
    </svg>
  );
};

export default TrayGrid;
