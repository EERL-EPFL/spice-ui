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
import { Box, Grid, Typography, Alert, Paper, Chip } from "@mui/material";
import TrayDisplay from "../components/TrayDisplay";
import ProbeLocationGrid from "../components/ProbeLocationGrid";

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
          <Grid item key={index} xs={12}>
            <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" marginBottom={2} color="primary">
                Tray {tray.order_sequence}: {tray.name || `Tray ${tray.order_sequence}`}
              </Typography>
              
              <Grid container spacing={3}>
                {/* Tray Display */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" marginBottom={1}>
                      Tray Configuration
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" marginBottom={2}>
                      <Chip size="small" label={`${tray.qty_cols}×${tray.qty_rows} wells`} />
                      <Chip size="small" label={`${tray.rotation_degrees}° rotation`} />
                      <Chip size="small" label={`∅${tray.well_relative_diameter}mm wells`} />
                    </Box>
                    <Box display="flex" justifyContent="center">
                      <TrayDisplay
                        name={tray.name}
                        qtyCols={tray.qty_cols}
                        qtyRows={tray.qty_rows}
                        rotation={tray.rotation_degrees}
                        wellDiameter={tray.well_relative_diameter}
                        maxWidth={300}
                        maxHeight={250}
                      />
                    </Box>
                  </Box>
                </Grid>
                
                {/* Probe Configuration */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="subtitle2" marginBottom={1}>
                      Temperature Probes
                    </Typography>
                    {tray.probe_count > 0 ? (
                      <Box>
                        <Box display="flex" gap={1} flexWrap="wrap" marginBottom={2}>
                          <Chip size="small" label={`${tray.probe_count || 8} probes`} />
                          <Chip size="small" label={`${tray.probe_position_units || "mm"} units`} />
                          <Chip size="small" label={`${tray.probe_locations?.length || 0} locations`} />
                        </Box>
                        
                        {tray.probe_locations && tray.probe_locations.length > 0 && (
                          <ProbeLocationGrid
                            locations={tray.probe_locations}
                            positionUnits={tray.probe_position_units || "mm"}
                            width={300}
                            height={200}
                          />
                        )}
                      </Box>
                    ) : (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        No temperature probes configured for this tray.
                      </Alert>
                    )}
                  </Box>
                </Grid>

                {/* Image Coordinates (if configured) */}
                {(tray.upper_left_corner_x || tray.upper_left_corner_y || 
                  tray.lower_right_corner_x || tray.lower_right_corner_y) && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" marginBottom={1}>
                      Image Corner Coordinates
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      {tray.upper_left_corner_x && (
                        <Chip size="small" label={`UL: (${tray.upper_left_corner_x}, ${tray.upper_left_corner_y})`} />
                      )}
                      {tray.lower_right_corner_x && (
                        <Chip size="small" label={`LR: (${tray.lower_right_corner_x}, ${tray.lower_right_corner_y})`} />
                      )}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
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
