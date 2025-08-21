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
  probe_number: number;
  column_index: number;
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
  positionUnits = "mm",
}) => {
  const addProbe = () => {
    const newDataColumn = (probeLocations.length > 0 
      ? Math.max(...probeLocations.map(p => p.column_index)) + 1 
      : 1); // Start from column 1, let Excel processor handle time column mapping

    const newProbe: ProbeLocation = {
      probe_number: newDataColumn, // probe_number same as column_index
      column_index: newDataColumn,
      position_x: 50, // Default center position
      position_y: 50,
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
        const updatedProbe = { ...probe, ...updates };
        // Keep probe_number and column_index in sync
        if (updates.column_index !== undefined) {
          updatedProbe.probe_number = updates.column_index;
        }
        return updatedProbe;
      }
      return probe;
    });
    onProbeLocationsChange(updated);
  };

  // Validation helpers
  const isDuplicateDataColumn = (dataColumn: number, currentIndex: number) => {
    return probeLocations.some((probe, i) => 
      i !== currentIndex && probe.column_index === dataColumn
    );
  };

  const isDuplicateName = (name: string, currentIndex: number) => {
    return probeLocations.some((probe, i) => 
      i !== currentIndex && probe.name?.toLowerCase() === name.toLowerCase()
    );
  };

  const loadDefaults = () => {
    const defaultProbes: ProbeLocation[] = [
      { probe_number: 1, column_index: 1, position_x: 4.5, position_y: 13.5, name: "Probe 1" },
      { probe_number: 2, column_index: 2, position_x: 49.5, position_y: 31.5, name: "Probe 2" },
      { probe_number: 3, column_index: 3, position_x: 49.5, position_y: 67.5, name: "Probe 3" },
      { probe_number: 4, column_index: 4, position_x: 4.5, position_y: 94.5, name: "Probe 4" },
      { probe_number: 5, column_index: 5, position_x: 144.5, position_y: 94.5, name: "Probe 5" },
      { probe_number: 6, column_index: 6, position_x: 99.5, position_y: 67.5, name: "Probe 6" },
      { probe_number: 7, column_index: 7, position_x: 99.5, position_y: 31.5, name: "Probe 7" },
      { probe_number: 8, column_index: 8, position_x: 144.5, position_y: 13.5, name: "Probe 8" },
    ];
    onProbeLocationsChange(defaultProbes);
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
              <Tooltip title="Data column order in Excel/CSV file (Excel processor will handle time column mapping)">
                <TextField
                  label="Data Column"
                  type="number"
                  value={probe.column_index}
                  onChange={(e) => updateProbe(index, { column_index: parseInt(e.target.value) || 1 })}
                  size="small"
                  sx={{ width: 105, flexShrink: 0 }}
                  inputProps={{ min: 1, max: 50 }}
                  error={isDuplicateDataColumn(probe.column_index, index)}
                  helperText={isDuplicateDataColumn(probe.column_index, index) ? "Duplicate column" : ""}
                />
              </Tooltip>
              <TextField
                label="X (mm)"
                type="number"
                value={probe.position_x}
                onChange={(e) => updateProbe(index, { position_x: parseFloat(e.target.value) || 0 })}
                size="small"
                sx={{ width: 90, flexShrink: 0 }}
                inputProps={{ step: 0.1 }}
              />
              <TextField
                label="Y (mm)"
                type="number"
                value={probe.position_y}
                onChange={(e) => updateProbe(index, { position_y: parseFloat(e.target.value) || 0 })}
                size="small"
                sx={{ width: 90, flexShrink: 0 }}
                inputProps={{ step: 0.1 }}
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