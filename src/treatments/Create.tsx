import {
    Create,
    SimpleForm,
    TextInput,
    NumberInput,
    ReferenceInput,
    AutocompleteInput,
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
                    allowEmpty
                    enableGetChoices={({ q }) => typeof q === 'string' && q.length >= 2}
                >
                    <AutocompleteInput
                        optionText="name"              
                        placeholder="Search samples…"  
                        filterToQuery={searchText => ({ q: searchText })}
                        fullWidth
                    />
                </ReferenceInput>
                <NumberInput source="enzyme_volume_microlitres" label="Enzyme Volume (μL)" />
            </SimpleForm>
        </Create>
    );
};

export default CreateComponent;
