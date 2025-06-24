import {
    ArrayInput,
    Edit,
    NumberInput,
    ReferenceInput,
    SelectInput,
    SimpleForm,
    SimpleFormIterator,
    TextInput,
    required
} from 'react-admin';
import { sampleType } from ".";
import { treatmentName } from "../treatments";
const EditComponent = () => {
    return (
        <Edit>
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
                <TextInput source="material_description" />
                <TextInput source="extraction_procedure" />
                <TextInput source="filter_substrate" />
                <NumberInput source="suspension_volume_litres" />
                <NumberInput source="air_volume_litres" />
                <NumberInput source="water_volume_litres" />
                <NumberInput source="initial_concentration_gram_l" />
                <NumberInput source="well_volume_litres" />
                <TextInput source="background_region_key" />
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
