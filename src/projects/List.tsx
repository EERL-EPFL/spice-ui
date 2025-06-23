import {
    List,
    Datagrid,
    TextField,
    usePermissions,
    TopToolbar,
    CreateButton,
    ExportButton,
    FunctionField,
    useRecordContext,
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
export const ColorBox = () => {
    const record = useRecordContext();
    if (!record) return null;

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
                style={{
                    width: '20px', // Size of the box
                    height: '20px', // Size of the box
                    backgroundColor: record.colour, // Use the record colour
                    border: '1px solid #ccc', // Optional border for visibility
                    marginRight: '10px', // Space between box and text
                }}
            />
            <TextField source="colour" />
        </div>
    );
};

export const ListComponent = () => {
    return (
        <List actions={<ListComponentActions />} storeKey={false} filters={postFilters}>
            <Datagrid rowClick="show">
                <TextField source="name" />
                <FunctionField render={() => <ColorBox />} label="Colour" />
            </Datagrid>
        </List>
    );
};

export default ListComponent;