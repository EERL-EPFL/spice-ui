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
  TopToolbar,
  EditButton,
  DeleteButton,
  usePermissions,
  ListContextProvider,
  useList,
  Pagination,
  Labeled,
} from "react-admin";
import {
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { treatmentName } from "../treatments";
import { formatEnzymeVolume } from "../utils/formatters";
import { SampleLocationMap } from "../components/SampleLocationMap";
import { TreatmentChips, SingleTreatmentChip } from "../components/TreatmentChips";
import { SampleTypeChip } from "../components/SampleTypeChips";

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
          <SingleTreatmentChip treatmentName={treatment.name} size="medium" variant="filled" />
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
              {treatment.experimental_results.length} results
            </Typography>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {hasResults ? (
          <DilutionDatagrid treatment={treatment} />
        ) : (
          <Typography color="text.secondary">
            No experimental results
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

// Display dilution data directly in treatment accordion
const DilutionDatagrid = ({ treatment }: { treatment: any }) => {
  const [selectedDilution, setSelectedDilution] = React.useState<string>("all");
  
  if (
    !treatment.dilution_summaries ||
    treatment.dilution_summaries.length === 0
  ) {
    return <Typography>No dilution data available</Typography>;
  }

  // Get unique dilution factors for filter
  const uniqueDilutions = [...new Set(
    (treatment.experimental_results || []).map((result: any) => result.dilution_factor)
  )].sort((a, b) => a - b);

  // Filter experimental results based on selected dilution
  const filteredResults = selectedDilution === "all" 
    ? treatment.experimental_results || []
    : (treatment.experimental_results || []).filter(
        (result: any) => result.dilution_factor.toString() === selectedDilution
      );

  // Create paginated list context for filtered experimental results
  const listContext = useList({
    data: filteredResults,
    perPage: 10,
    sort: { field: "well_coordinate", order: "ASC" },
  });

  const handleDilutionChange = (event: SelectChangeEvent) => {
    setSelectedDilution(event.target.value);
  };

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

      {/* Detailed well results for entire treatment */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">
          Well Results ({filteredResults.length} of {treatment.experimental_results?.length || 0} wells)
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Filter by Dilution</InputLabel>
          <Select
            value={selectedDilution}
            label="Filter by Dilution"
            onChange={handleDilutionChange}
          >
            <MenuItem value="all">All</MenuItem>
            {uniqueDilutions.map((dilution) => (
              <MenuItem key={dilution} value={dilution.toString()}>
                {dilution}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <ListContextProvider value={listContext}>
        <Datagrid bulkActionButtons={false} rowClick={false}>
          <TextField source="well_coordinate" label="Well" sortable />
          <TextField source="tray_name" label="Tray" sortable />
          <TextField source="dilution_factor" label="Dilution" sortable />
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
        </Datagrid>
        <Pagination rowsPerPageOptions={[5, 10, 25, 50]} />
      </ListContextProvider>
    </Box>
  );
};


// Main sample information display
const SampleInfo = () => {
  const record = useRecordContext();
  if (!record) return null;

  // Convert coordinates for map (for bulk and filter samples)
  const lat = typeof record.latitude === 'string' ? parseFloat(record.latitude) : record.latitude;
  const lng = typeof record.longitude === 'string' ? parseFloat(record.longitude) : record.longitude;
  const hasValidCoordinates = (record.type === "bulk" || record.type === "filter") && lat && lng && !isNaN(lat) && !isNaN(lng);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, flexWrap: "wrap" }}>
          <Typography variant="h5">
            {record.name}
          </Typography>
          <SampleTypeChip sampleType={record.type} size="medium" />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: hasValidCoordinates ? "1fr 1fr" : "1fr", gap: 2 }}>
          {/* Left column - Sample information */}
          <Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>

              {/* Collection date - only for bulk and filter */}
              {(record.type === "bulk" || record.type === "filter") && record.start_time && (
                <Labeled label="Collection Date">
                  <DateField source="start_time" showTime />
                </Labeled>
              )}

              {/* Location - only for bulk and filter (not procedural_blank) */}
              {record.type !== "procedural_blank" && record.location_id && (
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

              {/* Suspension volume - only for bulk and filter */}
              {(record.type === "bulk" || record.type === "filter") && record.suspension_volume_litres && (
                <Labeled label="Suspension Volume (L)">
                  <NumberField source="suspension_volume_litres" />
                </Labeled>
              )}

              {/* Bulk-specific fields */}
              {record.type === "bulk" && (
                <>
                  {record.air_volume_litres && (
                    <Labeled label="Air Volume (L)">
                      <NumberField source="air_volume_litres" />
                    </Labeled>
                  )}
                  {record.water_volume_litres && (
                    <Labeled label="Water Volume (L)">
                      <NumberField source="water_volume_litres" />
                    </Labeled>
                  )}
                  {record.initial_concentration_gram_l && (
                    <Labeled label="Initial Concentration (g/L)">
                      <NumberField source="initial_concentration_gram_l" />
                    </Labeled>
                  )}
                </>
              )}

              {/* Filter-specific fields */}
              {record.type === "filter" && (
                <>
                  {record.flow_litres_per_minute && (
                    <Labeled label="Airflow (L/min)">
                      <NumberField source="flow_litres_per_minute" />
                    </Labeled>
                  )}
                  {record.total_volume && (
                    <Labeled label="Total Volume (L)">
                      <NumberField source="total_volume" />
                    </Labeled>
                  )}
                  {record.filter_substrate && (
                    <Labeled label="Filter Substrate">
                      <TextField source="filter_substrate" />
                    </Labeled>
                  )}
                </>
              )}

              {/* Fields for both bulk and filter samples */}
              {(record.type === "bulk" || record.type === "filter") && record.stop_time && (
                <Labeled label="Stop Time">
                  <DateField source="stop_time" showTime />
                </Labeled>
              )}

              {/* Legacy fields - keep for backward compatibility but only show if they exist */}
              {record.well_volume_litres && (
                <Labeled label="Well Volume (L)">
                  <NumberField source="well_volume_litres" />
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

          {/* Right column - Map (for bulk and filter samples with coordinates) */}
          {hasValidCoordinates && (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Box sx={{ flex: 1, border: 1, borderColor: 'divider', borderRadius: 1, minHeight: 250 }}>
                <SampleLocationMap
                  latitude={lat}
                  longitude={lng}
                  sampleName={record.name}
                  compact={true}
                />
              </Box>
            </Box>
          )}
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
