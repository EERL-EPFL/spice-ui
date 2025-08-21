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
    const newProbeNumber = (probeLocations.length > 0 
      ? Math.max(...probeLocations.map(p => p.probe_number)) + 1 
      : 1);
    
    const newColumnIndex = (probeLocations.length > 0 
      ? Math.max(...probeLocations.map(p => p.column_index)) + 1 
      : 2); // Start from column 2 (Excel columns 1 for timestamp, 2+ for temperature)

    const newProbe: ProbeLocation = {
      probe_number: newProbeNumber,
      column_index: newColumnIndex,
      position_x: 50, // Default center position
      position_y: 50,
      name: `Probe ${newProbeNumber}`,
    };

    onProbeLocationsChange([...probeLocations, newProbe]);
  };

  const removeProbe = (index: number) => {
    const updated = probeLocations.filter((_, i) => i !== index);
    onProbeLocationsChange(updated);
  };

  const updateProbe = (index: number, updates: Partial<ProbeLocation>) => {
    const updated = probeLocations.map((probe, i) => 
      i === index ? { ...probe, ...updates } : probe
    );
    onProbeLocationsChange(updated);
  };

  const loadDefaults = () => {
    const defaultProbes: ProbeLocation[] = [
      { probe_number: 1, column_index: 2, position_x: 4.5, position_y: 13.5, name: "Probe 1" },
      { probe_number: 2, column_index: 3, position_x: 49.5, position_y: 31.5, name: "Probe 2" },
      { probe_number: 3, column_index: 4, position_x: 49.5, position_y: 67.5, name: "Probe 3" },
      { probe_number: 4, column_index: 5, position_x: 4.5, position_y: 94.5, name: "Probe 4" },
      { probe_number: 5, column_index: 6, position_x: 144.5, position_y: 94.5, name: "Probe 5" },
      { probe_number: 6, column_index: 7, position_x: 99.5, position_y: 67.5, name: "Probe 6" },
      { probe_number: 7, column_index: 8, position_x: 99.5, position_y: 31.5, name: "Probe 7" },
      { probe_number: 8, column_index: 9, position_x: 144.5, position_y: 13.5, name: "Probe 8" },
    ];
    onProbeLocationsChange(defaultProbes);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" color="primary">
          Probe Locations ({probeLocations.length} configured)
        </Typography>
        <Box gap={1} display="flex">
          <Chip
            label="Load 8-Probe Default"
            variant="outlined"
            clickable
            onClick={loadDefaults}
            size="small"
            color="primary"
          />
          {probeLocations.length < maxProbes && (
            <Chip
              label="Add Probe"
              variant="outlined"
              clickable
              onClick={addProbe}
              size="small"
              color="secondary"
              icon={<AddIcon />}
            />
          )}
        </Box>
      </Box>

      {probeLocations.length === 0 ? (
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No probes configured
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click "Add Probe" to manually add probes or "Load 8-Probe Default" for standard configuration
          </Typography>
        </Paper>
      ) : (
        <Box>
          {probeLocations.map((probe, index) => (
            <Paper key={index} elevation={1} sx={{ p: 2, mb: 1 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={2}>
                  <TextField
                    label="Name"
                    value={probe.name || ''}
                    onChange={(e) => updateProbe(index, { name: e.target.value })}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6} sm={1.5}>
                  <TextField
                    label="Probe #"
                    type="number"
                    value={probe.probe_number}
                    onChange={(e) => updateProbe(index, { probe_number: parseInt(e.target.value) || 1 })}
                    size="small"
                    fullWidth
                    inputProps={{ min: 1, max: maxProbes }}
                  />
                </Grid>
                <Grid item xs={6} sm={1.5}>
                  <TextField
                    label="Excel Col"
                    type="number"
                    value={probe.column_index}
                    onChange={(e) => updateProbe(index, { column_index: parseInt(e.target.value) || 2 })}
                    size="small"
                    fullWidth
                    inputProps={{ min: 2, max: 50 }}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    label={`X (${positionUnits})`}
                    type="number"
                    value={probe.position_x}
                    onChange={(e) => updateProbe(index, { position_x: parseFloat(e.target.value) || 0 })}
                    size="small"
                    fullWidth
                    inputProps={{ step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={6} sm={2}>
                  <TextField
                    label={`Y (${positionUnits})`}
                    type="number"
                    value={probe.position_y}
                    onChange={(e) => updateProbe(index, { position_y: parseFloat(e.target.value) || 0 })}
                    size="small"
                    fullWidth
                    inputProps={{ step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={2} display="flex" justifyContent="flex-end">
                  <Tooltip title="Remove probe">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => removeProbe(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ProbeConfigurationEditor;