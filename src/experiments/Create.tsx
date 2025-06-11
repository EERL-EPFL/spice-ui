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
    const { setValue, getValues } = useFormContext();
    useEffect(() => {
        if (defaultTrayId != null && !getValues('tray_configuration_id')) {
            setValue('tray_configuration_id', defaultTrayId);
        }
    }, [defaultTrayId, setValue, getValues]);
    return null;
};

const CreateComponent: React.FC = () => {
    // load just the top‐ranked tray
    const { data: trays } = useGetList(
        'trays',
        { pagination: { page: 1, perPage: 1 }, sort: { field: 'experiment_default', order: 'ASC' } }
    );
    const defaultTrayId = trays?.[0]?.id;

    return (
        <Create redirect="show">
            <SimpleForm>
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
                <NumberInput source="temperature_ramp" />
                <NumberInput source="temperature_start" />
                <NumberInput source="temperature_end" />
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
                    {({ formData }) => {
                        const TrayConfigurationRegionInput = () => {
                            const { data: trayConfiguration, isLoading } = useGetOne(
                                'trays',
                                { id: formData?.tray_configuration_id },
                                { enabled: !!formData?.tray_configuration_id }
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
                        };

                        return <TrayConfigurationRegionInput />;
                    }}
                </FormDataConsumer>
            </SimpleForm>
        </Create>
    );
};

export default CreateComponent;
