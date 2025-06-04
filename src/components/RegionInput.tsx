import React, { useCallback, useRef } from 'react';
import { useInput, FieldTitle } from 'react-admin';
import TrayGrid, { Cell, ExistingRegion, Orientation } from './TrayGrid';
import { Box, Typography, TextField, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';

const ROW_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const rowIndexToLetter = (idx: number): string => ROW_LETTERS[idx] || 'A';
const colIndexToNumber = (idx: number): number => idx + 1;
const letterToRowIndex = (letter: string): number =>
    ROW_LETTERS.indexOf(letter.toUpperCase());
const numberToColIndex = (num: number): number => num - 1;

// Parse "A1" or "H12" → { row: 0..7, col: 0..11 }, accounting for tray orientation
const parseCell = (s: string, tray?: number): Cell => {
    const match = s.match(/^([A-Ha-h])(\d{1,2})$/);
    if (match) {
        const row = letterToRowIndex(match[1]);
        const colNumber = parseInt(match[2], 10);
        let col = numberToColIndex(colNumber);

        // For P2, the visual display shows 12→1 but we need to map to logical coords
        // No inversion needed in parsing - the visual mapping handles this

        return { row, col };
    }
    return { row: 0, col: 0 };
};

// Convert Cell back to string, accounting for tray orientation
const cellToString = (cell: Cell, tray: number): string => {
    const letter = rowIndexToLetter(cell.row);
    // Both trays use normal 1-12 numbering in the coordinate system
    const colNumber = cell.col + 1;
    
    return `${letter}${colNumber}`;
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

// Simple YAML parser for our specific format
const parseYAML = (yamlText: string): any => {
    const lines = yamlText.split('\n');
    const result: any = {};
    let currentKey = '';
    let currentArray: any[] = [];
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        if (!line.startsWith(' ') && trimmed.endsWith(':')) {
            // New top-level key
            if (currentKey && currentArray.length > 0) {
                result[currentKey] = currentArray;
                currentArray = [];
            }
            currentKey = trimmed.slice(0, -1);
        } else if (trimmed.startsWith('- tray:')) {
            // Start of new array item
            const trayValue = trimmed.split('tray:')[1].trim();
            currentArray.push({ tray: trayValue });
        } else if (trimmed.startsWith('upper_left:')) {
            // Add upper_left to current item
            const value = trimmed.split('upper_left:')[1].trim();
            if (currentArray.length > 0) {
                currentArray[currentArray.length - 1].upper_left = value;
            }
        } else if (trimmed.startsWith('lower_right:')) {
            // Add lower_right to current item
            const value = trimmed.split('lower_right:')[1].trim();
            if (currentArray.length > 0) {
                currentArray[currentArray.length - 1].lower_right = value;
            }
        }
    }
    
    // Don't forget the last key
    if (currentKey && currentArray.length > 0) {
        result[currentKey] = currentArray;
    }
    
    return result;
};

export const RegionInput: React.FC<{ source: string; label?: string }> = (props) => {
    const {
        field: { value, onChange },
        fieldState: { error, isTouched },
        isRequired,
    } = useInput(props);

    const regions: SingleRegion[] = Array.isArray(value) ? value : [];
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNewRegion = useCallback(
        (regionObj: { tray: number; upperLeft: Cell; lowerRight: Cell }) => {
            const { tray, upperLeft, lowerRight } = regionObj;
            const ulStr = cellToString(upperLeft, tray);
            const lrStr = cellToString(lowerRight, tray);

            // 1) Check overlap on same tray
            const existingOnTray = regions.filter((r) => r.tray === tray);
            for (const r of existingOnTray) {
                const rUL = parseCell(r.upper_left, r.tray);
                const rLR = parseCell(r.lower_right, r.tray);
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

    const handleYAMLImport = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const yamlText = e.target?.result as string;
                const parsedYAML = parseYAML(yamlText);
                
                const importedRegions: SingleRegion[] = [];
                let colorIndex = regions.length; // Continue from existing color index
                
                Object.entries(parsedYAML).forEach(([regionName, regionData]: [string, any]) => {
                    if (Array.isArray(regionData)) {
                        regionData.forEach((region) => {
                            const trayNum = region.tray === 'P1' ? 1 : 2;
                            const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
                            
                            importedRegions.push({
                                name: regionName,
                                tray: trayNum,
                                upper_left: region.upper_left,
                                lower_right: region.lower_right,
                                color: color
                            });
                            colorIndex++;
                        });
                    }
                });
                
                // Merge with existing regions
                const updatedRegions = [...regions, ...importedRegions];
                onChange(updatedRegions);
                
            } catch (err) {
                console.error('Error parsing YAML:', err);
                window.alert('Error parsing YAML file. Please check the format.');
            }
        };
        
        reader.readAsText(file);
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [regions, onChange]);

    const handleYAMLExport = useCallback(() => {
        if (regions.length === 0) {
            window.alert('No regions to export.');
            return;
        }

        // Group regions by name for YAML structure
        const groupedRegions: { [key: string]: any[] } = {};
        
        regions.forEach(region => {
            const regionName = region.name || 'Unnamed';
            const trayLabel = region.tray === 1 ? 'P1' : 'P2';
            
            if (!groupedRegions[regionName]) {
                groupedRegions[regionName] = [];
            }
            
            groupedRegions[regionName].push({
                tray: trayLabel,
                upper_left: region.upper_left,
                lower_right: region.lower_right
            });
        });

        // Generate YAML content
        let yamlContent = '';
        Object.entries(groupedRegions).forEach(([regionName, regionData], index) => {
            if (index > 0) yamlContent += '\n';
            yamlContent += `${regionName}:\n`;
            
            regionData.forEach(region => {
                yamlContent += `  - tray: ${region.tray}\n`;
                yamlContent += `    upper_left: ${region.upper_left}\n`;
                yamlContent += `    lower_right: ${region.lower_right}\n`;
                yamlContent += '\n';
            });
        });

        // Create and download file
        const blob = new Blob([yamlContent.trim()], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'regions.yaml';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [regions]);

    const tray1Existing: ExistingRegion[] = regions
        .map((r, idx) => ({ ...r, idx }))
        .filter((r) => r.tray === 1)
        .map((r) => ({
            upperLeft: parseCell(r.upper_left, r.tray),
            lowerRight: parseCell(r.lower_right, r.tray),
            name: r.name || 'Unnamed',
            color: r.color,
            onRemove: () => handleRemove(r.idx),
        }));

    const tray2Existing: ExistingRegion[] = regions
        .map((r, idx) => ({ ...r, idx }))
        .filter((r) => r.tray === 2)
        .map((r) => ({
            upperLeft: parseCell(r.upper_left, r.tray),
            lowerRight: parseCell(r.lower_right, r.tray),
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
                                sx={{ 
                                    width: 140, // Fixed width for consistent sizing
                                    minWidth: 140 
                                }}
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

                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleYAMLImport}
                        startIcon={<UploadFileIcon />}
                        style={{ marginTop: '1rem' }}
                    >
                        Import YAML
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleYAMLExport}
                        startIcon={<DownloadIcon />}
                        style={{ marginTop: '1rem', marginLeft: '0.5rem' }}
                    >
                        Export YAML
                    </Button>
                    <input
                        type="file"
                        accept=".yaml,.yml"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default RegionInput;
