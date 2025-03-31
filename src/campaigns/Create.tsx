import {
    Create,
    SimpleForm,
    TextField,
    TextInput,
    required,
    NumberInput,
    DateTimeInput,
} from 'react-admin';

const CreateComponent = () => {
    return (
        <Create redirect="show">
            <SimpleForm  >
                <TextField source="id" />
                <TextInput source="name" validate={[required()]} />
                <TextInput source="comment" />
                <NumberInput source="latitude" />
                <NumberInput source="longitude" />
                <DateTimeInput source="start_date" />
                <DateTimeInput source="end_date" />
            </SimpleForm>
        </Create >
    )
};


export default CreateComponent;
