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
  ReferenceManyCount,
} from "react-admin";
import { postFilters } from "../filters/list";

const ListComponentActions = () => {
  const { permissions } = usePermissions();
  return (
    <TopToolbar>
      {permissions === "admin" && (
        <>
          <CreateButton />
        </>
      )}
      <ExportButton />
    </TopToolbar>
  );
};

export const ListComponent = () => {
  return (
    <List
      actions={<ListComponentActions />}
      storeKey={false}
      filters={postFilters}
    >
      <Datagrid rowClick="show">
        <DateField source="performed_at" label="Performed at" showTime />
        <TextField source="name" label="Name" />
        <TextField source="username" label="Username" />

        <DateField source="last_updated" label="Last updated" showTime />
      </Datagrid>
    </List>
  );
};

export default ListComponent;
