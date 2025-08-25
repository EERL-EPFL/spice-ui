import React, { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Collapse,
  Button,
  IconButton,
  Divider,
} from "@mui/material";
import {
  TextInput,
  NumberInput,
  SelectInput,
  FormDataConsumer,
  useInput,
  required,
} from "react-admin";
import {
  Settings as SettingsIcon,
  Image as ImageIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import TrayDisplay from "./TrayDisplay";
import TrayProbeConfig from "./TrayProbeConfig";
import ImageCoordinateSelector from "./ImageCoordinateSelector";

// Wrapper component to handle probe position updates with controls
const InteractiveTrayWrapper: React.FC<{ scopedFormData: any; allTrays: any[] }> = ({ 
  scopedFormData, 
  allTrays 
}) => {
  const probeLocationsField = useInput({ source: 'probe_locations', defaultValue: [] });
  const [isAddingProbe, setIsAddingProbe] = useState(false);
  
  const currentProbes = scopedFormData.probe_locations || [];
  
  const addProbe = () => {
    setIsAddingProbe(true);
  };
  
  // Helper function to get all existing probe column indices across all trays
  const getAllExistingProbeIndices = (): number[] => {
    const allIndices: number[] = [];
    allTrays.forEach((tray) => {
      if (tray?.probe_locations) {
        tray.probe_locations.forEach((probe: any) => {
          if (probe.data_column_index) {
            allIndices.push(probe.data_column_index);
          }
        });
      }
    });
    return allIndices;
  };
  
  const handleTrayClick = (x: number, y: number) => {
    if (!isAddingProbe) return;
    
    // Get the next available data column index across ALL trays
    const allExistingIndices = getAllExistingProbeIndices();
    const newDataColumnIndex = allExistingIndices.length > 0 
      ? Math.max(...allExistingIndices) + 1 
      : 1;
    
    const newProbe = {
      data_column_index: newDataColumnIndex,
      position_x: Math.round(x * 10) / 10, // Round to 1 decimal place
      position_y: Math.round(y * 10) / 10,
      name: `Probe ${newDataColumnIndex}`,
    };
    
    const updatedProbes = [...currentProbes, newProbe];
    probeLocationsField.field.onChange(updatedProbes);
    setIsAddingProbe(false);
  };
  
  const removeProbe = (index: number) => {
    const updatedProbes = currentProbes.filter((_: any, i: number) => i !== index);
    probeLocationsField.field.onChange(updatedProbes);
  };
  
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 400 }}>
      {/* Control Panel */}
      <Box sx={{ mb: 2, width: '100%' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="caption" color="text.secondary">
            {currentProbes.length} probe{currentProbes.length !== 1 ? 's' : ''} configured
          </Typography>
          <Button
            size="small"
            variant={isAddingProbe ? "contained" : "outlined"}
            color="secondary"
            startIcon={<AddIcon />}
            onClick={addProbe}
            sx={{ minWidth: 'auto', px: 1.5 }}
          >
            {isAddingProbe ? "Click on tray" : "Add Probe"}
          </Button>
        </Box>
        
        {/* Coordinate System Note */}
        <Typography variant="caption" color="text.secondary" sx={{ 
          display: 'block', 
          fontStyle: 'italic',
          textAlign: 'center',
          mt: 1,
          px: 1 
        }}>
          💡 Probe coordinates are in mm relative to A1 well at 0° rotation
        </Typography>
      </Box>
      
      {/* Interactive Tray Display */}
      <TrayDisplay
        name={scopedFormData.name}
        qtyCols={parseInt(scopedFormData.qty_cols) || 8}
        qtyRows={parseInt(scopedFormData.qty_rows) || 12}
        rotation={parseInt(scopedFormData.rotation_degrees) || 0}
        wellDiameter={scopedFormData.well_relative_diameter || 6.4}
        maxWidth={400}
        maxHeight={500}
        probeLocations={currentProbes}
        onProbePositionsChange={(positions) => {
          probeLocationsField.field.onChange(positions);
        }}
        onTrayClick={handleTrayClick}
        isAddingProbe={isAddingProbe}
      />
    </Box>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index} style={{ paddingTop: 16 }}>
      {value === index && children}
    </div>
  );
};

const CompactTrayEditor: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="primary">
          Tray Configuration
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Use the interactive preview on the right to place probes
        </Typography>
      </Box>

      {/* Full width container for all content */}
      <Box sx={{ width: '100%' }}>
        {/* Top Settings Row - Full width */}
        <Paper elevation={2} sx={{ p: 2, mb: 2, width: '100%' }}>
          <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="center">
            <TextInput
              source="name"
              label="Tray Name"
              size="small"
              validate={[required()]}
              sx={{ minWidth: 150, maxWidth: 200 }}
            />
            <SelectInput
              source="rotation_degrees"
              label="Rotation"
              choices={[
                { id: 0, name: "0°" },
                { id: 90, name: "90°" },
                { id: 180, name: "180°" },
                { id: 270, name: "270°" },
              ]}
              size="small"
              validate={[required()]}
              defaultValue={0}
              sx={{ width: 100 }}
            />
            <NumberInput
              source="well_relative_diameter"
              label="Well ∅ (mm)"
              size="small"
              defaultValue={6.4}
              step={0.1}
              min={0.1}
              sx={{ width: 120 }}
            />
            <NumberInput
              source="qty_cols"
              label="Columns"
              size="small"
              min={1}
              max={50}
              defaultValue={12}
              validate={[required()]}
              sx={{ width: 100 }}
            />
            <NumberInput
              source="qty_rows"
              label="Rows"
              size="small"
              min={1}
              max={50}
              defaultValue={8}
              validate={[required()]}
              sx={{ width: 80 }}
            />
          </Box>
        </Paper>

        {/* Two Cards Row */}
        <Box display="flex" gap={3} sx={{ minHeight: 400, width: '100%' }}>
          
          {/* Left Card: Tray Configuration with Tabs - Fixed width */}
          <Paper elevation={2} sx={{ 
            flex: 1, 
            minWidth: 0,
            p: 2 
          }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                size="small"
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              >
                <Tab 
                  icon={<SettingsIcon fontSize="small" />} 
                  label="Probes" 
                  iconPosition="start"
                  sx={{ minHeight: 40, fontSize: '0.875rem' }}
                />
                <Tab 
                  icon={<ImageIcon fontSize="small" />} 
                  label="Image Setup" 
                  iconPosition="start"
                  sx={{ minHeight: 40, fontSize: '0.875rem' }}
                />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <Box sx={{ minHeight: 300 }}>
                  <FormDataConsumer>
                    {({ formData }) => (
                      <TrayProbeConfig allTrays={formData?.trays || []} />
                    )}
                  </FormDataConsumer>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Box sx={{ minHeight: 300 }}>
                  <Box>
                    {/* Upper Left Corner Row */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <NumberInput
                          source="upper_left_corner_x"
                          label="Upper Left X"
                          size="small"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <NumberInput
                          source="upper_left_corner_y"
                          label="Upper Left Y"
                          size="small"
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                    
                    {/* Lower Right Corner Row */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <NumberInput
                          source="lower_right_corner_x"
                          label="Lower Right X"
                          size="small"
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <NumberInput
                          source="lower_right_corner_y"
                          label="Lower Right Y"
                          size="small"
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <FormDataConsumer>
                      {({ scopedFormData, formData, ...rest }) => (
                        <ImageCoordinateSelector
                          value={{
                            upper_left_corner_x: scopedFormData?.upper_left_corner_x,
                            upper_left_corner_y: scopedFormData?.upper_left_corner_y,
                            lower_right_corner_x: scopedFormData?.lower_right_corner_x,
                            lower_right_corner_y: scopedFormData?.lower_right_corner_y,
                          }}
                          onChange={(coordinates) => {
                            console.log('Image coordinates changed:', coordinates);
                          }}
                        />
                      )}
                    </FormDataConsumer>
                  </Box>
                </Box>
              </TabPanel>
            </Paper>

            {/* Right Card: Interactive Tray Preview - Completely Independent */}
            <Paper elevation={2} sx={{ 
              flex: '0 0 450px', 
              width: 450, 
              p: 2, 
              bgcolor: 'background.default',
              position: 'sticky', 
              top: 20,
              height: 'fit-content'
            }}>
              <Typography variant="subtitle2" gutterBottom color="primary">
                Interactive Tray Preview
              </Typography>
              <FormDataConsumer>
                {({ scopedFormData, formData }) => {
                  if (
                    scopedFormData?.name &&
                    scopedFormData?.qty_cols &&
                    scopedFormData?.qty_rows
                  ) {
                    return (
                      <InteractiveTrayWrapper 
                        scopedFormData={scopedFormData}
                        allTrays={formData?.trays || []}
                      />
                    );
                  }
                  return (
                    <Box 
                      sx={{ 
                        height: 300, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        border: '2px dashed #ddd',
                        borderRadius: 2,
                        bgcolor: 'background.paper'
                      }}
                    >
                      <Box textAlign="center">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Interactive Tray Preview
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Fill out tray details to see preview
                        </Typography>
                      </Box>
                    </Box>
                  );
                }}
              </FormDataConsumer>
            </Paper>

        </Box>
      </Box>
    </Box>
  );
};

export default CompactTrayEditor;