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
    Close as CloseIcon,
    Visibility as VisibilityIcon,
    Link as LinkIcon
} from '@mui/icons-material';
import { useDataProvider, useNotify, useAuthProvider } from 'react-admin';
import { useNavigate } from 'react-router-dom';

// NEW INTERFACES FOR TRAY-CENTRIC STRUCTURE
interface TrayWellSummary {
    row_letter: string;
    column_number: number;
    coordinate: string;
    sample?: {
        id: string;
        name: string;
        // ... other sample fields
    };
    treatment_name?: string;
    dilution_factor?: number;
    first_phase_change_time?: string;
    final_state?: string; // "frozen", "liquid", "no_data"
    total_phase_changes: number;
    image_asset_id?: string;
}

interface TrayResultsSummary {
    tray_id: string;
    tray_name?: string;
    wells: TrayWellSummary[];
}

interface ExperimentResultsSummaryCompact {
    total_time_points: number;
    first_timestamp?: string;
    last_timestamp?: string;
}

interface ExperimentResultsResponse {
    summary: ExperimentResultsSummaryCompact;
    trays: TrayResultsSummary[];
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
    well_info: TrayWellSummary;
    phase_change_history: PhaseChangeEvent[];
    temperature_summary: TemperatureSummary;
}

interface OptimizedResultsViewerProps {
    experimentId: string;
}

const OptimizedResultsViewer: React.FC<OptimizedResultsViewerProps> = ({ experimentId }) => {
    const [results, setResults] = useState<ExperimentResultsResponse | null>(null);
    const [selectedWell, setSelectedWell] = useState<WellDetailedResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wellDialogOpen, setWellDialogOpen] = useState(false);
    const [loadingWellDetails, setLoadingWellDetails] = useState(false);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [selectedWellImage, setSelectedWellImage] = useState<{
        imageAssetId: string | null;
        wellCoordinate: string;
    } | null>(null);
    const [imageSrc, setImageSrc] = useState<string>('');
    const [loadingImage, setLoadingImage] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);

    const dataProvider = useDataProvider();
    const notify = useNotify();
    const authProvider = useAuthProvider();
    const navigate = useNavigate();

    useEffect(() => {
        loadResults();
    }, [experimentId]);

    const loadResults = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get results from the main experiment endpoint
            const response = await dataProvider.getOne('experiments', { id: experimentId });
            
            if (response.data && response.data.results) {
                setResults(response.data.results);
            } else {
                throw new Error('No results available for this experiment');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load results';
            setError(errorMessage);
            notify(errorMessage, { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const loadWellDetails = async (coordinate: string, well: TrayWellSummary) => {
        try {
            setLoadingWellDetails(true);

            // For now, we'll create a mock detailed results since we don't have the individual well details API yet
            // In a real implementation, you might call /api/experiments/${experimentId}/wells/${coordinate}/results
            const mockDetailedResults: WellDetailedResults = {
                well_info: well,
                phase_change_history: [],
                temperature_summary: {
                    min_temperature: undefined,
                    max_temperature: undefined,
                    avg_temperature: undefined,
                    temperature_at_first_freeze: undefined,
                },
            };

            setSelectedWell(mockDetailedResults);
            setWellDialogOpen(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load well details';
            notify(errorMessage, { type: 'error' });
        } finally {
            setLoadingWellDetails(false);
        }
    };

    const getWellColor = (well: TrayWellSummary) => {
        if (well.total_phase_changes === 0) {
            return '#f5f5f5'; // No changes - gray
        }
        
        if (well.final_state === 'frozen') {
            return '#ffecb3'; // Frozen - light amber
        } else if (well.final_state === 'liquid') {
            return '#e3f2fd'; // Liquid - light blue
        }
        
        return '#f5f5f5'; // Default gray
    };

    const getWellTooltip = (well: TrayWellSummary) => {
        console.log('Well tooltip data:', well);
        const lines = [
            `Well: ${well.coordinate}`,
            `State: ${well.final_state?.charAt(0).toUpperCase() + well.final_state?.slice(1) || 'Unknown'}`,
            `Phase Changes: ${well.total_phase_changes}`,
        ];

        if (well.sample?.name) {
            lines.push(`Sample: ${well.sample.name}`);
        }
        if (well.treatment_name) {
            lines.push(`Treatment: ${well.treatment_name}`);
        }
        if (well.first_phase_change_time) {
            lines.push(`First Freeze: ${new Date(well.first_phase_change_time).toLocaleString()}`);
        }
        if (well.dilution_factor) {
            lines.push(`Dilution: ${well.dilution_factor}`);
        }

        console.log('Tooltip lines:', lines);
        return lines.join('\n');
    };

    const renderTrayGrid = () => {
        if (!results) return null;

        const { summary, trays } = results;
        
        // Get all wells across all trays
        const allWells = trays.flatMap(tray => tray.wells);

        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                    Experiment Results - Interactive Tray View
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                        <Chip 
                            icon={<AccessTimeIcon />}
                            label={`${summary.total_time_points} Time Points`}
                            color="primary"
                        />
                        <Chip 
                            icon={<ScienceIcon />}
                            label={`${allWells.length} Wells with Data`}
                            color="secondary"
                        />
                        <Chip 
                            label={`${trays.length} Trays`}
                            color="default"
                        />
                    </Stack>
                </Box>

                {trays.map((tray, trayIndex) => (
                    <Box key={tray.tray_id} sx={{ mb: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            {tray.tray_name || `Tray ${trayIndex + 1}`}
                        </Typography>
                        
                        {/* Determine grid layout based on wells in this tray */}
                        {renderTrayWells(tray)}
                    </Box>
                ))}

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

    const renderTrayWells = (tray: TrayResultsSummary) => {
        // Create a map for quick lookups
        const wellMap = new Map(tray.wells.map(w => [w.coordinate, w]));
        
        // Determine the grid dimensions based on well coordinates
        const rows = Math.max(...tray.wells.map(w => w.row_letter.charCodeAt(0) - 64));
        const cols = Math.max(...tray.wells.map(w => w.column_number));
        
        // If no wells, show message
        if (tray.wells.length === 0) {
            return (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No wells with data in this tray
                </Typography>
            );
        }

        return (
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, 40px)`,
                    gridTemplateRows: `repeat(${rows}, 40px)`,
                    gap: '2px',
                    justifyContent: 'center',
                    maxWidth: 'fit-content',
                    margin: '0 auto',
                    p: 2,
                    bgcolor: 'grey.100',
                    borderRadius: 2,
                }}
            >
                {Array.from({ length: rows }, (_, rowIndex) =>
                    Array.from({ length: cols }, (_, colIndex) => {
                        const coordinate = `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`;
                        const well = wellMap.get(coordinate);

                        return (
                            <Tooltip
                                key={coordinate}
                                title={well ? getWellTooltip(well) : `Well ${coordinate} - No Data`}
                                arrow
                            >
                                <Box
                                    onClick={well ? () => loadWellDetails(coordinate, well) : undefined}
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
                                    <Typography variant="body1">{well_info.coordinate} (Row {well_info.row_letter}, Col {well_info.column_number})</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Final State</Typography>
                                    <Chip 
                                        label={well_info.final_state?.charAt(0).toUpperCase() + well_info.final_state?.slice(1) || 'Unknown'}
                                        color={well_info.final_state === 'frozen' ? 'warning' : well_info.final_state === 'liquid' ? 'primary' : 'default'}
                                        size="small"
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">Sample</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body1">{well_info.sample?.name || 'Not specified'}</Typography>
                                        {well_info.sample?.id && (
                                            <Tooltip title="View sample details">
                                                <Button
                                                    size="small"
                                                    startIcon={<LinkIcon />}
                                                    onClick={() => navigate(`/samples/${well_info.sample?.id}/show`)}
                                                    sx={{ minWidth: 'auto', p: 0.5 }}
                                                >
                                                    View
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </Box>
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
                                {well_info.image_asset_id && (
                                    <Grid item xs={12}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary">Freeze Image:</Typography>
                                            <Button
                                                size="small"
                                                startIcon={<VisibilityIcon />}
                                                onClick={() => handleWellImageClick(well_info.image_asset_id!, well_info.coordinate)}
                                                variant="outlined"
                                            >
                                                View Freeze Image
                                            </Button>
                                        </Box>
                                    </Grid>
                                )}
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

    const handleWellImageClick = async (imageAssetId: string, wellCoordinate: string) => {
        if (!imageAssetId) return;
        
        setSelectedWellImage({ imageAssetId, wellCoordinate });
        setImageViewerOpen(true);
        setLoadingImage(true);
        setImageError(null);
        
        try {
            const token = await authProvider.getToken();
            const result = await dataProvider.loadAssetImage(imageAssetId, token);
            setImageSrc(result.data.blobUrl);
        } catch (error) {
            console.error('Error loading well image:', error);
            setImageError('Failed to load image');
        } finally {
            setLoadingImage(false);
        }
    };

    const handleCloseImageViewer = () => {
        setImageViewerOpen(false);
        setSelectedWellImage(null);
        setImageSrc('');
        setImageError(null);
    };

    const renderWellImageViewer = () => {
        if (!imageViewerOpen || !selectedWellImage) return null;
        
        return (
            <Dialog open={imageViewerOpen} onClose={handleCloseImageViewer} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Well {selectedWellImage.wellCoordinate} at Freeze Time
                    <Button
                        onClick={handleCloseImageViewer}
                        startIcon={<CloseIcon />}
                        size="small"
                    >
                        Close
                    </Button>
                </DialogTitle>
                <DialogContent>
                    {loadingImage && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                            <CircularProgress />
                            <Typography variant="body2" sx={{ ml: 2 }}>Loading image...</Typography>
                        </Box>
                    )}
                    {imageError && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                            <Typography variant="body2" color="error">{imageError}</Typography>
                        </Box>
                    )}
                    {imageSrc && !loadingImage && !imageError && (
                        <>
                            <img
                                src={imageSrc}
                                alt={`Well ${selectedWellImage.wellCoordinate} at freeze time`}
                                style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Well {selectedWellImage.wellCoordinate} freeze image
                            </Typography>
                        </>
                    )}
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
            {renderWellImageViewer()}
            
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