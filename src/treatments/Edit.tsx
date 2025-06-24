import {
    AutocompleteInput,
    Edit,
    NumberInput,
    ReferenceInput,
    SimpleForm,
    TextInput,
    SelectInput,
    required,
} from 'react-admin';
import { treatmentName } from '.';

const EditComponent = () => {
    return (
        <Edit>
            <SimpleForm>
                <TextInput disabled label="Id" source="id" />
                <SelectInput
                    source="name"
                    label="Treatment Type"
                    choices={Object.entries(treatmentName).map(([id, name]) => ({ id, name }))}
                    validate={[required()]}
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
