import {
    List,
    Datagrid,
    TextField,
    usePermissions,
    TopToolbar,
    CreateButton,
    ExportButton,
    useRecordContext,
    FunctionField,
    DateField,
} from "react-admin";
// import { LocationFieldAreas } from '../maps/Areas';
import { postFilters } from "../filters/list";

const ListComponentActions = () => {
    const { permissions } = usePermissions();
    return (
        <TopToolbar>
            {permissions === 'admin' && <><CreateButton /></>}
            <ExportButton />
        </TopToolbar>
    );
}

export const ListComponent = () => {
    return (
        <List actions={<ListComponentActions />} storeKey={false} filters={postFilters}
        >
            <Datagrid rowClick="show" >
                <TextField source="name" />
                <TextField source="description" />
                <DateField source="start_date" showTime />
                <DateField source="end_date" showTime />

            </Datagrid>
        </List>
    );
};

export default ListComponent;
