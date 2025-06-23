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
                <SelectInput 
                    source="name" 
                    label="Treatment Type" 
                    choices={[
                        { id: 'none', name: 'None' },
                        { id: 'heat', name: 'Heat' },
                        { id: 'h2o2', name: 'H2O2' },
                    ]}
                />
                <TextInput source="notes" label="Notes" multiline />
                <NumberInput source="enzyme_volume_litres" label="Enzyme Volume (μL)" />
            </SimpleForm>
        </Create>
    );
};

export default CreateComponent;
