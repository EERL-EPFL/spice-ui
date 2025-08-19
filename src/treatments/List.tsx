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
  FunctionField,
  ReferenceField,
} from "react-admin";
import { postFilters } from "../filters/list";
import { treatmentName } from ".";
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
        <FunctionField
          source="name"
          label="Treatment Type"
          render={(record) => {
            return treatmentName[record.name] || record.name;
          }}
        />
        <ReferenceField source="sample_id" reference="samples" link="show">
          <TextField source="name" />
        </ReferenceField>
        <NumberField source="enzyme_volume_litres" label="Enzyme Volume (L)" />
        <DateField source="last_updated" label="Last Updated" showTime />
      </Datagrid>
    </List>
  );
};

export default ListComponent;
