import {
    Create,
    SimpleForm,
    TextField,
    TextInput,
    required,
} from 'react-admin';
import { ColorInput } from 'react-admin-color-picker';

const CreateComponent = () => {
    return (
        <Create redirect="show">
            <SimpleForm>
                <TextField source="id" />
                <TextInput source="name" validate={[required()]} />
                <TextInput source="note" multiline />
                <ColorInput source="colour" 
                    label="Colour" 
                    helperText="Used to differentiate projects on maps"
                />
            </SimpleForm>
        </Create>
    );
};

export default CreateComponent;