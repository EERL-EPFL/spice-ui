import {
  Show,
  SimpleShowLayout,
  TextField,
  TopToolbar,
  EditButton,
  DeleteButton,
  usePermissions,
  FunctionField,
  ReferenceManyField,
  Datagrid,
  DateField,
} from "react-admin";
import { ColorBox } from "./List";

const ShowComponentActions = () => {
  const { permissions } = usePermissions();
  return (
    <TopToolbar>
      {permissions === "admin" && (
        <>
          <EditButton />
          <DeleteButton />
        </>
      )}
    </TopToolbar>
  );
};

export const ShowComponent = () => {
  return (
    <Show actions={<ShowComponentActions />}>
      <SimpleShowLayout>
        <TextField source="id" />
        <TextField source="name" />
        <TextField source="note" />
        <FunctionField render={() => <ColorBox />} label="Colour" />

        <ReferenceManyField
          reference="locations"
          target="project_id"
          label="Locations"
        >
          <Datagrid bulkActionButtons={false} rowClick="show">
            <TextField source="name" />
            <TextField source="description" />
            <DateField source="start_date" showTime />
            <DateField source="end_date" showTime />
          </Datagrid>
        </ReferenceManyField>
      </SimpleShowLayout>
    </Show>
  );
};

export default ShowComponent;
