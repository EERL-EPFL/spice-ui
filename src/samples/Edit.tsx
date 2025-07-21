import {
    ArrayInput,
    Edit,
    NumberInput,
    ReferenceInput,
    SelectInput,
    SimpleForm,
    SimpleFormIterator,
    TextInput,
    DateTimeInput,
    required
} from 'react-admin';
import { sampleType } from ".";
import { treatmentName } from "../treatments";
const EditComponent = () => {
    return (
        <Edit redirect="show">
            <SimpleForm>
                <TextInput disabled label="Id" source="id" />
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
                <NumberInput source="well_volume_litres" label="Well Volume (L)" />
                <TextInput source="remarks" />
                <ArrayInput source="treatments" label="Sample Treatments">
                    <SimpleFormIterator inline>
                        <SelectInput
                            source="name"
                            label="Treatment Type"
                            choices={Object.entries(treatmentName).map(([id, name]) => ({ id, name }))}
                            validate={[required()]}
                        />
                        <TextInput source="notes" />
                        <NumberInput source="enzyme_volume_litres" />
                    </SimpleFormIterator>
                </ArrayInput>
            </SimpleForm>
        </Edit>
    );
};

export default EditComponent;
