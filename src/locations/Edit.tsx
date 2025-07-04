import {
    Edit,
    SimpleForm,
    TextInput,
    required,
    DateTimeInput,
    ReferenceInput,
    SelectInput,
} from 'react-admin';

const EditComponent = () => {
    return (
        <Edit redirect="show">
            <SimpleForm>
                <TextInput disabled label="Id" source="id" />
                <ReferenceInput source="project_id" reference="projects">
                    <SelectInput optionText="name" validate={[required()]} />
                </ReferenceInput>
                <TextInput source="name" validate={[required()]} />
                <TextInput source="comment" multiline />
            </SimpleForm>
        </Edit>
    );
};

export default EditComponent;