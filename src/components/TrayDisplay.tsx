import React from 'react';
import { Box, Typography } from '@mui/material';

const BASE_CIRCLE_RADIUS = 12;
const BASE_SPACING = 30;

export interface TrayDisplayProps {
    name: string;
    qtyCols: number;  // number of columns (wells horizontally)
    qtyRows: number;  // number of rows (wells vertically)
    rotation: number;  // rotation in degrees
    wellDiameter?: string; // relative diameter (not used for display but could be)
    maxWidth?: number; // Maximum width constraint
    maxHeight?: number; // Maximum height constraint
}

const TrayDisplay: React.FC<TrayDisplayProps> = ({
    name,
    qtyCols,
    qtyRows,
    rotation,
    maxWidth = 500,
    maxHeight = 400,
}) => {
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
    const neededHeight = displayRows * BASE_SPACING + BASE_LABEL_MARGIN * 2 + TITLE_HEIGHT;

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
                case 0: return String(displayCol + 1);  // 1,2,3...
                case 90: return String.fromCharCode(65 + (qtyRows - 1 - displayCol));  // H,G,F... (corrected)
                case 180: return String(qtyCols - displayCol);  // 12,11,10...
                case 270: return String.fromCharCode(65 + displayCol);  // A,B,C... (corrected)
            }
        };
        
        // Helper function to get label for a display row
        const getRowLabel = (displayRow: number) => {
            switch (rotation) {
                case 0: return String.fromCharCode(65 + displayRow);  // A,B,C...
                case 90: return String(displayRow + 1);  // 1,2,3... (corrected)
                case 180: return String.fromCharCode(65 + (qtyRows - 1 - displayRow));  // H,G,F...
                case 270: return String(qtyCols - displayRow);  // 12,11,10... (corrected)
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
                label: label
            });
            
            // Bottom labels - consistent distance below wells (fixed calculation)
            bottomLabels.push({ 
                x: cx, 
                y: TITLE_HEIGHT + LABEL_MARGIN + (displayRows - 1) * SPACING + CIRCLE_RADIUS + LABEL_DISTANCE + (15 * scale),
                label: label
            });
        }
        
        for (let displayRow = 0; displayRow < displayRows; displayRow++) {
            const label = getRowLabel(displayRow);
            const cy = TITLE_HEIGHT + LABEL_MARGIN + displayRow * SPACING;
            
            // Left labels - consistent distance left of wells
            leftLabels.push({ 
                x: LABEL_MARGIN - CIRCLE_RADIUS - LABEL_DISTANCE,
                y: cy + (4 * scale),
                label: label
            });
            
            // Right labels - consistent distance right of wells
            rightLabels.push({ 
                x: LABEL_MARGIN + (displayCols - 1) * SPACING + CIRCLE_RADIUS + LABEL_DISTANCE,
                y: cy + (4 * scale),
                label: label
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
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: 0.5,
            maxWidth: maxWidth + 'px',
            maxHeight: maxHeight + 'px',
        }}>
            <svg
                width={svgWidth}
                height={svgHeight}
                style={{ border: '1px solid #ccc', background: '#fafafa', display: 'block' }}
            >
                {/* Tray name, rotation, well count inside SVG, above wells */}
                <text
                    x={svgWidth / 2}
                    y={TITLE_HEIGHT / 2.2}
                    textAnchor="middle"
                    fontSize={18 * scale}
                    fontWeight="bold"
                    fill="#333"
                >
                    {name} ({rotation}
                    <tspan baselineShift="super" fontSize={10 * scale}>°</tspan>)
                </text>
                <text
                    x={svgWidth / 2}
                    y={TITLE_HEIGHT - 6}
                    textAnchor="middle"
                    fontSize={13 * scale}
                    fill="#666"
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
            </svg>
        </Box>
    );
};

export default TrayDisplay;