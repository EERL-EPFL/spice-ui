import {
    List,
    Datagrid,
    TextField,
    usePermissions,
    TopToolbar,
    CreateButton,
    ExportButton,
    DateField,
    ReferenceField,
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
                <TextField source="name" />
                <ReferenceField source="project_id" reference="projects" link="show">
                    <TextField source="name" />
                </ReferenceField>
                <TextField source="description" />
                <DateField source="start_date" showTime />
                <DateField source="end_date" showTime />
            </Datagrid>
        </List>
    );
};

export default ListComponent;