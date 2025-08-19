import React, { useState, useMemo } from 'react';
import { 
    useRecordContext, 
    useGetOne
} from 'react-admin';
import { flattenSampleResults } from '../utils/experimentUtils';
import { transformCellToWellCoordinate } from '../utils/coordinateTransforms';
import { 
    Box, 
    Typography, 
    Paper,
    Chip,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Tooltip
} from '@mui/material';
import { scaleSequential } from 'd3-scale';
import { interpolateBlues } from 'd3-scale-chromatic';

interface WellSummary {
    row_letter: string;
    column_number: number;
    coordinate: string;
    tray_id?: string;
    first_phase_change_time: string | null;
    first_phase_change_seconds: number | null;
    final_state: string;
    sample_name: string | null;
    treatment_name: string | null;
    dilution_factor: number | null;
}

interface TreatmentResultsSummary {
    treatment: any;
    wells: WellSummary[];
    wells_frozen: number;
    wells_liquid: number;
}

interface SampleResultsSummary {
    sample: any;
    treatments: TreatmentResultsSummary[];
}

interface ExperimentResultsSummary {
    total_wells: number;
    wells_with_data: number;
    wells_frozen: number;
    wells_liquid: number;
    total_time_points: number;
    first_timestamp: string | null;
    last_timestamp: string | null;
    sample_results: SampleResultsSummary[];
}

interface TrayConfig {
    id: string;
    name: string;
    order_sequence: number;
    trays: Array<{
        id: string;
        name: string;
        qty_cols: number;
        qty_rows: number;
    }>;
}

// Component to display wells for a single tray
const TrayWellGrid: React.FC<{ 
    tray: TrayConfig;
    wellSummaries: WellSummary[];
    colorScale: (value: number | null) => string;
    minSeconds: number;
    maxSeconds: number;
    onWellClick?: (well: WellSummary) => void;
    trayConfigData?: any; // Add tray configuration data with rotation
}> = ({ 
    tray,
    wellSummaries,
    colorScale,
    minSeconds,
    maxSeconds,
    onWellClick,
    trayConfigData
}) => {
    const trayInfo = tray.trays[0];
    const maxRows = trayInfo?.qty_rows || 8;
    const maxCols = trayInfo?.qty_cols || 12;

    // Get rotation from tray configuration data
    const getTrayRotation = (trayId: string): number => {
        if (!trayConfigData?.trays) return 0;
        const trayConfig = trayConfigData.trays.find((t: any) => t.id === trayId);
        console.log(`Looking for tray ${trayId}, found config:`, trayConfig);
        return trayConfig?.rotation_degrees || 0;
    };

    const rotation = getTrayRotation(tray.id);
    console.log(`Tray ${tray.name} (${tray.id}) rotation: ${rotation}°`);

    // Filter wells for this specific tray
    const trayWells = wellSummaries.filter(w => w.tray_id === tray.id);

    // Create a map for quick lookup
    const wellMap: { [key: string]: WellSummary } = {};
    trayWells.forEach(well => {
        // Convert row_letter to number for grid positioning (A=1, B=2, etc.)
        const rowNum = well.row_letter.charCodeAt(0) - 64;
        const key = `${rowNum}-${well.column_number}`;
        wellMap[key] = well;
    });

    const getTooltipText = (well: WellSummary | undefined, row: number, col: number) => {
        // Generate coordinate using rotation transformation
        const coordinate = transformCellToWellCoordinate(
            { row: row - 1, col: col - 1 }, // Convert to 0-based for the transform function
            rotation,
            maxCols,
            maxRows
        );
        if (!well) return `${coordinate}: No data`;
        
        const phaseText = well.final_state === 'frozen' ? 'Frozen' : 'Liquid';
        let tooltip = `${coordinate}: ${phaseText}`;
        
        if (well.first_phase_change_seconds !== null) {
            const minutes = Math.floor(well.first_phase_change_seconds / 60);
            const seconds = well.first_phase_change_seconds % 60;
            tooltip += `\nFreezing time: ${minutes}m ${seconds}s`;
        }
        
        if (well.sample_name) tooltip += `\nSample: ${well.sample_name}`;
        if (well.treatment_name) tooltip += `\nTreatment: ${well.treatment_name}`;
        if (well.dilution_factor) tooltip += `\nDilution: ${well.dilution_factor}`;
        if (well.sample?.name) tooltip += `\nSample ID: ${well.sample.name}`;
        if (well.treatment?.sample?.name) tooltip += `\nTreatment Sample: ${well.treatment.sample.name}`;
        
        return tooltip;
    };

    // Generate grid
    const grid = [];
    for (let row = 1; row <= maxRows; row++) {
        const rowCells = [];
        for (let col = 1; col <= maxCols; col++) {
            const key = `${row}-${col}`;
            const well = wellMap[key];
            // Generate coordinate using rotation transformation
            const coordinate = transformCellToWellCoordinate(
                { row: row - 1, col: col - 1 }, // Convert to 0-based for the transform function
                rotation,
                maxCols,
                maxRows
            );
            // Debug logging for first few coordinates
            if (row <= 2 && col <= 2) {
                console.log(`Grid position (${row}, ${col}) -> cell (${row-1}, ${col-1}) -> coordinate: ${coordinate} (rotation: ${rotation}°)`);
            }
            
            const backgroundColor = well?.first_phase_change_seconds !== null 
                ? colorScale(well.first_phase_change_seconds)
                : '#f5f5f5';
            
            rowCells.push(
                <Tooltip 
                    key={key} 
                    title={<div style={{ whiteSpace: 'pre-line' }}>{getTooltipText(well, row, col)}</div>}
                    arrow
                >
                    <Box
                        sx={{
                            width: 30,
                            height: 30,
                            border: '1px solid #ccc',
                            backgroundColor,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '8px',
                            fontWeight: well ? 'bold' : 'normal',
                            color: well ? '#000' : '#999',
                            cursor: well && onWellClick ? 'pointer' : 'default',
                            '&:hover': well && onWellClick ? {
                                opacity: 0.8,
                                borderColor: '#000',
                                borderWidth: 2,
                            } : {}
                        }}
                        onClick={() => well && onWellClick && onWellClick(well)}
                    >
                        {coordinate}
                    </Box>
                </Tooltip>
            );
        }
        grid.push(
            <Box key={`row-${row}`} display="flex" gap={0.5}>
                <Box sx={{ width: 25, fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Generate row label using the same coordinate for the first column */}
                    {transformCellToWellCoordinate(
                        { row: row - 1, col: 0 }, // First column of this row
                        rotation,
                        maxCols,
                        maxRows
                    ).charAt(0)}
                </Box>
                {rowCells}
            </Box>
        );
    }

    // Column headers
    const colHeaders = [];
    for (let col = 1; col <= maxCols; col++) {
        colHeaders.push(
            <Box key={`col-${col}`} sx={{ width: 30, fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Generate column label using the same coordinate for the first row */}
                {transformCellToWellCoordinate(
                    { row: 0, col: col - 1 }, // First row of this column
                    rotation,
                    maxCols,
                    maxRows
                ).slice(1)}
            </Box>
        );
    }

    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    {trayInfo?.name || tray.name} (Sequence: {tray.order_sequence})
                </Typography>
                <Box>
                    {/* Column headers */}
                    <Box display="flex" gap={0.5} mb={0.5}>
                        <Box sx={{ width: 25 }}></Box>
                        {colHeaders}
                    </Box>
                    {/* Grid */}
                    <Box display="flex" flexDirection="column" gap={0.5}>
                        {grid}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export const TimePointVisualization = () => {
    const record = useRecordContext();
    const [selectedWell, setSelectedWell] = useState<WellSummary | null>(null);

    // Get tray configuration
    const { data: trayConfiguration, isLoading: trayLoading } = useGetOne(
        'tray_configurations',
        { id: record?.tray_configuration_id },
        { enabled: !!record?.tray_configuration_id }
    );

    // Debug tray configuration
    React.useEffect(() => {
        if (trayConfiguration) {
            console.log('Tray configuration loaded:', trayConfiguration);
        }
    }, [trayConfiguration]);

    // Extract results from the experiment record (new tray-centric structure)
    const results: any = record?.results || null;

    // Calculate color scale based on freezing times from new tray-centric structure
    const { colorScale, minSeconds, maxSeconds } = useMemo(() => {
        if (!results?.trays) {
            return { colorScale: () => '#f5f5f5', minSeconds: 0, maxSeconds: 0 };
        }

        // Extract all wells from all trays
        const allWells = results.trays.flatMap((tray: any) => tray.wells || []);
        const freezingTimes = allWells
            .filter((w: any) => w.first_phase_change_time !== null)
            .map((w: any) => {
                // Calculate seconds from start time if we have timestamps
                if (w.first_phase_change_time && results.summary?.first_timestamp) {
                    const freezeTime = new Date(w.first_phase_change_time).getTime();
                    const startTime = new Date(results.summary.first_timestamp).getTime();
                    return Math.floor((freezeTime - startTime) / 1000);
                }
                return null;
            })
            .filter((time: number | null) => time !== null);

        if (freezingTimes.length === 0) {
            return { colorScale: () => '#f5f5f5', minSeconds: 0, maxSeconds: 0 };
        }

        const min = Math.min(...freezingTimes);
        const max = Math.max(...freezingTimes);

        // Create a color scale from light blue (early freeze) to dark blue (late freeze)
        const scale = scaleSequential(interpolateBlues)
            .domain([min, max]);

        return { 
            colorScale: (value: number | null) => {
                if (value === null) return '#f5f5f5';
                return scale(value);
            },
            minSeconds: min,
            maxSeconds: max
        };
    }, [results]);

    if (trayLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (!record?.tray_configuration_id) {
        return (
            <Alert severity="warning">
                No tray configuration assigned to this experiment. Assign a tray configuration to visualize time points.
            </Alert>
        );
    }

    if (!results || !results.summary || results.summary.total_time_points === 0) {
        return (
            <Alert severity="info">
                No time point data available. Upload a merged.xlsx file to see phase change visualization.
            </Alert>
        );
    }

    const formatDateTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const formatSeconds = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    };

    // Get all trays from configuration
    const trays: TrayConfig[] = trayConfiguration?.trays || [];

    // Calculate summary statistics from tray data
    const allWells = results.trays.flatMap((tray: any) => tray.wells || []);
    const wellsWithData = allWells.length;
    const wellsFrozen = allWells.filter((w: any) => w.final_state === 'frozen').length;
    const wellsLiquid = allWells.filter((w: any) => w.final_state === 'liquid').length;

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Results Visualisation ({results.summary.total_time_points} time points)
            </Typography>

            <Grid container spacing={2}>
                {/* Results Summary */}
                <Grid item xs={12} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Experiment Summary
                            </Typography>
                            <Box display="flex" flexDirection="column" gap={1}>
                                <Chip 
                                    label={`${results.summary.total_time_points} time points`}
                                    color="primary"
                                    size="small"
                                />
                                <Chip 
                                    label={`${wellsWithData} wells with data`}
                                    color="info"
                                    size="small"
                                />
                            </Box>
                            
                            {results.summary.first_timestamp && (
                                <Box mt={2}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Start:</strong> {formatDateTime(results.summary.first_timestamp)}
                                    </Typography>
                                    {results.summary.last_timestamp && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>End:</strong> {formatDateTime(results.summary.last_timestamp)}
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Selected Well Details */}
                            {selectedWell && (
                                <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Well {selectedWell.coordinate}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>State:</strong> {selectedWell.final_state}
                                    </Typography>
                                    {selectedWell.first_phase_change_seconds !== null && (
                                        <Typography variant="body2">
                                            <strong>Freezing time:</strong> {formatSeconds(selectedWell.first_phase_change_seconds)}
                                        </Typography>
                                    )}
                                    {(selectedWell.sample_name || selectedWell.sample?.name) && (
                                        <Typography variant="body2">
                                            <strong>Sample:</strong> {selectedWell.sample?.name || selectedWell.sample_name}
                                        </Typography>
                                    )}
                                    {(selectedWell.treatment_name || selectedWell.treatment?.name) && (
                                        <Typography variant="body2">
                                            <strong>Treatment:</strong> {selectedWell.treatment?.name || selectedWell.treatment_name}
                                        </Typography>
                                    )}
                                    {selectedWell.treatment?.sample?.name && (
                                        <Typography variant="body2">
                                            <strong>Treatment Sample:</strong> {selectedWell.treatment.sample.name}
                                        </Typography>
                                    )}
                                    {selectedWell.dilution_factor && (
                                        <Typography variant="body2">
                                            <strong>Dilution:</strong> {selectedWell.dilution_factor}
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Color Scale Legend */}
                            <Box mt={3}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Freezing Time Scale
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Box 
                                        width={20} 
                                        height={20} 
                                        bgcolor={colorScale(minSeconds)}
                                        border="1px solid #ccc"
                                    />
                                    <Typography variant="caption">
                                        {formatSeconds(minSeconds)}
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                    <Box 
                                        width={20} 
                                        height={20} 
                                        bgcolor={colorScale(maxSeconds)}
                                        border="1px solid #ccc"
                                    />
                                    <Typography variant="caption">
                                        {formatSeconds(maxSeconds)}
                                    </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                    <Box 
                                        width={20} 
                                        height={20} 
                                        bgcolor="#f5f5f5"
                                        border="1px solid #ccc"
                                    />
                                    <Typography variant="caption">
                                        No freeze / No data
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Tray Visualizations */}
                <Grid item xs={12} md={9}>
                    <Box sx={{ maxHeight: '80vh', overflowY: 'auto', overflowX: 'auto' }}>
                        {trays.length === 0 ? (
                            <Alert severity="warning">
                                No tray configurations found. Please check the tray configuration setup.
                            </Alert>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 2, minWidth: 'fit-content' }}>
                                {results.trays.map((resultTray: any) => {
                                    console.log('Rendering tray:', resultTray.tray_id, resultTray.tray_name);
                                    return (
                                    <Box key={resultTray.tray_id} sx={{ flexShrink: 0 }}>
                                        {/* Convert tray result wells to the expected format */}
                                        <TrayWellGrid
                                            tray={{
                                                id: resultTray.tray_id,
                                                name: resultTray.tray_name || `Tray ${resultTray.tray_id}`,
                                                order_sequence: 1,
                                                trays: [{
                                                    id: resultTray.tray_id,
                                                    name: resultTray.tray_name || `Tray ${resultTray.tray_id}`,
                                                    qty_cols: 12, // Default to 96-well plate
                                                    qty_rows: 8
                                                }]
                                            }}
                                            wellSummaries={resultTray.wells.map((well: any) => ({
                                                row_letter: well.row_letter,
                                                column_number: well.column_number,
                                                coordinate: well.coordinate,
                                                tray_id: resultTray.tray_id,
                                                first_phase_change_time: well.first_phase_change_time,
                                                first_phase_change_seconds: well.first_phase_change_time && results.summary?.first_timestamp ? 
                                                    Math.floor((new Date(well.first_phase_change_time).getTime() - new Date(results.summary.first_timestamp).getTime()) / 1000) : null,
                                                final_state: well.final_state || 'no_data',
                                                sample_name: well.sample?.name || null,
                                                treatment_name: well.treatment_name || null,
                                                dilution_factor: well.dilution_factor || null,
                                                // Pass through full objects for linking
                                                sample: well.sample || null,
                                                treatment: well.treatment || null
                                            }))}
                                            colorScale={colorScale}
                                            minSeconds={minSeconds}
                                            maxSeconds={maxSeconds}
                                            onWellClick={setSelectedWell}
                                            trayConfigData={trayConfiguration}
                                        />
                                    </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};