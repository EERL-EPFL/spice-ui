import React from 'react';
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
    ArrayInput,
    SimpleFormIterator,
} from 'react-admin';
import { sampleType } from ".";
import { Typography } from '@mui/material';

const CreateComponent = () => {

    return (
        <Create redirect="show">
            <SimpleForm>
                <TextField source="id" />
                <ReferenceInput source="location_id" reference="locations">
                    <SelectInput optionText="name" />
                </ReferenceInput>
                <TextInput source="name" validate={[required()]} />
                <SelectInput
                    source="type"
                    choices={Object.entries(sampleType).map(([id, name]) => ({ id, name }))}
                    validate={[required()]}
                />
                <NumberInput source="latitude" />
                <NumberInput source="longitude" />
                <DateTimeInput source="start_time" label="Start Time" />
                <DateTimeInput source="stop_time" label="Stop Time" />
                <NumberInput source="flow_litres_per_minute" label="Flow Rate (L/min)" />
                <NumberInput source="total_volume" label="Total Volume (L)" />
                <TextInput source="material_description" />
                <TextInput source="extraction_procedure" />
                <TextInput source="filter_substrate" />
                <NumberInput source="suspension_volume_litres" label="Suspension Volume (L)" />
                <NumberInput source="air_volume_litres" label="Air Volume (L)" />
                <NumberInput source="water_volume_litres" label="Water Volume (L)" />
                <NumberInput source="initial_concentration_gram_l" />
                <NumberInput source="well_volume_litres" label="Well Volume (L)" defaultValue={5e-5} />
                <TextInput source="remarks" />

                <Typography variant="body2" color="textSecondary" sx={{ my: 2 }}>
                    <strong>Note:</strong> Every experiment requires at least one treatment. A default "none" treatment is added automatically if no other treatment is specified. If there are already known treatments they can also be added here.
                </Typography>
                <ArrayInput
                    source="treatments"
                    label="Treatments"
                    defaultValue={[{
                        name: 'none',
                        notes: 'Default treatment',
                        enzyme_volume_litres: null
                    }]}
                >
                    <SimpleFormIterator
                        inline
                    >
                        <SelectInput
                            source="name"
                            label="Treatment Type"
                            choices={[
                                { id: 'none', name: 'None' },
                                { id: 'heat', name: 'Heat' },
                                { id: 'h2o2', name: 'Hydrogen Peroxide' },
                            ]}
                            validate={[required()]}
                        />
                        <NumberInput
                            source="enzyme_volume_litres"
                            label="Enzyme Volume (L)"
                            step={0.001}
                        />
                        <TextInput
                            source="notes"
                            label="Notes"
                            multiline
                        />
                    </SimpleFormIterator>
                </ArrayInput>
            </SimpleForm>
        </Create>
    );
};

export default CreateComponent;
