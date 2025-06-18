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
                <TextInput source="description" multiline />
                <DateTimeInput source="start_date" parse={(date: string | Date) => {
                    const parsedDate = typeof date === 'string' ? new Date(date) : date;
                    return parsedDate ? parsedDate.toISOString() : null;
                }} />
                <DateTimeInput source="end_date" parse={(date: string | Date) => {
                    const parsedDate = typeof date === 'string' ? new Date(date) : date;
                    return parsedDate ? parsedDate.toISOString() : null;
                }} />
            </SimpleForm>
        </Edit>
    );
};

export default EditComponent;