import React, { useEffect } from 'react';
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
} from 'react-admin';
import { useFormContext } from 'react-hook-form';
import RegionInput from '../components/RegionInput';

/**
 * Once we know the default tray ID, shove it into the form.
 */
const InjectDefaultTray: React.FC<{ defaultTrayId?: any }> = ({ defaultTrayId }) => {
    const { setValue, getValues, watch } = useFormContext();
    const currentValue = watch('tray_configuration_id');
    
    useEffect(() => {
        if (defaultTrayId != null && !currentValue) {
            console.log('Setting default tray configuration ID:', defaultTrayId);
            setValue('tray_configuration_id', defaultTrayId, { shouldValidate: true });
        }
    }, [defaultTrayId, setValue, currentValue]);
    return null;
};

/**
 * Separate component for tray configuration region input to prevent unnecessary re-renders.
 * Only re-renders when tray_configuration_id changes, not when other form fields change.
 */
const TrayConfigurationRegionInput: React.FC<{ trayConfigurationId?: any }> = React.memo(({ trayConfigurationId }) => {
    const { data: trayConfiguration, isLoading } = useGetOne(
        'trays',
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

const CreateComponent: React.FC = () => {
    // load just the top‐ranked tray configuration
    const { data: trays } = useGetList(
        'trays',
        { pagination: { page: 1, perPage: 1 }, sort: { field: 'experiment_default', order: 'ASC' } }
    );
    const defaultTrayId = trays?.[0]?.id;

    return (
        <Create redirect="show">
            <SimpleForm onError={(error) => console.error('Form submission error:', error)}>
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

                {/* once we know the ID, inject it */}
                <InjectDefaultTray defaultTrayId={defaultTrayId} />

                <ReferenceInput
                    source="tray_configuration_id"
                    reference="trays"
                    sort={{ field: 'experiment_default', order: 'ASC' }}
                    defaultValue={defaultTrayId}
                >
                    <SelectInput
                        optionText={record =>
                            `${record.name}${record.experiment_default ? ' (Default)' : ''}`
                        }
                        optionValue="id"
                        validate={[required()]}
                    />
                </ReferenceInput>

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
