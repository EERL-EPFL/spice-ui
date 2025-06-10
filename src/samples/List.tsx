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
                <TextField source="type" label="Type" />
                {/* <ReferenceManyCount target="sample_id" reference="experiments" label="Experiments" link/> */}
                <ReferenceField source="campaign_id" reference="campaigns" link="show">
                    <TextField source="name" />
                </ReferenceField>
                <TextField source="treatment" label="Treatment" />=
                <DateField source="last_updated" label="Last Updated" showTime />
            </Datagrid>
        </List>
    );
};

export default ListComponent;
