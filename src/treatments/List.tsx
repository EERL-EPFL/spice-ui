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
    ReferenceManyCount,
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
                <TextField source="name" label="Name" />
                <ReferenceField source="sample_id" reference="samples" link="show">
                    <TextField source="name" />
                </ReferenceField>
                <NumberField source="enzyme_volume_microlitres" label="Enzyme Volume (μL)" />
                <DateField source="last_updated" label="Last Updated" showTime />
            </Datagrid>
        </List>
    );
};

export default ListComponent;
