import React, { useState } from 'react';

//
// Renders an 8×12 tray of wells with deep, colorblind-safe overlays.
// Two orientations are used: 270° (Tray 1) and 90° (Tray 2).
// Labels (letters and numbers) remain in fixed positions: letters on top, numbers on left.
//
// For Tray 1 (orientation=270):
//   • top labels: H → A (left to right)
//   • left labels: 1 → 12 (bottom to top)
//
// For Tray 2 (orientation=90):
//   • top labels: A → H (left to right)
//   • left labels: 12 → 1 (top to bottom)
//
// Props:
//   - tray: number
//   - orientation: 90 | 270
//   - onRegionSelect: ({ tray, upperLeft: Cell, lowerRight: Cell }) => void
//   - existingRegions?: Array<{ upperLeft: Cell; lowerRight: Cell; name: string; color: string; onRemove: () => void; }>
//
// A "Cell" is { row: 0..7, col: 0..11 } in logical coordinates.
//

export const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const NUM_ROWS = ROW_LETTERS.length; // 8
export const NUM_COLS = 12;                  // 1..12

const CIRCLE_RADIUS = 15;
const SPACING = 40;

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

export type Orientation = 90 | 270;

export interface TrayGridProps {
    tray: number;
    orientation: Orientation;
    onRegionSelect: (region: { tray: number; upperLeft: Cell; lowerRight: Cell }) => void;
    existingRegions?: ExistingRegion[];
}

const TrayGrid: React.FC<TrayGridProps> = ({
    tray,
    orientation,
    onRegionSelect,
    existingRegions = [],
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [startCell, setStartCell] = useState<Cell | null>(null);
    const [endCell, setEndCell] = useState<Cell | null>(null);
    const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);

    // After rotation, we still have 8 rows & 12 columns, but "width" becomes 8 and "height" becomes 12.
    const widthCells = NUM_ROWS;  // 8 display columns
    const heightCells = NUM_COLS; // 12 display rows

    // Convert a logical (row,col) → displayed (xIndex,yIndex) depending on orientation:
    const getDisplayIndices = (row: number, col: number) => {
        if (orientation === 90) {
            // P2 (Tray 2): A→H (left to right), 12→1 (top to bottom)
            // Keep rows normal, invert columns for display
            return { xIndex: row, yIndex: NUM_COLS - 1 - col };
        } else {
            // P1 (Tray 1): H→A (left to right), 1→12 (top to bottom) 
            // Invert rows for display, keep columns normal
            return { xIndex: NUM_ROWS - 1 - row, yIndex: col };
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

    // SVG size: width = (num displayed columns × SPACING + margin), height = (num displayed rows × SPACING + margin + 20 for labels)
    const svgWidth = widthCells * SPACING + SPACING;
    const svgHeight = heightCells * SPACING + SPACING + 20;

    return (
        <svg
            width={svgWidth}
            height={svgHeight}
            style={{ border: '1px solid #ccc', background: '#fafafa' }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
        >
            {/* 1) Draw all 8×12 wells (circles) */}
            {Array.from({ length: NUM_ROWS }).map((_, rowIdx) =>
                Array.from({ length: NUM_COLS }).map((_, colIdx) => {
                    const { xIndex, yIndex } = getDisplayIndices(rowIdx, colIdx);
                    const cx = SPACING + xIndex * SPACING;
                    const cy = SPACING + yIndex * SPACING;
                    const selected = isCellInSelection(rowIdx, colIdx);
                    const hovered = isCellHovered(rowIdx, colIdx);
                    const covered = isCellCovered(rowIdx, colIdx);
                    
                    let fillColor = '#fff';
                    if (selected) {
                        fillColor = 'rgba(0,128,255,0.5)';
                    } else if (hovered) {
                        fillColor = 'rgba(0,128,255,0.2)';
                    } else if (covered) {
                        fillColor = '#f5f5f5';
                    }
                    
                    return (
                        <circle
                            key={`circle-${rowIdx}-${colIdx}`}
                            cx={cx}
                            cy={cy}
                            r={CIRCLE_RADIUS}
                            fill={fillColor}
                            stroke="#333"
                            strokeWidth={1}
                            style={{ cursor: covered ? 'not-allowed' : 'pointer' }}
                            onMouseDown={() => handleMouseDown(rowIdx, colIdx)}
                            onMouseEnter={() => handleMouseEnter(rowIdx, colIdx)}
                            onMouseLeave={handleMouseLeaveCell}
                        />
                    );
                })
            )}

            {/* 2) Row Labels (Letters) */}
            {Array.from({ length: NUM_ROWS }).map((_, rowIdx) => {
                const { xIndex } = getDisplayIndices(rowIdx, 0);
                const cx = SPACING + xIndex * SPACING;
                // For P1 (270°): H→A, For P2 (90°): A→H
                const label = orientation === 90 ? ROW_LETTERS[rowIdx] : ROW_LETTERS[rowIdx];
                return (
                    <text
                        key={`row-label-${rowIdx}`}
                        x={cx}
                        y={15}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#333"
                    >
                        {label}
                    </text>
                );
            })}

            {/* 3) Column Labels (Numbers) */}
            {Array.from({ length: NUM_COLS }).map((_, colIdx) => {
                const { yIndex } = getDisplayIndices(0, colIdx);
                const cy = SPACING + yIndex * SPACING;
                
                let label: number;
                if (orientation === 90) {
                    // P2: 12→1 (top to bottom)
                    // colIdx=0 appears at bottom and should show "1"
                    // colIdx=11 appears at top and should show "12"
                    label = colIdx + 1;
                } else {
                    // P1: 1→12 (top to bottom)
                    label = colIdx + 1;
                }
                
                return (
                    <text
                        key={`col-label-${colIdx}`}
                        x={15}
                        y={cy + 5}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#333"
                    >
                        {label}
                    </text>
                );
            })}

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

                return (
                    <g key={`overlay-${idx}`}>
                        <rect
                            x={rectX}
                            y={rectY}
                            width={rectW}
                            height={rectH}
                            fill={region.color}
                            fillOpacity={0.3}
                            stroke={region.color}
                            strokeWidth={2}
                            rx={CIRCLE_RADIUS}
                            ry={CIRCLE_RADIUS}
                        />
                        <text
                            x={rectX + rectW / 2}
                            y={rectY + rectH / 2 + 5}
                            textAnchor="middle"
                            fontSize="14"
                            fontFamily="Arial, sans-serif"
                            fontWeight="600"
                            fill="#000"
                            stroke="#fff"
                            strokeWidth="3"
                            paintOrder="stroke fill"
                        >
                            {region.name || 'Unnamed'}
                        </text>
                        <circle
                            cx={rectX + rectW - 12}
                            cy={rectY + 12}
                            r={10}
                            fill="rgba(255,255,255,0.95)"
                            stroke={region.color}
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
                            fontWeight="bold"
                            style={{ cursor: 'pointer', userSelect: 'none' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                region.onRemove();
                            }}
                        >
                            ×
                        </text>
                    </g>
                );
            })}
        </svg>
    );
};

export default TrayGrid;
