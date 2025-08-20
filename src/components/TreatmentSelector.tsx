import React, { useState, useCallback, useEffect } from "react";
import { useDataProvider } from "react-admin";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Chip,
  Alert,
  ButtonGroup,
} from "@mui/material";
import {
  ContentCopy as CopyIcon,
  SelectAll as SelectAllIcon,
} from "@mui/icons-material";

// Import treatment name mapping
import { treatmentName } from "../treatments";
import { formatEnzymeVolume } from "../utils/formatters";

interface Treatment {
  id: string;
  name: string;
  sample?: {
    id: string;
    name: string;
    type?: string;
    campaign?: {
      location?: {
        name: string;
      };
    };
  };
}

interface ExistingRegionTreatment {
  regionName: string;
  regionIndex: number;
  treatment: {
    id: string;
    name: string;
    sample?: {
      id: string;
      name: string;
      type?: string;
      campaign?: {
        location?: {
          name: string;
        };
      };
    };
  };
  dilution_factor?: number;
}

export interface TreatmentSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  onApplyToAll?: (value: string) => void;
  label?: string;
  disabled?: boolean;
  compact?: boolean;
  existingRegionTreatments?: ExistingRegionTreatment[];
  currentRegionIndex?: number;
  currentRegionName?: string;
  filteredTreatments?: Treatment[]; // Add option to provide pre-filtered treatments
}

export const TreatmentSelector: React.FC<TreatmentSelectorProps> = ({
  value,
  onChange,
  onApplyToAll,
  label,
  disabled = false,
  compact = false,
  existingRegionTreatments = [],
  currentRegionIndex,
  currentRegionName = "this region",
  filteredTreatments,
}) => {
  const dataProvider = useDataProvider();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"project" | "procedural_blank">("project");
  const [locationId, setLocationId] = useState<string | null>(null);
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [treatmentId, setTreatmentId] = useState<string | null>(null);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(
    null,
  );

  // State for options
  const [locationOptions, setLocationOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [sampleOptions, setSampleOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [treatmentOptions, setTreatmentOptions] = useState<Array<Treatment>>(
    [],
  );
  const [proceduralBlankSampleOptions, setProceduralBlankSampleOptions] =
    useState<Array<{ id: string; name: string }>>([]);

  // Get unique existing treatments (excluding current region) - fallback for old logic
  const uniqueExistingTreatments = existingRegionTreatments.filter(
    (regionTreatment, index, self) =>
      regionTreatment.regionIndex !== currentRegionIndex &&
      index ===
        self.findIndex(
          (rt) => rt.treatment.id === regionTreatment.treatment.id,
        ),
  );

  // State for enhanced sample groups with all treatments
  const [treatmentsBySample, setTreatmentsBySample] = useState<Array<{
    sample: ExistingRegionTreatment['treatment']['sample'];
    treatments: Array<{
      id: string;
      name: string;
      sample?: any;
      enzyme_volume_litres?: number | null;
      notes?: string | null;
      usedInRegions: string[]; // Track which regions use this treatment
    }>;
  }>>([]);

  // Load all treatments for each unique sample from existing regions
  const loadAllTreatmentsForSamples = useCallback(async () => {
    const filteredTreatments = existingRegionTreatments
      .filter(regionTreatment => regionTreatment.regionIndex !== currentRegionIndex);

    // Get unique samples from existing regions
    const uniqueSamples = new Map<string, {
      sample: ExistingRegionTreatment['treatment']['sample'];
      usedTreatments: Map<string, string[]>; // treatmentId -> region names
    }>();

    filteredTreatments.forEach(regionTreatment => {
      const sampleId = regionTreatment.treatment.sample?.id;
      const sampleName = regionTreatment.treatment.sample?.name;
      
      if (!sampleId || !sampleName) {
        return;
      }

      if (!uniqueSamples.has(sampleId)) {
        uniqueSamples.set(sampleId, {
          sample: regionTreatment.treatment.sample,
          usedTreatments: new Map()
        });
      }

      const sampleGroup = uniqueSamples.get(sampleId)!;
      const treatmentId = regionTreatment.treatment.id;
      
      if (!sampleGroup.usedTreatments.has(treatmentId)) {
        sampleGroup.usedTreatments.set(treatmentId, []);
      }
      sampleGroup.usedTreatments.get(treatmentId)!.push(regionTreatment.regionName);
    });

    // Fetch all treatments for each unique sample
    const enhancedGroups = await Promise.all(
      Array.from(uniqueSamples.entries()).map(async ([sampleId, sampleGroup]) => {
        try {
          // Fetch all treatments for this sample
          const { data: treatments } = await dataProvider.getList("treatments", {
            pagination: { page: 1, perPage: 100 },
            sort: { field: "name", order: "ASC" },
            filter: { sample_id: sampleId },
          });

          // Fetch the full sample with location data
          const { data: fullSample } = await dataProvider.getOne("samples", { id: sampleId });
          let sampleWithLocation = fullSample;
          
          // If sample has location_id, fetch the location data
          if (fullSample.location_id) {
            try {
              const { data: location } = await dataProvider.getOne("locations", { id: fullSample.location_id });
              sampleWithLocation = {
                ...fullSample,
                campaign: {
                  location: location
                }
              };
            } catch (error) {
            }
          }

          // Enrich treatments with usage information and full sample+location data
          const enrichedTreatments = treatments.map((treatment: any) => ({
            id: treatment.id,
            name: treatment.name,
            sample: sampleWithLocation, // Now includes location data
            enzyme_volume_litres: treatment.enzyme_volume_litres,
            notes: treatment.notes,
            usedInRegions: sampleGroup.usedTreatments.get(treatment.id) || []
          }));

          return {
            sample: sampleGroup.sample,
            treatments: enrichedTreatments
          };
        } catch (error) {
          console.error(`Error loading treatments for sample ${sampleId}:`, error);
          return null;
        }
      })
    );

    setTreatmentsBySample(enhancedGroups.filter(group => group !== null));
  }, [existingRegionTreatments, currentRegionIndex, dataProvider]);

  // Load treatments when existing regions change
  React.useEffect(() => {
    if (existingRegionTreatments.length > 0) {
      loadAllTreatmentsForSamples();
    } else {
      setTreatmentsBySample([]);
    }
  }, [loadAllTreatmentsForSamples]);

  // Memoize treatment display data to prevent excessive API calls
  const [treatmentDisplayCache, setTreatmentDisplayCache] = useState<
    Map<
      string,
      {
        location: string;
        sample: string;
        treatment: string;
        sampleType: string;
      }
    >
  >(new Map());

  // Get treatment name from ID - no caching to avoid stale data issues
  const getTreatmentName = useCallback(async () => {
    if (!value)
      return { location: "", sample: "", treatment: "", sampleType: "" };

    console.log(`getTreatmentName: Processing ${value}, treatmentsBySample.length=${treatmentsBySample.length}, existingRegionTreatments.length=${existingRegionTreatments.length}`);

    // Skip cache entirely to avoid corruption issues

    try {
      // Priority 1: Check enhanced treatments by sample structure (has location info)
      const enhancedTreatment = treatmentsBySample
        .flatMap(sg => sg.treatments)
        .find(t => t.id === value);
      if (enhancedTreatment && enhancedTreatment.sample) {
        console.log(`getTreatmentName: Found in treatmentsBySample with location: ${enhancedTreatment.sample.campaign?.location?.name || 'none'}`);
        const result = {
          location: enhancedTreatment.sample.campaign?.location?.name || "",
          sample: enhancedTreatment.sample.name,
          treatment: treatmentName[enhancedTreatment.name] || enhancedTreatment.name,
          sampleType: enhancedTreatment.sample.type || "",
        };
        return result;
      }

      // Priority 2: Check existing treatments (may have location info)
      const existingTreatment = existingRegionTreatments.find(
        (rt) => rt.treatment.id === value,
      );
      if (existingTreatment && existingTreatment.treatment.sample) {
        console.log(`getTreatmentName: Found in existingRegionTreatments with location: ${existingTreatment.treatment.sample.campaign?.location?.name || 'none'}`);
        const result = {
          location:
            existingTreatment.treatment.sample.campaign?.location?.name || "",
          sample: existingTreatment.treatment.sample.name,
          treatment: treatmentName[existingTreatment.treatment.name] || existingTreatment.treatment.name,
          sampleType: existingTreatment.treatment.sample.type || "",
        };
        return result;
      }

      // Priority 3: Check loaded treatment options (fallback)
      const loadedTreatment = treatmentOptions.find((t) => t.id === value);
      if (loadedTreatment && loadedTreatment.sample) {
        console.log(`getTreatmentName: Found in treatmentOptions with location: ${loadedTreatment.sample.campaign?.location?.name || 'none'}`);
        const result = {
          location: loadedTreatment.sample.campaign?.location?.name || "",
          sample: loadedTreatment.sample.name,
          treatment: treatmentName[loadedTreatment.name] || loadedTreatment.name,
          sampleType: loadedTreatment.sample.type || "",
        };
        return result;
      }

      // Priority 4: Fallback to API fetch
      console.log(`getTreatmentName: Falling back to API fetch for ${value}`);
      const { data: treatment } = await dataProvider.getOne("treatments", {
        id: value,
      });
      if (!treatment) {
        console.log(`getTreatmentName: Treatment ${value} not found`);
        return { location: "", sample: "", treatment: "", sampleType: "" };
      }

      // Get the sample for this treatment
      const { data: sample } = await dataProvider.getOne("samples", {
        id: treatment.sample_id,
      });
      if (!sample) {
        console.log(`getTreatmentName: Sample not found for treatment ${value}`);
        return { location: "", sample: "", treatment: treatment.name, sampleType: "" };
      }

      // Get the location for this sample (if not procedural blank)
      let locationName = "";
      if (sample.location_id) {
        try {
          const { data: location } = await dataProvider.getOne("locations", {
            id: sample.location_id,
          });
          locationName = location?.name || "";
        } catch (error) {
          console.warn("Could not load location:", error);
        }
      }

      console.log(`getTreatmentName: API fetch complete with location: ${locationName || 'none'}`);
      const result = {
        location: locationName,
        sample: sample.name,
        treatment: treatmentName[treatment.name] || treatment.name,
        sampleType: sample.type || "",
      };
      return result;
    } catch (error) {
      console.error("Error fetching treatment hierarchy:", error);
      return { location: "", sample: "", treatment: "", sampleType: "" };
    }
  }, [value, dataProvider, treatmentsBySample, existingRegionTreatments, treatmentOptions]); // Added all data sources

  // Display the selected treatment name
  const [displayValue, setDisplayValue] = useState<{
    location: string;
    sample: string;
    treatment: string;
    sampleType: string;
  }>({ location: "", sample: "", treatment: "", sampleType: "" });

  React.useEffect(() => {
    if (value) {
      getTreatmentName().then(setDisplayValue);
    } else {
      setDisplayValue({
        location: "",
        sample: "",
        treatment: "",
        sampleType: "",
      });
    }
  }, [value, getTreatmentName]);

  // Load data functions (same as original)
  const loadLocations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await dataProvider.getList("locations", {
        pagination: { page: 1, perPage: 500 },
        sort: { field: "name", order: "ASC" },
        filter: {},
      });
      setLocationOptions(data);
    } catch (error) {
      console.error("Error loading locations:", error);
      setLocationOptions([]);
    } finally {
      setLoading(false);
    }
  }, [dataProvider]);

  const loadProceduralBlankSamples = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await dataProvider.getList("samples", {
        pagination: { page: 1, perPage: 500 },
        sort: { field: "name", order: "ASC" },
        filter: { type: "procedural_blank" },
      });
      setProceduralBlankSampleOptions(data);
    } catch (error) {
      console.error("Error loading procedural blank samples:", error);
      setProceduralBlankSampleOptions([]);
    } finally {
      setLoading(false);
    }
  }, [dataProvider]);

  const loadSamples = useCallback(
    async (locationId: string) => {
      if (!locationId) {
        setSampleOptions([]);
        return;
      }

      setLoading(true);
      try {
        const { data } = await dataProvider.getList("samples", {
          pagination: { page: 1, perPage: 500 },
          sort: { field: "name", order: "ASC" },
          filter: { location_id: locationId },
        });
        setSampleOptions(data);
      } catch (error) {
        console.error("Error loading samples:", error);
        setSampleOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [dataProvider],
  );

  const loadTreatments = useCallback(
    async (sampleId: string) => {
      if (!sampleId) {
        setTreatmentOptions([]);
        return;
      }

      setLoading(true);
      try {
        const { data } = await dataProvider.getList("treatments", {
          pagination: { page: 1, perPage: 500 },
          sort: { field: "name", order: "ASC" },
          filter: { sample_id: sampleId },
        });

        // Fetch sample data for each treatment to get full hierarchy
        const enrichedTreatments = await Promise.all(
          data.map(async (treatment: any) => {
            try {
              // Skip treatments without valid sample_id
              if (!treatment.sample_id) {
                return treatment;
              }
              
              const { data: sampleData } = await dataProvider.getOne(
                "samples",
                { id: treatment.sample_id },
              );
              return {
                ...treatment,
                sample: sampleData,
              };
            } catch (error) {
              console.error("Error loading sample for treatment:", error);
              return treatment;
            }
          }),
        );

        setTreatmentOptions(enrichedTreatments);
      } catch (error) {
        console.error("Error loading treatments:", error);
        setTreatmentOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [dataProvider],
  );


  // Use filtered treatments if provided
  useEffect(() => {
    if (filteredTreatments && filteredTreatments.length > 0) {
      setTreatmentOptions(filteredTreatments);
      setMode("project"); // Set to project mode when using filtered treatments
    }
  }, [filteredTreatments]);

  // Event handlers
  const handleOpen = () => {
    setOpen(true);
    if (mode === "project") {
      loadLocations();
    } else {
      loadProceduralBlankSamples();
    }
  };

  const handleModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: string | null,
  ) => {
    if (newMode !== null) {
      setMode(newMode as "project" | "procedural_blank");
      // Reset selections when mode changes
      setLocationId(null);
      setSampleId(null);
      setTreatmentId(null);
      setSelectedTreatment(null);

      if (newMode === "project") {
        loadLocations();
      } else {
        loadProceduralBlankSamples();
      }
    }
  };

  const handleLocationChange = (event: SelectChangeEvent) => {
    const newLocationId = event.target.value;
    setLocationId(newLocationId);
    setSampleId(null);
    setTreatmentId(null);
    setSelectedTreatment(null);
    loadSamples(newLocationId);
    
    // Auto-focus sample dropdown after location is selected
    setTimeout(() => {
      const sampleSelect = document.querySelector('[aria-label="Sample"]');
      if (sampleSelect) {
        (sampleSelect as HTMLElement).focus();
      }
    }, 100);
  };

  const handleSampleChange = (event: SelectChangeEvent) => {
    const newSampleId = event.target.value;
    setSampleId(newSampleId);
    setTreatmentId(null);
    setSelectedTreatment(null);
    loadTreatments(newSampleId);
    
    // Auto-focus treatment dropdown after sample is selected
    setTimeout(() => {
      const treatmentSelect = document.querySelector('[aria-label="Treatment"]');
      if (treatmentSelect) {
        (treatmentSelect as HTMLElement).focus();
      }
    }, 100);
  };

  const handleTreatmentChange = (event: SelectChangeEvent) => {
    const newTreatmentId = event.target.value;
    setTreatmentId(newTreatmentId);
    const treatment = treatmentOptions.find((t) => t.id === newTreatmentId);
    setSelectedTreatment(treatment || null);
  };

  const handleExistingTreatmentSelect = (treatmentData: any) => {
    setTreatmentId(treatmentData.id);
    setSelectedTreatment({
      id: treatmentData.id,
      name: treatmentData.name,
      sample: treatmentData.sample,
    });
    // Clear manual selections since we're using an existing one
    setLocationId(null);
    setSampleId(null);
  };

  const handleSelect = () => {
    if (treatmentId) {
      onChange(treatmentId);
      setOpen(false);
      // Reset state
      setLocationId(null);
      setSampleId(null);
      setTreatmentId(null);
      setSelectedTreatment(null);
    }
  };

  const handleApplyToAll = () => {
    if (treatmentId && onApplyToAll) {
      onApplyToAll(treatmentId);
      setOpen(false);
      // Reset state
      setLocationId(null);
      setSampleId(null);
      setTreatmentId(null);
      setSelectedTreatment(null);
    }
  };

  const getExistingTreatmentSummary = (
    regionTreatment: ExistingRegionTreatment,
  ) => {
    const parts = [];

    if (regionTreatment.treatment.sample?.campaign?.location?.name) {
      parts.push(regionTreatment.treatment.sample.campaign.location.name);
    }
    if (regionTreatment.treatment.sample?.name) {
      parts.push(regionTreatment.treatment.sample.name);
    }
    parts.push(treatmentName[regionTreatment.treatment.name] || regionTreatment.treatment.name);

    const treatmentPath = parts.join(" → ");
    const dilutionText = regionTreatment.dilution_factor
      ? ` (${regionTreatment.dilution_factor})`
      : "";
    return `${treatmentPath}${dilutionText}`;
  };

  if (compact) {
    return (
      <Box>
        <Box
          onClick={disabled ? undefined : handleOpen}
          sx={{
            cursor: disabled ? "default" : "pointer",
            padding: "4px 8px",
            borderRadius: 1,
            backgroundColor: disabled
              ? "action.disabledBackground"
              : "transparent",
            "&:hover": disabled
              ? {}
              : {
                  backgroundColor: "action.hover",
                },
            minHeight: "32px",
            display: "flex",
            alignItems: "center",
            border: "1px solid",
            borderColor: "divider",
            position: "relative",
          }}
        >
          {/* Location label on border edge */}
          {displayValue.location && (
            <Box
              sx={{
                position: "absolute",
                top: -8,
                left: 6,
                backgroundColor: "background.paper",
                paddingX: 0.5,
                fontSize: "0.65rem",
                fontWeight: "medium",
                color: "text.secondary",
                lineHeight: 1,
              }}
            >
              {displayValue.location}
            </Box>
          )}
          {displayValue.treatment ? (
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.75rem",
                lineHeight: 1.2,
                textAlign: "left",
                width: "100%",
              }}
            >
              <span style={{ fontWeight: "bold" }}>{displayValue.sample}</span>:{" "}
              {displayValue.treatment}
            </Typography>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontStyle: "italic",
              }}
            >
              {disabled ? "No treatment" : "Select treatment"}
            </Typography>
          )}
        </Box>

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 2 }}>Select Treatment for {currentRegionName}</DialogTitle>
          <DialogContent sx={{ py: 1 }}>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Existing Treatments Section - Grouped by Sample or Fallback to Simple List */}
              {(treatmentsBySample.length > 0 || uniqueExistingTreatments.length > 0) && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    sx={{ color: "primary.main", fontWeight: 'medium' }}
                  >
                    <CopyIcon sx={{ mr: 0.5, fontSize: '1rem', verticalAlign: "middle" }} />
                    Available Treatments by Sample
                  </Typography>
                  <Alert severity="info" sx={{ mb: 1, py: 0.5, fontSize: '0.875rem' }}>
                    Click any treatment to apply it to {currentRegionName}
                  </Alert>
                  <Paper variant="outlined" sx={{ maxHeight: 200, overflow: "auto" }}>
                    <List dense>
                      {treatmentsBySample.length > 0 ? (
                        // Grouped by Sample Display
                        treatmentsBySample.map((sampleGroup, sampleIndex) => (
                          <React.Fragment key={sampleGroup.sample?.id || sampleIndex}>
                            {/* Sample Header */}
                            <ListItem>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle2" color="text.secondary" fontWeight="bold">
                                    {sampleGroup.sample?.campaign?.location?.name && (
                                      <>{sampleGroup.sample.campaign.location.name} → </>
                                    )}
                                    {sampleGroup.sample?.name}
                                    {sampleGroup.sample?.type && (
                                      <Chip 
                                        label={sampleGroup.sample.type} 
                                        size="small" 
                                        variant="outlined" 
                                        sx={{ ml: 1, fontSize: '0.7rem' }}
                                      />
                                    )}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            
                            {/* Treatment Buttons for this Sample */}
                            <ListItem sx={{ pt: 0, pb: 1, pl: 3 }}>
                              <ButtonGroup variant="outlined" size="small">
                                {sampleGroup.treatments.map((treatment) => (
                                  <Button
                                    key={treatment.id}
                                    onClick={() => handleExistingTreatmentSelect(treatment)}
                                    variant={treatmentId === treatment.id ? "contained" : "outlined"}
                                    size="small"
                                    sx={{ 
                                      textTransform: "none",
                                      minWidth: "140px",
                                      maxWidth: "140px",
                                      px: 1,
                                      py: 1.5,
                                      height: "auto"
                                    }}
                                  >
                                    <Box display="flex" flexDirection="column" alignItems="center" sx={{ width: "100%" }}>
                                      <Typography variant="caption" fontWeight="medium" sx={{ textAlign: "center" }}>
                                        {treatmentName[treatment.name] || treatment.name}
                                      </Typography>
                                      {/* Show enzyme volume */}
                                      {treatment.enzyme_volume_litres && (
                                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', textAlign: "center" }}>
                                          {formatEnzymeVolume(treatment.enzyme_volume_litres)}L enzyme
                                        </Typography>
                                      )}
                                      {/* Show notes */}
                                      {treatment.notes && (
                                        <Typography 
                                          variant="caption" 
                                          color="text.secondary" 
                                          sx={{ 
                                            fontSize: '0.6rem',
                                            textAlign: "center",
                                            maxWidth: '130px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            mt: 0.2
                                          }}
                                          title={treatment.notes} // Show full notes on hover
                                        >
                                          {treatment.notes}
                                        </Typography>
                                      )}
                                      {/* Show placeholder if no details */}
                                      {!treatment.enzyme_volume_litres && !treatment.notes && (
                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem', fontStyle: 'italic' }}>
                                          No details
                                        </Typography>
                                      )}
                                    </Box>
                                  </Button>
                                ))}
                              </ButtonGroup>
                            </ListItem>
                            
                            {sampleIndex < treatmentsBySample.length - 1 && <Divider />}
                          </React.Fragment>
                        ))
                      ) : (
                        // Fallback Simple List Display
                        uniqueExistingTreatments.map((regionTreatment, index) => (
                          <React.Fragment key={regionTreatment.treatment.id}>
                            <ListItemButton
                              onClick={() => handleExistingTreatmentSelect({
                                id: regionTreatment.treatment.id,
                                name: regionTreatment.treatment.name,
                                sample: regionTreatment.treatment.sample
                              })}
                              selected={treatmentId === regionTreatment.treatment.id}
                            >
                              <ListItemText
                                primary={
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="body2" fontWeight="medium">
                                      {treatmentName[regionTreatment.treatment.name] || regionTreatment.treatment.name}
                                    </Typography>
                                    <Chip
                                      label={`From: ${regionTreatment.regionName}`}
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                    />
                                  </Box>
                                }
                                secondary={getExistingTreatmentSummary(regionTreatment)}
                              />
                            </ListItemButton>
                            {index < uniqueExistingTreatments.length - 1 && <Divider />}
                          </React.Fragment>
                        ))
                      )}
                    </List>
                  </Paper>
                </Box>
              )}

              {/* Divider between sections */}
              {(treatmentsBySample.length > 0 || uniqueExistingTreatments.length > 0) && (
                <Divider sx={{ my: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    OR SELECT NEW TREATMENT
                  </Typography>
                </Divider>
              )}

              {/* Mode Toggle - Hide when using filtered treatments */}
              {!filteredTreatments && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'medium' }}>
                    Select New Treatment
                  </Typography>
                  <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="sample type"
                    fullWidth
                    size="small"
                  >
                    <ToggleButton value="project" aria-label="project samples">
                      Project Samples
                    </ToggleButton>
                    <ToggleButton
                      value="procedural_blank"
                      aria-label="procedural blank samples"
                    >
                      Procedural Blank
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              )}

              {/* Filtered treatments mode header */}
              {filteredTreatments && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'medium' }}>
                    Select Treatment
                  </Typography>
                </Box>
              )}

              {mode === "project" ? (
                <>
                  {/* Project mode - Location -> Sample -> Treatment */}
                  {/* Skip location and sample selection when using filtered treatments */}
                  {!filteredTreatments && (
                    <>
                      {/* Always show Location + Sample row */}
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
                            Location
                          </Typography>
                          <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel>Location</InputLabel>
                            <Select
                              value={locationId || ""}
                              onChange={handleLocationChange}
                              label="Location"
                              disabled={loading}
                              aria-label="Location"
                            >
                              <MenuItem value="">
                                <em>Select location...</em>
                              </MenuItem>
                              {locationOptions.map((location) => (
                                <MenuItem key={location.id} value={location.id}>
                                  {location.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>

                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="body2" 
                            gutterBottom 
                            sx={{ 
                              fontWeight: 'medium',
                              color: !locationId ? 'text.disabled' : 'text.primary'
                            }}
                          >
                            Sample
                          </Typography>
                          <FormControl fullWidth size="small" variant="outlined">
                            <InputLabel>Sample</InputLabel>
                            <Select
                              value={sampleId || ""}
                              onChange={handleSampleChange}
                              label="Sample"
                              disabled={loading || !locationId}
                              aria-label="Sample"
                            >
                              <MenuItem value="">
                                <em>{!locationId ? "Select location first..." : "Select sample..."}</em>
                              </MenuItem>
                              {sampleOptions.map((sample) => (
                                <MenuItem key={sample.id} value={sample.id}>
                                  {sample.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>
                    </>
                  )}

                  {/* Always show Treatment section - works for both filtered and normal mode */}
                  <Box sx={{ mb: 2 }}>
                    <Typography 
                      variant="body2" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 'medium',
                        color: (!sampleId && !filteredTreatments) ? 'text.disabled' : 'text.primary'
                      }}
                    >
                      Treatment
                    </Typography>
                    
                    {/* Show message when no treatments available */}
                    {!filteredTreatments && !sampleId ? (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          backgroundColor: 'action.hover',
                          border: '1px dashed',
                          borderColor: 'divider'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Select location and sample to see available treatments
                        </Typography>
                      </Paper>
                    ) : treatmentOptions.length === 0 && (sampleId || filteredTreatments) ? (
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 2,
                          textAlign: 'center',
                          backgroundColor: 'warning.50',
                          border: '1px solid',
                          borderColor: 'warning.200'
                        }}
                      >
                        <Typography variant="body2" color="warning.dark">
                          No treatments available for this sample
                        </Typography>
                      </Paper>
                    ) : (
                      /* Treatment cards */
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {treatmentOptions.map((treatment) => (
                          <Paper
                            key={treatment.id}
                            variant={treatmentId === treatment.id ? "elevation" : "outlined"}
                            sx={{
                              p: 1.5,
                              minWidth: 120,
                              cursor: 'pointer',
                              border: treatmentId === treatment.id ? '2px solid' : '1px solid',
                              borderColor: treatmentId === treatment.id ? 'primary.main' : 'divider',
                              backgroundColor: treatmentId === treatment.id ? 'primary.50' : 'background.paper',
                              '&:hover': {
                                borderColor: 'primary.main',
                                backgroundColor: 'primary.50',
                              },
                              transition: 'all 0.2s ease',
                            }}
                            onClick={() => {
                              setTreatmentId(treatment.id);
                              setSelectedTreatment(treatment);
                            }}
                          >
                            <Typography variant="body2" fontWeight="bold" sx={{ mb: 0.5 }}>
                              {treatmentName[treatment.name] || treatment.name}
                            </Typography>
                            {treatment.enzyme_volume_litres && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {formatEnzymeVolume(treatment.enzyme_volume_litres)}L enzyme
                              </Typography>
                            )}
                            {treatment.notes && (
                              <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                display="block"
                                sx={{ 
                                  mt: 0.5,
                                  fontStyle: 'italic',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: 100
                                }}
                                title={treatment.notes}
                              >
                                {treatment.notes}
                              </Typography>
                            )}
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </Box>
                </>
              ) : (
                <>
                  {/* Procedural Blank mode - Sample -> Treatment */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      1. Select procedural blank sample
                    </Typography>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Procedural blank sample</InputLabel>
                      <Select
                        value={sampleId || ""}
                        onChange={handleSampleChange}
                        label="Procedural blank sample"
                        disabled={loading}
                      >
                        <MenuItem value="">
                          <em>Select a procedural blank sample...</em>
                        </MenuItem>
                        {proceduralBlankSampleOptions.map((sample) => (
                          <MenuItem key={sample.id} value={sample.id}>
                            {sample.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {sampleId && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        2. Select Treatment
                      </Typography>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Treatment</InputLabel>
                        <Select
                          value={treatmentId || ""}
                          onChange={handleTreatmentChange}
                          label="Treatment"
                          disabled={loading || !sampleId}
                        >
                          <MenuItem value="">
                            <em>Select a treatment...</em>
                          </MenuItem>
                          {treatmentOptions.map((treatment) => (
                            <MenuItem key={treatment.id} value={treatment.id}>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {treatmentName[treatment.name] || treatment.name}
                                </Typography>
                                {(treatment.enzyme_volume_litres || treatment.notes) && (
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    {treatment.enzyme_volume_litres && `${formatEnzymeVolume(treatment.enzyme_volume_litres)}L enzyme`}
                                    {treatment.enzyme_volume_litres && treatment.notes && ' • '}
                                    {treatment.notes && treatment.notes.length > 50 ? `${treatment.notes.substring(0, 50)}...` : treatment.notes}
                                  </Typography>
                                )}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                </>
              )}

              {loading && (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {/* Action Buttons */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mt={1}
                pt={1}
                borderTop="1px solid"
                borderColor="divider"
              >
                <Button onClick={() => setOpen(false)} color="inherit" size="small">
                  Cancel
                </Button>

                <Box display="flex" gap={1}>
                  {onApplyToAll && (
                    <Button
                      onClick={handleApplyToAll}
                      disabled={!treatmentId}
                      startIcon={<SelectAllIcon />}
                      variant="contained"
                      color="warning"
                      size="small"
                    >
                      Apply to All
                    </Button>
                  )}
                  <Button 
                    onClick={handleSelect} 
                    disabled={!treatmentId}
                    variant="contained"
                    color="primary"
                    size="small"
                  >
                    Select
                  </Button>
                </Box>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }

  // Non-compact version (standard display)
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mt: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {label && (
        <Typography variant="subtitle2" gutterBottom>
          {label}
        </Typography>
      )}

      <Paper
        elevation={1}
        sx={{
          p: 2,
          cursor: disabled ? "default" : "pointer",
          "&:hover": disabled
            ? {}
            : {
                elevation: 2,
              },
        }}
        onClick={disabled ? undefined : handleOpen}
      >
        <Typography variant="subtitle2" gutterBottom>
          {label || "Treatment Selection"}
        </Typography>
        {displayValue.treatment ? (
          <Box>
            {displayValue.sampleType === "procedural_blank" ? (
              <>
                <Typography variant="body2" color="primary.main">
                  Type: Procedural Blank
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sample: {displayValue.sample}
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  Treatment: {displayValue.treatment}
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Location: {displayValue.location}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sample: {displayValue.sample}
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  Treatment: {displayValue.treatment}
                </Typography>
              </>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            {disabled ? "No treatment" : "Select treatment"}
          </Typography>
        )}
      </Paper>

      {/* Same dialog as compact version */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {/* Dialog content same as above */}
      </Dialog>
    </Paper>
  );
};

export default TreatmentSelector;
