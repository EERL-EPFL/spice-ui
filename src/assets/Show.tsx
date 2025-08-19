import {
  Show,
  SimpleShowLayout,
  TextField,
  TopToolbar,
  EditButton,
  DeleteButton,
  usePermissions,
  DateField,
  NumberField,
  BooleanField,
  ReferenceField,
  ArrayField,
  Datagrid,
  FunctionField,
  TabbedShowLayout,
} from "react-admin";
import { UppyUploader } from "../uploader/Uppy";

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

const ShowComponent = () => {
  return (
    <Show actions={<ShowComponentActions />}>
      <SimpleShowLayout title="Experiment">
        <TextField source="id" />
        <DateField source="uploaded_at" label="Uploaded at" showTime />
        <TextField source="original_filename" />
        <ReferenceField
          source="experiment_id"
          reference="experiments"
          link="show"
        >
          <TextField source="name" />
        </ReferenceField>
        <TextField source="type" />
        <FunctionField
          source="size_bytes"
          label="Size (MB)"
          render={(record) => (record.size_bytes / 1024 / 1024).toFixed(2)}
        />
      </SimpleShowLayout>
    </Show>
  );
};

export default ShowComponent;
