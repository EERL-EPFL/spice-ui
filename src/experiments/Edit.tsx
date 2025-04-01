import {
    BooleanField,
    BooleanInput,
    DateTimeInput,
    Edit,
    NumberInput,
    ReferenceInput,
    SelectInput,
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
                <ReferenceInput source="sample_id" reference="samples">
                    <SelectInput optionText="name" />
                </ReferenceInput>
                <TextInput source="username" />
                <DateTimeInput source="performed_at" label="Date" parse={(date: string | Date) => {
                    const parsedDate = typeof date === 'string' ? new Date(date) : date;
                    return parsedDate ? parsedDate.toISOString() : null;
                }}/>
                <NumberInput source="temperature_ramp" />
                <NumberInput source="temperature_start" />
                <NumberInput source="temperature_end" />
                <BooleanInput source="is_calibration" />
                <TextInput source="remarks" />
            </SimpleForm>
        </Edit>
    );
};

export default EditComponent;
