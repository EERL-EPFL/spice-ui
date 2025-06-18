import React, { useState } from 'react';

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

// Generate dynamic row letters based on tray dimensions
const generateRowLetters = (maxRows: number): string[] => {
    const letters = [];
    for (let i = 0; i < maxRows; i++) {
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

export interface TrayGridProps {
    tray: string;
    qtyXAxis: number;
    qtyYAxis: number;
    orientation: Orientation;
    onRegionSelect: (region: { tray: string; upperLeft: Cell; lowerRight: Cell }) => void;
    existingRegions?: ExistingRegion[];
    readOnly?: boolean; // Add explicit readOnly prop
}

const TrayGrid: React.FC<TrayGridProps> = ({
    tray,
    qtyXAxis,
    qtyYAxis,
    orientation,
    onRegionSelect,
    existingRegions = [],
    readOnly = false,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [startCell, setStartCell] = useState<Cell | null>(null);
    const [endCell, setEndCell] = useState<Cell | null>(null);
    const [hoveredCell, setHoveredCell] = useState<Cell | null>(null);

    // Use the explicit readOnly prop instead of trying to detect it
    const isDisplayMode = readOnly;

    const rowLetters = generateRowLetters(qtyYAxis);

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
    const svgWidth = displayCols * SPACING + SPACING;
    const svgHeight = displayRows * SPACING + SPACING + 20;

    // Generate all label positions based on orientation
    const getLabels = () => {
        const topLabels = [];
        const leftLabels = [];

        // Always: top = numbers (columns), left = letters (rows)
        for (let colIdx = 0; colIdx < qtyXAxis; colIdx++) {
            const number = colIdx + 1;
            const { xIndex } = getDisplayIndices(0, colIdx);
            const cx = SPACING + xIndex * SPACING;
            topLabels.push({ x: cx, y: 15, label: number });
        }
        for (let rowIdx = 0; rowIdx < qtyYAxis; rowIdx++) {
            const letter = rowLetters[rowIdx] || String.fromCharCode(65 + rowIdx);
            const { yIndex } = getDisplayIndices(rowIdx, 0);
            const cy = SPACING + yIndex * SPACING;
            leftLabels.push({ x: 15, y: cy + 5, label: letter });
        }
        return { topLabels, leftLabels };
    };

    const { topLabels, leftLabels } = getLabels();

    return (
        <svg
            width={svgWidth}
            height={svgHeight}
            style={{ border: '1px solid #ccc', background: '#fafafa' }}
            onMouseUp={isDisplayMode ? undefined : handleMouseUp}
            onMouseLeave={isDisplayMode ? undefined : handleMouseLeave}
        >
            {/* 1) Draw all wells (circles) */}
            {Array.from({ length: qtyYAxis }).map((_, rowIdx) =>
                Array.from({ length: qtyXAxis }).map((_, colIdx) => {
                    const { xIndex, yIndex } = getDisplayIndices(rowIdx, colIdx);
                    const cx = SPACING + xIndex * SPACING;
                    const cy = SPACING + yIndex * SPACING;
                    const selected = !isDisplayMode && isCellInSelection(rowIdx, colIdx);
                    const hovered = !isDisplayMode && isCellHovered(rowIdx, colIdx);
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
                            style={{
                                cursor: isDisplayMode ? 'default' : (covered ? 'not-allowed' : 'pointer')
                            }}
                            onMouseDown={isDisplayMode ? undefined : () => handleMouseDown(rowIdx, colIdx)}
                            onMouseEnter={isDisplayMode ? undefined : () => handleMouseEnter(rowIdx, colIdx)}
                            onMouseLeave={isDisplayMode ? undefined : handleMouseLeaveCell}
                        />
                    );
                })
            )}

            {/* 2) Top Labels */}
            {topLabels.map((label, idx) => (
                <text
                    key={`top-label-${idx}`}
                    x={label.x}
                    y={label.y}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#333"
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
                        {!readOnly && (
                            <>
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
                            </>
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

export default TrayGrid;
