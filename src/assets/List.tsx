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
    ReferenceField,
    FunctionField,
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
                <DateField source="uploaded_at" label="Uploaded at" showTime />
                <TextField source="original_filename" />
                <ReferenceField source="experiment_id" reference="experiments" link="show">
                    <TextField source="name" />
                </ReferenceField>
                <TextField source="type" />
                <FunctionField source="size_bytes" label="Size (MB)" render={record => (record.size_bytes / 1024 / 1024).toFixed(2)} />
            </Datagrid>
        </List>
    );
};

export default ListComponent;
