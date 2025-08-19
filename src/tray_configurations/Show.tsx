import {
  Show,
  SimpleShowLayout,
  TextField,
  TopToolbar,
  EditButton,
  DeleteButton,
  BooleanField,
  useRecordContext,
  ArrayField,
  Datagrid,
  DateField,
  useCreatePath,
} from "react-admin";
import { Box, Grid, Typography, Alert } from "@mui/material";
import TrayDisplay from "../components/TrayDisplay";

const TrayConfigurationDisplay = () => {
  const record = useRecordContext();

  if (!record || !record.trays || record.trays.length === 0) {
    return <Typography>No tray configuration data available</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" marginBottom={2}>
        Tray Configuration
      </Typography>
      <Grid container spacing={3}>
        {record.trays.map((tray: any, index: number) => (
          <Grid item key={index} xs={12} md={6}>
            <Typography variant="subtitle1" marginBottom={1} align="center">
              Tray {tray.order_sequence} - {tray.rotation_degrees}° rotation
            </Typography>
            <Box display="flex" justifyContent="center">
              <TrayDisplay
                name={tray.name}
                qtyCols={tray.qty_cols}
                qtyRows={tray.qty_rows}
                rotation={tray.rotation_degrees}
                wellDiameter={tray.well_relative_diameter}
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const AssociatedExperimentsDisplay = () => {
  const record = useRecordContext();
  const createPath = useCreatePath();

  if (
    !record ||
    !record.associated_experiments ||
    record.associated_experiments.length === 0
  ) {
    return null;
  }

  return (
    <Box marginTop={3}>
      <Typography variant="h6" marginBottom={2}>
        Associated Experiments ({record.associated_experiments.length})
      </Typography>
      <ArrayField source="associated_experiments" label="">
        <Datagrid
          bulkActionButtons={false}
          rowClick={(id) =>
            createPath({ resource: "experiments", id, type: "show" })
          }
        >
          <DateField source="performed_at" label="Date" showTime />
          <TextField source="name" label="Experiment Name" />
          <TextField source="username" label="Username" />
        </Datagrid>
      </ArrayField>
    </Box>
  );
};

const ConditionalTopToolbar = () => {
  const record = useRecordContext();
  const hasAssociatedExperiments =
    record?.associated_experiments && record.associated_experiments.length > 0;

  return (
    <TopToolbar>
      {!hasAssociatedExperiments && <EditButton />}
      {!hasAssociatedExperiments && <DeleteButton />}
    </TopToolbar>
  );
};

const AssociatedExperimentsWarning = () => {
  const record = useRecordContext();
  const hasAssociatedExperiments =
    record?.associated_experiments && record.associated_experiments.length > 0;

  if (!hasAssociatedExperiments) {
    return null;
  }

  return (
    <Alert severity="warning" sx={{ marginBottom: 2 }}>
      This tray configuration has {record.associated_experiments.length}{" "}
      associated experiment(s). Editing or deleting this configuration is
      disabled as it would affect existing experiments.
    </Alert>
  );
};

export const ShowComponent = () => {
  return (
    <Show actions={<ConditionalTopToolbar />}>
      <SimpleShowLayout title="Tray Configuration">
        <AssociatedExperimentsWarning />
        <TextField source="name" />
        <BooleanField source="experiment_default" />
        <TrayConfigurationDisplay />
        <AssociatedExperimentsDisplay />
      </SimpleShowLayout>
    </Show>
  );
};

export default ShowComponent;
