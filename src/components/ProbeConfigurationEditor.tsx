import React from "react";
import {
  Box,
  Grid,
  IconButton,
  Paper,
  Typography,
  TextField,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { ArrayInput, SimpleFormIterator, TextInput, NumberInput } from "react-admin";

export interface ProbeLocation {
  data_column_index: number;
  position_x: number;
  position_y: number;
  name?: string;
}

interface ProbeConfigurationEditorProps {
  probeLocations: ProbeLocation[];
  onProbeLocationsChange: (locations: ProbeLocation[]) => void;
  maxProbes?: number;
  positionUnits?: string;
}

const ProbeConfigurationEditor: React.FC<ProbeConfigurationEditorProps> = ({
  probeLocations,
  onProbeLocationsChange,
  maxProbes = 16,
  positionUnits = "mm", // Millimeters in tray coordinate system
}) => {
  const addProbe = () => {
    const newDataColumn = (probeLocations.length > 0 
      ? Math.max(...probeLocations.map(p => p.data_column_index)) + 1 
      : 1); // Start from column 1

    const newProbe: ProbeLocation = {
      data_column_index: newDataColumn,
      position_x: 75, // Default center position in tray coordinate space (~150/2)
      position_y: 50, // Default center position in tray coordinate space (~100/2)
      name: `Probe ${newDataColumn}`,
    };

    onProbeLocationsChange([...probeLocations, newProbe]);
  };

  const removeProbe = (index: number) => {
    const updated = probeLocations.filter((_, i) => i !== index);
    onProbeLocationsChange(updated);
  };

  const updateProbe = (index: number, updates: Partial<ProbeLocation>) => {
    const updated = probeLocations.map((probe, i) => {
      if (i === index) {
        return { ...probe, ...updates };
      }
      return probe;
    });
    onProbeLocationsChange(updated);
  };

  // Validation helpers
  const isDuplicateDataColumn = (dataColumn: number, currentIndex: number) => {
    return probeLocations.some((probe, i) => 
      i !== currentIndex && probe.data_column_index === dataColumn
    );
  };

  const isDuplicateName = (name: string, currentIndex: number) => {
    return probeLocations.some((probe, i) => 
      i !== currentIndex && probe.name?.toLowerCase() === name.toLowerCase()
    );
  };


  return (
    <Box>
      {probeLocations.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No probes configured. Use the interactive tray on the right to add probes.
        </Typography>
      ) : (
        <Box>
          {probeLocations.map((probe, index) => (
            <Box key={index} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5, 
              p: 1, 
              bgcolor: 'background.paper', 
              borderRadius: 1, 
              mb: 0.5,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              width: '100%'
            }}>
              <Tooltip title={isDuplicateName(probe.name || '', index) ? "Duplicate probe name" : ""}>
                <TextField
                  label="Probe Name"
                  value={probe.name || ''}
                  onChange={(e) => updateProbe(index, { name: e.target.value })}
                  size="small"
                  sx={{ flex: 1, minWidth: 120, maxWidth: 200 }}
                  error={isDuplicateName(probe.name || '', index)}
                  helperText={isDuplicateName(probe.name || '', index) ? "Duplicate name" : ""}
                />
              </Tooltip>
              <Tooltip title="Data column order in CSV file">
                <TextField
                  label="Data Column"
                  type="number"
                  value={probe.data_column_index}
                  onChange={(e) => updateProbe(index, { data_column_index: parseInt(e.target.value) || 1 })}
                  size="small"
                  sx={{ width: 105, flexShrink: 0 }}
                  inputProps={{ min: 1, max: 50 }}
                  error={isDuplicateDataColumn(probe.data_column_index, index)}
                  helperText={isDuplicateDataColumn(probe.data_column_index, index) ? "Duplicate column" : ""}
                />
              </Tooltip>
              <TextField
                label={`X (${positionUnits})`}
                type="number"
                value={probe.position_x}
                onChange={(e) => updateProbe(index, { position_x: parseFloat(e.target.value) || 0 })}
                size="small"
                sx={{ width: 90, flexShrink: 0 }}
                inputProps={{ step: 0.1, min: 0, max: 150 }}
              />
              <TextField
                label={`Y (${positionUnits})`}
                type="number"
                value={probe.position_y}
                onChange={(e) => updateProbe(index, { position_y: parseFloat(e.target.value) || 0 })}
                size="small"
                sx={{ width: 90, flexShrink: 0 }}
                inputProps={{ step: 0.1, min: 0, max: 100 }}
              />
              <Tooltip title="Remove probe">
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => removeProbe(index)}
                  sx={{ ml: 0.5, flexShrink: 0 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ProbeConfigurationEditor;