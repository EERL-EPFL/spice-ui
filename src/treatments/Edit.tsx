import {
    AutocompleteInput,
    Edit,
    NumberInput,
    ReferenceInput,
    SimpleForm,
    TextInput,
    SelectInput,
} from 'react-admin';

const EditComponent = () => {
    return (
        <Edit>
            <SimpleForm>
                <TextInput disabled label="Id" source="id" />
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
                <ReferenceInput
                    source="sample_id"
                    reference="samples"
                    allowEmpty
                    enableGetChoices={({ q }) => typeof q === 'string' && q.length >= 2}
                >
                    <AutocompleteInput
                        optionText="name"
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
