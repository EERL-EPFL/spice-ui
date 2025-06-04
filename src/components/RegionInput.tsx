import React, { useCallback } from 'react';
import { useInput, FieldTitle } from 'react-admin';
import TrayGrid, { Cell, ExistingRegion, Orientation } from './TrayGrid';
import { Box, Typography, TextField, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const rowIndexToLetter = (idx: number): string => ROW_LETTERS[idx] || 'A';
const colIndexToNumber = (idx: number): number => idx + 1;
const letterToRowIndex = (letter: string): number =>
    ROW_LETTERS.indexOf(letter.toUpperCase());
const numberToColIndex = (num: number): number => num - 1;

// Parse “A1” or “H12” → { row: 0..7, col: 0..11 }
const parseCell = (s: string): Cell => {
    const match = s.match(/^([A-Ha-h])(\d{1,2})$/);
    if (match) {
        return {
            row: letterToRowIndex(match[1]),
            col: numberToColIndex(parseInt(match[2], 10)),
        };
    }
    return { row: 0, col: 0 };
};

interface SingleRegion {
    name: string;         // user‐entered label
    tray: number;         // 1 or 2
    upper_left: string;   // e.g. "A1"
    lower_right: string;  // e.g. "H4"
    color: string;        // e.g. "#1b9e77"
}

// Colorblind‐safe palette (ColorBrewer “Dark2”)
const COLOR_PALETTE = [
    '#1b9e77',
    '#d95f02',
    '#7570b3',
    '#e7298a',
    '#66a61e',
    '#e6ab02',
    '#a6761d',
    '#666666',
];

export const RegionInput: React.FC<{ source: string; label?: string }> = (props) => {
    const {
        field: { value, onChange },
        fieldState: { error, isTouched },
        isRequired,
    } = useInput(props);

    const regions: SingleRegion[] = Array.isArray(value) ? value : [];

    const handleNewRegion = useCallback(
        (regionObj: { tray: number; upperLeft: Cell; lowerRight: Cell }) => {
            const { tray, upperLeft, lowerRight } = regionObj;
            const ulStr = `${rowIndexToLetter(upperLeft.row)}${colIndexToNumber(upperLeft.col)}`;
            const lrStr = `${rowIndexToLetter(lowerRight.row)}${colIndexToNumber(lowerRight.col)}`;

            // 1) Check overlap on same tray
            const existingOnTray = regions.filter((r) => r.tray === tray);
            for (const r of existingOnTray) {
                const rUL = parseCell(r.upper_left);
                const rLR = parseCell(r.lower_right);
                const overlapInRows =
                    upperLeft.row <= rLR.row && lowerRight.row >= rUL.row;
                const overlapInCols =
                    upperLeft.col <= rLR.col && lowerRight.col >= rUL.col;
                if (overlapInRows && overlapInCols) {
                    window.alert('Cannot create overlapping regions.');
                    return;
                }
            }

            // 2) Pick a color
            const color = COLOR_PALETTE[regions.length % COLOR_PALETTE.length];

            // 3) Append new region (name initially empty)
            const updated: SingleRegion[] = [
                ...regions,
                { name: '', tray, upper_left: ulStr, lower_right: lrStr, color },
            ];
            onChange(updated);
        },
        [onChange, regions]
    );

    const handleRemove = (idx: number) => {
        const updated = regions.filter((_, i) => i !== idx);
        onChange(updated);
    };

    const handleNameChange = (idx: number, newName: string) => {
        const updated = regions.map((r, i) =>
            i === idx ? { ...r, name: newName } : r
        );
        onChange(updated);
    };

    const tray1Existing: ExistingRegion[] = regions
        .map((r, idx) => ({ ...r, idx }))
        .filter((r) => r.tray === 1)
        .map((r) => ({
            upperLeft: parseCell(r.upper_left),
            lowerRight: parseCell(r.lower_right),
            name: r.name || 'Unnamed',
            color: r.color,
            onRemove: () => handleRemove(r.idx),
        }));

    const tray2Existing: ExistingRegion[] = regions
        .map((r, idx) => ({ ...r, idx }))
        .filter((r) => r.tray === 2)
        .map((r) => ({
            upperLeft: parseCell(r.upper_left),
            lowerRight: parseCell(r.lower_right),
            name: r.name || 'Unnamed',
            color: r.color,
            onRemove: () => handleRemove(r.idx),
        }));

    return (
        <Box marginTop={2} marginBottom={2}>
            <FieldTitle
                label={props.label || 'Regions'}
                source={props.source}
                resource={undefined}
                isRequired={isRequired}
            />

            <Box display="flex" gap={2}>
                {/* Tray 1 */}
                <Box flex={1}>
                    <Typography variant="subtitle1" marginBottom={1}>
                        Tray 1 (P1)
                    </Typography>
                    <TrayGrid
                        tray={1}
                        orientation={270 as Orientation}
                        onRegionSelect={handleNewRegion}
                        existingRegions={tray1Existing}
                    />
                </Box>

                {/* Tray 2 */}
                <Box flex={1}>
                    <Typography variant="subtitle1" marginBottom={1}>
                        Tray 2 (P2)
                    </Typography>
                    <TrayGrid
                        tray={2}
                        orientation={90 as Orientation}
                        onRegionSelect={handleNewRegion}
                        existingRegions={tray2Existing}
                    />
                </Box>

                {/* Selected Regions List */}
                <Box flex={1}>
                    <Typography variant="subtitle2" marginBottom={1}>
                        Selected Regions
                    </Typography>

                    {regions.length === 0 && (
                        <Typography variant="body2" color="textSecondary">
                            No regions defined yet.
                        </Typography>
                    )}

                    {regions.map((r, idx) => (
                        <Box
                            key={`region-list-${idx}`}
                            display="flex"
                            alignItems="center"
                            marginBottom={1}
                        >
                            <TextField
                                label="Name"
                                size="small"
                                value={r.name}
                                onChange={(e) => handleNameChange(idx, e.target.value)}
                                variant="outlined"
                                margin="dense"
                                InputProps={{
                                    style: {
                                        backgroundColor: r.color,
                                        color: '#fff',
                                        whiteSpace: 'nowrap', // prevent wrapping
                                    },
                                }}
                            />
                            <Typography
                                variant="body2"
                                style={{ marginLeft: '0.5rem', whiteSpace: 'nowrap' }}
                            >
                                (P{r.tray}: {r.upper_left}–{r.lower_right})
                            </Typography>
                            <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemove(idx)}
                                style={{ marginLeft: '0.5rem' }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                    ))}

                    {isTouched && error && (
                        <Typography color="error" variant="body2">
                            {error}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default RegionInput;
