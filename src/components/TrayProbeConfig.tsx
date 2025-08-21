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
      <ProbeConfigurationEditor
        probeLocations={field.value || []}
        onProbeLocationsChange={handleProbeLocationsChange}
        maxProbes={16} // Fixed max probes
        positionUnits="mm" // Fixed units
      />
    </Box>
  );
};

export default TrayProbeConfig;