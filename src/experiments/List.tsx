import {
  List,
  Datagrid,
  TextField,
  usePermissions,
  TopToolbar,
  CreateButton,
  ExportButton,
  DateField,
} from "react-admin";
import { ExperimentFilterForm } from "./filters";

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
      filters={<ExperimentFilterForm />}
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
