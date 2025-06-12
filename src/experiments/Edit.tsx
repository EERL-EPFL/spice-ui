import React, { useState, useEffect } from 'react';
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

const EditComponent = () => {
    return (
        <Edit>
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
        </Edit>
    );
};

export default EditComponent;
