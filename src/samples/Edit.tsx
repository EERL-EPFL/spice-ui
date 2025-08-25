import React from "react";
import {
  Edit,
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
import { SampleCoordinateInput } from "../components/SampleCoordinateInput";

const EditComponent = () => (
  <Edit redirect="show">
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
          fullWidth
        />

        <FormDataConsumer>
          {({ formData }) => (
            <>
              {/* Location - hidden for procedural blank */}
              {formData.type !== "procedural_blank" && (
                <ReferenceInput source="location_id" reference="locations">
                  <SelectInput
                    optionText="name"
                    validate={required()}
                    fullWidth
                  />
                </ReferenceInput>
              )}

              <TextInput
                source="name"
                label="Material/Name"
                validate={required()}
                fullWidth
              />

              <NumberInput
                source="well_volume_litres"
                label="Well Volume (L)"
                defaultValue={0.00005}
                helperText="Volume per well (default: 50μL)"
                fullWidth
              />

              {/* Volume and date fields - only for bulk and filter */}
              {(formData.type === "bulk" || formData.type === "filter") && (
                <>
                  <NumberInput
                    source="suspension_volume_litres"
                    label="Suspension Volume (L)"
                    fullWidth
                  />
                  <DateTimeInput
                    source="start_time"
                    label="Collection Start Time"
                    parse={(value) => value ? new Date(value).toISOString() : null}
                    fullWidth
                  />
                  <DateTimeInput
                    source="stop_time"
                    label="Collection Stop Time"
                    parse={(value) => value ? new Date(value).toISOString() : null}
                    fullWidth
                  />
                </>
              )}

              {/* Filter-specific fields */}
              {formData.type === "filter" && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Filter Sample Details
                  </Typography>
                  <NumberInput
                    source="flow_litres_per_minute"
                    label="Airflow (L/min)"
                    fullWidth
                  />
                  <NumberInput
                    source="total_volume"
                    label="Total Volume (L)"
                    fullWidth
                  />
                  <TextInput
                    source="filter_substrate"
                    label="Filter Substrate"
                    fullWidth
                  />
                </>
              )}

              {/* Bulk-specific fields */}
              {formData.type === "bulk" && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Bulk Sample Details
                  </Typography>
                  <SampleCoordinateInput />
                  <NumberInput
                    source="air_volume_litres"
                    label="Air Volume (L)"
                    fullWidth
                  />
                  <NumberInput
                    source="water_volume_litres"
                    label="Water Volume (L)"
                    fullWidth
                  />
                  <NumberInput
                    source="initial_concentration_gram_l"
                    label="Initial Concentration (g/L)"
                    fullWidth
                  />
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
  </Edit>
);

export default EditComponent;
