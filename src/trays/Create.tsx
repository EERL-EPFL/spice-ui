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
                <TextInput source="name" validate={[required()]} />
                {/* <ReferenceInput source="sample_id" reference="samples">
                    <SelectInput optionText="name" />
                </ReferenceInput>
                <TextInput source="username" />
                <DateTimeInput source="performed_at" label="Date" parse={(date: string | Date) => {
                    const parsedDate = typeof date === 'string' ? new Date(date) : date;
                    return parsedDate ? parsedDate.toISOString() : null;
                }}/>
                <NumberInput source="temperature_ramp" />
                <NumberInput source="temperature_start" />
                <NumberInput source="temperature_end" />
                <TextInput source="remarks" />*/}
                <BooleanInput source="experiment_default" /> 
            </SimpleForm>
        </Create>
    );
};

export default CreateComponent;
