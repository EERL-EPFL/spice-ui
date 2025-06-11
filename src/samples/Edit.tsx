import {
    ArrayField,
    ArrayInput,
    BooleanField,
    BooleanInput,
    Datagrid,
    DateTimeInput,
    Edit,
    NumberInput,
    ReferenceInput,
    SelectInput,
    SimpleForm,
    SimpleFormIterator,
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
                <NumberInput source="latitude" />
                <NumberInput source="longitude" />
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
                Add treatments as input fields, here is the datagrid for the show component
                <ArrayInput source="treatments" label="Sample Treatments">
                    <SimpleFormIterator inline>
                        <TextInput source="name" />
                        <TextInput source="notes" />
                        <NumberInput source="enzyme_volume_microlitres" />
                    </SimpleFormIterator>
                </ArrayInput>
            </SimpleForm>
        </Edit>
    );
};

export default EditComponent;
