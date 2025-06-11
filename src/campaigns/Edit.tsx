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
                <DateTimeInput source="start_date" parse={(date: string | Date) => {
                    const parsedDate = typeof date === 'string' ? new Date(date) : date;
                    return parsedDate ? parsedDate.toISOString() : null;
                }}/>
                <DateTimeInput source="end_date" parse={(date: string | Date) => {
                    const parsedDate = typeof date === 'string' ? new Date(date) : date;
                    return parsedDate ? parsedDate.toISOString() : null;
                }}/>
            </SimpleForm>
        </Edit>
    )
};

export default EditComponent;
