import React, { useCallback, useRef, useState, useMemo } from "react";
import {
  useInput,
  FieldTitle,
  useGetOne,
  Link,
  useDataProvider,
  useRecordContext,
  useRedirect,
  useNotify,
} from "react-admin";
import TrayGrid, { Cell, ExistingRegion, Orientation } from "./TrayGrid";
import { TreatmentSelector } from "./TreatmentSelector";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Checkbox,
  Card,
  CardContent,
  Chip,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Link as MuiLink,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ScienceIcon from "@mui/icons-material/Science";
import { scaleSequential } from "d3-scale";
import { interpolateBlues } from "d3-scale-chromatic";
import { treatmentName } from "../treatments";

// Generate dynamic column letters based on tray dimensions
const generateColumnLetters = (maxCols: number): string[] => {
  const letters = [];
  for (let i = 0; i < maxCols; i++) {
    letters.push(String.fromCharCode(65 + i)); // A, B, C, etc.
  }
  return letters;
};

const colIndexToLetter = (idx: number, maxCols: number): string => {
  const letters = generateColumnLetters(maxCols);
  return letters[idx] || "A";
};

const rowIndexToNumber = (idx: number): number => idx + 1;

const letterToColIndex = (letter: string, maxCols: number): number => {
  const letters = generateColumnLetters(maxCols);
  return letters.indexOf(letter.toUpperCase());
};

const numberToRowIndex = (num: number): number => num - 1;

// Parse cell string with dynamic tray dimensions
// Format: Letter (row) + Number (column), e.g., "A1", "D5"
const parseCell = (s: string, trayConfig?: any): Cell => {
  if (!trayConfig) return { row: 0, col: 0 };

  const match = s.match(/^([A-Za-z])(\d{1,2})$/);
  if (match) {
    const col = letterToColIndex(match[1], trayConfig.qty_cols); // Letter maps to row index (but stored in col variable for grid positioning)
    const rowNumber = parseInt(match[2], 10);
    let row = numberToRowIndex(rowNumber); // Number maps to column index (but stored in row variable for grid positioning)

    // Validate bounds to prevent invalid coordinates
    if (
      row < 0 ||
      row >= trayConfig.qty_rows ||
      col < 0 ||
      col >= trayConfig.qty_cols
    ) {
      return { row: 0, col: 0 };
    }

    return { row, col };
  }
  return { row: 0, col: 0 };
};

// Convert Cell back to string with dynamic tray dimensions
// Format: Letter (row) + Number (column), e.g., "A1", "D5"
const cellToString = (cell: Cell, trayConfig: any): string => {
  // Validate bounds before converting
  if (
    cell.row < 0 ||
    cell.row >= trayConfig.qty_rows ||
    cell.col < 0 ||
    cell.col >= trayConfig.qty_cols
  ) {
    return "A1"; // Return safe default
  }

  const letter = colIndexToLetter(cell.col, trayConfig.qty_cols); // Grid col index maps to letter (row in microplate notation)
  const rowNumber = cell.row + 1; // Grid row index maps to number (column in microplate notation)
  return `${letter}${rowNumber}`;
};

// Helper to convert a cell to string, considering tray rotation
// This converts stored numeric coordinates directly to scientific notation
const cellToStringWithRotation = (
  cell: Cell,
  trayConfig: any,
  rotation: number,
): string => {
  // For stored coordinates in the database:
  // - cell.row represents the logical row (0-7 for A-H)
  // - cell.col represents the logical column (0-11 for 1-12)
  // 
  // The rotation affects how these are displayed, but the stored coordinates
  // are already in the correct logical format for direct conversion

  // Convert stored coordinates directly to scientific notation
  // Row index maps to letter (A, B, C, ..., H)
  // Column index maps to number (1, 2, 3, ..., 12)
  const letter = String.fromCharCode(65 + cell.row);
  const number = cell.col + 1;

  return `${letter}${number}`;
};

interface SingleRegion {
  name: string;
  tray_id: number; // Changed from tray_sequence_id to tray_id to match API
  col_min: number; // Changed from upper_left string to numeric columns
  col_max: number; // New field for maximum column
  row_min: number; // Changed from lower_right string to numeric rows
  row_max: number; // New field for maximum row
  display_colour_hex: string; // Changed from color to display_colour_hex to match API
  treatment_id?: string; // Changed from sample to treatment_id
  dilution_factor?: number; // Changed from dilution to dilution_factor to match API (integer type)
  is_background_key?: boolean; // Changed from is_region_key to is_background_key
  treatment?: {
    // Add the nested treatment object
    id: string;
    name: string;
    notes?: string;
    enzyme_volume_litres?: number;
    sample?: {
      id: string;
      name: string;
      campaign?: {
        id: string;
        name: string;
      };
    };
  };
}

// Updated TrayConfig to match new API structure
interface TrayConfig {
  order_sequence: number;
  rotation_degrees: number;
  name?: string;
  qty_cols?: number;
  qty_rows?: number;
  well_relative_diameter?: string;
}

// Colorblind‐safe palette (ColorBrewer "Dark2")
const COLOR_PALETTE = [
  "#1b9e77",
  "#d95f02",
  "#7570b3",
  "#e7298a",
  "#66a61e",
  "#e6ab02",
  "#a6761d",
  "#666666",
];

// Simple YAML parser for our specific format
const parseYAML = (yamlText: string, trayConfigs: TrayConfig[]): any => {
  const lines = yamlText.split("\n");
  const result: any = {};
  let currentKey = "";
  let currentArray: any[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (!line.startsWith(" ") && trimmed.endsWith(":")) {
      // New top-level key
      if (currentKey && currentArray.length > 0) {
        result[currentKey] = currentArray;
        currentArray = [];
      }
      currentKey = trimmed.slice(0, -1);
    } else if (trimmed.startsWith("- tray:")) {
      // Start of new array item
      const trayValue = trimmed.split("tray:")[1].trim();
      currentArray.push({ tray: trayValue });
    } else if (trimmed.startsWith("upper_left:")) {
      // Add upper_left to current item
      const value = trimmed.split("upper_left:")[1].trim();
      if (currentArray.length > 0) {
        currentArray[currentArray.length - 1].upper_left = value;
      }
    } else if (trimmed.startsWith("lower_right:")) {
      // Add lower_right to current item
      const value = trimmed.split("lower_right:")[1].trim();
      if (currentArray.length > 0) {
        currentArray[currentArray.length - 1].lower_right = value;
      }
    }
  }

  // Don't forget the last key
  if (currentKey && currentArray.length > 0) {
    result[currentKey] = currentArray;
  }

  return result;
};

// Component to display well details with hyperlink functionality
const WellDetailsDisplay: React.FC<{
  well: any; // Use API data structure directly
  formatSeconds: (seconds: number) => string;
  onViewImage?: (well: any) => void;
}> = ({ well, formatSeconds, onViewImage }) => {
  const redirect = useRedirect();

  const handleTreatmentClick = () => {
    if (well.treatment?.id) {
      redirect("show", "treatments", well.treatment.id);
    }
  };

  const handleSampleClick = () => {
    // Check direct sample access first, then fall back to treatment sample
    const sampleId = well.sample?.id || well.treatment?.sample?.id;
    if (sampleId) {
      redirect("show", "samples", sampleId);
    }
  };

  return (
    <Box
      mt={3}
      p={2}
      borderRadius={1}
      sx={{
        backgroundColor: "action.hover",
        border: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="subtitle2" gutterBottom color="text.primary">
        {well.tray_name
          ? `${well.tray_name}: ${well.coordinate}`
          : `Well ${well.coordinate}`}
      </Typography>
      {well.first_phase_change_temperature_probes?.average && (
        <Tooltip
          title={
            well.first_phase_change_temperature_probes ? (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                  Individual Probe Temperatures:
                </Typography>
                <Typography variant="body2">
                  Probe 1: {well.first_phase_change_temperature_probes.probe_1}
                  °C
                </Typography>
                <Typography variant="body2">
                  Probe 2: {well.first_phase_change_temperature_probes.probe_2}
                  °C
                </Typography>
                <Typography variant="body2">
                  Probe 3: {well.first_phase_change_temperature_probes.probe_3}
                  °C
                </Typography>
                <Typography variant="body2">
                  Probe 4: {well.first_phase_change_temperature_probes.probe_4}
                  °C
                </Typography>
                <Typography variant="body2">
                  Probe 5: {well.first_phase_change_temperature_probes.probe_5}
                  °C
                </Typography>
                <Typography variant="body2">
                  Probe 6: {well.first_phase_change_temperature_probes.probe_6}
                  °C
                </Typography>
                <Typography variant="body2">
                  Probe 7: {well.first_phase_change_temperature_probes.probe_7}
                  °C
                </Typography>
                <Typography variant="body2">
                  Probe 8: {well.first_phase_change_temperature_probes.probe_8}
                  °C
                </Typography>
              </Box>
            ) : (
              ""
            )
          }
          enterDelay={0}
          leaveDelay={200}
          followCursor
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ cursor: "help" }}
          >
            <strong>Freezing temperature (average):</strong>{" "}
            {well.first_phase_change_temperature_probes.average}°C
          </Typography>
        </Tooltip>
      )}
      {well.first_phase_change_seconds !== null && (
        <Typography variant="body2" color="text.secondary">
          <strong>Freezing time:</strong>{" "}
          {formatSeconds(well.first_phase_change_seconds)} (
          {well.first_phase_change_seconds}s)
          {well.first_phase_change_time && (
            <span style={{ marginLeft: 4 }}>
              [{new Date(well.first_phase_change_time).toLocaleTimeString()}]
            </span>
          )}
        </Typography>
      )}
      {(well.sample?.name ||
        well.treatment?.sample?.name ||
        well.sample_name) && (
        <Typography variant="body2" color="text.secondary">
          <strong>Sample:</strong>{" "}
          {well.sample?.id || well.treatment?.sample?.id ? (
            <MuiLink
              component="button"
              variant="body2"
              onClick={handleSampleClick}
              sx={{
                cursor: "pointer",
                textDecoration: "underline",
                color: "primary.main",
              }}
            >
              {well.sample?.name ||
                well.treatment?.sample?.name ||
                well.sample_name}
            </MuiLink>
          ) : (
            well.sample?.name ||
            well.treatment?.sample?.name ||
            well.sample_name
          )}
        </Typography>
      )}
      {well.treatment?.name && (
        <Typography variant="body2" color="text.secondary">
          <strong>Treatment:</strong>{" "}
          {well.treatment?.id ? (
            <MuiLink
              component="button"
              variant="body2"
              onClick={handleTreatmentClick}
              sx={{
                cursor: "pointer",
                textDecoration: "underline",
                color: "primary.main",
              }}
            >
              {treatmentName[well.treatment.name] || well.treatment.name}
            </MuiLink>
          ) : (
            treatmentName[well.treatment.name] || well.treatment.name
          )}
        </Typography>
      )}
      {well.dilution_factor && (
        <Typography variant="body2" color="text.secondary">
          <strong>Dilution:</strong> {well.dilution_factor}
        </Typography>
      )}
      {well.treatment?.enzyme_volume_litres && (
        <Typography variant="body2" color="text.secondary">
          <strong>Enzyme volume:</strong> {well.treatment.enzyme_volume_litres}L
        </Typography>
      )}
      {(well.temperatures?.image_filename || well.image_filename_at_freeze) && (
        <Box mt={1} display="flex" alignItems="center">
          <Typography variant="body2" color="text.secondary" mr={1}>
            <strong>Image:</strong>
            <span style={{ marginLeft: 4 }}>
              {well.temperatures?.image_filename ||
                well.image_filename_at_freeze}
            </span>
          </Typography>
          {well.image_asset_id || well.temperatures?.image_asset_id ? (
            <Tooltip title="View freeze image">
              <IconButton
                size="small"
                onClick={() => onViewImage?.(well)}
                sx={{ ml: 0.5 }}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="Image asset doesn't exist in the experiment">
              <span>
                <IconButton
                  size="small"
                  disabled
                  sx={{ ml: 0.5, color: "text.disabled" }}
                >
                  <VisibilityOffIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      )}
    </Box>
  );
};

// Component to display treatment information in read-only mode
const TreatmentDisplay: React.FC<{
  treatmentId: string;
  treatmentData?: SingleRegion["treatment"];
}> = ({ treatmentId, treatmentData }) => {
  const { data: fetchedTreatment, isLoading } = useGetOne(
    "treatments",
    { id: treatmentId },
    { enabled: !!treatmentId && !treatmentData },
  );

  const treatment = treatmentData || fetchedTreatment;

  if (!treatmentId) {
    return (
      <Typography
        variant="caption"
        color="textSecondary"
        sx={{ fontSize: "0.8rem" }}
      >
        No treatment
      </Typography>
    );
  }

  if (!treatment && isLoading) {
    return (
      <Typography
        variant="caption"
        color="textSecondary"
        sx={{ fontSize: "0.8rem" }}
      >
        Loading...
      </Typography>
    );
  }

  if (!treatment) {
    return (
      <Typography variant="caption" color="error" sx={{ fontSize: "0.8rem" }}>
        Treatment not found
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "48px",
        justifyContent: "center",
      }}
    >
      {treatment.sample?.name && (
        <Typography
          variant="caption"
          sx={{ fontSize: "0.75rem", lineHeight: 1.2, fontWeight: "medium" }}
        >
          {treatment.sample.name}
        </Typography>
      )}
      <Typography
        variant="caption"
        sx={{ fontSize: "0.7rem", lineHeight: 1.2, color: "text.secondary" }}
      >
        {treatment.name}
      </Typography>
      {treatment.sample?.location?.name && (
        <Typography
          variant="caption"
          sx={{ fontSize: "0.65rem", lineHeight: 1.2, color: "text.secondary" }}
        >
          {treatment.sample.location.name}
        </Typography>
      )}
    </Box>
  );
};

export const RegionInput: React.FC<{
  source: string;
  label?: string;
  trayConfiguration?: { trays: TrayConfig[] };
  readOnly?: boolean;
  value?: any; // Allow direct value prop for display mode
  validate?: (value: any) => string | undefined; // Add validate prop
  showTimePointVisualization?: boolean; // Add option to show time point data
  viewMode?: "regions" | "results"; // External viewMode control
  hideInternalToggle?: boolean; // Option to hide the internal toggle
  filteredTreatments?: any[]; // Add option to filter treatments for wizard mode
  onWellClick?: (wellSummary: any) => void; // External well click handler for image preview
}> = (props) => {
  const dataProvider = useDataProvider();
  const record = useRecordContext(); // Get the current experiment record for time point data
  const notify = useNotify();

  // Always call useInput to maintain consistent hook order, but handle errors gracefully
  let inputResult;
  try {
    // Create a custom validation function that includes duplicate checking
    const customValidate = (value: any) => {
      const regions: SingleRegion[] = Array.isArray(value) ? value : [];

      // Check for duplicate names
      const nameCount: { [key: string]: number } = {};
      let hasDuplicates = false;

      regions.forEach((region) => {
        const name = region.name?.trim();
        if (name) {
          nameCount[name] = (nameCount[name] || 0) + 1;
          if (nameCount[name] > 1) {
            hasDuplicates = true;
          }
        }
      });

      if (hasDuplicates) {
        return "Duplicate region names are not allowed";
      }

      // Check for empty required fields
      const hasEmptyNames = regions.some((r) => !r.name?.trim());
      const hasEmptyTreatments = regions.some((r) => !r.treatment_id?.trim());
      const hasEmptyDilutions = regions.some(
        (r) => !r.dilution_factor || r.dilution_factor <= 0,
      );

      if (hasEmptyNames) {
        return "All regions must have a name";
      }
      if (hasEmptyTreatments) {
        return "All regions must have a treatment selected";
      }
      if (hasEmptyDilutions) {
        return "All regions must have a valid dilution factor (positive number)";
      }

      // Call any additional validation passed as prop
      if (props.validate) {
        return props.validate(value);
      }

      return undefined;
    };

    inputResult = useInput({
      ...props,
      validate: customValidate,
    });
  } catch (error) {
    // If useInput fails (no form context), create a mock result
    inputResult = {
      field: { value: [], onChange: () => {} },
      fieldState: { error: undefined, isTouched: false },
      isRequired: false,
    };
  }

  // Get value and onChange, prioritizing direct props for read-only mode
  const value =
    props.readOnly && props.value !== undefined
      ? props.value
      : inputResult.field.value;
  const onChange = props.readOnly ? () => {} : inputResult.field.onChange;
  const error = props.readOnly ? undefined : inputResult.fieldState.error;
  const isTouched = props.readOnly ? false : inputResult.fieldState.isTouched;
  const isRequired = props.readOnly ? false : inputResult.isRequired;

  const regions: SingleRegion[] = useMemo(
    () => (Array.isArray(value) ? value : []),
    [value],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Add refs for inputs to maintain focus
  const inputRefs = useRef<{
    [key: string]: React.RefObject<HTMLInputElement>;
  }>({});
  const {
    trayConfiguration,
    readOnly = false,
    showTimePointVisualization = false,
  } = props;
  const [selectedWell, setSelectedWell] = useState<any | null>(null);

  // Extract results from the experiment record for time point visualization
  const results: any = record?.results || null;

  // Use external viewMode if provided, otherwise use internal state
  const [internalViewMode, setInternalViewMode] = useState<
    "regions" | "results"
  >(
    showTimePointVisualization &&
      results &&
      results.summary?.total_time_points > 0
      ? "results"
      : "regions",
  );
  const viewMode = props.viewMode || internalViewMode;

  // Calculate color scale based on freezing times for time point visualization
  const { colorScale, minSeconds, maxSeconds } = useMemo(() => {
    if (!showTimePointVisualization || !results?.trays) {
      return { colorScale: () => "#f5f5f5", minSeconds: 0, maxSeconds: 0 };
    }

    // Extract freezing times directly from API data
    const freezingTimes = results.trays
      .flatMap((tray: any) => tray.wells || [])
      .filter(
        (well: any) =>
          well.first_phase_change_time && results.summary?.first_timestamp,
      )
      .map((well: any) =>
        Math.floor(
          (new Date(well.first_phase_change_time).getTime() -
            new Date(results.summary.first_timestamp).getTime()) /
            1000,
        ),
      );

    if (freezingTimes.length === 0) {
      return { colorScale: () => "#f5f5f5", minSeconds: 0, maxSeconds: 0 };
    }

    const min = Math.min(...freezingTimes);
    const max = Math.max(...freezingTimes);

    // Create a color scale from light blue (early freeze) to dark blue (late freeze)
    const scale = scaleSequential(interpolateBlues).domain([min, max]);

    return {
      colorScale: (value: number | null) => {
        if (value === null) return "#d32f2f"; // Darker colorblind-friendly red
        return scale(value);
      },
      minSeconds: min,
      maxSeconds: max,
    };
  }, [results, showTimePointVisualization]);

  // Function to properly assign sample/treatment to wells based on tray filtering
  const getCorrectSampleForWell = (
    well: any,
    regions: any[],
  ): { sample_name: string | null; treatment_name: string | null } => {
    // Only assign data if we have valid regions and the well has actual region assignments
    if (!regions || regions.length === 0) {
      return { sample_name: null, treatment_name: null };
    }

    // Convert well coordinates to 0-indexed for region comparison
    const wellRow = well.row_letter.charCodeAt(0) - 65; // Convert letter to 0-indexed (A=0, B=1, etc.)
    const wellCol = well.column_number - 1; // Convert 1-indexed to 0-indexed

    // Find regions that match this well's tray by tray_id
    const matchingRegions = regions.filter((region) => {
      // Skip regions without proper tray configuration
      if (!region.tray_id) return false;

      // Find the tray configuration for this region
      const trayInfo = flatTrays.find(
        (t) => t.tray.order_sequence === region.tray_id,
      );

      // Check if this tray matches the well's tray name
      return (
        trayInfo &&
        (trayInfo.trayName === well.tray_name ||
          trayInfo.tray.name === well.tray_name)
      );
    });

    // Find the region that contains this well's coordinates
    const containingRegion = matchingRegions.find((region) => {
      return (
        wellRow >= (region.row_min || 0) &&
        wellRow <= (region.row_max || 0) &&
        wellCol >= (region.col_min || 0) &&
        wellCol <= (region.col_max || 0)
      );
    });

    // Only return data if we have a valid containing region with treatment and sample data
    if (
      containingRegion &&
      containingRegion.treatment &&
      containingRegion.treatment.sample &&
      containingRegion.treatment.sample.name &&
      containingRegion.treatment.name
    ) {
      return {
        sample_name: containingRegion.treatment.sample.name,
        treatment_name: containingRegion.treatment.name,
      };
    }

    // Return null if no valid region assignment is found
    return { sample_name: null, treatment_name: null };
  };

  // Direct access to well data from results - no reconstruction needed
  const wellDataByTray = useMemo(() => {
    if (!results?.trays) return new Map();

    const trayMap = new Map<string, Map<string, any>>();
    results.trays.forEach((tray: any) => {
      const wellMap = new Map<string, any>();
      (tray.wells || []).forEach((well: any) => {
        // Add calculated seconds for backward compatibility
        const wellWithSeconds = {
          ...well,
          first_phase_change_seconds:
            well.first_phase_change_time && results.summary?.first_timestamp
              ? Math.floor(
                  (new Date(well.first_phase_change_time).getTime() -
                    new Date(results.summary.first_timestamp).getTime()) /
                    1000,
                )
              : null,
        };
        wellMap.set(well.coordinate, wellWithSeconds);
      });
      trayMap.set(tray.tray_name, wellMap);
    });
    return trayMap;
  }, [results]);

  // Function to fetch average temperature for each tray
  const [trayTemperatures, setTrayTemperatures] = useState<Map<number, number>>(
    new Map(),
  );

  React.useEffect(() => {
    const fetchTrayTemperatures = async () => {
      if (!record?.id || !showTimePointVisualization) return;

      try {
        // Fetch temperature data for the experiment
        const response = await dataProvider.getOne("experiments", {
          id: record.id,
        });

        if (response.data?.temperature_summary?.average_temperatures_by_tray) {
          const tempMap = new Map<number, number>();
          response.data.temperature_summary.average_temperatures_by_tray.forEach(
            (temp: { tray_id: number; avg_temperature: number }) => {
              tempMap.set(temp.tray_id, temp.avg_temperature);
            },
          );
          setTrayTemperatures(tempMap);
        }
      } catch (error) {
        console.error("Error fetching tray temperatures:", error);
      }
    };

    fetchTrayTemperatures();
  }, [record?.id, showTimePointVisualization, dataProvider]);

  const formatSeconds = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Initialize or update input refs when regions change
  React.useEffect(() => {
    regions.forEach((region, idx) => {
      ["name", "treatment", "dilution_factor"].forEach((field) => {
        const key = `region-${idx}-${field}`;
        if (!inputRefs.current[key]) {
          inputRefs.current[key] = React.createRef();
        }
      });
    });
  }, [regions.length]);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS

  // Generate a unique default name for a region using display coordinates
  const generateDefaultRegionName = useCallback(
    (trayName: string, startCoord: string, endCoord: string): string => {
      // Base name format: TrayStartEnd or TrayStart if single cell
      let baseName: string;
      if (startCoord === endCoord) {
        baseName = `${trayName}${startCoord}`;
      } else {
        baseName = `${trayName}${startCoord}${endCoord}`;
      }

      // Check for duplicates and add suffix if needed
      let finalName = baseName;
      let counter = 1;
      while (regions.some((r) => r.name === finalName)) {
        finalName = `${baseName}_${counter}`;
        counter++;
      }

      return finalName;
    },
    [regions],
  );

  const handleNewRegion = useCallback(
    (regionObj: {
      trayName: string;
      upperLeft: Cell;
      lowerRight: Cell;
      trayConfig: any;
      trayId: number;
      hasOverlap?: boolean;
    }) => {
      const { trayName, upperLeft, lowerRight, trayConfig, trayId } = regionObj;

      // Check overlap on same tray using new coordinate system
      const existingOnTray = regions.filter((r) => r.tray_id === trayId);
      for (const r of existingOnTray) {
        const overlapInRows =
          upperLeft.row <= r.row_max && lowerRight.row >= r.row_min;
        const overlapInCols =
          upperLeft.col <= r.col_max && lowerRight.col >= r.col_min;
        if (overlapInRows && overlapInCols) {
          notify(
            "Cannot create overlapping regions. Please select a different area.",
            { type: "error" },
          );
          return;
        }
      }

      // Use the same coordinate display logic that works everywhere else
      const ulCell: Cell = { row: upperLeft.row, col: upperLeft.col };
      const lrCell: Cell = { row: lowerRight.row, col: lowerRight.col };
      const startCoord = cellToStringWithRotation(
        ulCell,
        trayConfig,
        trayConfig.rotation_degrees,
      );
      const endCoord = cellToStringWithRotation(
        lrCell,
        trayConfig,
        trayConfig.rotation_degrees,
      );

      // Generate unique default name using display coordinates
      const defaultName = generateDefaultRegionName(
        trayName,
        startCoord,
        endCoord,
      );

      // Pick a color
      const color = COLOR_PALETTE[regions.length % COLOR_PALETTE.length];

      // Append new region with numeric coordinates
      const updated: SingleRegion[] = [
        ...regions,
        {
          name: defaultName,
          tray_id: trayId,
          col_min: upperLeft.col,
          col_max: lowerRight.col,
          row_min: upperLeft.row,
          row_max: lowerRight.row,
          display_colour_hex: color,
          treatment_id: "",
          dilution_factor: undefined,
          is_background_key: false, // Default to false
        },
      ];
      onChange(updated);
    },
    [onChange, regions, generateDefaultRegionName],
  );

  const handleRemove = useCallback(
    (idx: number) => {
      const updated = regions.filter((_, i) => i !== idx);
      onChange(updated);
    },
    [onChange, regions],
  );

  const handleRegionChange = useCallback(
    (idx: number, field: string, newValue: string | boolean | number) => {
      // Check for duplicate names when changing name field
      if (field === "name" && typeof newValue === "string") {
        const isDuplicate = regions.some(
          (r, i) => i !== idx && r.name === newValue,
        );
        if (isDuplicate && newValue.trim() !== "") {
          notify(
            `Name "${newValue}" already exists. Please choose a different name.`,
            { type: "error" },
          );
          return; // Don't update if it would create a duplicate
        }
      }

      // Get current focused element to restore focus after state update
      const activeElement = document.activeElement as HTMLElement;
      const activeId = activeElement?.id;

      const updated = regions.map((r, i) =>
        i === idx ? { ...r, [field]: newValue } : r,
      );
      onChange(updated);

      // Restore focus on next render
      setTimeout(() => {
        if (activeId) {
          const elementToFocus = document.getElementById(activeId);
          if (elementToFocus) {
            elementToFocus.focus();
          }
        }
      }, 0);
    },
    [onChange, regions, notify],
  );

  // Validation function to check for duplicate names
  const validateRegionNames = useCallback(() => {
    const nameCount: { [key: string]: number } = {};
    const duplicateIndices: Set<number> = new Set();

    regions.forEach((region, idx) => {
      const name = region.name?.trim();
      if (name) {
        nameCount[name] = (nameCount[name] || 0) + 1;
        if (nameCount[name] > 1) {
          // Mark all regions with this name as duplicates
          regions.forEach((r, i) => {
            if (r.name?.trim() === name) {
              duplicateIndices.add(i);
            }
          });
        }
      }
    });

    return duplicateIndices;
  }, [regions]);

  const duplicateIndices = validateRegionNames();
  const hasDuplicates = duplicateIndices.size > 0;

  // Add validation effect to propagate form errors
  React.useEffect(() => {
    if (!props.readOnly && inputResult.fieldState) {
      const hasEmptyNames = regions.some((r) => !r.name?.trim());
      const hasEmptyTreatments = regions.some((r) => !r.treatment_id?.trim());
      const hasEmptyDilutions = regions.some(
        (r) => !r.dilution_factor || r.dilution_factor <= 0,
      );

      if (
        hasDuplicates ||
        hasEmptyNames ||
        hasEmptyTreatments ||
        hasEmptyDilutions
      ) {
        // Create a custom error that react-hook-form will recognize
        const errorMessage = hasDuplicates
          ? "Duplicate region names are not allowed"
          : "All fields are required";

        // Trigger validation without changing the actual value
        setTimeout(() => {
          const form = document.querySelector("form");
          if (form) {
            const event = new Event("input", { bubbles: true });
            form.dispatchEvent(event);
          }
        }, 0);
      }
    }
  }, [hasDuplicates, regions, props.readOnly, inputResult.fieldState]);

  // Hook to enhance regions with treatment information for display
  const [enhancedRegions, setEnhancedRegions] = React.useState<SingleRegion[]>(
    [],
  );

  // Memoize the regions key to prevent unnecessary effect triggers
  const regionsKey = useMemo(
    () =>
      regions
        .map((r) => `${r.treatment_id}-${!!r.treatment?.sample?.name}-${r.name}-${r.dilution_factor}`)
        .join(","),
    [regions],
  );

  React.useEffect(() => {
    const enhanceRegionsWithTreatmentData = async () => {
      const enhanced = await Promise.all(
        regions.map(async (region) => {
          // If we already have treatment data, use it
          if (region.treatment?.sample?.name) {
            return region;
          }

          // If we have a treatment_id but no nested treatment data, fetch it
          if (region.treatment_id && !region.treatment?.sample?.name) {
            try {
              const { data: treatment } = await dataProvider.getOne(
                "treatments",
                { id: region.treatment_id },
              );

              // Get the sample for this treatment
              const { data: sample } = await dataProvider.getOne("samples", {
                id: treatment.sample_id,
              });

              return {
                ...region,
                treatment: {
                  ...treatment,
                  sample: sample,
                },
              };
            } catch (error) {
              console.error(
                "Error fetching treatment data for region:",
                region.name,
                error,
              );
              return region;
            }
          }

          return region;
        }),
      );

      setEnhancedRegions(enhanced);
    };

    if (regions.length > 0) {
      enhanceRegionsWithTreatmentData();
    } else {
      setEnhancedRegions([]);
    }
  }, [regionsKey]); // Use memoized key instead of raw regions

  const handleYAMLImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const yamlText = e.target?.result as string;
          const parsedYAML = parseYAML(
            yamlText,
            trayConfiguration?.trays || [],
          );

          const importedRegions: SingleRegion[] = [];
          let colorIndex = regions.length;

          Object.entries(parsedYAML).forEach(
            ([regionName, regionData]: [string, any]) => {
              if (Array.isArray(regionData)) {
                regionData.forEach((region) => {
                  const color =
                    COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];

                  // Find the tray by name to get its order_sequence (tray_id)
                  const trayInfo = trayConfiguration?.trays?.find(
                    (t) => t.name === region.tray,
                  );

                  if (trayInfo) {
                    const upperLeftCell = parseCell(
                      region.upper_left,
                      trayInfo,
                    );
                    const lowerRightCell = parseCell(
                      region.lower_right,
                      trayInfo,
                    );

                    importedRegions.push({
                      name: regionName,
                      tray_id: trayInfo.order_sequence, // Use the order_sequence as tray_id
                      col_min: upperLeftCell.col,
                      col_max: lowerRightCell.col,
                      row_min: upperLeftCell.row,
                      row_max: lowerRightCell.row,
                      display_colour_hex: color,
                      treatment_id: "",
                      dilution_factor: undefined,
                      is_background_key: false, // Default to false
                    });
                  }
                  colorIndex++;
                });
              }
            },
          );

          const updatedRegions = [...regions, ...importedRegions];
          onChange(updatedRegions);
        } catch (err) {
          console.error("Error parsing YAML:", err);
          window.alert("Error parsing YAML file. Please check the format.");
        }
      };

      reader.readAsText(file);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [regions, onChange, trayConfiguration],
  );

  // Create a stable no-op function for display mode
  const noOpRegionSelect = useCallback(() => {}, []);

  // Create memoized values for all hooks to ensure consistent hook call order
  const [noTraysMessage, flatTrays] = React.useMemo(() => {
    // If no tray configuration is provided, return early with message component
    if (
      !trayConfiguration ||
      !trayConfiguration.trays ||
      trayConfiguration.trays.length === 0
    ) {
      const message = (
        <Box marginTop={2} marginBottom={2}>
          <FieldTitle
            label={props.label || "Regions"}
            source={props.source}
            resource={undefined}
            isRequired={isRequired}
          />
          <Typography variant="body2" color="textSecondary">
            No tray configuration available. Please select a tray configuration
            first.
          </Typography>
        </Box>
      );
      return [message, []];
    }

    // Otherwise, process the tray configuration
    // Note: With the new schema, trays are already flattened in trayConfiguration.trays
    const flattened = [];
    for (const tray of trayConfiguration.trays) {
      flattened.push({
        trayConfig: trayConfiguration,
        tray,
        trayName: tray.name,
        rotation: tray.rotation_degrees,
      });
    }
    return [null, flattened];
  }, [trayConfiguration, props.label, props.source, isRequired]);

  // Get well data with applied region corrections
  const getWellWithRegionData = useCallback(
    (well: any, trayName: string) => {
      // Apply region-based sample/treatment corrections if needed
      const correctedSample = getCorrectSampleForWell(
        {
          ...well,
          tray_name: trayName,
        },
        regions,
      );

      return {
        ...well,
        // Override with region-corrected data if available, otherwise use API data
        sample_name: correctedSample.sample_name || well.sample?.name,
        treatment_name: correctedSample.treatment_name || well.treatment_name,
      };
    },
    [regions],
  );

  // YAML export must be defined AFTER flatTrays is available
  const handleYAMLExport = useCallback(() => {
    if (regions.length === 0) {
      window.alert("No regions to export.");
      return;
    }

    const groupedRegions: { [key: string]: any[] } = {};

    regions.forEach((region) => {
      const regionName = region.name || "Unnamed";

      if (!groupedRegions[regionName]) {
        groupedRegions[regionName] = [];
      }

      // MIGRATION LOGIC: Handle old regions that don't have tray_id set
      let effectiveTrayId = region.tray_id;
      if (effectiveTrayId === undefined || effectiveTrayId === null) {
        effectiveTrayId = 1; // Default to first tray configuration
      }

      // Find the tray info by matching the order_sequence with the region's effective tray_id
      const trayInfo = flatTrays.find(
        (t) => t.tray.order_sequence === effectiveTrayId,
      );

      if (trayInfo) {
        // Convert numeric coordinates back to letter+number format for YAML export
        const upperLeftCell: Cell = {
          row: region.row_min,
          col: region.col_min,
        };
        const lowerRightCell: Cell = {
          row: region.row_max,
          col: region.col_max,
        };
        const upperLeftStr = cellToString(upperLeftCell, trayInfo.tray);
        const lowerRightStr = cellToString(lowerRightCell, trayInfo.tray);

        const trayName =
          trayInfo.tray.name || trayInfo.trayName || `Tray_${effectiveTrayId}`;

        groupedRegions[regionName].push({
          tray: trayName, // Use the actual tray name
          upper_left: upperLeftStr,
          lower_right: lowerRightStr,
        });
      } else {
        // Fallback if tray info not found

        const upperLeftStr = `${String.fromCharCode(65 + region.col_min)}${region.row_min + 1}`;
        const lowerRightStr = `${String.fromCharCode(65 + region.col_max)}${region.row_max + 1}`;

        groupedRegions[regionName].push({
          tray: `Tray_${effectiveTrayId}`,
          upper_left: upperLeftStr,
          lower_right: lowerRightStr,
        });
      }
    });

    let yamlContent = "";
    Object.entries(groupedRegions).forEach(
      ([regionName, regionData], index) => {
        if (index > 0) yamlContent += "\n";
        yamlContent += `${regionName}:\n`;

        regionData.forEach((region) => {
          yamlContent += `  - tray: ${region.tray}\n`;
          yamlContent += `    upper_left: ${region.upper_left}\n`;
          yamlContent += `    lower_right: ${region.lower_right}\n`;
          yamlContent += "\n";
        });
      },
    );

    // Create and download file
    const blob = new Blob([yamlContent.trim()], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "regions.yaml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [regions, flatTrays, trayConfiguration]);

  // Memoize migration check to prevent infinite loops
  const needsMigration = useMemo(() => {
    return (
      !readOnly &&
      regions.some((r) => r.tray_id === null || r.tray_id === undefined)
    );
  }, [readOnly, regions]);

  // Memoized migration function to prevent recreation on every render
  const performMigration = useCallback(() => {
    if (!needsMigration || flatTrays.length === 0) return;

    const updatedRegions = regions.map((region, idx) => {
      if (region.tray_id === null || region.tray_id === undefined) {
        // Check which tray this region is currently being displayed on
        // by finding which tray configuration contains a region at these coordinates
        for (let i = 0; i < flatTrays.length; i++) {
          const flatTray = flatTrays[i];
          const trayConfig = flatTray.trayConfig;

          // Check if this region's coordinates are within this tray's bounds
          if (
            region.row_max < (trayConfig.tray.qty_rows || 0) &&
            region.col_max < (trayConfig.tray.qty_cols || 0)
          ) {
            return { ...region, tray_id: trayConfig.tray.order_sequence };
          }
        }

        // Fallback: assign to first tray
        return { ...region, tray_id: 1 };
      }
      return region;
    });

    // Only update if there were actual changes
    const hasChanges = updatedRegions.some(
      (r, idx) => r.tray_id !== regions[idx].tray_id,
    );

    if (hasChanges) {
      onChange(updatedRegions);
    }
  }, [needsMigration, regions, flatTrays, onChange]);

  // Add a one-time migration effect to fix legacy regions
  React.useEffect(() => {
    // Only run once when all conditions are met
    if (needsMigration && flatTrays.length > 0) {
      // Use a timeout to ensure this runs after the current render cycle
      const timeoutId = setTimeout(performMigration, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [needsMigration, flatTrays.length > 0]); // Simplified dependencies

  // NOW we can do conditional returns after all hooks have been called
  if (noTraysMessage) {
    return noTraysMessage;
  }

  // All hooks below this point will always run, maintaining consistent hook order

  return (
    <Box marginTop={2} marginBottom={2}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        {props.label && (
          <FieldTitle
            label={props.label}
            source={props.source}
            resource={undefined}
            isRequired={isRequired}
          />
        )}

        {/* View Mode Toggle - only show when we have results data and not hidden */}
        {showTimePointVisualization && results && !props.hideInternalToggle && (
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => newMode && setInternalViewMode(newMode)}
            size="small"
          >
            <ToggleButton value="regions" aria-label="regions view">
              <VisibilityIcon sx={{ mr: 0.5 }} />
              Regions
            </ToggleButton>
            <ToggleButton value="results" aria-label="results view">
              <ScienceIcon sx={{ mr: 0.5 }} />
              Results
            </ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      <Box
        display="flex"
        gap={2}
        alignItems="flex-start"
        justifyContent="center"
      >
        {/* Render dynamic trays with minimal spacing */}
        <Box display="flex" gap={1} flexWrap="wrap" sx={{ minWidth: 0 }}>
          {flatTrays.map((flatTray, index) => {
            const { trayConfig, tray, trayName, rotation } = flatTray;
            const existingRegions: ExistingRegion[] = enhancedRegions
              .map((r, idx) => ({ ...r, idx }))
              .filter((r) => {
                // Handle regions with null tray_id by assigning them to the first tray
                if (r.tray_id === null || r.tray_id === undefined) {
                  return index === 0; // Show on first tray only
                }
                return r.tray_id === tray.order_sequence;
              })
              .map((r) => {
                // Create a display name that includes dilution and treatment/sample info
                let displayName = r.name || "Unnamed";

                // Add dilution factor in brackets if available
                if (r.dilution_factor) {
                  displayName = `${displayName} (${r.dilution_factor}x)`;
                }

                // Add treatment/sample info if available
                if (r.treatment?.sample?.name && r.treatment?.name) {
                  displayName = `${displayName}\n${r.treatment.sample.name}\n${r.treatment.name}`;
                } else if (r.treatment?.name) {
                  displayName = `${displayName}\n${r.treatment.name}`;
                }

                return {
                  upperLeft: { row: r.row_min, col: r.col_min },
                  lowerRight: { row: r.row_max, col: r.col_max },
                  name: displayName,
                  color: r.display_colour_hex,
                  onRemove: readOnly ? () => {} : () => handleRemove(r.idx),
                };
              });

            return (
              <Box
                key={index}
                sx={{ flex: "1 1 auto", minWidth: "240px", maxWidth: "400px" }}
                display="flex"
                flexDirection="column"
                alignItems="center"
              >
                <Typography
                  variant="caption"
                  fontWeight="medium"
                  marginBottom={0.5}
                  textAlign="center"
                >
                  {trayName} ({rotation}°)
                  {trayTemperatures.has(tray.order_sequence) && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.8rem",
                        color: "#666",
                      }}
                    >
                      Avg:{" "}
                      {trayTemperatures.get(tray.order_sequence)?.toFixed(1)}
                      °C
                    </span>
                  )}
                </Typography>
                <TrayGrid
                  tray={trayName}
                  qtyCols={tray.qty_cols}
                  qtyRows={tray.qty_rows}
                  orientation={rotation as Orientation}
                  onRegionSelect={
                    readOnly
                      ? noOpRegionSelect
                      : (regionObj) =>
                          handleNewRegion({
                            trayName,
                            upperLeft: regionObj.upperLeft,
                            lowerRight: regionObj.lowerRight,
                            trayConfig: tray,
                            trayId: tray.order_sequence,
                            hasOverlap: regionObj.hasOverlap,
                          })
                  }
                  existingRegions={existingRegions}
                  readOnly={readOnly}
                  wellSummaryMap={wellDataByTray.get(trayName) || new Map()}
                  colorScale={colorScale}
                  onWellClick={(well: any) => {
                    const wellWithRegionData = getWellWithRegionData(
                      well,
                      trayName,
                    );
                    setSelectedWell(wellWithRegionData);
                  }}
                  showTimePointVisualization={
                    showTimePointVisualization && viewMode === "results"
                  }
                  viewMode={viewMode}
                  selectedWell={selectedWell}
                />
              </Box>
            );
          })}
        </Box>

        {/* Unified panel controlled by view mode toggle - moved to right side */}
        {(regions.length > 0 || (showTimePointVisualization && results)) && (
          <Card
            sx={{ flex: "0 0 auto", width: "480px", height: "fit-content" }}
          >
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">
                  {viewMode === "regions" ? "Selected Regions" : "Results"}
                </Typography>

                {/* Export button for regions view in read-only mode */}
                {viewMode === "regions" && readOnly && regions.length > 0 && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={handleYAMLExport}
                    startIcon={<DownloadIcon />}
                    sx={{
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      minWidth: "auto",
                    }}
                  >
                    Export YAML
                  </Button>
                )}
              </Box>

              {/* Regions Content */}
              {viewMode === "regions" && (
                <Box>
                  {regions.length === 0 && (
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      fontStyle="italic"
                    >
                      No regions defined yet.
                    </Typography>
                  )}

                  {regions.map((r, idx) => {
                    // Removed debug logging

                    // MIGRATION LOGIC: Handle old regions that don't have tray_id set
                    let effectiveTrayId = r.tray_id;

                    // If tray_id is undefined/null, try to determine it from the region's position
                    if (
                      effectiveTrayId === undefined ||
                      effectiveTrayId === null
                    ) {
                      // For existing regions without tray_id, we need to make an educated guess
                      // Based on the console logs, assign to first tray as fallback
                      effectiveTrayId = 1;
                    }

                    // Find the tray config and rotation for this region
                    const trayInfo = flatTrays.find(
                      (t) => t.tray.order_sequence === effectiveTrayId,
                    );
                    const trayConfig = trayInfo?.tray;
                    const rotation = trayInfo?.rotation || 0;

                    // Convert numeric coordinates to letter+number format for display
                    let ulStr = "A1";
                    let lrStr = "A1";
                    let trayName = "Unknown";
                    if (trayInfo && trayConfig) {
                      const ulCell: Cell = { row: r.row_min, col: r.col_min };
                      const lrCell: Cell = { row: r.row_max, col: r.col_max };
                      ulStr = cellToStringWithRotation(
                        ulCell,
                        trayConfig,
                        rotation,
                      );
                      lrStr = cellToStringWithRotation(
                        lrCell,
                        trayConfig,
                        rotation,
                      );
                      // Use the actual tray name from the tray configuration
                      trayName =
                        trayConfig.name ||
                        trayInfo.trayName ||
                        `Tray ${effectiveTrayId}`;
                    }
                    return (
                      <Box
                        key={`region-list-${idx}`}
                        marginBottom={0.5}
                        padding={1}
                        paddingTop={1.5}
                        border={`1px solid ${r.display_colour_hex}`}
                        borderRadius={1}
                        sx={{
                          backgroundColor: `${r.display_colour_hex}08`,
                          position: "relative",
                          minWidth: 380,
                        }}
                      >
                        {/* Color indicator and region label */}
                        <Box
                          sx={{
                            position: "absolute",
                            top: -8,
                            left: 8,
                            backgroundColor: "background.paper",
                            paddingX: 0.5,
                            fontSize: "0.875rem",
                            fontWeight: "medium",
                            color: r.display_colour_hex,
                          }}
                        >
                          {trayName}: {ulStr}–{lrStr}
                        </Box>

                        {/* Single compact row with all fields */}
                        <Box
                          display="flex"
                          alignItems="flex-start"
                          gap={1}
                          flexWrap="wrap"
                        >
                          <TextField
                            id={`region-${idx}-name`}
                            placeholder="Name*"
                            size="small"
                            value={r.name}
                            onChange={
                              readOnly
                                ? undefined
                                : (e) =>
                                    handleRegionChange(
                                      idx,
                                      "name",
                                      e.target.value,
                                    )
                            }
                            variant="standard"
                            disabled={readOnly}
                            required
                            error={
                              (!r.name && !readOnly) ||
                              duplicateIndices.has(idx)
                            }
                            helperText={
                              duplicateIndices.has(idx)
                                ? "Duplicate"
                                : undefined
                            }
                            sx={{ width: 100 }}
                            inputRef={inputRefs.current[`region-${idx}-name`]}
                            InputProps={{
                              sx: { fontSize: "0.875rem", paddingY: 0 },
                              endAdornment: duplicateIndices.has(idx) ? (
                                <CloseIcon
                                  sx={{
                                    fontSize: "0.8rem",
                                    color: "error.main",
                                    marginLeft: 0.5,
                                  }}
                                />
                              ) : undefined,
                            }}
                            FormHelperTextProps={{
                              sx: {
                                fontSize: "0.75rem",
                                marginTop: 0,
                              },
                            }}
                          />

                          <TextField
                            id={`region-${idx}-dilution`}
                            placeholder="Dilution*"
                            size="small"
                            value={r.dilution_factor?.toString() || ""}
                            onChange={
                              readOnly
                                ? undefined
                                : (e) => {
                                    const numValue =
                                      parseInt(e.target.value) || 0;
                                    handleRegionChange(
                                      idx,
                                      "dilution_factor",
                                      numValue,
                                    );
                                  }
                            }
                            variant="standard"
                            disabled={readOnly}
                            required
                            error={
                              (!r.dilution_factor || r.dilution_factor <= 0) &&
                              !readOnly
                            }
                            sx={{ width: 80 }}
                            inputRef={
                              inputRefs.current[`region-${idx}-dilution`]
                            }
                            InputProps={{
                              sx: { fontSize: "0.875rem", paddingY: 0 },
                            }}
                          />

                          <Box sx={{ width: 140 }}>
                            {readOnly ? (
                              <TreatmentDisplay
                                treatmentId={r.treatment_id || ""}
                                treatmentData={r.treatment}
                              />
                            ) : (
                              <TreatmentSelector
                                value={r.treatment_id || ""}
                                label=""
                                placeholder="Treatment"
                                disabled={readOnly}
                                size="small"
                                compact={true}
                                filteredTreatments={props.filteredTreatments}
                                existingRegionTreatments={enhancedRegions
                                  .map((region, index) => {
                                    // Only include regions that have actual treatment data
                                    if (!region.treatment || !region.treatment.id) {
                                      return null;
                                    }
                                    
                                    return {
                                      regionName: region.name || `Region ${index + 1}`,
                                      regionIndex: index,
                                      treatment: region.treatment,
                                      dilution_factor: region.dilution_factor,
                                    };
                                  })
                                  .filter((rt) => rt !== null)} // Only include valid region treatments
                                currentRegionIndex={idx}
                                currentRegionName={
                                  r.name || `Region ${idx + 1}`
                                }
                                onChange={(treatmentId) => {
                                  if (!readOnly) {
                                    handleRegionChange(
                                      idx,
                                      "treatment_id",
                                      treatmentId,
                                    );
                                  }
                                }}
                                onApplyToAll={(treatmentId) => {
                                  if (!readOnly) {
                                    const updatedRegions = regions.map(
                                      (region) => ({
                                        ...region,
                                        treatment_id: treatmentId,
                                      }),
                                    );
                                    onChange(updatedRegions);
                                  }
                                }}
                              />
                            )}
                          </Box>

                          <Tooltip title="Background key" placement="top">
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Checkbox
                                checked={r.is_background_key || false}
                                onChange={
                                  readOnly
                                    ? undefined
                                    : (e) =>
                                        handleRegionChange(
                                          idx,
                                          "is_background_key",
                                          e.target.checked,
                                        )
                                }
                                disabled={readOnly}
                                size="small"
                                sx={{ padding: 0.5 }}
                              />
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "0.75rem",
                                  whiteSpace: "nowrap",
                                  fontWeight: r.is_background_key ? 600 : 400,
                                  color: r.is_background_key
                                    ? "primary.main"
                                    : "text.secondary",
                                }}
                              >
                                BG Key
                              </Typography>
                            </Box>
                          </Tooltip>
                        </Box>

                        {/* Delete button overlapping the corner */}
                        {!readOnly && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemove(idx)}
                            sx={{
                              position: "absolute",
                              top: -8,
                              right: -8,
                              backgroundColor: "background.paper",
                              border: `2px solid ${r.display_colour_hex}`,
                              padding: 0.25,
                              "&:hover": {
                                backgroundColor: r.display_colour_hex,
                                "& .MuiSvgIcon-root": {
                                  color: "white",
                                },
                              },
                            }}
                          >
                            <CloseIcon
                              sx={{
                                fontSize: "0.9rem",
                                color: r.display_colour_hex,
                              }}
                            />
                          </IconButton>
                        )}
                      </Box>
                    );
                  })}

                  {isTouched && error && (
                    <Typography color="error" variant="caption">
                      {error.message || String(error)}
                    </Typography>
                  )}

                  {!readOnly && (
                    <Box display="flex" gap={1} marginTop={1}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleYAMLImport}
                        startIcon={<UploadFileIcon />}
                        sx={{ fontSize: "0.7rem", padding: "4px 8px" }}
                      >
                        Import
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleYAMLExport}
                        startIcon={<DownloadIcon />}
                        sx={{ fontSize: "0.7rem", padding: "4px 8px" }}
                      >
                        Export
                      </Button>
                      <input
                        type="file"
                        accept=".yaml,.yml"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        style={{ display: "none" }}
                      />
                    </Box>
                  )}
                </Box>
              )}

              {/* Results Content */}
              {viewMode === "results" &&
                showTimePointVisualization &&
                results && (
                  <Box>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      <Chip
                        label={`${results.summary.total_time_points} time points`}
                        color="primary"
                        size="small"
                      />
                      <Chip
                        label={`${results.trays.reduce((count: number, tray: any) => count + (tray.wells?.length || 0), 0)} wells with data`}
                        color="info"
                        size="small"
                      />
                    </Box>

                    {results.summary.first_timestamp && (
                      <Box mt={2}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Start:</strong>{" "}
                          {formatDateTime(results.summary.first_timestamp)}
                        </Typography>
                        {results.summary.last_timestamp && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>End:</strong>{" "}
                            {formatDateTime(results.summary.last_timestamp)}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* Color Bar Legend */}
                    {minSeconds > 0 && (
                      <Box mt={3}>
                        <Typography variant="subtitle2" gutterBottom>
                          Freezing Time Color Scale
                        </Typography>

                        {/* Color Bar */}
                        <Box
                          sx={{
                            height: 20,
                            width: "100%",
                            background: `linear-gradient(to right, ${Array.from(
                              { length: 10 },
                              (_, i) =>
                                colorScale(
                                  minSeconds +
                                    (maxSeconds - minSeconds) * (i / (10 - 1)),
                                ),
                            ).join(", ")})`,
                            border: "1px solid #ccc",
                            borderRadius: 1,
                            mb: 1,
                          }}
                        />

                        {/* Scale Labels */}
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: "medium" }}
                          >
                            {formatSeconds(minSeconds)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Freezing Time
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: "medium" }}
                          >
                            {formatSeconds(maxSeconds)}
                          </Typography>
                        </Box>

                        {/* No data indicator */}
                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                          <Box
                            width={15}
                            height={15}
                            bgcolor="#d32f2f"
                            border="1px solid #ccc"
                            borderRadius={0.5}
                          />
                          <Typography variant="caption">
                            No freeze detected / No data
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    {/* Selected Well Details */}
                    {selectedWell && (
                      <WellDetailsDisplay
                        well={selectedWell}
                        formatSeconds={formatSeconds}
                        onViewImage={props.onWellClick}
                      />
                    )}
                  </Box>
                )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default RegionInput;
