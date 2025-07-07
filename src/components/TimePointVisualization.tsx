import React, { useState, useEffect } from 'react';
import { 
    useAuthProvider, 
    useRecordContext, 
    useNotify,
    useGetOne
} from 'react-admin';
import { 
    Box, 
    Typography, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper,
    Chip,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert
} from '@mui/material';
// We'll create a simple inline component for well state display

interface TimePoint {
    id: string;
    experiment_id: string;
    timestamp: string;
    image_filename?: string;
    temperature_readings: TemperatureReading[];
    well_states: WellState[];
    created_at: string;
}

interface TemperatureReading {
    probe_sequence: number;
    temperature: number;
}

interface WellState {
    row: number;
    col: number;
    value: number;
}

// Simple component to display well states in a grid
const WellStateGrid: React.FC<{ trayConfiguration: any; wellStates: WellState[] }> = ({ 
    trayConfiguration, 
    wellStates 
}) => {
    const getWellStateColor = (value: number) => {
        switch (value) {
            case 0: return '#E3F2FD'; // Light blue for liquid
            case 1: return '#FFECB3'; // Light amber for frozen
            default: return '#F5F5F5'; // Gray for unknown
        }
    };

    // Get tray dimensions - handle both single tray and multi-tray configurations
    let maxRows = 8; // Default for 96-well
    let maxCols = 12;
    
    if (trayConfiguration?.trays && Array.isArray(trayConfiguration.trays)) {
        // Multi-tray configuration
        const firstTray = trayConfiguration.trays[0];
        if (firstTray?.trays && firstTray.trays.length > 0) {
            const tray = firstTray.trays[0];
            maxRows = tray.qty_y_axis || 8;
            maxCols = tray.qty_x_axis || 12;
        }
    } else if (trayConfiguration?.qty_y_axis && trayConfiguration?.qty_x_axis) {
        // Direct tray configuration
        maxRows = trayConfiguration.qty_y_axis;
        maxCols = trayConfiguration.qty_x_axis;
    }

    // Create a map of well states
    const wellStateMap: { [key: string]: number } = {};
    wellStates.forEach(ws => {
        const key = `${ws.row}-${ws.col}`;
        wellStateMap[key] = ws.value;
    });

    // Generate grid
    const grid = [];
    for (let row = 1; row <= maxRows; row++) {
        const rowCells = [];
        for (let col = 1; col <= maxCols; col++) {
            const key = `${row}-${col}`;
            const value = wellStateMap[key];
            const hasData = value !== undefined;
            
            rowCells.push(
                <Box
                    key={key}
                    sx={{
                        width: 24,
                        height: 24,
                        border: '1px solid #ccc',
                        backgroundColor: hasData ? getWellStateColor(value) : '#f9f9f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: hasData ? 'bold' : 'normal',
                        color: hasData ? '#333' : '#999'
                    }}
                    title={hasData ? `${String.fromCharCode(64 + col)}${row}: ${value === 0 ? 'Liquid' : 'Frozen'}` : `${String.fromCharCode(64 + col)}${row}: No data`}
                >
                    {hasData ? (value === 0 ? 'L' : 'F') : ''}
                </Box>
            );
        }
        grid.push(
            <Box key={`row-${row}`} display="flex" gap={0.5}>
                <Box sx={{ width: 20, fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {row}
                </Box>
                {rowCells}
            </Box>
        );
    }

    // Column headers
    const colHeaders = [];
    for (let col = 1; col <= maxCols; col++) {
        colHeaders.push(
            <Box key={`col-${col}`} sx={{ width: 24, fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {String.fromCharCode(64 + col)}
            </Box>
        );
    }

    return (
        <Box>
            {/* Column headers */}
            <Box display="flex" gap={0.5} mb={0.5}>
                <Box sx={{ width: 20 }}></Box> {/* Empty space for row numbers */}
                {colHeaders}
            </Box>
            {/* Grid */}
            <Box display="flex" flexDirection="column" gap={0.5}>
                {grid}
            </Box>
        </Box>
    );
};

export const TimePointVisualization = () => {
    const record = useRecordContext();
    const auth = useAuthProvider();
    const notify = useNotify();
    const [timePoints, setTimePoints] = useState<TimePoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTimePoint, setSelectedTimePoint] = useState<TimePoint | null>(null);

    // Get tray configuration for visualization
    const { data: trayConfiguration, isLoading: trayLoading } = useGetOne(
        'trays',
        { id: record?.tray_configuration_id },
        { enabled: !!record?.tray_configuration_id }
    );

    useEffect(() => {
        const fetchTimePoints = async () => {
            if (!record?.id || !auth) return;

            try {
                const token = await auth.getToken();
                const response = await fetch(`/api/experiments/${record.id}/time_points`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setTimePoints(Array.isArray(data) ? data : []);
                    if (data.length > 0) {
                        setSelectedTimePoint(data[0]);
                    }
                } else {
                    // Time points endpoint might not exist yet, that's ok
                    console.info('Time points endpoint not available or no data');
                    setTimePoints([]);
                }
            } catch (error) {
                console.warn('Error fetching time points:', error);
                setTimePoints([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTimePoints();
    }, [record?.id, auth]);

    if (loading || trayLoading) {
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

    if (timePoints.length === 0) {
        return (
            <Alert severity="info">
                No time point data available. Upload a merged.xlsx file to see phase change visualization.
            </Alert>
        );
    }

    const formatDateTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const getWellStateColor = (value: number) => {
        switch (value) {
            case 0: return '#E3F2FD'; // Light blue for liquid
            case 1: return '#FFECB3'; // Light amber for frozen
            default: return '#F5F5F5'; // Gray for unknown
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Time Point Visualization ({timePoints.length} time points)
            </Typography>

            <Grid container spacing={2}>
                {/* Time Point List */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                                Time Points
                            </Typography>
                            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Time</TableCell>
                                            <TableCell>Wells</TableCell>
                                            <TableCell>Probes</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {timePoints.map((tp) => (
                                            <TableRow 
                                                key={tp.id}
                                                hover
                                                selected={selectedTimePoint?.id === tp.id}
                                                onClick={() => setSelectedTimePoint(tp)}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                <TableCell>
                                                    <Typography variant="caption">
                                                        {formatDateTime(tp.timestamp)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{tp.well_states.length}</TableCell>
                                                <TableCell>{tp.temperature_readings.length}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Selected Time Point Details */}
                <Grid item xs={12} md={8}>
                    {selectedTimePoint && (
                        <Card>
                            <CardContent>
                                <Typography variant="subtitle1" gutterBottom>
                                    Time Point: {formatDateTime(selectedTimePoint.timestamp)}
                                </Typography>
                                
                                {selectedTimePoint.image_filename && (
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        Image: {selectedTimePoint.image_filename}
                                    </Typography>
                                )}

                                {/* Temperature Readings */}
                                {selectedTimePoint.temperature_readings.length > 0 && (
                                    <Box mb={2}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Temperature Readings:
                                        </Typography>
                                        <Box display="flex" flexWrap="wrap" gap={1}>
                                            {selectedTimePoint.temperature_readings.map((tr) => (
                                                <Chip 
                                                    key={tr.probe_sequence}
                                                    label={`Probe ${tr.probe_sequence}: ${tr.temperature.toFixed(1)}°C`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                {/* Well States Visualization */}
                                {selectedTimePoint.well_states.length > 0 && trayConfiguration && (
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Well States:
                                        </Typography>
                                        <WellStateGrid
                                            trayConfiguration={trayConfiguration}
                                            wellStates={selectedTimePoint.well_states}
                                        />
                                        
                                        {/* Legend */}
                                        <Box mt={2} display="flex" gap={2}>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Box 
                                                    width={16} 
                                                    height={16} 
                                                    bgcolor={getWellStateColor(0)}
                                                    border="1px solid #ccc"
                                                />
                                                <Typography variant="caption">Liquid</Typography>
                                            </Box>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Box 
                                                    width={16} 
                                                    height={16} 
                                                    bgcolor={getWellStateColor(1)}
                                                    border="1px solid #ccc"
                                                />
                                                <Typography variant="caption">Frozen</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};