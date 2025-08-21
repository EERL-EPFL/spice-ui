import React, { useState } from "react";
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

const TrayConfigurationDisplay = () => {
  const record = useRecordContext();
  const [hoveredProbe, setHoveredProbe] = useState<string | null>(null);

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
                {/* Tray Display with Probes */}
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="subtitle2" marginBottom={1}>
                      Tray Configuration
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap" marginBottom={2}>
                      <Chip size="small" label={`${tray.qty_cols}×${tray.qty_rows} wells`} />
                      <Chip size="small" label={`${tray.rotation_degrees}° rotation`} />
                      <Chip size="small" label={`∅${tray.well_relative_diameter}mm wells`} />
                      {tray.probe_locations && tray.probe_locations.length > 0 && (
                        <Chip size="small" label={`${tray.probe_locations.length} probes`} />
                      )}
                    </Box>
                    <Box display="flex" justifyContent="center">
                      <TrayDisplay
                        name={tray.name}
                        qtyCols={tray.qty_cols}
                        qtyRows={tray.qty_rows}
                        rotation={tray.rotation_degrees}
                        wellDiameter={tray.well_relative_diameter}
                        probeLocations={tray.probe_locations}
                        maxWidth={500}
                        maxHeight={400}
                        readOnly={true}
                        hoveredProbe={hoveredProbe}
                        onProbeHover={setHoveredProbe}
                      />
                    </Box>
                  </Box>
                </Grid>

                {/* Image Coordinates (if configured) */}
                {(tray.upper_left_corner_x || tray.upper_left_corner_y || 
                  tray.lower_right_corner_x || tray.lower_right_corner_y) && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" marginBottom={1}>
                      Image Corner Coordinates
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap" marginBottom={2}>
                      {tray.upper_left_corner_x && (
                        <Chip size="small" label={`A1: (${tray.upper_left_corner_x}, ${tray.upper_left_corner_y})`} />
                      )}
                      {tray.lower_right_corner_x && (
                        <Chip size="small" label={`${String.fromCharCode(64 + tray.qty_rows)}${tray.qty_cols}: (${tray.lower_right_corner_x}, ${tray.lower_right_corner_y})`} />
                      )}
                    </Box>
                    
                    {/* Probe Details underneath image coordinates */}
                    {tray.probe_locations && tray.probe_locations.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" marginBottom={1}>
                          Temperature Probe Locations (mm)
                        </Typography>
                        <Box 
                          sx={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                            gap: 1,
                            backgroundColor: 'background.default',
                            padding: 2,
                            borderRadius: 1,
                            border: 1,
                            borderColor: 'divider',
                          }}
                        >
                          {tray.probe_locations.map((probe, index) => {
                            const probeId = `${tray.name}-${index}`;
                            const isHovered = hoveredProbe === probeId;
                            
                            return (
                              <Box 
                                key={index}
                                sx={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  padding: 1,
                                  borderRadius: 1,
                                  backgroundColor: isHovered ? 'error.50' : 'background.paper',
                                  border: 1,
                                  borderColor: isHovered ? 'error.main' : 'divider',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  transform: isHovered ? 'translateY(-1px)' : 'none',
                                  boxShadow: isHovered ? 2 : 0,
                                  '&:hover': {
                                    borderColor: 'error.main',
                                    backgroundColor: 'error.50',
                                    transform: 'translateY(-1px)',
                                    boxShadow: 2,
                                  }
                                }}
                                onMouseEnter={() => setHoveredProbe(probeId)}
                                onMouseLeave={() => setHoveredProbe(null)}
                              >
                              <Box
                                sx={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: '50%',
                                  backgroundColor: 'primary.main',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  flexShrink: 0,
                                }}
                              >
                                {probe.name ? probe.name.substring(0, 1) : probe.data_column_index}
                              </Box>
                              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                <Typography variant="body2" fontWeight="500">
                                  {probe.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Position: ({Number(probe.position_x).toFixed(1)}, {Number(probe.position_y).toFixed(1)}) • Column {probe.data_column_index}
                                </Typography>
                              </Box>
                            </Box>
                          );
                        })}
                        </Box>
                      </Box>
                    )}
                  </Grid>
                )}

                {/* Standalone Probe Details (if no image coordinates but probes exist) */}
                {!(tray.upper_left_corner_x || tray.upper_left_corner_y || 
                  tray.lower_right_corner_x || tray.lower_right_corner_y) && 
                 tray.probe_locations && tray.probe_locations.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" marginBottom={1}>
                      Temperature Probe Locations (mm)
                    </Typography>
                    <Box 
                      sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                        gap: 1,
                        backgroundColor: 'background.default',
                        padding: 2,
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'divider',
                      }}
                    >
                      {tray.probe_locations.map((probe, index) => {
                        const probeId = `${tray.name}-${index}`;
                        const isHovered = hoveredProbe === probeId;
                        
                        return (
                          <Box 
                            key={index}
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              padding: 1,
                              borderRadius: 1,
                              backgroundColor: isHovered ? 'error.50' : 'background.paper',
                              border: 1,
                              borderColor: isHovered ? 'error.main' : 'divider',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              transform: isHovered ? 'translateY(-1px)' : 'none',
                              boxShadow: isHovered ? 2 : 0,
                              '&:hover': {
                                borderColor: 'error.main',
                                backgroundColor: 'error.50',
                                transform: 'translateY(-1px)',
                                boxShadow: 2,
                              }
                            }}
                            onMouseEnter={() => setHoveredProbe(probeId)}
                            onMouseLeave={() => setHoveredProbe(null)}
                          >
                          <Box
                            sx={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              backgroundColor: 'primary.main',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              flexShrink: 0,
                            }}
                          >
                            {probe.name ? probe.name.substring(0, 1) : probe.data_column_index}
                          </Box>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight="500">
                              {probe.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Position: ({Number(probe.position_x).toFixed(1)}, {Number(probe.position_y).toFixed(1)}) • Column {probe.data_column_index}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
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
