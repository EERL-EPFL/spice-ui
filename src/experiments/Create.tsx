import React, { useEffect, useMemo, useCallback } from 'react';
import {
    Create,
    SimpleForm,
    TextField,
    TextInput,
    required,
    NumberInput,
    DateTimeInput,
    ReferenceInput,
    SelectInput,
    BooleanInput,
    useGetList,
    FormDataConsumer,
    useGetOne,
    useInput,
} from 'react-admin';
import RegionInput from '../components/RegionInput';


/**
 * Separate component for tray configuration region input to prevent unnecessary re-renders.
 * Only re-renders when tray_configuration_id changes, not when other form fields change.
 */
const TrayConfigurationRegionInput: React.FC<{ trayConfigurationId?: any }> = React.memo(({ trayConfigurationId }) => {
    const { data: trayConfiguration, isLoading } = useGetOne(
        'tray_configurations',
        { id: trayConfigurationId },
        { enabled: !!trayConfigurationId }
    );

    if (isLoading) {
        return <div>Loading tray configuration...</div>;
    }

    return (
        <RegionInput
            source="regions"
            label="Define Well Regions"
            trayConfiguration={trayConfiguration}
        />
    );
});

/**
 * Custom tray configuration selector that properly handles default values
 */
const TrayConfigurationSelector: React.FC<{ 
    defaultTrayId?: any; 
    fallbackTrayId?: any; 
    isLoading?: boolean;
}> = ({ 
    defaultTrayId, 
    fallbackTrayId,
    isLoading 
}) => {
    if (isLoading) {
        return <div>Loading tray configurations...</div>;
    }
    
    return (
        <ReferenceInput
            source="tray_configuration_id"
            reference="tray_configurations"
            sort={{ field: 'experiment_default', order: 'DESC' }}
        >
            <SelectInput
                optionText={record =>
                    `${record.name}${record.experiment_default ? ' (Default)' : ''}`
                }
                optionValue="id"
                validate={[required()]}
            />
        </ReferenceInput>
    );
};

const CreateComponent: React.FC = () => {
    // Memoize the query parameters to prevent infinite loops
    const defaultTraysParams = useMemo(() => ({
        pagination: { page: 1, perPage: 1 },
        sort: { field: 'experiment_default', order: 'DESC' as const },
        filter: { experiment_default: true }
    }), []);

    const allTraysParams = useMemo(() => ({
        pagination: { page: 1, perPage: 10 },
        sort: { field: 'experiment_default', order: 'DESC' as const }
    }), []);

    // Load the tray configuration marked as experiment_default = true
    const { data: trays, isLoading: traysLoading, error: traysError } = useGetList(
        'tray_configurations',
        defaultTraysParams
    );
    
    // Also load ALL tray configurations to check if any exist
    const { data: allTrays, isLoading: allTraysLoading } = useGetList(
        'tray_configurations',
        allTraysParams
    );
    
    const defaultTrayId = useMemo(() => trays?.[0]?.id, [trays]);
    const fallbackTrayId = useMemo(() => allTrays?.[0]?.id, [allTrays]);
    
    const trayToUse = useMemo(() => defaultTrayId || fallbackTrayId, [defaultTrayId, fallbackTrayId]);

    // Debug logging - memoize to prevent excessive logging
    useEffect(() => {
        if (!traysLoading && !allTraysLoading) {
            console.log('=== Tray Configuration Debug ===');
            console.log('Default trays query result:', { trays, isLoading: traysLoading, error: traysError });
            console.log('All trays query result:', { allTrays, isLoading: allTraysLoading });
            console.log('Default tray ID:', defaultTrayId);
            console.log('Fallback tray ID:', fallbackTrayId);
            console.log('Tray to use:', trayToUse);
            console.log('================================');
        }
    }, [defaultTrayId, fallbackTrayId, trayToUse, traysLoading, allTraysLoading]);

    // Memoize transform function to prevent infinite loops - ALWAYS call this hook
    const transformData = useCallback((data) => {
        // If no tray_configuration_id is set, use our default
        if (!data.tray_configuration_id && trayToUse) {
            data.tray_configuration_id = trayToUse;
            console.log('Transform: Setting tray_configuration_id to', data.tray_configuration_id);
        }
        return data;
    }, [trayToUse]);

    // Memoize default values to prevent infinite loops - ALWAYS call this hook
    const defaultValues = useMemo(() => ({
        tray_configuration_id: trayToUse
    }), [trayToUse]);

    // Handle loading state after all hooks are called
    if (traysLoading || allTraysLoading) {
        return (
            <Create redirect="show">
                <div style={{ padding: '20px', textAlign: 'center' }}>
                    Loading tray configurations...
                </div>
            </Create>
        );
    }

    return (
        <Create 
            redirect="show"
            transform={transformData}
        >
            <SimpleForm 
                key={`form-${trayToUse || 'no-tray'}`} // Force re-render when tray changes
                onError={(error) => console.error('Form submission error:', error)}
                defaultValues={defaultValues}
            >
                {!traysLoading && !allTraysLoading && allTrays?.length === 0 && (
                    <div style={{ 
                        padding: '8px 12px', 
                        marginBottom: '16px',
                        backgroundColor: '#f8d7da', 
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px',
                        color: '#721c24'
                    }}>
                        ❌ No tray configurations found. Please create a tray configuration first.
                    </div>
                )}
                {!traysLoading && !defaultTrayId && allTrays?.length > 0 && (
                    <div style={{ 
                        padding: '8px 12px', 
                        marginBottom: '16px',
                        backgroundColor: '#fff3cd', 
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px',
                        color: '#856404'
                    }}>
                        ⚠️ No default tray configuration found. Using "{allTrays[0]?.name}" as fallback.
                        Consider setting a tray configuration as default.
                    </div>
                )}
                <TextField source="id" />
                <TextInput source="name" validate={[required()]} />
                <TextInput source="username" />
                <DateTimeInput
                    source="performed_at"
                    label="Date"
                    defaultValue={new Date().toISOString()}
                    parse={date =>
                        typeof date === 'string'
                            ? new Date(date).toISOString()
                            : date?.toISOString() || null
                    }
                />
                <NumberInput source="temperature_ramp" defaultValue={0.33} />
                <NumberInput source="temperature_start" defaultValue={2} />
                <NumberInput source="temperature_end" defaultValue={-35} />
                <TextInput source="remarks" />
                <BooleanInput source="is_calibration" />

                <TrayConfigurationSelector 
                    defaultTrayId={defaultTrayId} 
                    fallbackTrayId={fallbackTrayId} 
                    isLoading={traysLoading || allTraysLoading}
                />

                <FormDataConsumer>
                    {({ formData }) => (
                        <TrayConfigurationRegionInput 
                            trayConfigurationId={formData?.tray_configuration_id} 
                        />
                    )}
                </FormDataConsumer>
            </SimpleForm>
        </Create>
    );
};

export default CreateComponent;
