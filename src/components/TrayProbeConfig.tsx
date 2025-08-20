import React from "react";
import {
  Box,
  Typography,
  TextField,
  Grid,
  MenuItem,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from "@mui/material";
import { 
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon 
} from "@mui/icons-material";
import { 
  NumberInput, 
  SelectInput, 
  FormDataConsumer,
} from "react-admin";
import ProbeLocationGrid from "./ProbeLocationGrid";

const DEFAULT_PROBE_LOCATIONS = [
  { probe_number: 1, column_index: 2, position_x: 4.5, position_y: 13.5 },
  { probe_number: 2, column_index: 3, position_x: 49.5, position_y: 31.5 },
  { probe_number: 3, column_index: 4, position_x: 49.5, position_y: 67.5 },
  { probe_number: 4, column_index: 5, position_x: 4.5, position_y: 94.5 },
  { probe_number: 5, column_index: 6, position_x: 144.5, position_y: 94.5 },
  { probe_number: 6, column_index: 7, position_x: 99.5, position_y: 67.5 },
  { probe_number: 7, column_index: 8, position_x: 99.5, position_y: 31.5 },
  { probe_number: 8, column_index: 9, position_x: 144.5, position_y: 13.5 },
];

const TrayProbeConfig: React.FC = () => {
  return (
    <FormDataConsumer>
      {({ formData, scopedFormData }) => {
        const probeCount = scopedFormData?.probe_count || 8;
        const positionUnits = scopedFormData?.probe_position_units || "mm";
        const probeLocations = scopedFormData?.probe_locations || [];

        return (
          <Accordion sx={{ mt: 2 }}>
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              sx={{ backgroundColor: 'action.hover' }}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <SettingsIcon color="primary" />
                <Typography variant="subtitle2" color="primary">
                  Temperature Probes ({probeLocations.length} configured)
                </Typography>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <NumberInput
                    source="probe_count"
                    label="Probe Count"
                    defaultValue={8}
                    min={1}
                    max={16}
                    fullWidth
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <SelectInput
                    source="probe_position_units"
                    label="Position Units"
                    choices={[
                      { id: "mm", name: "Millimeters (mm)" },
                      { id: "cm", name: "Centimeters (cm)" },
                      { id: "pixels", name: "Pixels" },
                    ]}
                    defaultValue="mm"
                    fullWidth
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      // This will update the form data with default probe locations
                      if (formData && typeof formData === 'object') {
                        const currentTrayIndex = formData.__trayIndex__ || 0;
                        // Update the current tray's probe_locations field
                        // Note: This is a simplified approach - in a real implementation
                        // you'd want to properly integrate with React-Admin's form state
                        console.log('Loading default probes for tray', currentTrayIndex);
                      }
                    }}
                  >
                    Load 8-Probe Default
                  </Button>
                </Grid>

                {probeLocations.length > 0 && (
                  <Grid item xs={12}>
                    <ProbeLocationGrid
                      locations={probeLocations}
                      positionUnits={positionUnits}
                      width={300}
                      height={200}
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Probe Configuration:</strong> This tray is configured for {probeCount} temperature probes 
                      with positions measured in {positionUnits}. 
                      {probeLocations.length === 0 
                        ? " Click 'Load 8-Probe Default' to set up standard probe positions."
                        : ` Currently ${probeLocations.length} probe locations are defined.`
                      }
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      }}
    </FormDataConsumer>
  );
};

export default TrayProbeConfig;