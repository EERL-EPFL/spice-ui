import {
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
    EditButton,
    DeleteButton,
    usePermissions,
    DateField,
    NumberField,
} from "react-admin";

const ShowComponentActions = () => {
    const { permissions } = usePermissions();
    return (
        <TopToolbar>
            {permissions === 'admin' && (
                <>
                    <EditButton />
                    <DeleteButton />
                </>
            )}
        </TopToolbar>
    );
};

export const ShowComponent = () => {
    return (
        <Show actions={<ShowComponentActions />}>
            <SimpleShowLayout>
                <TextField source="id" />
                <TextField source="experiment_code" />
                <TextField source="campaign_id" />
                <TextField source="user_identifier" />
                <DateField source="experiment_date" showTime />
                <DateField source="created_at" showTime />
                <DateField source="image_capture_started_at" showTime />
                <DateField source="image_capture_ended_at" showTime />
                <NumberField source="temperature_ramp" />
                <NumberField source="temperature_start" />
                <NumberField source="temperature_end" />
                <NumberField source="cooling_rate" />
                <NumberField source="temperature_calibration_slope" />
                <NumberField source="temperature_calibration_intercept" />
            </SimpleShowLayout>
        </Show>
    );
};

export default ShowComponent;
