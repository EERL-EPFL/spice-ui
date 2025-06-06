import {
    BooleanInput,
    Edit,
    SimpleForm,
    TextInput,
    required
} from 'react-admin';


const EditComponent = () => {
    return (
        <Edit>
            <SimpleForm>
                <TextInput disabled label="Id" source="id" />
                <TextInput source="name" validate={[required()]} />
                <BooleanInput source="experiment_default" /> 
            </SimpleForm>
        </Edit>
    );
};

export default EditComponent;
