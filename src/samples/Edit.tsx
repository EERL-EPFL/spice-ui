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
                    label="Collection Date & Time"
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
                  <NumberInput
                    source="filter_fraction"
                    label="Filter Fraction"
                    fullWidth
                  />
                  <TextInput
                    source="source"
                    label="Source Information"
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
                  <NumberInput source="latitude" label="Latitude" fullWidth />
                  <NumberInput source="longitude" label="Longitude" fullWidth />
                  <NumberInput
                    source="bulk_mass_mg"
                    label="Bulk Mass (mg)"
                    fullWidth
                  />
                  <TextInput
                    source="source"
                    label="Source Information"
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
