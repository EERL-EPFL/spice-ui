import React from "react";
import {
  List,
  Datagrid,
  TextField,
  usePermissions,
  TopToolbar,
  CreateButton,
  ExportButton,
  DateField,
  ReferenceField,
  FunctionField,
} from "react-admin";
import { postFilters } from "../filters/list";
import { SampleTypeChip } from "../components/SampleTypeChips";

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
      <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="name" label="Sample ID" />
        <FunctionField
          source="type"
          label="Type"
          render={(record) => (
            <SampleTypeChip sampleType={record.type} />
          )}
        />
        <ReferenceField source="location_id" reference="locations" link="show">
          <TextField source="name" />
        </ReferenceField>
        <FunctionField
          label="Treatments"
          render={(record) =>
            record.treatments ? record.treatments.length : 0
          }
        />
        <DateField source="last_updated" label="Last Updated" showTime />
      </Datagrid>
    </List>
  );
};

export default ListComponent;
