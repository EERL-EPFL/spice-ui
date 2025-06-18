import React, { useState, useCallback } from 'react';
import { useDataProvider } from 'react-admin';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Box,
    Typography,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    Paper,
} from '@mui/material';

export const TreatmentSelector = (props: {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
    disabled?: boolean;
    compact?: boolean;
}) => {
    const dataProvider = useDataProvider();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [locationId, setLocationId] = useState<string | null>(null);
    const [sampleId, setSampleId] = useState<string | null>(null);
    const [treatmentId, setTreatmentId] = useState<string | null>(null);

    // Add state for options
    const [locationOptions, setLocationOptions] = useState<Array<{ id: string, name: string }>>([]);
    const [sampleOptions, setSampleOptions] = useState<Array<{ id: string, name: string }>>([]);
    const [treatmentOptions, setTreatmentOptions] = useState<Array<{ id: string, name: string }>>([]);

    // Load locations when dialog opens
    const loadLocations = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await dataProvider.getList('locations', {
                pagination: { page: 1, perPage: 500 },
                sort: { field: 'name', order: 'ASC' },
                filter: {}
            });
            setLocationOptions(data);
        } catch (error) {
            console.error('Error loading locations:', error);
            setLocationOptions([]);
        } finally {
            setLoading(false);
        }
    }, [dataProvider]);

    // Load samples for a selected location
    const loadSamples = useCallback(async (locationId: string) => {
        if (!locationId) {
            setSampleOptions([]);
            return;
        }

        setLoading(true);
        try {
            const { data } = await dataProvider.getList('samples', {
                pagination: { page: 1, perPage: 500 },
                sort: { field: 'name', order: 'ASC' },
                filter: { location_id: locationId }
            });
            setSampleOptions(data);
        } catch (error) {
            console.error('Error loading samples:', error);
            setSampleOptions([]);
        } finally {
            setLoading(false);
        }
    }, [dataProvider]);

    // Load treatments for a selected sample
    const loadTreatments = useCallback(async (sampleId: string) => {
        if (!sampleId) {
            setTreatmentOptions([]);
            return;
        }

        setLoading(true);
        try {
            const { data } = await dataProvider.getList('treatments', {
                pagination: { page: 1, perPage: 500 },
                sort: { field: 'name', order: 'ASC' },
                filter: { sample_id: sampleId }
            });
            setTreatmentOptions(data);
        } catch (error) {
            console.error('Error loading treatments:', error);
            setTreatmentOptions([]);
        } finally {
            setLoading(false);
        }
    }, [dataProvider]);

    // Handle location selection
    const handleLocationChange = useCallback((event: SelectChangeEvent<string>) => {
        const newLocationId = event.target.value;
        setLocationId(newLocationId);
        setSampleId(null);
        setTreatmentId(null);
        setSampleOptions([]);
        setTreatmentOptions([]);
        if (newLocationId) {
            loadSamples(newLocationId);
        }
    }, [loadSamples]);

    // Handle sample selection
    const handleSampleChange = useCallback((event: SelectChangeEvent<string>) => {
        const newSampleId = event.target.value;
        setSampleId(newSampleId);
        setTreatmentId(null);
        setTreatmentOptions([]);
        if (newSampleId) {
            loadTreatments(newSampleId);
        }
    }, [loadTreatments]);

    // Handle treatment selection
    const handleTreatmentChange = useCallback((event: SelectChangeEvent<string>) => {
        setTreatmentId(event.target.value);
    }, []);

    // Handle final selection
    const handleSelect = useCallback(() => {
        if (treatmentId) {
            props.onChange(treatmentId);
            setOpen(false);
        }
    }, [treatmentId, props]);

    // Get treatment name from ID
    const getTreatmentName = useCallback(async () => {
        if (!props.value) return { location: '', sample: '', treatment: '' };

        try {
            const { data: treatment } = await dataProvider.getOne('treatments', { id: props.value });
            if (!treatment) return { location: '', sample: '', treatment: '' };

            // Get the sample for this treatment
            const { data: sample } = await dataProvider.getOne('samples', { id: treatment.sample_id });
            if (!sample) return { location: '', sample: '', treatment: treatment.name };

            // Get the location for this sample
            const { data: location } = await dataProvider.getOne('locations', { id: sample.location_id });

            return {
                location: location?.name || '',
                sample: sample.name,
                treatment: treatment.name
            };
        } catch (error) {
            console.error('Error fetching treatment hierarchy:', error);
            return { location: '', sample: '', treatment: '' };
        }
    }, [props.value, dataProvider]);

    // Display the selected treatment name
    const [displayValue, setDisplayValue] = useState<{ location: string; sample: string; treatment: string }>({ location: '', sample: '', treatment: '' });

    React.useEffect(() => {
        if (props.value) {
            getTreatmentName().then(setDisplayValue);
        } else {
            setDisplayValue({ location: '', sample: '', treatment: '' });
        }
    }, [props.value, getTreatmentName]);

    const openDialog = () => {
        setLocationId(null);
        setSampleId(null);
        setTreatmentId(null);
        setLocationOptions([]);
        setSampleOptions([]);
        setTreatmentOptions([]);
        setOpen(true);
        loadLocations();
    };

    return (
        <div>
            {props.compact ? (
                // Compact mode - show hierarchical display
                <Box
                    onClick={props.disabled ? undefined : openDialog}
                    sx={{
                        cursor: props.disabled ? 'default' : 'pointer',
                        padding: '6px 12px',
                        borderRadius: 1,
                        backgroundColor: props.disabled ? 'action.disabledBackground' : 'transparent',
                        '&:hover': props.disabled ? {} : {
                            backgroundColor: 'action.hover'
                        },
                        minHeight: '48px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        border: '1px solid',
                        borderColor: 'divider'
                    }}
                >
                    {displayValue.treatment ? (
                        <>
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: '0.65rem',
                                    color: 'text.secondary',
                                    lineHeight: 1.2,
                                    marginBottom: '2px'
                                }}
                            >
                                {displayValue.location}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontSize: '0.8rem',
                                    lineHeight: 1.2,
                                    marginBottom: '1px'
                                }}
                            >
                                {displayValue.sample}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    lineHeight: 1.2
                                }}
                            >
                                {displayValue.treatment}
                            </Typography>
                        </>
                    ) : (
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'text.secondary',
                                fontStyle: 'italic'
                            }}
                        >
                            {props.disabled ? 'No treatment selected' : 'Click to select treatment'}
                        </Typography>
                    )}
                </Box>
            ) : (
                // Standard mode
                <Paper
                    elevation={1}
                    sx={{
                        p: 2,
                        cursor: props.disabled ? 'default' : 'pointer',
                        '&:hover': props.disabled ? {} : {
                            elevation: 2
                        }
                    }}
                    onClick={props.disabled ? undefined : openDialog}
                >
                    <Typography variant="subtitle2" gutterBottom>
                        {props.label || 'Treatment Selection'}
                    </Typography>
                    {displayValue.treatment ? (
                        <Box>
                            <Typography variant="body2" color="text.secondary">
                                Location: {displayValue.location}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Sample: {displayValue.sample}
                            </Typography>
                            <Typography variant="body1" fontWeight="bold">
                                Treatment: {displayValue.treatment}
                            </Typography>
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            {props.disabled ? 'No treatment selected' : 'Click to select a treatment'}
                        </Typography>
                    )}
                </Paper>
            )}

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Select a Treatment</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} p={1}>
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                1. Select Location
                            </Typography>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Location</InputLabel>
                                <Select
                                    value={locationId || ''}
                                    onChange={handleLocationChange}
                                    label="Location"
                                    disabled={loading}
                                >
                                    <MenuItem value="">
                                        <em>Select a location...</em>
                                    </MenuItem>
                                    {locationOptions.map(location => (
                                        <MenuItem key={location.id} value={location.id}>
                                            {location.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {locationId && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    2. Select Sample
                                </Typography>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Sample</InputLabel>
                                    <Select
                                        value={sampleId || ''}
                                        onChange={handleSampleChange}
                                        label="Sample"
                                        disabled={loading || !locationId}
                                    >
                                        <MenuItem value="">
                                            <em>Select a sample...</em>
                                        </MenuItem>
                                        {sampleOptions.map(sample => (
                                            <MenuItem key={sample.id} value={sample.id}>
                                                {sample.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}

                        {sampleId && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    3. Select Treatment
                                </Typography>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Treatment</InputLabel>
                                    <Select
                                        value={treatmentId || ''}
                                        onChange={handleTreatmentChange}
                                        label="Treatment"
                                        disabled={loading || !sampleId}
                                    >
                                        <MenuItem value="">
                                            <em>Select a treatment...</em>
                                        </MenuItem>
                                        {treatmentOptions.map(treatment => (
                                            <MenuItem key={treatment.id} value={treatment.id}>
                                                {treatment.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}

                        {loading && (
                            <Box display="flex" justifyContent="center" p={2}>
                                <CircularProgress size={24} />
                            </Box>
                        )}

                        <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                            <Button onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSelect}
                                variant="contained"
                                disabled={!treatmentId}
                            >
                                Select
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TreatmentSelector;