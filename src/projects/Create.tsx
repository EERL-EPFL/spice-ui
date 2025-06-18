import {
    Create,
    SimpleForm,
    TextField,
    TextInput,
    required,
} from 'react-admin';

const CreateComponent = () => {
    return (
        <Create redirect="show">
            <SimpleForm>
                <TextField source="id" />
                <TextInput source="name" validate={[required()]} />
                <TextInput source="note" multiline />
                <TextInput source="colour" label="Color" />
            </SimpleForm>
        </Create>
    );
};

export default CreateComponent;