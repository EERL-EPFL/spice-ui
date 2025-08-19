import React from "react";
import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  NumberField,
  ReferenceField,
  useRecordContext,
  FunctionField,
  ChipField,
  Datagrid,
  ArrayField,
  SingleFieldList,
  ShowButton,
  TopToolbar,
  EditButton,
  DeleteButton,
  usePermissions,
  ListContextProvider,
  useList,
  Pagination,
  BooleanField,
  Labeled,
  WithRecord,
} from "react-admin";
import {
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { sampleType } from ".";
import { treatmentName } from "../treatments";
import { formatEnzymeVolume } from "../utils/formatters";
import { SampleLocationMap } from "../components/SampleLocationMap";

const ShowActions = () => {
  const { permissions } = usePermissions();
  return (
    <TopToolbar>
      {permissions === "admin" && (
        <>
          <EditButton />
          <DeleteButton />
        </>
      )}
    </TopToolbar>
  );
};

// Component to display treatment details with proper react-admin patterns
const TreatmentsList = () => {
  const record = useRecordContext();

  if (!record?.treatments || record.treatments.length === 0) {
    return <Typography>No treatments available</Typography>;
  }

  return (
    <ArrayField source="treatments" label={false}>
      <SingleFieldList linkType={false}>
        <TreatmentItem />
      </SingleFieldList>
    </ArrayField>
  );
};

// Individual treatment display component
const TreatmentItem = () => {
  const treatment = useRecordContext();
  const [expanded, setExpanded] = React.useState(false);

  if (!treatment) return null;

  const handleChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };

  const treatmentDisplay = treatmentName[treatment.name] || treatment.name;
  const hasResults = treatment.experimental_results?.length > 0;

  return (
    <Accordion
      expanded={expanded}
      onChange={handleChange}
      sx={{ width: "100%", mb: 2 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}
        >
          <Chip label={treatmentDisplay} color="primary" variant="outlined" />
          {treatment.enzyme_volume_litres && (
            <Typography variant="body2" color="text.secondary">
              Enzyme: {formatEnzymeVolume(treatment.enzyme_volume_litres)}L
            </Typography>
          )}
          {treatment.notes && treatment.notes !== "Default treatment" && (
            <Typography variant="body2" color="text.secondary">
              {treatment.notes}
            </Typography>
          )}
          {hasResults && (
            <Typography variant="body2" sx={{ ml: "auto", mr: 2 }}>
              {treatment.experimental_results.length} results |
              {treatment.statistics?.success_rate
                ? ` ${(treatment.statistics.success_rate * 100).toFixed(0)}% success`
                : ""}
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {hasResults ? (
          <DilutionSummaries treatment={treatment} />
        ) : (
          <Typography color="text.secondary">
            No experimental results
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

// Display dilution summaries for a treatment
const DilutionSummaries = ({ treatment }) => {
  if (
    !treatment.dilution_summaries ||
    treatment.dilution_summaries.length === 0
  ) {
    return <Typography>No dilution data available</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Dilution Factor Analysis
      </Typography>

      {/* Summary table of dilutions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Datagrid
            data={treatment.dilution_summaries}
            bulkActionButtons={false}
            rowClick={false}
          >
            <TextField source="dilution_factor" label="Dilution Factor" />
            <FunctionField
              label="Wells"
              render={(record) =>
                `${record.statistics.frozen_count}/${record.statistics.total_wells}`
              }
            />
            <FunctionField
              label="Success Rate"
              render={(record) =>
                `${(record.statistics.success_rate * 100).toFixed(1)}%`
              }
            />
            <FunctionField
              label="Mean Temp (°C)"
              render={(record) =>
                record.statistics.mean_nucleation_temp_celsius?.toFixed(2) ||
                "-"
              }
            />
            <FunctionField
              label="Median Time (s)"
              render={(record) =>
                record.statistics.median_nucleation_time_seconds || "-"
              }
            />
          </Datagrid>
        </CardContent>
      </Card>

      {/* Detailed results by dilution */}
      {treatment.dilution_summaries.map((dilutionSummary) => (
        <DilutionDetails
          key={dilutionSummary.dilution_factor}
          dilutionSummary={dilutionSummary}
          experimentalResults={treatment.experimental_results}
        />
      ))}
    </Box>
  );
};

// Display individual well results for a specific dilution
const DilutionDetails = ({ dilutionSummary, experimentalResults }) => {
  const [expanded, setExpanded] = React.useState(false);

  // Filter results for this dilution factor
  const dilutionResults = experimentalResults.filter(
    (result) => result.dilution_factor === dilutionSummary.dilution_factor,
  );

  // Create paginated list context
  const listContext = useList({
    data: dilutionResults,
    perPage: 5,
    sort: { field: "well_coordinate", order: "ASC" },
  });

  return (
    <Accordion
      expanded={expanded}
      onChange={(e, isExpanded) => setExpanded(isExpanded)}
      sx={{ mb: 1 }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>
          Dilution {dilutionSummary.dilution_factor}× — {dilutionResults.length}{" "}
          wells
        </Typography>
      </AccordionSummary>
      <AccordionDetails>
        <ListContextProvider value={listContext}>
          <Datagrid bulkActionButtons={false} rowClick={false}>
            <TextField source="well_coordinate" label="Well" sortable />
            <TextField source="tray_name" label="Tray" sortable />
            <ReferenceField
              source="experiment_id"
              reference="experiments"
              link="show"
              label="Experiment"
              sortable
            >
              <TextField source="name" />
            </ReferenceField>
            <FunctionField
              label="Time (s)"
              source="nucleation_time_seconds"
              render={(record) => record.nucleation_time_seconds || "-"}
              sortable
            />
            <FunctionField
              label="Temp (°C)"
              source="nucleation_temperature_avg_celsius"
              render={(record) =>
                record.nucleation_temperature_avg_celsius
                  ? parseFloat(
                      record.nucleation_temperature_avg_celsius,
                    ).toFixed(2)
                  : "-"
              }
              sortable
            />
            <ChipField source="final_state" label="State" />
          </Datagrid>
          <Pagination rowsPerPageOptions={[5, 10, 25, 50]} />
        </ListContextProvider>
      </AccordionDetails>
    </Accordion>
  );
};

// Main sample information display
const SampleInfo = () => {
  const record = useRecordContext();
  if (!record) return null;

  // Convert coordinates for map
  const lat = typeof record.latitude === 'string' ? parseFloat(record.latitude) : record.latitude;
  const lng = typeof record.longitude === 'string' ? parseFloat(record.longitude) : record.longitude;
  const hasValidCoordinates = lat && lng && !isNaN(lat) && !isNaN(lng);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {record.name}
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: hasValidCoordinates ? "1fr 1fr" : "1fr 1fr", gap: 2 }}>
          {/* Left column - Sample information */}
          <Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
              <Labeled label="Sample Type">
                <TextField
                  source="type"
                  transform={(value) => sampleType[value] || value}
                />
              </Labeled>

              {record.location_id && (
                <Labeled label="Location">
                  <ReferenceField
                    source="location_id"
                    reference="locations"
                    link="show"
                  >
                    <TextField source="name" />
                  </ReferenceField>
                </Labeled>
              )}

              {record.well_volume_litres && (
                <Labeled label="Well Volume (L)">
                  <NumberField source="well_volume_litres" />
                </Labeled>
              )}

              {record.suspension_volume_litres && (
                <Labeled label="Suspension Volume (L)">
                  <NumberField source="suspension_volume_litres" />
                </Labeled>
              )}

              {record.material_description && (
                <Labeled label="Material">
                  <TextField source="material_description" />
                </Labeled>
              )}

              {record.extraction_procedure && (
                <Labeled label="Extraction">
                  <TextField source="extraction_procedure" />
                </Labeled>
              )}
            </Box>

            <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Created: <DateField source="created_at" showTime />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Updated: <DateField source="last_updated" showTime />
              </Typography>
            </Box>
          </Box>

          {/* Right column - Map */}
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {hasValidCoordinates && (
              <Box sx={{ flex: 1, border: 1, borderColor: 'divider', borderRadius: 1, minHeight: 250 }}>
                <SampleLocationMap
                  latitude={lat}
                  longitude={lng}
                  sampleName={record.name}
                  compact={true}
                />
              </Box>
            )}
          </Box>
        </Box>

        {record.remarks && (
          <Box sx={{ mt: 2 }}>
            <Labeled label="Remarks">
              <TextField source="remarks" />
            </Labeled>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export const ShowComponent = () => {
  return (
    <Show actions={<ShowActions />}>
      <SimpleShowLayout>
        <SampleInfo />
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          Treatments
        </Typography>
        <TreatmentsList />
      </SimpleShowLayout>
    </Show>
  );
};

export default ShowComponent;
