import {
    Create,
    SimpleForm,
    TextInput,
    NumberInput,
    ReferenceInput,
    SelectInput,
    required,
} from 'react-admin';
import { treatmentName } from '.';

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
                    choices={Object.entries(treatmentName).map(([id, name]) => ({ id, name }))}
                    validate={[required()]}
                />
                <TextInput source="notes" label="Notes" multiline />
                <NumberInput source="enzyme_volume_litres" label="Enzyme Volume (μL)" />
            </SimpleForm>
        </Create>
    );
};

export default CreateComponent;
