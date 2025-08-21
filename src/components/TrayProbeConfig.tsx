import React from "react";
import {
  Box,
  Typography,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { 
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon 
} from "@mui/icons-material";
import { 
  NumberInput, 
  SelectInput, 
  FormDataConsumer,
  useInput,
} from "react-admin";
import ProbeLocationGrid from "./ProbeLocationGrid";
import ProbeConfigurationEditor, { ProbeLocation } from "./ProbeConfigurationEditor";

const TrayProbeConfig: React.FC = () => {
  return (
    <FormDataConsumer>
      {({ formData, scopedFormData }) => {
        const probeCount = scopedFormData?.probe_count || 8;
        const positionUnits = scopedFormData?.probe_position_units || "mm";
        const probeLocations: ProbeLocation[] = scopedFormData?.probe_locations || [];

        return (
          <ProbeLocationsInput 
            probeCount={probeCount}
            positionUnits={positionUnits}
            probeLocations={probeLocations}
          />
        );
      }}
    </FormDataConsumer>
  );
};

const ProbeLocationsInput: React.FC<{
  probeCount: number;
  positionUnits: string;
  probeLocations: ProbeLocation[];
}> = ({ probeCount, positionUnits, probeLocations }) => {
  const { field } = useInput({ source: 'probe_locations', defaultValue: [] });

  const handleProbeLocationsChange = (locations: ProbeLocation[]) => {
    field.onChange(locations);
  };

  return (
    <Box>
      <Accordion sx={{ mt: 2 }} defaultExpanded>
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{ backgroundColor: 'action.hover' }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <SettingsIcon color="primary" />
            <Typography variant="subtitle2" color="primary">
              Temperature Probes ({field.value?.length || 0} configured)
            </Typography>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <NumberInput
                source="probe_count"
                label="Maximum Probes"
                defaultValue={8}
                min={1}
                max={16}
                fullWidth
                size="small"
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
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <ProbeConfigurationEditor
                probeLocations={field.value || []}
                onProbeLocationsChange={handleProbeLocationsChange}
                maxProbes={probeCount}
                positionUnits={positionUnits}
              />
            </Grid>

            <Grid item xs={12}>
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'info.main', 
                  color: 'info.contrastText', 
                  borderRadius: 1,
                  fontSize: '0.875rem'
                }}
              >
                💡 <strong>Tip:</strong> Use the interactive tray preview on the right to visually place probes by clicking, 
                or configure them manually using the form above.
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default TrayProbeConfig;