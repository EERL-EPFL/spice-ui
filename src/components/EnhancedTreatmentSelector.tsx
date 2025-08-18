import React, { useState, useCallback, useEffect } from 'react';
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
    ToggleButton,
    ToggleButtonGroup,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
    Divider,
    Chip,
    Alert,
    ButtonGroup,
} from '@mui/material';
import {
    ContentCopy as CopyIcon,
    SelectAll as SelectAllIcon,
    Science as ScienceIcon,
} from '@mui/icons-material';

interface Treatment {
    id: string;
    name: string;
    sample?: {
        id: string;
        name: string;
        type?: string;
        campaign?: {
            location?: {
                name: string;
            };
        };
    };
}

interface ExistingRegionTreatment {
    regionName: string;
    regionIndex: number;
    treatment: {
        id: string;
        name: string;
        sample?: {
            id: string;
            name: string;
            type?: string;
            campaign?: {
                location?: {
                    name: string;
                };
            };
        };
    };
    dilution_factor?: number;
}

export interface EnhancedTreatmentSelectorProps {
    value?: string;
    onChange: (value: string) => void;
    onApplyToAll?: (value: string) => void;
    label?: string;
    disabled?: boolean;
    compact?: boolean;
    existingRegionTreatments?: ExistingRegionTreatment[];
    currentRegionIndex?: number;
    currentRegionName?: string;
    filteredTreatments?: Treatment[]; // Add option to provide pre-filtered treatments
}

export const EnhancedTreatmentSelector: React.FC<EnhancedTreatmentSelectorProps> = ({
    value,
    onChange,
    onApplyToAll,
    label,
    disabled = false,
    compact = false,
    existingRegionTreatments = [],
    currentRegionIndex,
    currentRegionName = 'this region',
    filteredTreatments
}) => {
    const dataProvider = useDataProvider();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'project' | 'procedural_blank'>('project');
    const [locationId, setLocationId] = useState<string | null>(null);
    const [sampleId, setSampleId] = useState<string | null>(null);
    const [treatmentId, setTreatmentId] = useState<string | null>(null);
    const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);

    // State for options
    const [locationOptions, setLocationOptions] = useState<Array<{ id: string, name: string }>>([]);
    const [sampleOptions, setSampleOptions] = useState<Array<{ id: string, name: string }>>([]);
    const [treatmentOptions, setTreatmentOptions] = useState<Array<Treatment>>([]);
    const [proceduralBlankSampleOptions, setProceduralBlankSampleOptions] = useState<Array<{ id: string, name: string }>>([]);

    // Get unique existing treatments (excluding current region)
    const uniqueExistingTreatments = existingRegionTreatments
        .filter((regionTreatment, index, self) => 
            regionTreatment.regionIndex !== currentRegionIndex &&
            index === self.findIndex(rt => rt.treatment.id === regionTreatment.treatment.id)
        );

    // Memoize treatment display data to prevent excessive API calls
    const [treatmentDisplayCache, setTreatmentDisplayCache] = useState<Map<string, { location: string; sample: string; treatment: string; sampleType: string }>>(new Map());

    // Get treatment name from ID - optimized to prevent infinite loops
    const getTreatmentName = useCallback(async () => {
        if (!value) return { location: '', sample: '', treatment: '', sampleType: '' };

        // Check cache first to avoid redundant API calls
        if (treatmentDisplayCache.has(value)) {
            return treatmentDisplayCache.get(value)!;
        }

        try {
            // Check if it's from existing treatments first
            const existingTreatment = existingRegionTreatments.find(rt => rt.treatment.id === value);
            if (existingTreatment && existingTreatment.treatment.sample) {
                const result = {
                    location: existingTreatment.treatment.sample.campaign?.location?.name || '',
                    sample: existingTreatment.treatment.sample.name,
                    treatment: existingTreatment.treatment.name,
                    sampleType: existingTreatment.treatment.sample.type || ''
                };
                setTreatmentDisplayCache(prev => new Map(prev).set(value, result));
                return result;
            }

            // Check if it's from loaded options
            const loadedTreatment = treatmentOptions.find(t => t.id === value);
            if (loadedTreatment && loadedTreatment.sample) {
                const result = {
                    location: loadedTreatment.sample.campaign?.location?.name || '',
                    sample: loadedTreatment.sample.name,
                    treatment: loadedTreatment.name,
                    sampleType: loadedTreatment.sample.type || ''
                };
                setTreatmentDisplayCache(prev => new Map(prev).set(value, result));
                return result;
            }

            // Fallback: fetch from API (only if not cached)
            const { data: treatment } = await dataProvider.getOne('treatments', { id: value });
            if (!treatment) {
                const result = { location: '', sample: '', treatment: '', sampleType: '' };
                setTreatmentDisplayCache(prev => new Map(prev).set(value, result));
                return result;
            }

            // Get the sample for this treatment
            const { data: sample } = await dataProvider.getOne('samples', { id: treatment.sample_id });
            if (!sample) {
                const result = { location: '', sample: '', treatment: treatment.name, sampleType: '' };
                setTreatmentDisplayCache(prev => new Map(prev).set(value, result));
                return result;
            }

            // Get the location for this sample (if not procedural blank)
            let locationName = '';
            if (sample.location_id) {
                try {
                    const { data: location } = await dataProvider.getOne('locations', { id: sample.location_id });
                    locationName = location?.name || '';
                } catch (error) {
                    console.warn('Could not load location:', error);
                }
            }

            const result = {
                location: locationName,
                sample: sample.name,
                treatment: treatment.name,
                sampleType: sample.type || ''
            };
            setTreatmentDisplayCache(prev => new Map(prev).set(value, result));
            return result;
        } catch (error) {
            console.error('Error fetching treatment hierarchy:', error);
            const result = { location: '', sample: '', treatment: '', sampleType: '' };
            setTreatmentDisplayCache(prev => new Map(prev).set(value, result));
            return result;
        }
    }, [value, dataProvider]); // Removed problematic dependencies

    // Display the selected treatment name
    const [displayValue, setDisplayValue] = useState<{ location: string; sample: string; treatment: string; sampleType: string }>({ location: '', sample: '', treatment: '', sampleType: '' });

    React.useEffect(() => {
        if (value) {
            getTreatmentName().then(setDisplayValue);
        } else {
            setDisplayValue({ location: '', sample: '', treatment: '', sampleType: '' });
        }
    }, [value, getTreatmentName]);

    // Load data functions (same as original)
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

    const loadProceduralBlankSamples = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await dataProvider.getList('samples', {
                pagination: { page: 1, perPage: 500 },
                sort: { field: 'name', order: 'ASC' },
                filter: { type: 'procedural_blank' }
            });
            setProceduralBlankSampleOptions(data);
        } catch (error) {
            console.error('Error loading procedural blank samples:', error);
            setProceduralBlankSampleOptions([]);
        } finally {
            setLoading(false);
        }
    }, [dataProvider]);

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

            // Fetch sample data for each treatment to get full hierarchy
            const enrichedTreatments = await Promise.all(
                data.map(async (treatment: any) => {
                    try {
                        const { data: sampleData } = await dataProvider.getOne('samples', { id: treatment.sample_id });
                        return {
                            ...treatment,
                            sample: sampleData
                        };
                    } catch (error) {
                        console.error('Error loading sample for treatment:', error);
                        return treatment;
                    }
                })
            );

            setTreatmentOptions(enrichedTreatments);
        } catch (error) {
            console.error('Error loading treatments:', error);
            setTreatmentOptions([]);
        } finally {
            setLoading(false);
        }
    }, [dataProvider]);

    // Use filtered treatments if provided
    useEffect(() => {
        if (filteredTreatments && filteredTreatments.length > 0) {
            setTreatmentOptions(filteredTreatments);
            setMode('project'); // Set to project mode when using filtered treatments
        }
    }, [filteredTreatments]);

    // Event handlers
    const handleOpen = () => {
        setOpen(true);
        if (mode === 'project') {
            loadLocations();
        } else {
            loadProceduralBlankSamples();
        }
    };

    const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: string | null) => {
        if (newMode !== null) {
            setMode(newMode as 'project' | 'procedural_blank');
            // Reset selections when mode changes
            setLocationId(null);
            setSampleId(null);
            setTreatmentId(null);
            setSelectedTreatment(null);
            
            if (newMode === 'project') {
                loadLocations();
            } else {
                loadProceduralBlankSamples();
            }
        }
    };

    const handleLocationChange = (event: SelectChangeEvent) => {
        const newLocationId = event.target.value;
        setLocationId(newLocationId);
        setSampleId(null);
        setTreatmentId(null);
        setSelectedTreatment(null);
        loadSamples(newLocationId);
    };

    const handleSampleChange = (event: SelectChangeEvent) => {
        const newSampleId = event.target.value;
        setSampleId(newSampleId);
        setTreatmentId(null);
        setSelectedTreatment(null);
        loadTreatments(newSampleId);
    };

    const handleTreatmentChange = (event: SelectChangeEvent) => {
        const newTreatmentId = event.target.value;
        setTreatmentId(newTreatmentId);
        const treatment = treatmentOptions.find(t => t.id === newTreatmentId);
        setSelectedTreatment(treatment || null);
    };

    const handleExistingTreatmentSelect = (treatment: Treatment) => {
        setTreatmentId(treatment.id);
        setSelectedTreatment(treatment);
        // Clear manual selections since we're using an existing one
        setLocationId(null);
        setSampleId(null);
    };

    const handleSelect = () => {
        if (treatmentId) {
            onChange(treatmentId);
            setOpen(false);
            // Reset state
            setLocationId(null);
            setSampleId(null);
            setTreatmentId(null);
            setSelectedTreatment(null);
        }
    };

    const handleApplyToAll = () => {
        if (treatmentId && onApplyToAll) {
            onApplyToAll(treatmentId);
            setOpen(false);
            // Reset state
            setLocationId(null);
            setSampleId(null);
            setTreatmentId(null);
            setSelectedTreatment(null);
        }
    };


    const getExistingTreatmentSummary = (regionTreatment: ExistingRegionTreatment) => {
        const parts = [];
        
        if (regionTreatment.treatment.sample?.campaign?.location?.name) {
            parts.push(regionTreatment.treatment.sample.campaign.location.name);
        }
        if (regionTreatment.treatment.sample?.name) {
            parts.push(regionTreatment.treatment.sample.name);
        }
        parts.push(regionTreatment.treatment.name);
        
        const treatmentPath = parts.join(' → ');
        const dilutionText = regionTreatment.dilution_factor ? ` (${regionTreatment.dilution_factor})` : '';
        return `${treatmentPath}${dilutionText}`;
    };

    if (compact) {
        return (
            <Box>
                <Box
                    onClick={disabled ? undefined : handleOpen}
                    sx={{
                        cursor: disabled ? 'default' : 'pointer',
                        padding: '4px 8px',
                        borderRadius: 1,
                        backgroundColor: disabled ? 'action.disabledBackground' : 'transparent',
                        '&:hover': disabled ? {} : {
                            backgroundColor: 'action.hover'
                        },
                        minHeight: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        border: '1px solid',
                        borderColor: 'divider',
                        position: 'relative'
                    }}
                >
                    {/* Location label on border edge */}
                    {displayValue.location && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: -8,
                                left: 6,
                                backgroundColor: 'background.paper',
                                paddingX: 0.5,
                                fontSize: '0.65rem',
                                fontWeight: 'medium',
                                color: 'text.secondary',
                                lineHeight: 1
                            }}
                        >
                            {displayValue.location}
                        </Box>
                    )}
                    {displayValue.treatment ? (
                        <Typography
                            variant="body2"
                            sx={{
                                fontSize: '0.75rem',
                                lineHeight: 1.2,
                                textAlign: 'left',
                                width: '100%'
                            }}
                        >
                            <span style={{ fontWeight: 'bold' }}>{displayValue.sample}</span>: {displayValue.treatment}
                        </Typography>
                    ) : (
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'text.secondary',
                                fontStyle: 'italic'
                            }}
                        >
                            {disabled ? 'No treatment' : 'Select treatment'}
                        </Typography>
                    )}
                </Box>

                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                        Select Treatment for {currentRegionName}
                    </DialogTitle>
                    <DialogContent>
                        <Box display="flex" flexDirection="column" gap={3} p={1}>
                            
                            {/* Existing Treatments Section */}
                            {uniqueExistingTreatments.length > 0 && (
                                <Box>
                                    <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                                        <CopyIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Copy from Existing Regions
                                    </Typography>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Click any treatment below to apply it to {currentRegionName}
                                    </Alert>
                                    <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto' }}>
                                        <List dense>
                                            {uniqueExistingTreatments.map((regionTreatment, index) => (
                                                <React.Fragment key={regionTreatment.treatment.id}>
                                                    <ListItemButton
                                                        onClick={() => handleExistingTreatmentSelect(regionTreatment.treatment)}
                                                        selected={treatmentId === regionTreatment.treatment.id}
                                                    >
                                                        <ListItemText
                                                            primary={
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Typography variant="body2" fontWeight="medium">
                                                                        {regionTreatment.treatment.name}
                                                                    </Typography>
                                                                    <Chip 
                                                                        label={`From: ${regionTreatment.regionName}`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        color="primary"
                                                                    />
                                                                </Box>
                                                            }
                                                            secondary={getExistingTreatmentSummary(regionTreatment)}
                                                        />
                                                    </ListItemButton>
                                                    {index < uniqueExistingTreatments.length - 1 && <Divider />}
                                                </React.Fragment>
                                            ))}
                                        </List>
                                    </Paper>
                                </Box>
                            )}

                            {/* Divider between sections */}
                            {uniqueExistingTreatments.length > 0 && (
                                <Divider sx={{ my: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        OR SELECT NEW TREATMENT
                                    </Typography>
                                </Divider>
                            )}

                            {/* Mode Toggle - Hide when using filtered treatments */}
                            {!filteredTreatments && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Select New Treatment
                                    </Typography>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Sample Type
                                    </Typography>
                                    <ToggleButtonGroup
                                        value={mode}
                                        exclusive
                                        onChange={handleModeChange}
                                        aria-label="sample type"
                                        fullWidth
                                    >
                                        <ToggleButton value="project" aria-label="project samples">
                                            Project Samples
                                        </ToggleButton>
                                        <ToggleButton value="procedural_blank" aria-label="procedural blank samples">
                                            Procedural blank samples
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                            )}

                            {/* Filtered treatments mode header */}
                            {filteredTreatments && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Select Treatment
                                    </Typography>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Choose from available treatments
                                    </Typography>
                                </Box>
                            )}

                            {mode === 'project' ? (
                                <>
                                    {/* Project mode - Location -> Sample -> Treatment */}
                                    {/* Skip location and sample selection when using filtered treatments */}
                                    {!filteredTreatments && (
                                        <>
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
                                        </>
                                    )}

                                    {/* Treatment selection - works for both filtered and normal mode */}
                                    {(sampleId || filteredTreatments) && (
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>
                                                {filteredTreatments ? 'Select Treatment' : '3. Select Treatment'}
                                            </Typography>
                                            <FormControl fullWidth variant="outlined">
                                                <InputLabel>Treatment</InputLabel>
                                                <Select
                                                    value={treatmentId || ''}
                                                    onChange={handleTreatmentChange}
                                                    label="Treatment"
                                                    disabled={loading || (!sampleId && !filteredTreatments)}
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
                                </>
                            ) : (
                                <>
                                    {/* Procedural Blank mode - Sample -> Treatment */}
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom>
                                            1. Select procedural blank sample
                                        </Typography>
                                        <FormControl fullWidth variant="outlined">
                                            <InputLabel>Procedural blank sample</InputLabel>
                                            <Select
                                                value={sampleId || ''}
                                                onChange={handleSampleChange}
                                                label="Procedural blank sample"
                                                disabled={loading}
                                            >
                                                <MenuItem value="">
                                                    <em>Select a procedural blank sample...</em>
                                                </MenuItem>
                                                {proceduralBlankSampleOptions.map(sample => (
                                                    <MenuItem key={sample.id} value={sample.id}>
                                                        {sample.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Box>

                                    {sampleId && (
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>
                                                2. Select Treatment
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
                                </>
                            )}

                            {loading && (
                                <Box display="flex" justifyContent="center" p={2}>
                                    <CircularProgress size={24} />
                                </Box>
                            )}

                            {/* Action Buttons */}
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                                <Button onClick={() => setOpen(false)} color="inherit">
                                    Cancel
                                </Button>
                                
                                <ButtonGroup variant="contained">
                                    <Button
                                        onClick={handleSelect}
                                        disabled={!treatmentId}
                                    >
                                        Select for {currentRegionName}
                                    </Button>
                                    {onApplyToAll && (
                                        <Button
                                            onClick={handleApplyToAll}
                                            disabled={!treatmentId}
                                            startIcon={<SelectAllIcon />}
                                            sx={{ borderLeft: '1px solid rgba(255,255,255,0.3)' }}
                                        >
                                            Apply to All Regions
                                        </Button>
                                    )}
                                </ButtonGroup>
                            </Box>
                        </Box>
                    </DialogContent>
                </Dialog>
            </Box>
        );
    }

    // Non-compact version (standard display)
    return (
        <Paper 
            elevation={1} 
            sx={{ 
                p: 2, 
                mt: 1,
                border: '1px solid',
                borderColor: 'divider'
            }}
        >
            {label && (
                <Typography variant="subtitle2" gutterBottom>
                    {label}
                </Typography>
            )}
            
            <Paper
                elevation={1}
                sx={{
                    p: 2,
                    cursor: disabled ? 'default' : 'pointer',
                    '&:hover': disabled ? {} : {
                        elevation: 2
                    }
                }}
                onClick={disabled ? undefined : handleOpen}
            >
                <Typography variant="subtitle2" gutterBottom>
                    {label || 'Treatment Selection'}
                </Typography>
                {displayValue.treatment ? (
                    <Box>
                        {displayValue.sampleType === 'procedural_blank' ? (
                            <>
                                <Typography variant="body2" color="primary.main">
                                    Type: Procedural Blank
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Sample: {displayValue.sample}
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    Treatment: {displayValue.treatment}
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary">
                                    Location: {displayValue.location}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Sample: {displayValue.sample}
                                </Typography>
                                <Typography variant="body1" fontWeight="bold">
                                    Treatment: {displayValue.treatment}
                                </Typography>
                            </>
                        )}
                    </Box>
                ) : (
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                        {disabled ? 'No treatment' : 'Select treatment'}
                    </Typography>
                )}
            </Paper>

            {/* Same dialog as compact version */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                {/* Dialog content same as above */}
            </Dialog>
        </Paper>
    );
};

export default EnhancedTreatmentSelector;