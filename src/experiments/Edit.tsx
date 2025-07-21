import React from 'react';
import {
    BooleanField,
    BooleanInput,
    DateTimeInput,
    Edit,
    NumberInput,
    ReferenceInput,
    SelectInput,
    SimpleForm,
    TextInput,
    required,
    useRecordContext,
    useGetOne,
    FormDataConsumer
} from 'react-admin';
import RegionInput from '../components/RegionInput';

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

const EditComponent = () => {
    return (
        <Edit redirect="show" mutationMode="pessimistic">
            <SimpleForm>
                <TextInput disabled label="Id" source="id" />
                <TextInput source="name" validate={[required()]} />
                <ReferenceInput source="sample_id" reference="samples">
                    <SelectInput optionText="name" />
                </ReferenceInput>
                <TextInput source="username" />
                <DateTimeInput source="performed_at" label="Date" parse={(date: string | Date) => {
                    const parsedDate = typeof date === 'string' ? new Date(date) : date;
                    return parsedDate ? parsedDate.toISOString() : null;
                }} />

                <NumberInput source="temperature_ramp" fullWidth />
                <NumberInput source="temperature_start" fullWidth />
                <NumberInput source="temperature_end" fullWidth />
                <TextInput source="remarks" fullWidth />
                <BooleanInput source="is_calibration" />
                <hr style={{ margin: '20px 0', border: '1px solid #ccc', width: '100%' }} />

                <ReferenceInput
                    source="tray_configuration_id"
                    reference="trays"
                    sort={{ field: 'experiment_default', order: 'ASC' }}
                    
                >
                    <SelectInput
                        optionText={record =>
                            `${record.name}${record.experiment_default ? ' (Default)' : ''}`
                        }
                        optionValue="id"
                        validate={[required()]}
                        disabled
                        helperText="Tray configuration cannot be changed after creation, create another experiment if necessary."
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
        </Edit>
    );
};

export default EditComponent;
