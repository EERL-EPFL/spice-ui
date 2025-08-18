import React, { useState, useMemo } from 'react';
import { 
    useRecordContext, 
    useGetOne
} from 'react-admin';
import { flattenSampleResults } from '../utils/experimentUtils';
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
    row: number;
    col: number;
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
        qty_x_axis: number;
        qty_y_axis: number;
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
}> = ({ 
    tray,
    wellSummaries,
    colorScale,
    minSeconds,
    maxSeconds,
    onWellClick
}) => {
    const trayInfo = tray.trays[0];
    const maxRows = trayInfo?.qty_y_axis || 8;
    const maxCols = trayInfo?.qty_x_axis || 12;

    // Filter wells for this specific tray
    const trayWells = wellSummaries.filter(w => w.tray_id === tray.id);

    // Create a map for quick lookup
    const wellMap: { [key: string]: WellSummary } = {};
    trayWells.forEach(well => {
        const key = `${well.row}-${well.col}`;
        wellMap[key] = well;
    });

    const getTooltipText = (well: WellSummary | undefined, row: number, col: number) => {
        const coordinate = `${String.fromCharCode(65 + row)}${col + 1}`;
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
        
        return tooltip;
    };

    // Generate grid
    const grid = [];
    for (let row = 1; row <= maxRows; row++) {
        const rowCells = [];
        for (let col = 1; col <= maxCols; col++) {
            const key = `${row}-${col}`;
            const well = wellMap[key];
            const coordinate = `${String.fromCharCode(65 + row)}${col + 1}`;
            
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
                    {String.fromCharCode(65 + row)}
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
                {col}
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

    // Extract results summary from the experiment record
    const resultsSummary: ExperimentResultsSummary | null = record?.results_summary || null;

    // Calculate color scale based on freezing times
    const { colorScale, minSeconds, maxSeconds } = useMemo(() => {
        if (!resultsSummary?.sample_results) {
            return { colorScale: () => '#f5f5f5', minSeconds: 0, maxSeconds: 0 };
        }

        const wellSummaries = flattenSampleResults(resultsSummary.sample_results);
        const freezingTimes = wellSummaries
            .filter(w => w.first_phase_change_seconds !== null)
            .map(w => w.first_phase_change_seconds!);

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
    }, [resultsSummary]);

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

    if (!resultsSummary || resultsSummary.total_time_points === 0) {
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

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Results Visualisation ({resultsSummary.total_time_points} time points)
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
                                    label={`${resultsSummary.total_time_points} time points`}
                                    color="primary"
                                    size="small"
                                />
                                <Chip 
                                    label={`${resultsSummary.wells_with_data} wells with data`}
                                    color="info"
                                    size="small"
                                />
                                <Chip 
                                    label={`${resultsSummary.wells_frozen} frozen wells`}
                                    color="warning"
                                    size="small"
                                />
                                <Chip 
                                    label={`${resultsSummary.wells_liquid} liquid wells`}
                                    color="success"
                                    size="small"
                                />
                            </Box>
                            
                            {resultsSummary.first_timestamp && (
                                <Box mt={2}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Start:</strong> {formatDateTime(resultsSummary.first_timestamp)}
                                    </Typography>
                                    {resultsSummary.last_timestamp && (
                                        <Typography variant="body2" color="text.secondary">
                                            <strong>End:</strong> {formatDateTime(resultsSummary.last_timestamp)}
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
                                    {selectedWell.sample_name && (
                                        <Typography variant="body2">
                                            <strong>Sample:</strong> {selectedWell.sample_name}
                                        </Typography>
                                    )}
                                    {selectedWell.treatment_name && (
                                        <Typography variant="body2">
                                            <strong>Treatment:</strong> {selectedWell.treatment_name}
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
                                {trays.map((tray) => (
                                    <Box key={tray.id} sx={{ flexShrink: 0 }}>
                                        <TrayWellGrid
                                            tray={tray}
                                            wellSummaries={flattenSampleResults(resultsSummary.sample_results)}
                                            colorScale={colorScale}
                                            minSeconds={minSeconds}
                                            maxSeconds={maxSeconds}
                                            onWellClick={setSelectedWell}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};