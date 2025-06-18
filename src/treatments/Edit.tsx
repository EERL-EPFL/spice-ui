import {
    AutocompleteInput,
    Edit,
    NumberInput,
    ReferenceInput,
    SimpleForm,
    TextInput,
} from 'react-admin';

const EditComponent = () => {
    return (
        <Edit>
            <SimpleForm>
                <TextInput disabled label="Id" source="id" />
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
                <NumberInput source="enzyme_volume_litres" label="Enzyme Volume (μL)" />
            </SimpleForm>
        </Edit>
    );
};

export default EditComponent;
