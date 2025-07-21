import React, { useState } from 'react';
import { Tooltip } from '@mui/material';

//
// Renders a dynamic tray of wells with deep, colorblind-safe overlays.
// Supports any dimensions and orientation based on tray configuration.
// Labels (letters and numbers) remain in fixed positions: letters on top, numbers on left.
//
// Props:
//   - tray: string (tray name)
//   - qtyXAxis: number (columns)
//   - qtyYAxis: number (rows)
//   - orientation: 0 | 90 | 180 | 270
//   - onRegionSelect: ({ tray, upperLeft: Cell, lowerRight: Cell }) => void
//   - existingRegions?: Array<{ upperLeft: Cell; lowerRight: Cell; name: string; color: string; onRemove: () => void; }>
//
// A "Cell" is { row: 0..qtyYAxis-1, col: 0..qtyXAxis-1 } in logical coordinates.
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
    row: number;
    col: number;
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
    sample_name: string | null;
    treatment_name: string | null;
    treatment_id?: string;
    dilution_factor: number | null;
    // Full objects with UUIDs for UI linking
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
    qtyXAxis: number;
    qtyYAxis: number;
    orientation: Orientation;
    onRegionSelect: (region: { tray: string; upperLeft: Cell; lowerRight: Cell }) => void;
    existingRegions?: ExistingRegion[];
    readOnly?: boolean; // Add explicit readOnly prop
    // Time point visualization props
    wellSummaryMap?: Map<string, WellSummary>;
    colorScale?: (value: number | null) => string;
    onWellClick?: (well: WellSummary) => void;
    showTimePointVisualization?: boolean;
    viewMode?: 'regions' | 'results';
    selectedWell?: WellSummary | null; // Add selected well for highlighting
}

const TrayGrid: React.FC<TrayGridProps> = ({
    tray,
    qtyXAxis,
    qtyYAxis,
    orientation,
    onRegionSelect,
    existingRegions = [],
    readOnly = false,
    wellSummaryMap,
    colorScale,
    onWellClick,
    showTimePointVisualization = false,
    viewMode = 'regions',
    selectedWell = null,
}) => {
    // Helper function to format seconds as minutes and seconds
    const formatSeconds = (seconds: number | null | undefined) => {
        if (seconds === null || seconds === undefined) return 'N/A';
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

    const columnLetters = generateColumnLetters(qtyXAxis);

    // Helper function to get well summary for a cell
    const getWellSummary = (row: number, col: number): WellSummary | undefined => {
        if (!showTimePointVisualization || !wellSummaryMap) return undefined;
        // Convert grid coordinates to well coordinate string (e.g., "A6")
        const coordinate = `${String.fromCharCode(65 + col)}${row + 1}`;
        const well = wellSummaryMap.get(coordinate);
        
        
        return well;
    };

    // Helper function to get tooltip text for a well
    const getTooltipText = (row: number, col: number): string => {
        const well = getWellSummary(row, col);
        const coordinate = `${String.fromCharCode(65 + col)}${row + 1}`;
        
        if (!well) return `${coordinate}: No data`;
        
        const phaseText = well.final_state === 'frozen' ? 'Frozen' : 'Liquid';
        let tooltip = `${coordinate}: ${phaseText}`;
        
        if (well.first_phase_change_seconds !== null && well.first_phase_change_seconds !== undefined) {
            const minutes = Math.floor(well.first_phase_change_seconds / 60);
            const seconds = well.first_phase_change_seconds % 60;
            tooltip += `\nFreezing time: ${minutes}m ${seconds}s`;
        }
        
        if (well.treatment?.sample?.name) tooltip += `\nSample: ${well.treatment.sample.name}`;
        if (well.treatment?.name) tooltip += `\nTreatment: ${well.treatment.name}`;
        if (well.dilution_factor) tooltip += `\nDilution: ${well.dilution_factor}`;
        
        return tooltip;
    };

    // Helper function to get well background color
    const getWellColor = (row: number, col: number, selected: boolean, hovered: boolean, covered: boolean): string => {
        if (selected) {
            return 'rgba(0,128,255,0.5)';
        } else if (hovered) {
            return 'rgba(0,128,255,0.2)';
        } else if (showTimePointVisualization && colorScale) {
            const well = getWellSummary(row, col);
            if (well?.first_phase_change_seconds !== null && well?.first_phase_change_seconds !== undefined) {
                return colorScale(well.first_phase_change_seconds);
            }
            return '#ffcccc';
        } else if (covered && viewMode === 'regions') {
            return 'rgba(245,245,245,0.3)'; // More transparent in regions mode
        } else if (covered) {
            return '#f5f5f5';
        }
        return viewMode === 'regions' ? 'rgba(255,255,255,0.7)' : '#fff'; // Slightly transparent wells in regions mode
    };

    // Calculate display dimensions based on orientation
    const isRotated90or270 = orientation === 90 || orientation === 270;
    const displayCols = isRotated90or270 ? qtyYAxis : qtyXAxis;
    const displayRows = isRotated90or270 ? qtyXAxis : qtyYAxis;

    // Convert a logical (row,col) → displayed (xIndex,yIndex) depending on orientation:
    const getDisplayIndices = (row: number, col: number) => {
        switch (orientation) {
            case 90:
                return { xIndex: row, yIndex: qtyXAxis - 1 - col };
            case 180:
                return { xIndex: qtyXAxis - 1 - col, yIndex: qtyYAxis - 1 - row };
            case 270:
                return { xIndex: qtyYAxis - 1 - row, yIndex: col };
            default: // 0 degrees
                return { xIndex: col, yIndex: row };
        }
    };

    // Check if a cell is covered by any existing region
    const isCellCovered = (row: number, col: number) => {
        return existingRegions.some(region => {
            const { upperLeft, lowerRight } = region;
            return row >= upperLeft.row && row <= lowerRight.row &&
                col >= upperLeft.col && col <= lowerRight.col;
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

        // Don't allow selection on covered cells
        if (isCellCovered(row, col)) return;

        setStartCell({ row, col });
        setEndCell({ row, col });
        setIsDragging(true);
    };

    const handleMouseEnter = (row: number, col: number) => {
        if (!isDragging) {
            setHoveredCell({ row, col });
            return;
        }
        // Don't extend selection over covered cells
        if (isCellCovered(row, col)) return;

        setEndCell({ row, col });
    };

    const handleMouseLeaveCell = () => {
        if (!isDragging) {
            setHoveredCell(null);
        }
    };

    const handleMouseUp = () => {
        if (startCell && endCell) {
            const upperLeft: Cell = {
                row: Math.min(startCell.row, endCell.row),
                col: Math.min(startCell.col, endCell.col),
            };
            const lowerRight: Cell = {
                row: Math.max(startCell.row, endCell.row),
                col: Math.max(startCell.col, endCell.col),
            };
            onRegionSelect({ tray, upperLeft, lowerRight });
        }
        setIsDragging(false);
        setStartCell(null);
        setEndCell(null);
    };

    const handleMouseLeave = () => {
        if (isDragging) {
            setIsDragging(false);
            setStartCell(null);
            setEndCell(null);
        }
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
        return hoveredCell?.row === row && hoveredCell?.col === col &&
            !isCellCovered(row, col) && !isDragging;
    };

    // SVG size: width = (num displayed columns × SPACING + margin), height = (num displayed rows × SPACING + margin + 30 for labels)
    const svgWidth = displayCols * SPACING + SPACING;
    const svgHeight = displayRows * SPACING + SPACING + 30;

    // Generate all label positions based on orientation
    const getLabels = () => {
        const topLabels = [];
        const leftLabels = [];

        // Always: top = letters (columns), left = numbers (rows)
        for (let colIdx = 0; colIdx < qtyXAxis; colIdx++) {
            const letter = columnLetters[colIdx] || String.fromCharCode(65 + colIdx);
            const { xIndex } = getDisplayIndices(0, colIdx);
            const cx = SPACING + xIndex * SPACING;
            topLabels.push({ x: cx, y: 12, label: letter });
        }
        for (let rowIdx = 0; rowIdx < qtyYAxis; rowIdx++) {
            const number = rowIdx + 1;
            const { yIndex } = getDisplayIndices(rowIdx, 0);
            const cy = SPACING + yIndex * SPACING;
            leftLabels.push({ x: 8, y: cy + 5, label: number });
        }
        return { topLabels, leftLabels };
    };

    const { topLabels, leftLabels } = getLabels();

    // Create wells render function to use in two places
    const renderWells = (onTop = false) => Array.from({ length: qtyYAxis }).map((_, rowIdx) =>
        Array.from({ length: qtyXAxis }).map((_, colIdx) => {
            const { xIndex, yIndex } = getDisplayIndices(rowIdx, colIdx);
            const cx = SPACING + xIndex * SPACING;
            const cy = SPACING + yIndex * SPACING;
            const selected = !isDisplayMode && isCellInSelection(rowIdx, colIdx);
            const hovered = !isDisplayMode && isCellHovered(rowIdx, colIdx);
            const covered = isCellCovered(rowIdx, colIdx);
            const well = getWellSummary(rowIdx, colIdx);

            const fillColor = getWellColor(rowIdx, colIdx, selected, hovered, covered);

            const coordinate = `${String.fromCharCode(65 + colIdx)}${rowIdx + 1}`;
            // Capture well data at render time to prevent race conditions
            const currentWell = well;
            const tooltipContent = currentWell && showTimePointVisualization ? (
                <div style={{ fontSize: '12px', lineHeight: '1.3' }}>
                    <div style={{ fontWeight: 'bold' }}>
                        {currentWell.tray_name ? `${currentWell.tray_name}: ${coordinate}` : coordinate}
                    </div>
                    {currentWell.first_phase_change_temperature_probes?.average && (
                        <div>{currentWell.first_phase_change_temperature_probes.average}°C</div>
                    )}
                    <div>{formatSeconds(currentWell.first_phase_change_seconds)}</div>
                </div>
            ) : null;

            return (
                <Tooltip
                    key={`tooltip-${onTop ? 'top-' : ''}${rowIdx}-${colIdx}`}
                    title={tooltipContent || ""}
                    enterDelay={500}
                    leaveDelay={200}
                    followCursor
                    disableHoverListener={!tooltipContent}
                >
                    <circle
                        cx={cx}
                        cy={cy}
                        r={CIRCLE_RADIUS}
                        fill={fillColor}
                        stroke={(() => {
                            // Check if this well is selected for highlighting
                            // Match by coordinate AND ensure it's from the same tray
                            const isSelected = selectedWell && well && 
                                selectedWell.coordinate === well.coordinate && 
                                selectedWell.tray_name === tray; // Only highlight in the matching tray
                            
                            if (isSelected) {
                                return "#ff6b35"; // Bold orange border for selected well
                            }
                            return showTimePointVisualization && well ? "#666" : "#333";
                        })()}
                        strokeWidth={(() => {
                            // Check if this well is selected for highlighting
                            // Match by coordinate AND ensure it's from the same tray
                            const isSelected = selectedWell && well && 
                                selectedWell.coordinate === well.coordinate && 
                                selectedWell.tray_name === tray; // Only highlight in the matching tray
                            
                            if (isSelected) {
                                return 4; // Bold border width for selected well
                            }
                            return showTimePointVisualization && well ? 2 : 1;
                        })()}
                        style={{
                            cursor: isDisplayMode ? 
                                (showTimePointVisualization && well ? 'pointer' : 'default') : 
                                (covered ? 'not-allowed' : 'pointer')
                        }}
                        onMouseDown={isDisplayMode ? 
                            (showTimePointVisualization ? () => handleMouseDown(rowIdx, colIdx) : undefined) : 
                            () => handleMouseDown(rowIdx, colIdx)}
                        onMouseEnter={isDisplayMode ? undefined : () => handleMouseEnter(rowIdx, colIdx)}
                        onMouseLeave={isDisplayMode ? undefined : handleMouseLeaveCell}
                    />
                </Tooltip>
            );
        })
    );

    return (
        <svg
            width={svgWidth}
            height={svgHeight}
            style={{ border: '1px solid #ccc', background: '#fafafa' }}
            onMouseUp={isDisplayMode ? undefined : handleMouseUp}
            onMouseLeave={isDisplayMode ? undefined : handleMouseLeave}
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
                    fill="#000"
                    fontWeight="bold"
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
                    fill="#000"
                    fontWeight="bold"
                >
                    {label.label}
                </text>
            ))}

            {/* 4) Existing Region Overlays */}
            {existingRegions.map((region, idx) => {
                const { upperLeft, lowerRight } = region;
                const { xIndex: x1, yIndex: y1 } = getDisplayIndices(upperLeft.row, upperLeft.col);
                const { xIndex: x2, yIndex: y2 } = getDisplayIndices(lowerRight.row, lowerRight.col);

                // Calculate exact boundaries to hug only the selected wells
                const minX = Math.min(x1, x2);
                const maxX = Math.max(x1, x2);
                const minY = Math.min(y1, y2);
                const maxY = Math.max(y1, y2);

                // Position rectangle to hug the wells more tightly
                const rectX = SPACING + minX * SPACING - CIRCLE_RADIUS;
                const rectY = SPACING + minY * SPACING - CIRCLE_RADIUS;
                const rectW = (maxX - minX) * SPACING + 2 * CIRCLE_RADIUS;
                const rectH = (maxY - minY) * SPACING + 2 * CIRCLE_RADIUS;

                // Adjust opacity based on view mode
                const fillOpacity = viewMode === 'results' ? 0.1 : 0.3;
                const strokeOpacity = viewMode === 'results' ? 0.4 : 1.0;
                const textVisible = viewMode === 'regions';

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
                            style={{ pointerEvents: 'none' }} // Allow clicks to pass through to wells
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
                                style={{ pointerEvents: 'none' }} // Allow clicks to pass through to wells
                            >
                                {(region.name || 'Unnamed').split('\n').map((line, index, lines) => (
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
                                    style={{ cursor: 'pointer' }}
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
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
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

            {/* 5) Draw wells on top when in time point mode */}
            {showTimePointVisualization && renderWells(true)}
        </svg>
    );
};

export default TrayGrid;
