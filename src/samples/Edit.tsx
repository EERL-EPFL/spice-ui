import React, { useState, useEffect } from 'react';
import {
    Edit,
    useRecordContext,
    useUpdate,
    useNotify,
    useRedirect
} from 'react-admin';
import {
    Box,
    Button,
    Typography
} from '@mui/material';
import { Save } from '@mui/icons-material';
import SampleForm from '../components/SampleForm';

const EditComponent = () => {
    const record = useRecordContext();
    const [update] = useUpdate();
    const notify = useNotify();
    const redirect = useRedirect();
    const [formData, setFormData] = useState<any>(null);
    const [isValid, setIsValid] = useState(false);
    const [loading, setLoading] = useState(false);

    // Prepare initial data for the reusable form
    const initialData = record ? {
        ...record,
        // Map database field names to form field names
        material: record.name || record.material_description,
        suspension_volume_ml: record.suspension_volume_litres ? record.suspension_volume_litres * 1000 : null,
        collected_at: record.start_time,
        comment: record.remarks,
        treatments: record.treatments?.map((t: any) => t.name) || ['none'],
        
        // Filter-specific mappings
        starttime: record.start_time,
        stoptime: record.stop_time,
        flow: record.flow_litres_per_minute,
        total_volume: record.total_volume,
        filterfrac: record.filter_fraction,
        
        // Bulk-specific mappings
        bulkmass_mg: record.bulk_mass_mg
    } : null;

    const handleFormDataChange = (data: any) => {
        setFormData(data);
        // Validate required fields
        const isFormValid = data.material?.trim() && 
                           data.suspension_volume_ml && 
                           data.collected_at &&
                           data.treatments?.length > 0;
        setIsValid(isFormValid);
    };

    const handleSave = async () => {
        if (!isValid || !formData || !record) return;
        
        setLoading(true);
        try {
            // Map form data back to database field names
            const updateData = {
                name: formData.material,
                material_description: formData.material,
                type: formData.type,
                suspension_volume_litres: formData.suspension_volume_ml / 1000,
                start_time: formData.collected_at,
                stop_time: formData.stoptime,
                remarks: formData.comment,
                
                // Filter-specific fields
                flow_litres_per_minute: formData.flow,
                total_volume: formData.total_volume,
                filter_fraction: formData.filterfrac,
                source: formData.source,
                
                // Bulk-specific fields
                latitude: formData.latitude,
                longitude: formData.longitude,
                bulk_mass_mg: formData.bulkmass_mg,
            };
            
            await update('samples', {
                id: record.id,
                data: updateData,
                previousData: record
            });
            
            // Note: Treatment updates would need separate API calls
            // This is simplified for now - in production you'd want to handle treatment updates too
            
            notify('Sample updated successfully', { type: 'success' });
            redirect('show', 'samples', record.id);
        } catch (error) {
            console.error('Error updating sample:', error);
            notify('Failed to update sample', { type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!record) return <Typography>Loading...</Typography>;

    return (
        <Edit redirect={false} actions={false}>
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5">
                        Edit Sample: {record.name}
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={!isValid || loading}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </Box>
                
                <SampleForm
                    initialData={initialData}
                    onDataChange={handleFormDataChange}
                    compact={false}
                />
            </Box>
        </Edit>
    );
};

export default EditComponent;
