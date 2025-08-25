import React from "react";
import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  ReferenceInput,
  DateTimeInput,
  NumberInput,
  required,
  FormDataConsumer,
  ArrayInput,
  SimpleFormIterator,
} from "react-admin";
import { Box, Typography, Divider } from "@mui/material";
import { useLocation } from "react-router-dom";
import { SampleCoordinateInput } from "../components/SampleCoordinateInput";

const CreateComponent = () => {
  const location = useLocation();
  const prefilledLocationId = location.state?.record?.location_id;

  return (
    <Create redirect="show">
      <SimpleForm>
      <Box sx={{ width: "100%" }}>
        <Typography variant="h6" gutterBottom>
          Sample Information
        </Typography>

        <SelectInput
          source="type"
          choices={[
            { id: "bulk", name: "Bulk" },
            { id: "filter", name: "Filter" },
            { id: "procedural_blank", name: "Procedural Blank" },
          ]}
          validate={required()}
          defaultValue="bulk"
          fullWidth
        />

        <FormDataConsumer>
          {({ formData }) => (
            <>
              {/* Location - hidden for procedural blank */}
              {formData.type !== "procedural_blank" && (
                <ReferenceInput 
                  source="location_id" 
                  reference="locations"
                  defaultValue={prefilledLocationId}
                >
                  <SelectInput
                    optionText="name"
                    validate={required()}
                    fullWidth
                  />
                </ReferenceInput>
              )}

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextInput
                  source="name"
                  label="Material/Name"
                  validate={required()}
                  sx={{ flex: 2 }}
                />
                <NumberInput
                  source="well_volume_litres"
                  label="Well Volume (L)"
                  defaultValue={0.00005}
                  helperText="Volume per well (default: 50μL)"
                  sx={{ flex: 1 }}
                />
              </Box>

              {/* Common fields for bulk and filter */}
              {(formData.type === "bulk" || formData.type === "filter") && (
                <>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <NumberInput
                      source="suspension_volume_litres"
                      label="Suspension Volume (L)"
                      helperText="Volume of liquid used to prepare the sample suspension"
                      sx={{ flex: 1 }}
                    />
                    {formData.type === "bulk" && (
                      <>
                        <NumberInput
                          source="air_volume_litres"
                          label="Air Volume (L)"
                          helperText="Volume of air in sample"
                          sx={{ flex: 1 }}
                        />
                        <NumberInput
                          source="water_volume_litres"
                          label="Water Volume (L)"
                          helperText="Volume of water used for suspension"
                          sx={{ flex: 1 }}
                        />
                      </>
                    )}
                    {formData.type === "filter" && (
                      <>
                        <NumberInput
                          source="flow_litres_per_minute"
                          label="Airflow (L/min)"
                          helperText="Airflow rate during sampling"
                          sx={{ flex: 1 }}
                        />
                        <NumberInput
                          source="total_volume"
                          label="Total Volume (L)"
                          helperText="Total volume of air sampled"
                          sx={{ flex: 1 }}
                        />
                      </>
                    )}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <DateTimeInput
                      source="start_time"
                      label="Collection Start Time"
                      helperText="When sample collection started"
                      parse={(value) => value ? new Date(value).toISOString() : null}
                      sx={{ flex: 1 }}
                    />
                    <DateTimeInput
                      source="stop_time"
                      label="Collection Stop Time"
                      helperText="When sample collection finished"
                      parse={(value) => value ? new Date(value).toISOString() : null}
                      sx={{ flex: 1 }}
                    />
                    {formData.type === "bulk" && (
                      <NumberInput
                        source="initial_concentration_gram_l"
                        label="Initial Concentration (g/L)"
                        helperText="Initial particle concentration in suspension"
                        sx={{ flex: 1 }}
                      />
                    )}
                  </Box>
                </>
              )}

              {/* Type-specific additional fields */}
              {formData.type === "filter" && (
                <TextInput
                  source="filter_substrate"
                  label="Filter Substrate"
                  helperText="Filter material type"
                  fullWidth
                />
              )}

              {formData.type === "bulk" && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Location & Coordinates
                  </Typography>
                  <SampleCoordinateInput />
                </>
              )}

              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Treatments
              </Typography>
              <ArrayInput source="treatments" defaultValue={[{ name: "none" }]}>
                <SimpleFormIterator inline>
                  <SelectInput
                    source="name"
                    choices={[
                      { id: "none", name: "None (No treatment)" },
                      { id: "heat", name: "Heat Treatment" },
                      { id: "h2o2", name: "H₂O₂ Treatment" },
                    ]}
                    validate={required()}
                    sx={{ minWidth: 200 }}
                  />
                  <TextInput
                    source="notes"
                    label="Notes"
                    sx={{ minWidth: 200 }}
                  />
                  <NumberInput
                    source="enzyme_volume_litres"
                    label="Enzyme Volume (L)"
                    helperText="Volume of treatment agent added"
                    sx={{ minWidth: 150 }}
                  />
                </SimpleFormIterator>
              </ArrayInput>

              <Divider sx={{ my: 2 }} />
              <TextInput
                source="remarks"
                label="Comments"
                multiline
                rows={3}
                fullWidth
              />
            </>
          )}
        </FormDataConsumer>
      </Box>
      </SimpleForm>
    </Create>
  );
};

export default CreateComponent;
