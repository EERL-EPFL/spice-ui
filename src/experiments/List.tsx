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
        <DateField source="performed_at" label="Date" showTime />
        <TextField source="name" label="Experiment Code" />
        <ReferenceField source="sample_id" reference="samples" link="show">
          <TextField source="name" />
        </ReferenceField>
        <TextField source="username" label="Username" />
        <ReferenceManyCount
          label="Data Assets #"
          reference="assets"
          target="experiment_id"
          link
        />
      </Datagrid>
    </List>
  );
};

export default ListComponent;
