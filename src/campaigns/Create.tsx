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
                <DateTimeInput source="start_date" parse={(date: string | Date) => {
                    const parsedDate = typeof date === 'string' ? new Date(date) : date;
                    return parsedDate ? parsedDate.toISOString() : null;
                }}/>
                <DateTimeInput source="end_date" parse={(date: string | Date) => {
                    const parsedDate = typeof date === 'string' ? new Date(date) : date;
                    return parsedDate ? parsedDate.toISOString() : null;
                }}/>
            </SimpleForm>
        </Create >
    )
};


export default CreateComponent;
