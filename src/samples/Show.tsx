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

const ExperimentalResultsTable = () => {
  const record = useRecordContext();
  const redirect = useRedirect();
  const [frozenFilter, setFrozenFilter] = React.useState("all");
  const [experimentFilter, setExperimentFilter] = React.useState("all");

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

  // Filter results based on category and experiment
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

    return true;
  });

  const handleFilterChange = (newFilter) => {
    setFrozenFilter(newFilter);
  };

  const handleExperimentFilterChange = (event) => {
    setExperimentFilter(event.target.value);
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
    perPage: 10,
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
        <ToggleButtonGroup
          value={frozenFilter}
          exclusive
          onChange={(_, newFilter) => {
            if (newFilter) {
              handleFilterChange(newFilter);
            }
          }}
          size="small"
        >
          <ToggleButton value="all">All ({totalCount})</ToggleButton>
          <ToggleButton value="frozen">
            <CheckCircle sx={{ mr: 0.5, fontSize: "1rem" }} />
            Frozen ({frozenCount})
          </ToggleButton>
          <ToggleButton value="liquid">
            <Cancel sx={{ mr: 0.5, fontSize: "1rem" }} />
            Liquid ({liquidCount})
          </ToggleButton>
          <ToggleButton value="no_result">
            No Result ({noResultCount})
          </ToggleButton>
        </ToggleButtonGroup>

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
        <Box display="flex" flexDirection="column" gap={2}>
          <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
            <Labeled>
              <TextField source="id" />
            </Labeled>
            <Labeled>
              <TextField source="name" />
            </Labeled>
            <Labeled>
              <ReferenceField
                source="location_id"
                reference="locations"
                link="show"
              >
                <TextField source="name" />
              </ReferenceField>
            </Labeled>
          </Box>

          <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
            <Labeled>
              <FunctionField
                source="type"
                label="Type"
                render={(record) => {
                  return sampleType[record.type] || record.type;
                }}
              />
            </Labeled>
            <Labeled>
              <NumberField source="latitude" label="Latitude (°)" />
            </Labeled>
            <Labeled>
              <NumberField source="longitude" label="Longitude (°)" />
            </Labeled>
          </Box>

          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <Labeled>
              <DateField source="start_time" label="Start Time" showTime />
            </Labeled>
            <Labeled>
              <DateField source="stop_time" label="Stop Time" showTime />
            </Labeled>
          </Box>

          <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
            <Labeled>
              <NumberField
                source="flow_litres_per_minute"
                label="Flow Rate (L/min)"
              />
            </Labeled>
            <Labeled>
              <NumberField source="total_volume" label="Total Volume (L)" />
            </Labeled>
            <Labeled>
              <TextField source="material_description" />
            </Labeled>
          </Box>

          <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
            <Labeled>
              <TextField source="extraction_procedure" />
            </Labeled>
            <Labeled>
              <TextField source="filter_substrate" />
            </Labeled>
            <Labeled>
              <NumberField
                source="suspension_volume_litres"
                label="Suspension Volume (L)"
              />
            </Labeled>
          </Box>

          <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
            <Labeled>
              <NumberField source="air_volume_litres" label="Air Volume (L)" />
            </Labeled>
            <Labeled>
              <NumberField
                source="water_volume_litres"
                label="Water Volume (L)"
              />
            </Labeled>
            <Labeled>
              <NumberField source="initial_concentration_gram_l" />
            </Labeled>
          </Box>

          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <Labeled>
              <NumberField
                source="well_volume_litres"
                label="Well Volume (L)"
              />
            </Labeled>
            <Labeled>
              <TextField source="remarks" />
            </Labeled>
          </Box>

          <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
            <Labeled>
              <DateField source="created_at" showTime />
            </Labeled>
            <Labeled>
              <DateField source="last_updated" showTime />
            </Labeled>
          </Box>
        </Box>
      </TabbedShowLayout.Tab>

      <TabbedShowLayout.Tab label="Treatments">
        <ReferenceManyField reference="treatments" target="sample_id" label="">
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
        </ReferenceManyField>
      </TabbedShowLayout.Tab>

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
