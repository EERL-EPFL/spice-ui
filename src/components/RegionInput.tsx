import React, { useCallback, useRef } from 'react';
import { useInput, FieldTitle } from 'react-admin';
import TrayGrid, { Cell, ExistingRegion, Orientation } from './TrayGrid';
import { SimpleTreatmentSelector } from './TreatmentSelector';
import { Box, Typography, TextField, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';

// Generate dynamic row letters based on tray dimensions
const generateRowLetters = (maxRows: number): string[] => {
    const letters = [];
    for (let i = 0; i < maxRows; i++) {
        letters.push(String.fromCharCode(65 + i)); // A, B, C, etc.
    }
    return letters;
};

const rowIndexToLetter = (idx: number, maxRows: number): string => {
    const letters = generateRowLetters(maxRows);
    return letters[idx] || 'A';
};

const colIndexToNumber = (idx: number): number => idx + 1;

const letterToRowIndex = (letter: string, maxRows: number): number => {
    const letters = generateRowLetters(maxRows);
    return letters.indexOf(letter.toUpperCase());
};

const numberToColIndex = (num: number): number => num - 1;

// Parse cell string with dynamic tray dimensions
const parseCell = (s: string, trayConfig?: any): Cell => {
    if (!trayConfig) return { row: 0, col: 0 };

    const match = s.match(/^([A-Za-z])(\d{1,2})$/);
    if (match) {
        const row = letterToRowIndex(match[1], trayConfig.qty_y_axis);
        const colNumber = parseInt(match[2], 10);
        let col = numberToColIndex(colNumber);
        return { row, col };
    }
    return { row: 0, col: 0 };
};

// Convert Cell back to string with dynamic tray dimensions
const cellToString = (cell: Cell, trayConfig: any): string => {
    const letter = rowIndexToLetter(cell.row, trayConfig.qty_y_axis);
    const colNumber = cell.col + 1;
    return `${letter}${colNumber}`;
};

interface SingleRegion {
    name: string;
    tray_name: string;     // Now use tray name instead of number
    upper_left: string;
    lower_right: string;
    color: string;
    sample?: string;       // Add sample field
    dilution?: string;     // Add dilution field
}

interface TrayConfig {
    order_sequence: number;
    rotation_degrees: number;
    trays: Array<{
        name: string;
        qty_x_axis: number;
        qty_y_axis: number;
        well_relative_diameter?: string;
    }>;
}

// Colorblind‐safe palette (ColorBrewer "Dark2")
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
const parseYAML = (yamlText: string, trayConfigs: TrayConfig[]): any => {
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

export const RegionInput: React.FC<{
    source: string;
    label?: string;
    trayConfiguration?: { trays: TrayConfig[] };
    readOnly?: boolean;
}> = (props) => {
    const {
        field: { value, onChange },
        fieldState: { error, isTouched },
        isRequired,
    } = useInput(props);

    const regions: SingleRegion[] = Array.isArray(value) ? value : [];
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Add refs for inputs to maintain focus
    const inputRefs = useRef<{ [key: string]: React.RefObject<HTMLInputElement> }>({});
    const { trayConfiguration, readOnly = false } = props;

    // Initialize or update input refs when regions change
    React.useEffect(() => {
        regions.forEach((region, idx) => {
            ['name', 'sample', 'dilution'].forEach(field => {
                const key = `region-${idx}-${field}`;
                if (!inputRefs.current[key]) {
                    inputRefs.current[key] = React.createRef();
                }
            });
        });
    }, [regions.length]);

    // Create memoized values for all hooks to ensure consistent hook call order
    const [noTraysMessage, flatTrays] = React.useMemo(() => {
        // If no tray configuration is provided, return early with message component
        if (!trayConfiguration || !trayConfiguration.trays || trayConfiguration.trays.length === 0) {
            const message = (
                <Box marginTop={2} marginBottom={2}>
                    <FieldTitle
                        label={props.label || 'Regions'}
                        source={props.source}
                        resource={undefined}
                        isRequired={isRequired}
                    />
                    <Typography variant="body2" color="textSecondary">
                        No tray configuration available. Please select a tray configuration first.
                    </Typography>
                </Box>
            );
            return [message, []];
        }

        // Otherwise, process the tray configuration
        const flattened = [];
        for (const trayConfig of trayConfiguration.trays) {
            for (const tray of trayConfig.trays) {
                flattened.push({
                    trayConfig,
                    tray,
                    trayName: tray.name,
                    rotation: trayConfig.rotation_degrees
                });
            }
        }
        return [null, flattened];
    }, [trayConfiguration, props.label, props.source, isRequired]);

    // If no trays are available, show the message
    if (noTraysMessage) {
        return noTraysMessage;
    }

    // All hooks below this point will always run, maintaining consistent hook order

    const handleNewRegion = useCallback(
        (regionObj: { trayName: string; upperLeft: Cell; lowerRight: Cell; trayConfig: any }) => {
            const { trayName, upperLeft, lowerRight, trayConfig } = regionObj;
            const ulStr = cellToString(upperLeft, trayConfig);
            const lrStr = cellToString(lowerRight, trayConfig);

            // Check overlap on same tray
            const existingOnTray = regions.filter((r) => r.tray_name === trayName);
            for (const r of existingOnTray) {
                const rUL = parseCell(r.upper_left, trayConfig);
                const rLR = parseCell(r.lower_right, trayConfig);
                const overlapInRows =
                    upperLeft.row <= rLR.row && lowerRight.row >= rUL.row;
                const overlapInCols =
                    upperLeft.col <= rLR.col && lowerRight.col >= rUL.col;
                if (overlapInRows && overlapInCols) {
                    window.alert('Cannot create overlapping regions.');
                    return;
                }
            }

            // Pick a color
            const color = COLOR_PALETTE[regions.length % COLOR_PALETTE.length];

            // Append new region
            const updated: SingleRegion[] = [
                ...regions,
                {
                    name: '',
                    tray_name: trayName,
                    upper_left: ulStr,
                    lower_right: lrStr,
                    color,
                    sample: '',
                    dilution: ''
                },
            ];
            onChange(updated);
        },
        [onChange, regions]
    );

    const handleRemove = (idx: number) => {
        const updated = regions.filter((_, i) => i !== idx);
        onChange(updated);
    };

    const handleRegionChange = useCallback((idx: number, field: string, newValue: string) => {
        // Get current focused element to restore focus after state update
        const activeElement = document.activeElement as HTMLElement;
        const activeId = activeElement?.id;

        const updated = regions.map((r, i) =>
            i === idx ? { ...r, [field]: newValue } : r
        );
        onChange(updated);

        // Restore focus on next render
        setTimeout(() => {
            if (activeId) {
                const elementToFocus = document.getElementById(activeId);
                if (elementToFocus) {
                    elementToFocus.focus();
                }
            }
        }, 0);
    }, [onChange, regions]);

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
                const parsedYAML = parseYAML(yamlText, trayConfiguration?.trays || []);

                const importedRegions: SingleRegion[] = [];
                let colorIndex = regions.length;

                Object.entries(parsedYAML).forEach(([regionName, regionData]: [string, any]) => {
                    if (Array.isArray(regionData)) {
                        regionData.forEach((region) => {
                            const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];

                            importedRegions.push({
                                name: regionName,
                                tray_name: region.tray,
                                upper_left: region.upper_left,
                                lower_right: region.lower_right,
                                color: color,
                                sample: '',
                                dilution: ''
                            });
                            colorIndex++;
                        });
                    }
                });

                const updatedRegions = [...regions, ...importedRegions];
                onChange(updatedRegions);

            } catch (err) {
                console.error('Error parsing YAML:', err);
                window.alert('Error parsing YAML file. Please check the format.');
            }
        };

        reader.readAsText(file);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [regions, onChange, trayConfiguration]);

    const handleYAMLExport = useCallback(() => {
        if (regions.length === 0) {
            window.alert('No regions to export.');
            return;
        }

        const groupedRegions: { [key: string]: any[] } = {};

        regions.forEach(region => {
            const regionName = region.name || 'Unnamed';

            if (!groupedRegions[regionName]) {
                groupedRegions[regionName] = [];
            }

            groupedRegions[regionName].push({
                tray: region.tray_name,
                upper_left: region.upper_left,
                lower_right: region.lower_right
            });
        });

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

    return (
        <Box marginTop={2} marginBottom={2}>
            <FieldTitle
                label={props.label || 'Regions'}
                source={props.source}
                resource={undefined}
                isRequired={isRequired}
            />

            <Box display="flex" gap={2} flexWrap="wrap">
                {/* Render dynamic trays */}
                {flatTrays.map((flatTray, index) => {
                    const { trayConfig, tray, trayName, rotation } = flatTray;
                    const existingRegions: ExistingRegion[] = regions
                        .map((r, idx) => ({ ...r, idx }))
                        .filter((r) => r.tray_name === trayName)
                        .map((r) => ({
                            upperLeft: parseCell(r.upper_left, tray),
                            lowerRight: parseCell(r.lower_right, tray),
                            name: r.name || 'Unnamed',
                            color: r.color,
                            onRemove: readOnly ? () => { } : () => handleRemove(r.idx),
                        }));

                    return (
                        <Box key={index} flex={1} minWidth="400px">
                            <Typography variant="subtitle1" marginBottom={1}>
                                {trayName} ({rotation}°)
                            </Typography>
                            <TrayGrid
                                tray={trayName}
                                qtyXAxis={tray.qty_x_axis}
                                qtyYAxis={tray.qty_y_axis}
                                orientation={rotation as Orientation}
                                onRegionSelect={readOnly ? () => { } : (regionObj) => handleNewRegion({
                                    trayName,
                                    upperLeft: regionObj.upperLeft,
                                    lowerRight: regionObj.lowerRight,
                                    trayConfig: tray
                                })}
                                existingRegions={existingRegions}
                            />
                        </Box>
                    );
                })}

                {/* Selected Regions List */}
                <Box flex={1} minWidth="300px">
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
                            flexDirection="column"
                            marginBottom={2}
                            padding={2}
                            border={`2px solid ${r.color}`}
                            borderRadius={1}
                            sx={{ backgroundColor: `${r.color}10` }}
                        >
                            <Box display="flex" alignItems="center" marginBottom={1}>
                                <TextField
                                    id={`region-${idx}-name`}
                                    label="Region Name"
                                    size="small"
                                    value={r.name}
                                    onChange={readOnly ? undefined : (e) => handleRegionChange(idx, 'name', e.target.value)}
                                    variant="outlined"
                                    disabled={readOnly}
                                    sx={{ width: 140, marginRight: 1 }}
                                    inputRef={inputRefs.current[`region-${idx}-name`]}
                                />
                                <Typography variant="body2" color="textSecondary">
                                    {r.tray_name}: {r.upper_left}–{r.lower_right}
                                </Typography>
                                {!readOnly && (
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleRemove(idx)}
                                        style={{ marginLeft: 'auto' }}
                                    >
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                            <Box display="flex" gap={1}>
                                <Box sx={{ flex: 1 }}>
                                    <SimpleTreatmentSelector
                                        value={r.sample || ''}
                                        label="Treatment"
                                        disabled={readOnly}
                                        onChange={(treatmentId) => {
                                            if (!readOnly) {
                                                handleRegionChange(idx, 'sample', treatmentId);
                                            }
                                        }}
                                    />
                                </Box>
                                <TextField
                                    id={`region-${idx}-dilution`}
                                    label="Dilution"
                                    size="small"
                                    value={r.dilution || ''}
                                    onChange={readOnly ? undefined : (e) => handleRegionChange(idx, 'dilution', e.target.value)}
                                    variant="outlined"
                                    disabled={readOnly}
                                    sx={{ flex: 1 }}
                                    inputRef={inputRefs.current[`region-${idx}-dilution`]}
                                />
                            </Box>
                        </Box>
                    ))}

                    {isTouched && error && (
                        <Typography color="error" variant="body2">
                            {error.message || String(error)}
                        </Typography>
                    )}

                    {!readOnly && (
                        <>
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
                        </>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default RegionInput;
