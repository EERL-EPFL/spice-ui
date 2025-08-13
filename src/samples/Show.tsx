import React from "react";
import {
  Show,
  SimpleShowLayout,
  TextField,
  TopToolbar,
  EditButton,
  DeleteButton,
  usePermissions,
  DateField,
  NumberField,
  ReferenceField,
  ReferenceManyField,
  Datagrid,
  useRecordContext,
  useRedirect,
  Button,
  Labeled,
  FunctionField,
  ListContextProvider,
  ChipField,
  TabbedShowLayout,
  Pagination,
  useList,
} from "react-admin";
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";
import { sampleType } from ".";
import { treatmentName } from "../treatments";

const ShowComponentActions = () => {
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

const CreateTreatmentButton = () => {
  const { permissions } = usePermissions();
  const record = useRecordContext();
  const redirect = useRedirect();

  if (permissions !== "admin") return null;
  if (!record) return null;

  const handleClick = () => {
    redirect(
      "create",
      "treatments",
      undefined,
      {},
      { record: { sample_id: record.id } },
    );
  };

  return <Button label="Create Treatment" onClick={handleClick} />;
};

const SampleDetailsContent = () => {
  const record = useRecordContext();
  
  if (!record) return null;

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {/* Header Section */}
      <Paper sx={{ p: 2 }}>
        <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
          <Labeled>
            <TextField source="name" />
          </Labeled>
          <Labeled>
            <FunctionField
              source="type"
              label="Sample Type"
              render={(record) => (
                <Chip 
                  label={sampleType[record.type] || record.type}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
            />
          </Labeled>
          <Labeled>
            <TextField source="id" label="Sample ID" />
          </Labeled>
        </Box>
      </Paper>

      {/* Sample Details - Multi-line organized sections */}
      {(record.type === 'bulk' || record.type === 'filter') && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
            Sample Details
          </Typography>
          
          {/* Collection Info Row */}
          <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2} sx={{ mb: 1 }}>
            <Labeled>
              <ReferenceField
                source="location_id"
                reference="locations"
                link="show"
              >
                <TextField source="name" label="Collection Location" />
              </ReferenceField>
            </Labeled>
            <Labeled>
              <DateField source="start_time" label="Collection Date" showTime />
            </Labeled>
            <Labeled>
              <NumberField
                source="suspension_volume_litres"
                label="Suspension Volume (L)"
              />
            </Labeled>
          </Box>
          
          {/* Type-specific measurements row */}
          {record.type === 'filter' && (
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={2} sx={{ mb: 1 }}>
              <Labeled>
                <NumberField
                  source="flow_litres_per_minute"
                  label="Airflow (L/min)"
                />
              </Labeled>
              <Labeled>
                <NumberField source="total_volume" label="Total Volume (L)" />
              </Labeled>
              <Labeled>
                <NumberField source="filter_fraction" label="Filter Fraction" />
              </Labeled>
            </Box>
          )}
          
          {record.type === 'bulk' && (
            <Box display="grid" gridTemplateColumns="repeat(auto-fit, minmax(150px, 1fr))" gap={2} sx={{ mb: 1 }}>
              <Labeled>
                <NumberField source="latitude" label="Latitude (°)" />
              </Labeled>
              <Labeled>
                <NumberField source="longitude" label="Longitude (°)" />
              </Labeled>
              <Labeled>
                <NumberField source="bulk_mass_mg" label="Sample Mass (mg)" />
              </Labeled>
            </Box>
          )}
          
          {/* Source information row */}
          {record.source && (
            <Box sx={{ mt: 1 }}>
              <Labeled>
                <TextField source="source" label="Source Information" />
              </Labeled>
            </Box>
          )}
        </Paper>
      )}

      {/* Comments and Timestamps - Combined compact section */}
      <Paper sx={{ p: 2 }}>
        <Box display="flex" flexDirection="column" gap={1}>
          {record.remarks && (
            <Labeled>
              <TextField source="remarks" label="Comments" />
            </Labeled>
          )}
          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <Labeled>
              <DateField source="created_at" label="Created" showTime />
            </Labeled>
            <Labeled>
              <DateField source="last_updated" label="Last Modified" showTime />
            </Labeled>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

const ExperimentalResultsTable = () => {
  const record = useRecordContext();
  const redirect = useRedirect();
  const [frozenFilter, setFrozenFilter] = React.useState("all");
  const [experimentFilter, setExperimentFilter] = React.useState("all");
  const [treatmentFilter, setTreatmentFilter] = React.useState("all");

  if (
    !record ||
    !record.experimental_results ||
    record.experimental_results.length === 0
  ) {
    return (
      <Typography
        variant="body2"
        color="textSecondary"
        style={{ fontStyle: "italic" }}
      >
        No associated experiments found for this sample.
      </Typography>
    );
  }

  // Categorize results based on actual data
  const categorizeResult = (result) => {
    if (result.final_state === "frozen") return "frozen";

    // Check if we have actual measurement data for liquid state
    const hasTemperatureData = result.freezing_temperature_avg !== null;
    const hasTimeData = result.freezing_time_seconds !== null;

    if (
      result.final_state === "liquid" &&
      (hasTemperatureData || hasTimeData)
    ) {
      return "liquid";
    }

    return "no_result"; // No actual measurement data
  };

  // Get unique experiments for dropdown
  const uniqueExperiments = Array.from(
    new Set(record.experimental_results.map((result) => result.experiment_id)),
  )
    .map((experimentId) => {
      const result = record.experimental_results.find(
        (r) => r.experiment_id === experimentId,
      );
      return {
        id: experimentId,
        name: result?.experiment_name || experimentId,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Get unique treatments for dropdown
  const uniqueTreatments = Array.from(
    new Set(record.experimental_results.map((result) => result.treatment_id).filter(Boolean)),
  )
    .map((treatmentId) => {
      const result = record.experimental_results.find(
        (r) => r.treatment_id === treatmentId,
      );
      return {
        id: treatmentId,
        name: result?.treatment_name || treatmentId,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filter results based on category, experiment, and treatment
  const filteredResults = record.experimental_results.filter((result) => {
    // Apply frozen state filter
    if (frozenFilter !== "all" && categorizeResult(result) !== frozenFilter) {
      return false;
    }

    // Apply experiment filter
    if (
      experimentFilter !== "all" &&
      result.experiment_id !== experimentFilter
    ) {
      return false;
    }

    // Apply treatment filter
    if (
      treatmentFilter !== "all" &&
      result.treatment_id !== treatmentFilter
    ) {
      return false;
    }

    return true;
  });

  const handleFilterChange = (newFilter) => {
    setFrozenFilter(newFilter);
  };

  const handleExperimentFilterChange = (event) => {
    setExperimentFilter(event.target.value);
  };

  const handleTreatmentFilterChange = (event) => {
    setTreatmentFilter(event.target.value);
  };

  const frozenCount = record.experimental_results.filter(
    (r) => categorizeResult(r) === "frozen",
  ).length;
  const liquidCount = record.experimental_results.filter(
    (r) => categorizeResult(r) === "liquid",
  ).length;
  const noResultCount = record.experimental_results.filter(
    (r) => categorizeResult(r) === "no_result",
  ).length;
  const totalCount = record.experimental_results.length;

  // Transform data for React Admin Datagrid
  const resultsWithId = filteredResults.map((result, index) => ({
    id: `${result.experiment_id}-${result.well_coordinate}-${index}`,
    ...result,
    original_experiment_id: result.experiment_id, // Keep original experiment ID separate
  }));

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  const cleanTreatmentName = (name: string) => {
    // Remove the Rust Option wrapper "Some(...)" if present
    if (name && name.startsWith("Some(") && name.endsWith(")")) {
      return name.slice(5, -1);
    }
    return name;
  };

  // Create list context for React Admin
  const listContext = useList({
    data: resultsWithId,
    isPending: false,
    perPage: 25,
  });

  return (
    <Box>
      {/* Filter Controls */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter by State</InputLabel>
          <Select
            value={frozenFilter}
            onChange={(event) => handleFilterChange(event.target.value)}
            label="Filter by State"
          >
            <MenuItem value="all">All ({totalCount})</MenuItem>
            <MenuItem value="frozen">Frozen ({frozenCount})</MenuItem>
            <MenuItem value="liquid">Liquid ({liquidCount})</MenuItem>
            <MenuItem value="no_result">No Result ({noResultCount})</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Experiment</InputLabel>
          <Select
            value={experimentFilter}
            onChange={handleExperimentFilterChange}
            label="Filter by Experiment"
          >
            <MenuItem value="all">
              All Experiments ({uniqueExperiments.length})
            </MenuItem>
            {uniqueExperiments.map((experiment) => (
              <MenuItem key={experiment.id} value={experiment.id}>
                {experiment.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Treatment</InputLabel>
          <Select
            value={treatmentFilter}
            onChange={handleTreatmentFilterChange}
            label="Filter by Treatment"
          >
            <MenuItem value="all">
              All Treatments ({uniqueTreatments.length})
            </MenuItem>
            {uniqueTreatments.map((treatment) => (
              <MenuItem key={treatment.id} value={treatment.id}>
                {treatment.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {filteredResults.length > 0 && (
          <Chip
            label={`${filteredResults.length} results`}
            size="small"
            variant="outlined"
          />
        )}
      </Box>

      {/* Results Datagrid with React Admin */}
      {filteredResults.length > 0 ? (
        <ListContextProvider value={listContext}>
          <Datagrid bulkActionButtons={false} rowClick={false}>
            <FunctionField
              source="experiment_name"
              label="Experiment"
              render={(record) => (
                <Button
                  onClick={() =>
                    redirect(
                      "show",
                      "experiments",
                      record.original_experiment_id,
                    )
                  }
                  sx={{
                    textTransform: "none",
                    p: 0,
                    minWidth: "auto",
                    textDecoration: "underline",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  {record.experiment_name}
                </Button>
              )}
            />
            <FunctionField
              source="experiment_date"
              label="Date"
              render={(record) =>
                record.experiment_date
                  ? new Date(record.experiment_date).toLocaleDateString()
                  : "-"
              }
            />
            <TextField source="well_coordinate" label="Well" />
            <TextField source="tray_name" label="Tray" />
            <FunctionField
              source="treatment_name"
              label="Treatment"
              render={(record) =>
                record.treatment_id ? (
                  <Button
                    onClick={() =>
                      redirect("show", "treatments", record.treatment_id)
                    }
                    sx={{
                      textTransform: "none",
                      p: 0,
                      minWidth: "auto",
                      textDecoration: "underline",
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    {cleanTreatmentName(record.treatment_name) || "-"}
                  </Button>
                ) : (
                  cleanTreatmentName(record.treatment_name) || "-"
                )
              }
            />
            <TextField source="dilution_factor" label="Dilution" />
            <FunctionField
              source="freezing_time_seconds"
              label="Freezing Time"
              render={(record) =>
                record.freezing_time_seconds
                  ? formatTime(record.freezing_time_seconds)
                  : "-"
              }
            />
            <FunctionField
              source="freezing_temperature_avg"
              label="Avg Temp (°C)"
              render={(record) =>
                record.freezing_temperature_avg
                  ? Number(record.freezing_temperature_avg).toFixed(2)
                  : "-"
              }
            />
            <FunctionField
              source="final_state"
              label="Final State"
              render={(record) => (
                <Chip
                  label={record.final_state}
                  size="small"
                  sx={{
                    bgcolor:
                      record.final_state === "frozen"
                        ? "success.light"
                        : "info.light",
                  }}
                />
              )}
            />
          </Datagrid>
          <Pagination />
        </ListContextProvider>
      ) : (
        <Typography
          variant="body2"
          color="textSecondary"
          style={{ fontStyle: "italic" }}
        >
          No experiments found matching the selected filter.
        </Typography>
      )}
    </Box>
  );
};

const TabbedContentWithCounts = () => {
  const record = useRecordContext();
  const experimentCount = record?.experimental_results?.length || 0;

  return (
    <TabbedShowLayout>
      <TabbedShowLayout.Tab label="Sample Details">
        <SampleDetailsContent />
      </TabbedShowLayout.Tab>

      <ReferenceManyField reference="treatments" target="sample_id" label="">
        {({ data, total }) => (
          <TabbedShowLayout.Tab label={`Treatments (${total || 0})`}>
          <>
            <TopToolbar>
              <CreateTreatmentButton />
            </TopToolbar>
            <Datagrid bulkActionButtons={false} rowClick={false}>
              <FunctionField
                source="name"
                label="Treatment Type"
                render={(record) => {
                  return treatmentName[record.name] || record.name;
                }}
              />
              <TextField source="notes" />
              <NumberField source="enzyme_volume_litres" />
              <DateField source="last_updated" showTime />
            </Datagrid>
          </>
          </TabbedShowLayout.Tab>
        )}
      </ReferenceManyField>

      <TabbedShowLayout.Tab
        label={`Associated Experiments (${experimentCount})`}
      >
        <ExperimentalResultsTable />
      </TabbedShowLayout.Tab>
    </TabbedShowLayout>
  );
};

export const ShowComponent = () => {
  return (
    <Show actions={<ShowComponentActions />}>
      <TabbedContentWithCounts />
    </Show>
  );
};

export default ShowComponent;
