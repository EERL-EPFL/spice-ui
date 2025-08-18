import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    Stack,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import {
    Thermostat as ThermostatIcon,
    AccessTime as AccessTimeIcon,
    Science as ScienceIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useDataProvider, useNotify } from 'react-admin';

interface TrayLayout {
    rows: number;
    columns: number;
    tray_configurations: TrayInfo[];
}

interface TrayInfo {
    tray_id: string;
    tray_name: string;
    sequence: number;
}

interface WellResultSummary {
    row_letter: string;
    column_number: number;
    coordinate: string;
    sample_id?: string;
    sample_name?: string;
    treatment_name?: string;
    dilution_factor?: number;
    first_phase_change_time?: string;
    final_state?: number;
    total_phase_changes: number;
}

interface ExperimentResultsSummary {
    experiment_id: string;
    experiment_name: string;
    tray_layout: TrayLayout;
    wells: WellResultSummary[];
    total_time_points: number;
    first_timestamp?: string;
    last_timestamp?: string;
}

interface PhaseChangeEvent {
    timestamp: string;
    from_state?: number;
    to_state: number;
    image_filename?: string;
    temperature_at_change?: number;
}

interface TemperatureSummary {
    min_temperature?: number;
    max_temperature?: number;
    avg_temperature?: number;
    temperature_at_first_freeze?: number;
}

interface WellDetailedResults {
    well_info: WellResultSummary;
    phase_change_history: PhaseChangeEvent[];
    temperature_summary: TemperatureSummary;
}

interface OptimizedResultsViewerProps {
    experimentId: string;
}

const OptimizedResultsViewer: React.FC<OptimizedResultsViewerProps> = ({ experimentId }) => {
    const [results, setResults] = useState<ExperimentResultsSummary | null>(null);
    const [selectedWell, setSelectedWell] = useState<WellDetailedResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wellDialogOpen, setWellDialogOpen] = useState(false);
    const [loadingWellDetails, setLoadingWellDetails] = useState(false);

    const dataProvider = useDataProvider();
    const notify = useNotify();

    useEffect(() => {
        loadResults();
    }, [experimentId]);

    const loadResults = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/experiments/${experimentId}/results`);
            if (!response.ok) {
                throw new Error(`Failed to load results: ${response.statusText}`);
            }

            const data: ExperimentResultsSummary = await response.json();
            setResults(data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load results';
            setError(errorMessage);
            notify(errorMessage, { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const loadWellDetails = async (row: number, col: number) => {
        try {
            setLoadingWellDetails(true);

            const response = await fetch(`/api/experiments/${experimentId}/wells/${row}/${col}/results`);
            if (!response.ok) {
                if (response.status === 404) {
                    notify('No data found for this well', { type: 'info' });
                    return;
                }
                throw new Error(`Failed to load well details: ${response.statusText}`);
            }

            const data: WellDetailedResults = await response.json();
            setSelectedWell(data);
            setWellDialogOpen(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load well details';
            notify(errorMessage, { type: 'error' });
        } finally {
            setLoadingWellDetails(false);
        }
    };

    const getWellColor = (well: WellResultSummary) => {
        if (well.total_phase_changes === 0) {
            return '#f5f5f5'; // No changes - gray
        }
        
        if (well.final_state === 1) {
            return '#ffecb3'; // Frozen - light amber
        } else if (well.final_state === 0) {
            return '#e3f2fd'; // Liquid - light blue
        }
        
        return '#f5f5f5'; // Default gray
    };

    const getWellTooltip = (well: WellResultSummary) => {
        const lines = [
            `Well: ${well.coordinate}`,
            `State: ${well.final_state === 1 ? 'Frozen' : well.final_state === 0 ? 'Liquid' : 'Unknown'}`,
            `Phase Changes: ${well.total_phase_changes}`,
        ];

        if (well.sample_name) {
            lines.push(`Sample: ${well.sample_name}`);
        }
        if (well.treatment_name) {
            lines.push(`Treatment: ${well.treatment_name}`);
        }
        if (well.first_phase_change_time) {
            lines.push(`First Freeze: ${new Date(well.first_phase_change_time).toLocaleString()}`);
        }

        return lines.join('\n');
    };

    const renderTrayGrid = () => {
        if (!results) return null;

        const { tray_layout, wells } = results;
        const wellMap = new Map(wells.map(w => [`${w.row}-${w.col}`, w]));

        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Experiment Results - Interactive Tray View
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip 
                            icon={<AccessTimeIcon />}
                            label={`${results.total_time_points} Time Points`}
                            color="primary"
                        />
                        <Chip 
                            icon={<ScienceIcon />}
                            label={`${wells.length} Wells with Data`}
                            color="secondary"
                        />
                    </Stack>
                </Box>

                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${tray_layout.columns}, 40px)`,
                        gridTemplateRows: `repeat(${tray_layout.rows}, 40px)`,
                        gap: '2px',
                        justifyContent: 'center',
                        maxWidth: 'fit-content',
                        margin: '0 auto',
                        p: 2,
                        bgcolor: 'grey.100',
                        borderRadius: 2,
                    }}
                >
                    {Array.from({ length: tray_layout.rows }, (_, row) =>
                        Array.from({ length: tray_layout.columns }, (_, col) => {
                            const actualRow = row + 1; // Convert to 1-based
                            const actualCol = col + 1;
                            const well = wellMap.get(`${actualRow}-${actualCol}`);
                            const coordinate = `${String.fromCharCode(65 + row)}${actualCol}`;

                            return (
                                <Tooltip
                                    key={`${actualRow}-${actualCol}`}
                                    title={well ? getWellTooltip(well) : `Well ${coordinate} - No Data`}
                                    arrow
                                >
                                    <Box
                                        onClick={well ? () => loadWellDetails(actualRow, actualCol) : undefined}
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            bgcolor: well ? getWellColor(well) : '#f0f0f0',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            cursor: well ? 'pointer' : 'default',
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': well ? {
                                                transform: 'scale(1.1)',
                                                zIndex: 1,
                                                boxShadow: 2,
                                            } : {},
                                        }}
                                    >
                                        {coordinate}
                                    </Box>
                                </Tooltip>
                            );
                        })
                    )}
                </Box>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 16, height: 16, bgcolor: '#e3f2fd', border: '1px solid #ccc' }} />
                        <Typography variant="caption">Liquid</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 16, height: 16, bgcolor: '#ffecb3', border: '1px solid #ccc' }} />
                        <Typography variant="caption">Frozen</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Box sx={{ width: 16, height: 16, bgcolor: '#f5f5f5', border: '1px solid #ccc' }} />
                        <Typography variant="caption">No Data</Typography>
                    </Stack>
                </Box>
            </Box>
        );
    };

    const renderWellDetailsDialog = () => {
        if (!selectedWell) return null;

        const { well_info, phase_change_history, temperature_summary } = selectedWell;

        return (
            <Dialog
                open={wellDialogOpen}
                onClose={() => setWellDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography variant="h6">
                            Well {well_info.coordinate} Details
                        </Typography>
                        <Button
                            onClick={() => setWellDialogOpen(false)}
                            startIcon={<CloseIcon />}
                            size="small"
                        >
                            Close
                        </Button>
                    </Stack>
                </DialogTitle>
                
                <DialogContent dividers>
                    {/* Well Information */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Well Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Position</Typography>
                                    <Typography variant="body1">{well_info.coordinate} (Row {well_info.row}, Col {well_info.col})</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Final State</Typography>
                                    <Chip 
                                        label={well_info.final_state === 1 ? 'Frozen' : well_info.final_state === 0 ? 'Liquid' : 'Unknown'}
                                        color={well_info.final_state === 1 ? 'warning' : well_info.final_state === 0 ? 'primary' : 'default'}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Sample</Typography>
                                    <Typography variant="body1">{well_info.sample_name || 'Not specified'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Treatment</Typography>
                                    <Typography variant="body1">{well_info.treatment_name || 'Not specified'}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Total Phase Changes</Typography>
                                    <Typography variant="body1">{well_info.total_phase_changes}</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Dilution Factor</Typography>
                                    <Typography variant="body1">{well_info.dilution_factor || 'Not specified'}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Temperature Summary */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <ThermostatIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Temperature Summary
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={3}>
                                    <Typography variant="body2" color="text.secondary">Min Temperature</Typography>
                                    <Typography variant="body1">
                                        {temperature_summary.min_temperature ? `${temperature_summary.min_temperature.toFixed(1)}°C` : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={3}>
                                    <Typography variant="body2" color="text.secondary">Max Temperature</Typography>
                                    <Typography variant="body1">
                                        {temperature_summary.max_temperature ? `${temperature_summary.max_temperature.toFixed(1)}°C` : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={3}>
                                    <Typography variant="body2" color="text.secondary">Avg Temperature</Typography>
                                    <Typography variant="body1">
                                        {temperature_summary.avg_temperature ? `${temperature_summary.avg_temperature.toFixed(1)}°C` : 'N/A'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={3}>
                                    <Typography variant="body2" color="text.secondary">Temp at First Freeze</Typography>
                                    <Typography variant="body1">
                                        {temperature_summary.temperature_at_first_freeze ? `${temperature_summary.temperature_at_first_freeze.toFixed(1)}°C` : 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Phase Change History */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Phase Change History
                            </Typography>
                            {phase_change_history.length > 0 ? (
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Timestamp</TableCell>
                                                <TableCell>Change</TableCell>
                                                <TableCell>Image</TableCell>
                                                <TableCell>Temperature</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {phase_change_history.map((event, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        {new Date(event.timestamp).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Stack direction="row" alignItems="center" spacing={1}>
                                                            {event.from_state !== undefined && (
                                                                <>
                                                                    <Chip 
                                                                        label={event.from_state === 1 ? 'Frozen' : 'Liquid'}
                                                                        size="small"
                                                                        color={event.from_state === 1 ? 'warning' : 'primary'}
                                                                    />
                                                                    <Typography variant="caption">→</Typography>
                                                                </>
                                                            )}
                                                            <Chip 
                                                                label={event.to_state === 1 ? 'Frozen' : 'Liquid'}
                                                                size="small"
                                                                color={event.to_state === 1 ? 'warning' : 'primary'}
                                                            />
                                                        </Stack>
                                                    </TableCell>
                                                    <TableCell>
                                                        {event.image_filename || 'N/A'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {event.temperature_at_change ? `${event.temperature_at_change.toFixed(1)}°C` : 'N/A'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    No phase changes recorded for this well.
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                </DialogContent>
            </Dialog>
        );
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <CircularProgress />
                <Typography variant="body1" sx={{ ml: 2 }}>
                    Loading experiment results...
                </Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="body1">
                    <strong>Error:</strong> {error}
                </Typography>
            </Alert>
        );
    }

    if (!results) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body1">
                    No results data available for this experiment.
                </Typography>
            </Alert>
        );
    }

    return (
        <Box>
            {renderTrayGrid()}
            {renderWellDetailsDialog()}
            
            {loadingWellDetails && (
                <Box 
                    sx={{ 
                        position: 'fixed', 
                        top: 0, 
                        left: 0, 
                        right: 0, 
                        bottom: 0, 
                        bgcolor: 'rgba(0,0,0,0.5)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        zIndex: 9999 
                    }}
                >
                    <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, textAlign: 'center' }}>
                        <CircularProgress />
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            Loading well details...
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default OptimizedResultsViewer;