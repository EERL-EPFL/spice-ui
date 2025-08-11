import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Divider,
    Alert,
    Button,
    Paper,
} from '@mui/material';
import { Add } from '@mui/icons-material';

interface SampleFormProps {
    initialData?: any;
    onDataChange: (data: any) => void;
    compact?: boolean;
}

interface TreatmentData {
    name: string;
    notes?: string;
    enzyme_volume_litres?: number | null;
}

interface SampleFormData {
    material: string;
    type: 'bulk' | 'filter' | 'procedural_blank' | 'pure_water';
    suspension_volume_ml: string;
    collected_at: string;
    comment: string;
    treatments: TreatmentData[];
    
    // Filter-specific fields
    starttime?: string;
    stoptime?: string;
    flow?: string;
    total_volume?: string;
    source?: string;
    filterfrac?: string;
    
    // Bulk-specific fields
    latitude?: string;
    longitude?: string;
    bulkmass_mg?: string;
}

const AVAILABLE_TREATMENTS = [
    { id: 'none', name: 'None (No treatment)' },
    { id: 'heat', name: 'Heat Treatment' },
    { id: 'h2o2', name: 'H₂O₂ Treatment' }
];

const SampleForm: React.FC<SampleFormProps> = ({ 
    initialData, 
    onDataChange, 
    compact = false 
}) => {
    const [formData, setFormData] = useState<SampleFormData>({
        material: initialData?.material || '',
        type: initialData?.type || 'bulk',
        suspension_volume_ml: initialData?.suspension_volume_ml?.toString() || '',
        collected_at: initialData?.collected_at || '',
        comment: initialData?.comment || '',
        treatments: initialData?.treatments || [{ name: 'none', notes: '', enzyme_volume_litres: null }],
        
        // Filter fields
        starttime: initialData?.starttime || '',
        stoptime: initialData?.stoptime || '',
        flow: initialData?.flow?.toString() || '',
        total_volume: initialData?.total_volume?.toString() || '',
        source: initialData?.source || '',
        filterfrac: initialData?.filterfrac?.toString() || '',
        
        // Bulk fields
        latitude: initialData?.latitude?.toString() || '',
        longitude: initialData?.longitude?.toString() || '',
        bulkmass_mg: initialData?.bulkmass_mg?.toString() || '',
    });

    // Notify parent of data changes
    useEffect(() => {
        const processedData = {
            ...formData,
            suspension_volume_ml: formData.suspension_volume_ml ? parseFloat(formData.suspension_volume_ml) : null,
            flow: formData.flow ? parseFloat(formData.flow) : null,
            total_volume: formData.total_volume ? parseFloat(formData.total_volume) : null,
            filterfrac: formData.filterfrac ? parseFloat(formData.filterfrac) : null,
            latitude: formData.latitude ? parseFloat(formData.latitude) : null,
            longitude: formData.longitude ? parseFloat(formData.longitude) : null,
            bulkmass_mg: formData.bulkmass_mg ? parseFloat(formData.bulkmass_mg) : null,
        };
        onDataChange(processedData);
    }, [
        formData.material,
        formData.type, 
        formData.suspension_volume_ml,
        formData.collected_at,
        formData.comment,
        formData.treatments,
        formData.starttime,
        formData.stoptime,
        formData.flow,
        formData.total_volume,
        formData.source,
        formData.filterfrac,
        formData.latitude,
        formData.longitude,
        formData.bulkmass_mg,
        onDataChange
    ]);

    const updateField = (field: keyof SampleFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addTreatment = () => {
        setFormData(prev => ({
            ...prev,
            treatments: [...prev.treatments, { name: 'none', notes: '', enzyme_volume_litres: null }]
        }));
    };

    const removeTreatment = (index: number) => {
        setFormData(prev => ({
            ...prev,
            treatments: prev.treatments.length > 1 
                ? prev.treatments.filter((_, i) => i !== index)
                : prev.treatments // Keep at least one treatment
        }));
    };

    const updateTreatment = (index: number, field: keyof TreatmentData, value: any) => {
        setFormData(prev => ({
            ...prev,
            treatments: prev.treatments.map((treatment, i) => 
                i === index ? { ...treatment, [field]: value } : treatment
            )
        }));
    };

    const renderBasicFields = () => (
        <Box>
            {!compact && (
                <Typography variant="h6" gutterBottom sx={{ mt: 1 }}>
                    Basic Information
                </Typography>
            )}
            
            <Grid container spacing={2}>
                <Grid item xs={12} sm={compact ? 7 : 8}>
                    <TextField
                        label="Material/Name"
                        fullWidth
                        variant="outlined"
                        value={formData.material}
                        onChange={(e) => updateField('material', e.target.value)}
                        required
                        helperText={compact ? undefined : "e.g., 'Arctic dust', 'Seawater', 'Atmospheric particles'"}
                    />
                </Grid>
                <Grid item xs={12} sm={compact ? 5 : 4}>
                    <FormControl fullWidth>
                        <InputLabel>Sample Type</InputLabel>
                        <Select
                            value={formData.type}
                            label="Sample Type"
                            onChange={(e) => updateField('type', e.target.value)}
                            sx={{ minWidth: compact ? 220 : 180 }}
                        >
                            <MenuItem value="bulk">Bulk</MenuItem>
                            <MenuItem value="filter">Filter</MenuItem>
                            <MenuItem value="procedural_blank">Procedural Blank</MenuItem>
                            <MenuItem value="pure_water">Pure Water</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                
                {/* Only show volume and date fields for actual samples (bulk, filter) */}
                {(formData.type === 'bulk' || formData.type === 'filter') && (
                    <>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Suspension Volume (mL)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={formData.suspension_volume_ml}
                                onChange={(e) => updateField('suspension_volume_ml', e.target.value)}
                                required
                                helperText={compact ? undefined : "Volume of liquid used for suspension"}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Collection Date & Time"
                                type="datetime-local"
                                fullWidth
                                variant="outlined"
                                value={formData.collected_at}
                                onChange={(e) => updateField('collected_at', e.target.value)}
                                required
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </>
                )}
            </Grid>
        </Box>
    );

    const renderFilterFields = () => (
        <Box>
            <Typography variant={compact ? "subtitle1" : "h6"} gutterBottom>
                Filter Sample Details
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Sampling Start Time"
                        type="datetime-local"
                        fullWidth
                        variant="outlined"
                        value={formData.starttime}
                        onChange={(e) => updateField('starttime', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        label="Sampling Stop Time"
                        type="datetime-local"
                        fullWidth
                        variant="outlined"
                        value={formData.stoptime}
                        onChange={(e) => updateField('stoptime', e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Airflow (L/min)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={formData.flow}
                        onChange={(e) => updateField('flow', e.target.value)}
                        helperText={compact ? undefined : "Flow rate through filter"}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Total Volume (L)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={formData.total_volume}
                        onChange={(e) => updateField('total_volume', e.target.value)}
                        helperText={compact ? undefined : "Total air volume sampled"}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Filter Fraction"
                        type="number"
                        inputProps={{ min: 0, max: 1, step: 0.01 }}
                        fullWidth
                        variant="outlined"
                        value={formData.filterfrac}
                        onChange={(e) => updateField('filterfrac', e.target.value)}
                        helperText={compact ? undefined : "Fraction of filter used (0-1)"}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Source Information"
                        fullWidth
                        variant="outlined"
                        value={formData.source}
                        onChange={(e) => updateField('source', e.target.value)}
                        helperText={compact ? undefined : "Where/whom the filter was obtained from"}
                    />
                </Grid>
            </Grid>
        </Box>
    );

    const renderBulkFields = () => (
        <Box>
            <Typography variant={compact ? "subtitle1" : "h6"} gutterBottom>
                Bulk Sample Details
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Latitude"
                        type="number"
                        inputProps={{ min: -90, max: 90, step: 0.000001 }}
                        fullWidth
                        variant="outlined"
                        value={formData.latitude}
                        onChange={(e) => updateField('latitude', e.target.value)}
                        helperText={compact ? undefined : "Decimal degrees"}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Longitude"
                        type="number"
                        inputProps={{ min: -180, max: 180, step: 0.000001 }}
                        fullWidth
                        variant="outlined"
                        value={formData.longitude}
                        onChange={(e) => updateField('longitude', e.target.value)}
                        helperText={compact ? undefined : "Decimal degrees"}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        label="Bulk Mass (mg)"
                        type="number"
                        fullWidth
                        variant="outlined"
                        value={formData.bulkmass_mg}
                        onChange={(e) => updateField('bulkmass_mg', e.target.value)}
                        helperText={compact ? undefined : "Mass of bulk powder used"}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        label="Source Information"
                        fullWidth
                        variant="outlined"
                        value={formData.source}
                        onChange={(e) => updateField('source', e.target.value)}
                        helperText={compact ? undefined : "Where/whom the bulk material was obtained from"}
                    />
                </Grid>
            </Grid>
        </Box>
    );

    const renderTreatmentFields = () => (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant={compact ? "subtitle1" : "h6"}>
                    Treatments for This Sample
                </Typography>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={addTreatment}
                    startIcon={<Add />}
                >
                    Add Treatment
                </Button>
            </Box>
            {!compact && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                    Define the treatments that will be applied to this sample. At least one treatment is required.
                </Typography>
            )}
            
            {formData.treatments.map((treatment, index) => (
                <Paper 
                    key={index} 
                    sx={{ 
                        p: 2, 
                        mb: 2, 
                        bgcolor: 'background.default',
                        border: 1,
                        borderColor: 'divider'
                    }}
                    variant="outlined"
                >
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                            <FormControl fullWidth>
                                <InputLabel>Treatment Type</InputLabel>
                                <Select
                                    value={treatment.name}
                                    label="Treatment Type"
                                    onChange={(e) => updateTreatment(index, 'name', e.target.value)}
                                >
                                    <MenuItem value="none">None</MenuItem>
                                    <MenuItem value="heat">Heat</MenuItem>
                                    <MenuItem value="h2o2">H₂O₂</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                label="Enzyme Volume (L)"
                                type="number"
                                inputProps={{ min: 0, step: 0.001 }}
                                fullWidth
                                value={treatment.enzyme_volume_litres || ''}
                                onChange={(e) => updateTreatment(index, 'enzyme_volume_litres', 
                                    e.target.value ? parseFloat(e.target.value) : null
                                )}
                                disabled={treatment.name === 'none'}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Notes"
                                fullWidth
                                value={treatment.notes || ''}
                                onChange={(e) => updateTreatment(index, 'notes', e.target.value)}
                                placeholder="Treatment details..."
                            />
                        </Grid>
                        <Grid item xs={12} sm={1}>
                            <Button
                                color="error"
                                onClick={() => removeTreatment(index)}
                                disabled={formData.treatments.length === 1}
                                size="small"
                                variant="outlined"
                            >
                                ✕
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            ))}

            {formData.treatments.length === 0 && (
                <Alert severity="error" sx={{ mt: 1 }}>
                    At least one treatment must be defined
                </Alert>
            )}
        </Box>
    );

    return (
        <Box>
            {renderBasicFields()}
            
            {!compact && <Divider sx={{ my: 3 }} />}
            {compact && <Box sx={{ my: 2 }} />}

            {/* Type-Specific Fields */}
            {formData.type === 'filter' && (
                <>
                    {renderFilterFields()}
                    {!compact && <Divider sx={{ my: 2 }} />}
                    {compact && <Box sx={{ my: 2 }} />}
                </>
            )}

            {formData.type === 'bulk' && (
                <>
                    {renderBulkFields()}
                    {!compact && <Divider sx={{ my: 2 }} />}
                    {compact && <Box sx={{ my: 2 }} />}
                </>
            )}

            {/* Treatment Selection */}
            {renderTreatmentFields()}

            {!compact && <Divider sx={{ my: 2 }} />}
            {compact && <Box sx={{ my: 2 }} />}

            {/* Comments */}
            <TextField
                label="Comments"
                fullWidth
                multiline
                rows={compact ? 2 : 3}
                variant="outlined"
                value={formData.comment}
                onChange={(e) => updateField('comment', e.target.value)}
                helperText={compact ? undefined : "Additional notes about this sample"}
            />
        </Box>
    );
};

export default SampleForm;