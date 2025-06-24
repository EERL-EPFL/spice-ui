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
    BooleanField,
    BooleanInput,
} from 'react-admin';
import { sampleType } from ".";


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
                <TextInput source="material_description" />
                <TextInput source="extraction_procedure" />
                <TextInput source="filter_substrate" />
                <NumberInput source="suspension_volume_litres" />
                <NumberInput source="air_volume_litres" />
                <NumberInput source="water_volume_litres" />
                <NumberInput source="initial_concentration_gram_l" />
                <NumberInput source="well_volume_litres" defaultValue={5e-5} />
                <TextInput source="background_region_key" />
                <TextInput source="remarks" />
            </SimpleForm>
        </Create>
    );
};

export default CreateComponent;
