import {
    List,
    Datagrid,
    TextField,
    usePermissions,
    TopToolbar,
    CreateButton,
    ExportButton,
    DateField,
    NumberField,
} from "react-admin";
import { postFilters } from "../filters/list";

const ListComponentActions = () => {
    const { permissions } = usePermissions();
    return (
        <TopToolbar>
            {permissions === 'admin' && <><CreateButton /></>}
            <ExportButton />
        </TopToolbar>
    );
};

export const ListComponent = () => {
    return (
        <List actions={<ListComponentActions />} storeKey={false} filters={postFilters}>
            <Datagrid rowClick="show">
                <TextField source="id" label="ID" />
                <TextField source="experiment_code" label="Experiment Code" />
                <TextField source="campaign_id" label="Campaign ID" />
                <TextField source="user_identifier" label="User Identifier" />
                <DateField source="experiment_date" label="Experiment Date" showTime />
                <DateField source="created_at" label="Created At" showTime />
                <DateField source="image_capture_started_at" label="Image Capture Started At" showTime />
                <DateField source="image_capture_ended_at" label="Image Capture Ended At" showTime />
                <NumberField source="temperature_ramp" label="Temperature Ramp" />
                <NumberField source="temperature_start" label="Temperature Start" />
                <NumberField source="temperature_end" label="Temperature End" />
                <NumberField source="cooling_rate" label="Cooling Rate" />
                <NumberField source="temperature_calibration_slope" label="Temperature Calibration Slope" />
                <NumberField source="temperature_calibration_intercept" label="Temperature Calibration Intercept" />
            </Datagrid>
        </List>
    );
};

export default ListComponent;
