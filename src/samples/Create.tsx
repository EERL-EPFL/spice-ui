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

const CreateComponent = () => {
    return (
        <Create redirect="show">
            <SimpleForm>
                <TextField source="id" />
                <ReferenceInput source="campaign_id" reference="campaigns">
                    <SelectInput optionText="name" />
                </ReferenceInput>
                <TextInput source="name" validate={[required()]} />
                <SelectInput
                    source="type"
                    choices={[
                        { id: 'Bulk', name: 'Bulk' },
                        { id: 'Filter', name: 'Filter' },
                        { id: 'ProceduralBlank', name: 'ProceduralBlank' },
                        { id: 'PureWater', name: 'PureWater' },
                    ]}
                    validate={[required()]}
                />
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
        </Create>
    );
};

export default CreateComponent;
