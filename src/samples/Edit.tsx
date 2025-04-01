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
    required
} from 'react-admin';

const EditComponent = () => {
    return (
        <Edit>
            <SimpleForm>
                <TextInput disabled label="Id" source="id" />
                <ReferenceInput source="campaign_id" reference="campaigns">
                    <SelectInput optionText="name" />
                </ReferenceInput>
                <TextInput source="name" validate={[required()]} />
                <TextInput source="type" validate={[required()]} />
                <TextInput source="treatment" />
                <TextInput source="material_description" />
                <TextInput source="extraction_procedure" />
                <TextInput source="filter_substrate" />
                <NumberInput source="suspension_volume_liters" />
                <NumberInput source="air_volume_liters" />
                <NumberInput source="water_volume_liters" />
                <NumberInput source="initial_concentration_gram_l" />
                <NumberInput source="well_volume_liters" />
                <TextInput source="background_region_key" />
                <TextInput source="remarks" />
            </SimpleForm>
        </Edit>
    );
};

export default EditComponent;
