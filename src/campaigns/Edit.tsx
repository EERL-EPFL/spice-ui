import {
    DateTimeInput,
    Edit,
    NumberInput,
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
                <TextInput source="comment" />
                <NumberInput source="latitude" />
                <NumberInput source="longitude" />
                <DateTimeInput source="start_date" />
                <DateTimeInput source="end_date" />
            </SimpleForm>
        </Edit>
    )
};

export default EditComponent;
