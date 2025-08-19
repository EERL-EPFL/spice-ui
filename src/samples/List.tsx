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
  NumberField,
  ReferenceManyCount,
  ReferenceField,
  FunctionField,
  useListContext,
} from "react-admin";
import { Typography, Box, Paper } from "@mui/material";
import { postFilters } from "../filters/list";
import { sampleType } from ".";

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

const ExperimentalSamplesTable = () => {
  const { data, isLoading } = useListContext();

  const experimentalSamples =
    data?.filter(
      (sample) => sample.type === "bulk" || sample.type === "filter",
    ) || [];

  if (isLoading) return null;

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Experimental Samples ({experimentalSamples.length})
      </Typography>
      <Datagrid
        data={experimentalSamples}
        rowClick="show"
        bulkActionButtons={false}
      >
        <TextField source="name" label="Name" />
        <FunctionField
          source="type"
          label="Type"
          render={(record) => {
            return sampleType[record.type] || record.type;
          }}
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
    </Paper>
  );
};

const ControlSamplesTable = () => {
  const { data, isLoading } = useListContext();

  const controlSamples =
    data?.filter((sample) => sample.type === "procedural_blank") || [];

  if (isLoading) return null;

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Control Samples ({controlSamples.length})
      </Typography>
      <Datagrid data={controlSamples} rowClick="show" bulkActionButtons={false}>
        <TextField source="name" label="Name" />
        <FunctionField
          source="type"
          label="Type"
          render={(record) => {
            return sampleType[record.type] || record.type;
          }}
        />
        <FunctionField
          label="Treatments"
          render={(record) =>
            record.treatments ? record.treatments.length : 0
          }
        />
        <DateField source="last_updated" label="Last Updated" showTime />
      </Datagrid>
    </Paper>
  );
};

export const ListComponent = () => {
  return (
    <List
      actions={<ListComponentActions />}
      storeKey={false}
      filters={postFilters}
    >
      <Box>
        <ExperimentalSamplesTable />
        <ControlSamplesTable />
      </Box>
    </List>
  );
};

export default ListComponent;
