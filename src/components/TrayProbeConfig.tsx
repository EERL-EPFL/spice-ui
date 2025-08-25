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
import ProbeConfigurationEditor, { ProbeLocation } from "./ProbeConfigurationEditor";

const TrayProbeConfig: React.FC<{ allTrays?: any[] }> = ({ allTrays = [] }) => {
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
            allTrays={allTrays}
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
  allTrays: any[];
}> = ({ probeCount, positionUnits, probeLocations, allTrays }) => {
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
        positionUnits={positionUnits}
        allTrays={allTrays}
      />
    </Box>
  );
};

export default TrayProbeConfig;