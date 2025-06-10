import React from 'react';
import { Box, Typography } from '@mui/material';

const BASE_CIRCLE_RADIUS = 12;
const BASE_SPACING = 30;

export interface TrayDisplayProps {
    name: string;
    qtyXAxis: number;  // number of columns (wells horizontally)
    qtyYAxis: number;  // number of rows (wells vertically)
    rotation: number;  // rotation in degrees
    wellDiameter?: string; // relative diameter (not used for display but could be)
    maxWidth?: number; // Maximum width constraint
    maxHeight?: number; // Maximum height constraint
}

const TrayDisplay: React.FC<TrayDisplayProps> = ({
    name,
    qtyXAxis,
    qtyYAxis,
    rotation,
    maxWidth = 500,
    maxHeight = 400,
}) => {
    // Generate row letters dynamically based on qtyYAxis
    const generateRowLetters = (count: number): string[] => {
        const letters = [];
        for (let i = 0; i < count; i++) {
            letters.push(String.fromCharCode(65 + i)); // A, B, C, etc.
        }
        return letters;
    };

    const rowLetters = generateRowLetters(qtyYAxis);

    // Calculate SVG dimensions and scaling
    const isRotated90or270 = rotation === 90 || rotation === 270;
    const displayCols = isRotated90or270 ? qtyYAxis : qtyXAxis;
    const displayRows = isRotated90or270 ? qtyXAxis : qtyYAxis;

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
                return { xIndex: row, yIndex: qtyXAxis - 1 - col };
            case 180:
                return { xIndex: qtyXAxis - 1 - col, yIndex: qtyYAxis - 1 - row };
            case 270:
                return { xIndex: qtyYAxis - 1 - row, yIndex: col };
            default: // 0 degrees
                return { xIndex: col, yIndex: row };
        }
    };

    // Generate all label positions (no overlap with wells)
    const getLabels = () => {
        const topLabels = [];
        const leftLabels = [];

        // For rotated views, we need to adjust which labels appear where
        if (rotation === 0 || rotation === 180) {
            // X-axis (columns): letters A, B, C...
            for (let colIdx = 0; colIdx < qtyXAxis; colIdx++) {
                const letter = String.fromCharCode(65 + colIdx);
                const { xIndex } = getDisplayIndices(0, colIdx);
                const cx = LABEL_MARGIN + xIndex * SPACING;
                topLabels.push({ x: cx, y: TITLE_HEIGHT + LABEL_MARGIN / 2, label: letter });
            }
            // Y-axis (rows): numbers 1, 2, 3...
            for (let rowIdx = 0; rowIdx < qtyYAxis; rowIdx++) {
                const number = rowIdx + 1;
                const { yIndex } = getDisplayIndices(rowIdx, 0);
                const cy = TITLE_HEIGHT + LABEL_MARGIN + yIndex * SPACING;
                leftLabels.push({ x: LABEL_MARGIN / 2, y: cy, label: number });
            }
        } else if (rotation === 90 || rotation === 270) {
            // For 90°/270° rotation, columns become rows and vice versa
            // X-axis (what were originally rows): numbers 1, 2, 3...
            for (let rowIdx = 0; rowIdx < qtyYAxis; rowIdx++) {
                const number = rowIdx + 1;
                const { xIndex } = getDisplayIndices(rowIdx, 0);
                const cx = LABEL_MARGIN + xIndex * SPACING;
                topLabels.push({ x: cx, y: TITLE_HEIGHT + LABEL_MARGIN / 2, label: number });
            }
            // Y-axis (what were originally columns): letters A, B, C...
            for (let colIdx = 0; colIdx < qtyXAxis; colIdx++) {
                const letter = String.fromCharCode(65 + colIdx);
                const { yIndex } = getDisplayIndices(0, colIdx);
                const cy = TITLE_HEIGHT + LABEL_MARGIN + yIndex * SPACING;
                leftLabels.push({ x: LABEL_MARGIN / 2, y: cy, label: letter });
            }
        }

        return { topLabels, leftLabels };
    };

    const wellPositions = (() => {
        const positions = [];
        for (let logicalRow = 0; logicalRow < qtyYAxis; logicalRow++) {
            for (let logicalCol = 0; logicalCol < qtyXAxis; logicalCol++) {
                const { xIndex, yIndex } = getDisplayIndices(logicalRow, logicalCol);
                positions.push({
                    cx: LABEL_MARGIN + xIndex * SPACING,
                    cy: TITLE_HEIGHT + LABEL_MARGIN + yIndex * SPACING,
                });
            }
        }
        return positions;
    })();
    const { topLabels, leftLabels } = getLabels();

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
                    {qtyXAxis} × {qtyYAxis} wells
                </text>
                {/* Top labels (letters) */}
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
                {/* Left labels (numbers) */}
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