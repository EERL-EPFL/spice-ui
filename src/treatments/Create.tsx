import {
    Create,
    SimpleForm,
    TextInput,
    NumberInput,
    ReferenceInput,
    SelectInput,
} from 'react-admin';

const CreateComponent = () => {

    return (
        <Create redirect="show">
            <SimpleForm>
                <TextInput source="name" label="Name" />
                <TextInput source="notes" label="Notes" multiline />
                <ReferenceInput
                    source="sample_id"
                    reference="samples"
                    perPage={1000}
                    allowEmpty
                >
                    <SelectInput
                        optionText="name"
                    />
                </ReferenceInput>
                <NumberInput source="enzyme_volume_microlitres" label="Enzyme Volume (μL)" />
            </SimpleForm>
        </Create>
    );
};

export default CreateComponent;
