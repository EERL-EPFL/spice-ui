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
  required,
} from "react-admin";
import {
  Settings as SettingsIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import TrayDisplay from "./TrayDisplay";
import TrayProbeConfig from "./TrayProbeConfig";
import ImageCoordinateSelector from "./ImageCoordinateSelector";
import InteractiveTrayDisplay from "./InteractiveTrayDisplay";

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
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="primary">
          Tray Configuration
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Use the interactive preview on the right to place probes
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left: Form Controls */}
        <Grid item xs={12} md={8}>
          {/* Basic Tray Settings */}
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextInput
                  source="name"
                  label="Tray Name"
                  fullWidth
                  size="small"
                  validate={[required()]}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
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
                  fullWidth
                  validate={[required()]}
                  defaultValue={0}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <NumberInput
                  source="well_relative_diameter"
                  label="Well ∅ (mm)"
                  size="small"
                  fullWidth
                  defaultValue={6.4}
                  step={0.1}
                  min={0.1}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6} sm={3}>
                <NumberInput
                  source="qty_cols"
                  label="Columns"
                  size="small"
                  fullWidth
                  min={1}
                  max={50}
                  defaultValue={12}
                  validate={[required()]}
                />
              </Grid>
              <Grid item xs={6} sm={3}>
                <NumberInput
                  source="qty_rows"
                  label="Rows"
                  size="small"
                  fullWidth
                  min={1}
                  max={50}
                  defaultValue={8}
                  validate={[required()]}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Tabbed Sections */}
          <Box>
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
              <TrayProbeConfig />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Box>
                <Grid container spacing={2}>
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
                          // The form values are handled by the NumberInput components above
                          // This provides visual feedback only
                          console.log('Image coordinates changed:', coordinates);
                        }}
                      />
                    )}
                  </FormDataConsumer>
                </Box>
              </Box>
            </TabPanel>
          </Box>
        </Grid>

        {/* Right: Always Visible Preview */}
        <Grid item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default', position: 'sticky', top: 20 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="subtitle2" gutterBottom>
                Interactive Tray Preview
              </Typography>
            </Box>
            <FormDataConsumer>
              {({ scopedFormData }) => {
                if (
                  scopedFormData?.name &&
                  scopedFormData?.qty_cols &&
                  scopedFormData?.qty_rows
                ) {
                  return (
                    <InteractiveTrayDisplay
                      name={scopedFormData.name}
                      qtyCols={parseInt(scopedFormData.qty_cols) || 8}
                      qtyRows={parseInt(scopedFormData.qty_rows) || 12}
                      rotation={parseInt(scopedFormData.rotation_degrees) || 0}
                      wellDiameter={scopedFormData.well_relative_diameter || 6.4}
                      maxWidth={320}
                      maxHeight={400}
                      probePositions={scopedFormData.probe_locations || []}
                      positionUnits={scopedFormData.probe_position_units || "mm"}
                      onProbePositionsChange={(positions) => {
                        // This will be handled by the InteractiveTrayDisplay component
                        // which will use the form context to update probe_locations
                      }}
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
                        Tray Preview
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Fill out tray details to see interactive preview
                      </Typography>
                    </Box>
                  </Box>
                );
              }}
            </FormDataConsumer>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default CompactTrayEditor;