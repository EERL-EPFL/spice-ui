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
                <TextInput source="experiment_code" validate={[required()]} />
                <TextInput source="campaign_id" />
                <TextInput source="user_identifier" />
                <DateTimeInput source="experiment_date" />
                <DateTimeInput source="created_at" disabled />
                <DateTimeInput source="image_capture_started_at" />
                <DateTimeInput source="image_capture_ended_at" />
                <NumberInput source="temperature_ramp" />
                <NumberInput source="temperature_start" />
                <NumberInput source="temperature_end" />
                <NumberInput source="cooling_rate" />
                <NumberInput source="temperature_calibration_slope" />
                <NumberInput source="temperature_calibration_intercept" />
            </SimpleForm>
        </Edit>
    );
};

export default EditComponent;
