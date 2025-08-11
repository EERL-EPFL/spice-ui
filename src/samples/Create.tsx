import React, { useState } from 'react';
import {
    Create,
    useCreate,
    useNotify,
    useRedirect
} from 'react-admin';
import {
    Box,
    Button,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from '@mui/material';
import { Save } from '@mui/icons-material';
import SampleForm from '../components/SampleForm';
import { useGetList } from 'react-admin';

const CreateComponent = () => {
    const [create] = useCreate();
    const [createTreatment] = useCreate();
    const notify = useNotify();
    const redirect = useRedirect();
    const [formData, setFormData] = useState<any>(null);
    const [isValid, setIsValid] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedLocationId, setSelectedLocationId] = useState('');
    
    const { data: locations } = useGetList('locations');

    const handleFormDataChange = (data: any) => {
        setFormData(data);
        // Validate required fields
        const isFormValid = data.material?.trim() && 
                           data.suspension_volume_ml && 
                           data.collected_at &&
                           data.treatments?.length > 0 &&
                           selectedLocationId;
        setIsValid(isFormValid);
    };

    const handleSave = async () => {
        if (!isValid || !formData || !selectedLocationId) return;
        
        setLoading(true);
        try {
            // Extract treatments from form data
            const { treatments, ...sampleData } = formData;
            
            // Map form data to database field names
            const createData = {
                name: sampleData.material,
                material_description: sampleData.material,
                type: sampleData.type,
                location_id: selectedLocationId,
                suspension_volume_litres: sampleData.suspension_volume_ml / 1000,
                start_time: sampleData.collected_at,
                stop_time: sampleData.stoptime,
                remarks: sampleData.comment,
                
                // Filter-specific fields
                flow_litres_per_minute: sampleData.flow,
                total_volume: sampleData.total_volume,
                filter_fraction: sampleData.filterfrac,
                source: sampleData.source,
                
                // Bulk-specific fields
                latitude: sampleData.latitude,
                longitude: sampleData.longitude,
                bulk_mass_mg: sampleData.bulkmass_mg,
            };
            
            // Create the sample first
            const sampleResult = await create('samples', { data: createData });
            
            // Create treatment records for each selected treatment
            const treatmentPromises = treatments.map(async (treatmentName: string) => {
                const treatmentData = {
                    name: treatmentName,
                    sample_id: sampleResult.data.id,
                };
                return createTreatment('treatments', { data: treatmentData });
            });
            
            await Promise.all(treatmentPromises);
            
            notify('Sample and treatments created successfully', { type: 'success' });
            redirect('show', 'samples', sampleResult.data.id);
        } catch (error) {
            console.error('Error creating sample:', error);
            notify('Failed to create sample', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Create redirect={false} actions={false}>
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5">
                        Create New Sample
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={!isValid || loading}
                    >
                        {loading ? 'Creating...' : 'Create Sample'}
                    </Button>
                </Box>
                
                {/* Location Selection */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Location *</InputLabel>
                    <Select
                        value={selectedLocationId}
                        label="Location *"
                        onChange={(e) => setSelectedLocationId(e.target.value)}
                        required
                    >
                        {locations?.map((location: any) => (
                            <MenuItem key={location.id} value={location.id}>
                                {location.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                
                <SampleForm
                    onDataChange={handleFormDataChange}
                    compact={false}
                />
            </Box>
        </Create>
    );
};

export default CreateComponent;
