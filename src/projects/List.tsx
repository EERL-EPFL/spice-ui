import {
    List,
    Datagrid,
    TextField,
    usePermissions,
    TopToolbar,
    CreateButton,
    ExportButton,
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
                <TextField source="name" />
                <TextField source="note" />
                <FunctionField
                    source="colour"
                    label="Color"
                    render={record => (
                        <div style={{
                            display: 'inline-block',
                            width: '20px',
                            height: '20px',
                            backgroundColor: record.colour || '#ccc',
                            border: '1px solid #000',
                            borderRadius: '3px'
                        }} />
                    )}
                />
            </Datagrid>
        </List>
    );
};

export default ListComponent;