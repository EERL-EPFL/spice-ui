import {
    List,
    Datagrid,
    TextField,
    usePermissions,
    TopToolbar,
    CreateButton,
    ExportButton,
    BooleanField,
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
                <BooleanField source="experiment_default" />
            </Datagrid>
        </List>
    );
};

export default ListComponent;
