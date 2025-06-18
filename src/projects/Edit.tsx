import {
    Edit,
    SimpleForm,
    TextInput,
    required
} from 'react-admin';

const EditComponent = () => {
    return (
        <Edit redirect="show">
            <SimpleForm>
                <TextInput disabled label="Id" source="id" />
                <TextInput source="name" validate={[required()]} />
                <TextInput source="note" multiline />
                <TextInput source="colour" label="Color" />
            </SimpleForm>
        </Edit>
    );
};

export default EditComponent;