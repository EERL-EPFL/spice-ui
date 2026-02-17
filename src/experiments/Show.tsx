import {
  Show,
  TextField,
  TopToolbar,
  EditButton,
  DeleteButton,
  BulkDeleteButton,
  usePermissions,
  DateField,
  NumberField,
  BooleanField,
  ReferenceField,
  Datagrid,
  FunctionField,
  TabbedShowLayout,
  Pagination,
  useRecordContext,
  useAuthProvider,
  useGetOne,
  useRefresh,
  useDataProvider,
  useNotify,
  useListContext,
  useGetList,
  ListContextProvider,
} from "react-admin";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Switch,
  FormControlLabel,
  TextField as MuiTextField,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import GetAppIcon from "@mui/icons-material/GetApp";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DescriptionIcon from "@mui/icons-material/Description";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ScienceIcon from "@mui/icons-material/Science";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import { UppyUploader } from "../uploader/Uppy";
import RegionInput from "../components/RegionInput";

// Helper functions for asset display
const formatRole = (role: string | null | undefined): string => {
  if (!role) return "unspecified";
  return role
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getTypeColor = (type: string | null | undefined) => {
  switch (type) {
    case "image":
      return "info";
    case "tabular":
      return "success";
    case "netcdf":
      return "warning";
    default:
      return "default";
  }
};

const getRoleColor = (role: string | null | undefined) => {
  switch (role) {
    case "camera_image":
      return "secondary";
    case "analysis_data":
      return "primary";
    case "temperature_data":
      return "info";
    case "configuration":
      return "warning";
    default:
      return "default";
  }
};

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
const DownloadAllButton = () => {
  const record = useRecordContext();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const [isDownloading, setIsDownloading] = useState(false);

  const { total: assetCount = 0 } = useGetList("assets", {
    filter: { experiment_id: record?.id },
    pagination: { page: 1, perPage: 1 },
    sort: { field: "uploaded_at", order: "DESC" },
  });

  if (!record || assetCount === 0) return null;

  const handleDownload = async () => {
    if (!record) return;

    setIsDownloading(true);
    try {
      const result = await dataProvider.downloadExperimentAssets(record.id);
      window.location.href = result.data.download_url;
      setTimeout(() => setIsDownloading(false), 1000);
    } catch (error: any) {
      console.error("Error during download:", error);
      notify(`Download failed: ${error.message || "Unknown error"}`, { type: "error" });
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? "Preparing..." : "Download all"}
    </Button>
  );
};

// Standalone Regions/Results Toggle Component
const RegionsResultsToggle = ({
  viewMode,
  onViewModeChange,
  hasResults,
}: {
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  hasResults: boolean;
}) => {
  if (!hasResults) {
    return (
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={(_, newMode) => newMode && onViewModeChange(newMode)}
        size="small"
      >
        <ToggleButton value="regions" aria-label="regions view">
          <VisibilityIcon sx={{ mr: 0.5 }} />
          Regions
        </ToggleButton>
        <ToggleButton
          value="results"
          aria-label="results view"
          disabled={true}
          sx={{
            color: "text.disabled",
            "&.Mui-disabled": {
              color: "text.disabled",
            },
          }}
        >
          <ScienceIcon sx={{ mr: 0.5 }} />
          Results
        </ToggleButton>
      </ToggleButtonGroup>
    );
  }

  return (
    <ToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={(_, newMode) => newMode && onViewModeChange(newMode)}
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
  );
};

// Image viewer component for well freeze images
const WellImageViewer = ({
  open,
  onClose,
  imageAssetId,
  wellCoordinate,
}: {
  open: boolean;
  onClose: () => void;
  imageAssetId: string | null;
  wellCoordinate: string;
}) => {
  const authProvider = useAuthProvider();
  const dataProvider = useDataProvider();
  const [imageSrc, setImageSrc] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageAssetId || !open) {
      setImageSrc("");
      setError(null);
      return;
    }

    const loadImage = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await authProvider.getToken();
        const result = await dataProvider.loadAssetImage(imageAssetId, token);
        setImageSrc(result.data.blobUrl);
      } catch (error) {
        console.error("Error loading well image:", error);
        setError("Failed to load image");
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [imageAssetId, open, authProvider, dataProvider]);

  if (!open || !imageAssetId) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        Well {wellCoordinate} at Freeze Time
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "400px",
            }}
          >
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading image...
            </Typography>
          </Box>
        )}
        {error && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "400px",
            }}
          >
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          </Box>
        )}
        {imageSrc && !loading && !error && (
          <>
            <img
              src={imageSrc}
              alt={`Well ${wellCoordinate} at freeze time`}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "80vh",
                objectFit: "contain",
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              Well {wellCoordinate} freeze image
            </Typography>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

const RegionsDisplay = ({ viewMode }: { viewMode: string }) => {
  const record = useRecordContext();
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedWellImage, setSelectedWellImage] = useState<{
    imageAssetId: string | null;
    wellCoordinate: string;
  } | null>(null);

  const { data: trayConfiguration, isLoading } = useGetOne(
    "tray_configurations",
    { id: record?.tray_configuration_id },
    { enabled: !!record?.tray_configuration_id },
  );

  if (isLoading) {
    return <div>Loading tray configuration...</div>;
  }

  if (!record?.regions || !Array.isArray(record.regions)) {
    return <div>No regions defined for this experiment.</div>;
  }

  // Check if we have time point data to show visualization
  const hasTimePointData =
    record?.results && record.results.summary?.total_time_points > 0;

  // Handler for when user clicks on well to view image
  const handleWellImageClick = (wellSummary: any) => {
    if (wellSummary.image_asset_id) {
      setSelectedWellImage({
        imageAssetId: wellSummary.image_asset_id,
        wellCoordinate: wellSummary.coordinate,
      });
      setImageViewerOpen(true);
    }
  };

  const handleCloseImageViewer = () => {
    setImageViewerOpen(false);
    setSelectedWellImage(null);
  };

  return (
    <>
      <RegionInput
        source="regions"
        label=""
        trayConfiguration={trayConfiguration}
        readOnly={true}
        value={record.regions}
        showTimePointVisualization={hasTimePointData}
        viewMode={viewMode as "regions" | "results"}
        hideInternalToggle={true}
        onWellClick={handleWellImageClick}
      />
      <WellImageViewer
        open={imageViewerOpen}
        onClose={handleCloseImageViewer}
        imageAssetId={selectedWellImage?.imageAssetId || null}
        wellCoordinate={selectedWellImage?.wellCoordinate || ""}
      />
    </>
  );
};

// Compact uploader wrapper component
const CompactUploader: React.FC<{
  title: string;
  description: string;
  component: React.ReactNode;
  icon: React.ReactNode;
  color: "primary" | "secondary";
}> = ({ title, description, component, icon, color }) => {
  return (
    <Card
      sx={{
        minHeight: "120px",
        border: `1px solid`,
        borderColor: color === "primary" ? "primary.main" : "secondary.main",
        "&:hover": {
          boxShadow: 2,
        },
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Box
            sx={{
              color: color === "primary" ? "primary.main" : "secondary.main",
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle2" fontWeight="bold">
            {title}
          </Typography>
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          mb={1.5}
        >
          {description}
        </Typography>
        <Box
          sx={{
            "& > *": {
              transform: "scale(0.85)",
              transformOrigin: "top left",
              width: "117.6%",
            },
          }}
        >
          {component}
        </Box>
      </CardContent>
    </Card>
  );
};

// Very thin one-line uploader for in-tab use
const ThinLineUploader: React.FC<{
  title: string;
  component: React.ReactNode;
  icon: React.ReactNode;
  color: "primary" | "secondary";
  allowOverwrite?: boolean;
  onOverwriteChange?: (enabled: boolean) => void;
}> = ({ title, component, icon, color, allowOverwrite, onOverwriteChange }) => {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          p: 1,
          border: `1px solid`,
          borderColor: color === "primary" ? "primary.main" : "secondary.main",
          borderRadius: 1,
          backgroundColor: "background.paper",
          minHeight: "40px",
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{ minWidth: "150px" }}
        >
          <Box
            sx={{
              color: color === "primary" ? "primary.main" : "secondary.main",
            }}
          >
            {icon}
          </Box>
          <Typography variant="body2" fontWeight="500">
            {title}
          </Typography>
        </Box>
        <Box
          sx={{
            flex: 1,
            "& > *": {
              transform: "scale(0.8)",
              transformOrigin: "left center",
            },
          }}
        >
          {component}
        </Box>
      </Box>

      {/* Overwrite switch underneath the uploader boundary box */}
      {onOverwriteChange && (
        <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={allowOverwrite || false}
                onChange={(e) => onOverwriteChange(e.target.checked)}
                size="medium"
                color="primary"
              />
            }
            label="Allow overwrite existing files"
            sx={{
              "& .MuiFormControlLabel-label": {
                fontSize: "0.875rem",
                color: "text.secondary",
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
};

// Create consolidated state interfaces
interface UIState {
  viewMode: string;
  previousHasResults: boolean;
  allowOverwrite: boolean;
}

interface ModalState {
  imageViewerOpen: boolean;
  selectedAsset: any;
  selectedWellImage: {
    imageAssetId: string | null;
    wellCoordinate: string;
  } | null;
}

interface FilterState {
  assetTypeFilter: string;
  assetRoleFilter: string;
  filenameFilter: string;
}

// Generic API operation hook
const useApiOperation = () => {
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const executeOperation = useCallback(async (
    operation: string,
    params: any,
    successMessage?: string,
    errorMessage?: string
  ) => {
    try {
      const result = await (dataProvider as any)[operation](...params);
      if (successMessage) {
        notify(successMessage, { type: "success" });
      }
      return result;
    } catch (error: any) {
      const message = errorMessage || `Operation failed: ${error.message || "Unknown error"}`;
      notify(message, { type: "error" });
      throw error;
    }
  }, [dataProvider, notify]);

  return executeOperation;
};

// Consolidated Asset Actions Component
const AssetActions = ({ record, onRefresh, onView }: {
  record: any;
  onRefresh: () => void;
  onView?: (record: any) => void;
}) => {
  const executeOperation = useApiOperation();
  const authProvider = useAuthProvider();
  const [isDeleting, setIsDeleting] = useState(false);
  const isImage = record.type === "image";

  const handleDownload = async () => {
    try {
      const token = await authProvider.getToken();
      const response = await fetch(`/api/assets/${record.id}/download`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = record.original_filename;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        console.error("Failed to download asset");
      }
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${record.original_filename}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await executeOperation('delete', ['assets', { id: record.id }], "File deleted successfully");
      onRefresh();
    } catch (error: any) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <Tooltip title="Download file">
        <IconButton size="small" onClick={handleDownload} color="primary">
          <DownloadIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete file">
        <IconButton
          size="small"
          onClick={handleDelete}
          disabled={isDeleting}
          color="error"
        >
          {isDeleting ? <CircularProgress size={16} /> : <DeleteIcon />}
        </IconButton>
      </Tooltip>
      {isImage && onView && (
        <Tooltip title="View image">
          <IconButton size="small" onClick={() => onView(record)} color="primary">
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
};

// Consolidated Image Viewer Component
const AssetImageViewer = ({
  record,
  open,
  onClose,
}: {
  record: any;
  open: boolean;
  onClose: () => void;
}) => {
  const authProvider = useAuthProvider();
  const dataProvider = useDataProvider();
  const [imageSrc, setImageSrc] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!record || !open) return;

    const loadImage = async () => {
      setLoading(true);
      try {
        const token = await authProvider.getToken();
        const result = await (dataProvider as any).loadAssetImage(record.id, token);
        setImageSrc(result.data.blobUrl);
      } catch (error) {
        console.error("Error loading image:", error);
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [record, open, authProvider, dataProvider]);

  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith("blob:")) {
        window.URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  if (!record || !open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {record.original_filename}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 200,
        }}
      >
        {loading ? (
          <Typography>Loading image...</Typography>
        ) : imageSrc ? (
          <img
            src={imageSrc}
            alt={record.original_filename}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "80vh",
              objectFit: "contain",
            }}
            onError={(e) => {
              console.error("Image failed to load:", e);
              setImageSrc("");
            }}
          />
        ) : (
          <Typography color="error">Failed to load image</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};




// React-admin bulk action components for assets
const AssetBulkDeleteButton = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const refresh = useRefresh();

  return (
    <BulkDeleteButton
      resource="assets"
      mutationMode="pessimistic"
      confirmTitle="Delete Assets"
      confirmContent="Are you sure you want to delete the selected assets? This action cannot be undone."
    />
  );
};

const AssetBulkDownloadButton = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { selectedIds } = useListContext();
  const executeOperation = useApiOperation();

  if (selectedIds.length === 0) return null;

  const handleBulkDownload = async () => {
    setIsDownloading(true);
    try {
      const result = await executeOperation(
        'bulkDownloadAssets',
        [selectedIds],
        `Downloading ${selectedIds.length} selected files...`
      );
      window.location.href = result.data.download_url;
      setTimeout(() => setIsDownloading(false), 500);
    } catch (error) {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={isDownloading ? <CircularProgress size={16} /> : <GetAppIcon />}
      onClick={handleBulkDownload}
      disabled={isDownloading}
      size="small"
      sx={{ mr: 1 }}
    >
      {isDownloading ? "Preparing..." : "Download Selected"}
    </Button>
  );
};

// Combined bulk actions component
const AssetBulkActions = () => (
  <Box sx={{ display: "flex", gap: 1 }}>
    <AssetBulkDownloadButton />
    <AssetBulkDeleteButton />
  </Box>
);

// Consolidated Processing Actions Component
const ProcessingActions = ({
  record,
  onProcess,
}: {
  record: any;
  onProcess: () => void;
}) => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const executeOperation = useApiOperation();

  const isTabular = record.type === "tabular";
  const filename = record.original_filename || "";
  const fileExtension = filename.toLowerCase().split(".").pop() || "";
  const isExcel = fileExtension === "xlsx" || fileExtension === "xls";
  const status = record.processing_status;

  if (!isTabular || !isExcel) return null;

  const setLoading = (operation: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [operation]: loading }));
  };

  const handleProcess = async () => {
    setLoading('process', true);
    try {
      await executeOperation(
        'processAsset',
        [record.experiment_id, record.id],
        "✅ Processing completed successfully"
      );
      onProcess();
    } catch (error) {
      console.error("Processing error:", error);
    } finally {
      setLoading('process', false);
    }
  };

  const handleClearResults = async () => {
    if (!window.confirm(
      "Are you sure you want to clear all processed experiment data? This will remove temperature readings, well transitions, and results from the database."
    )) return;

    setLoading('clear', true);
    try {
      await executeOperation(
        'clearExperimentResults',
        [record.experiment_id, record.id],
        "🗑️ Experiment data cleared successfully"
      );
      onProcess();
    } catch (error) {
      console.error("Clear results error:", error);
    } finally {
      setLoading('clear', false);
    }
  };

  if (status === "processing" || loadingStates.process) {
    return (
      <Tooltip title="Processing...">
        <CircularProgress size={20} color="info" />
      </Tooltip>
    );
  }

  if (status === "completed") {
    return (
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <Tooltip title="Reprocess data">
          <IconButton size="small" onClick={handleProcess} color="success">
            <ScienceIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear processed data">
          <IconButton
            size="small"
            onClick={handleClearResults}
            disabled={loadingStates.clear}
            color="error"
          >
            {loadingStates.clear ? <CircularProgress size={16} /> : <CloseIcon />}
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  return (
    <Tooltip title={status === "error" ? "Retry processing" : "Process experiment data"}>
      <IconButton
        size="small"
        onClick={handleProcess}
        color={status === "error" ? "error" : "warning"}
      >
        <ScienceIcon />
      </IconButton>
    </Tooltip>
  );
};

// Condensed experiment details component
const ExperimentDetailsHeader = () => {
  const record = useRecordContext();

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
        {/* Compact 2-row layout with essential info only */}
        <Box
          display="grid"
          gridTemplateColumns="2fr 1fr 1fr 1fr"
          gap={2}
          sx={{ mb: 1 }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {record?.name}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Date
            </Typography>
            <Typography variant="body2">
              <DateField source="performed_at" showTime />
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              User
            </Typography>
            <Typography variant="body2">{record?.username}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Calibration
            </Typography>
            <Typography variant="body2">
              <BooleanField source="is_calibration" />
            </Typography>
          </Box>
        </Box>

        <Box display="grid" gridTemplateColumns="2fr 1fr 1fr 1fr" gap={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Tray Configuration
            </Typography>
            <Typography variant="body2">
              <ReferenceField
                source="tray_configuration_id"
                reference="tray_configurations"
                link="show"
              >
                <TextField source="name" />
              </ReferenceField>
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Start Temp
            </Typography>
            <Typography variant="body2">
              <NumberField source="temperature_start" />
              °C
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              End Temp
            </Typography>
            <Typography variant="body2">
              <NumberField source="temperature_end" />
              °C
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Ramp Rate
            </Typography>
            <Typography variant="body2">
              <NumberField source="temperature_ramp" />
              °C/min
            </Typography>
          </Box>
        </Box>

        {record?.remarks && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Remarks
            </Typography>
            <Typography variant="body2">{record.remarks}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Tabular Data Section Component using direct API call
const TabularDataSection = ({ onRefresh }: { onRefresh: () => void }) => {
  const record = useRecordContext();
  const refresh = useRefresh();
  const {
    data: tabularAssets,
    isLoading,
    refetch,
  } = useGetList("assets", {
    filter: { experiment_id: record?.id, type: "tabular" },
    pagination: { page: 1, perPage: 50 },
    sort: { field: "uploaded_at", order: "DESC" },
  });

  const handleRefresh = () => {
    refetch();
    refresh();
    onRefresh();
  };

  if (isLoading) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
        >
          <DescriptionIcon color="primary" />
          Data Processing Files
        </Typography>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h6"
        sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
      >
        <DescriptionIcon color="primary" />
        Data Processing Files
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tabular data for experiment data processing - always visible for easy
        access. Select one to process results from.
      </Typography>
      <Box>
        {(tabularAssets || []).map((asset: any) => (
          <Card key={asset.id} variant="outlined" sx={{ mb: 1, p: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {asset.original_filename}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 0.5,
                  }}
                >
                  <Chip
                    label={formatRole(asset.role)}
                    size="small"
                    color={getRoleColor(asset.role)}
                  />
                  {asset.size_bytes && (
                    <Typography variant="caption" color="text.secondary">
                      {(asset.size_bytes / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Uploaded: {new Date(asset.uploaded_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              {/* Actions section */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ProcessingActions record={asset} onProcess={handleRefresh} />
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <AssetActions record={asset} onRefresh={handleRefresh} />
              </Box>
            </Box>
          </Card>
        ))}
        {(!tabularAssets || tabularAssets.length === 0) && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: "italic", textAlign: "center", py: 2 }}
          >
            No data files uploaded yet. Upload Excel files (.xlsx) to process
            experiment data.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

// Custom Assets List Component using direct API call
const AssetsList = ({
  filter,
  onAssetView,
  onRefresh,
}: {
  filter: Record<string, any>;
  onAssetView: (asset: any) => void;
  onRefresh: React.MutableRefObject<() => void>;
}) => {
  const record = useRecordContext();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    data: assets,
    total,
    isLoading,
    refetch,
  } = useGetList("assets", {
    filter: { experiment_id: record?.id, ...filter },
    pagination: { page, perPage },
    sort: { field: "uploaded_at", order: "DESC" },
  });

  // Refetch when onRefresh is called
  useEffect(() => {
    const refreshAssets = () => {
      refetch();
      setSelectedIds([]); // Clear selection on refresh
    };
    // Store refetch function so parent can call it
    onRefresh.current = refreshAssets;
  }, [refetch, onRefresh]);

  const handleSelect = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const handleToggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  };

  const handleUnselectItems = () => {
    setSelectedIds([]);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ListContextProvider
      value={{
        data: assets || [],
        total: total || 0,
        isLoading,
        selectedIds,
        onSelect: handleSelect,
        onToggleItem: handleToggleItem,
        onUnselectItems: handleUnselectItems,
        resource: "assets",
        displayedFilters: {},
        filterValues: filter,
        setFilters: () => {},
        showFilter: () => {},
        hideFilter: () => {},
        sort: { field: "uploaded_at", order: "DESC" },
        setSort: () => {},
        page,
        perPage,
        setPage,
        setPerPage,
        hasCreate: false,
        hasEdit: false,
        hasShow: false,
        hasList: true,
        refetch,
      }}
    >
      <Datagrid
        rowClick={false}
        bulkActionButtons={<AssetBulkActions />}
        isRowSelectable={() => true}
        size="small"
        sx={{
          "& .MuiTableCell-root": {
            padding: "4px 8px",
            fontSize: "0.75rem",
          },
          "& .MuiTableRow-root": {
            minHeight: "32px",
          },
          "& .MuiChip-root": {
            height: "20px",
            fontSize: "0.65rem",
            "& .MuiChip-label": {
              paddingLeft: "6px",
              paddingRight: "6px",
            },
          },
        }}
      >
        <TextField source="original_filename" />
        <FunctionField
          label="Type"
          render={(record) => (
            <Chip
              label={record.type || "unknown"}
              size="small"
              color={getTypeColor(record.type)}
              variant="outlined"
            />
          )}
        />
        <FunctionField
          label="Role"
          render={(record) => (
            <Chip
              label={formatRole(record.role)}
              size="small"
              color={getRoleColor(record.role)}
            />
          )}
        />
        <FunctionField
          source="size_bytes"
          render={(record) =>
            record.size_bytes
              ? `${(record.size_bytes / 1024 / 1024).toFixed(2)} MB`
              : ""
          }
        />
        <DateField source="uploaded_at" showTime label="Uploaded At" />
        <FunctionField
          label="Actions"
          render={(record) => (
            <AssetActions record={record} onRefresh={() => refetch()} onView={onAssetView} />
          )}
        />
      </Datagrid>
      <Pagination rowsPerPageOptions={[10, 25, 50, 100, 250]} />
    </ListContextProvider>
  );
};

const TabbedContent = () => {
  const record = useRecordContext();
  const refresh = useRefresh();
  const assetsRefreshRef = useRef(() => {});
  
  // Consolidated state objects
  const [uiState, setUiState] = useState<UIState>({
    viewMode: "regions",
    previousHasResults: false,
    allowOverwrite: false,
  });
  
  const [modalState, setModalState] = useState<ModalState>({
    imageViewerOpen: false,
    selectedAsset: null,
    selectedWellImage: null,
  });
  
  const [filterState, setFilterState] = useState<FilterState>({
    assetTypeFilter: "all",
    assetRoleFilter: "all",
    filenameFilter: "",
  });

  // Use direct API call to get asset count for tab label
  const { total: assetCount = 0 } = useGetList("assets", {
    filter: { experiment_id: record?.id },
    pagination: { page: 1, perPage: 1 },
    sort: { field: "uploaded_at", order: "DESC" },
  });

  // Check if results are available
  const hasResults =
    record?.results && record.results.summary?.total_time_points > 0;

  // Auto-switch to Results view when results become newly available
  useEffect(() => {
    if (hasResults && !uiState.previousHasResults) {
      setUiState(prev => ({ ...prev, viewMode: "results" }));
    }
    setUiState(prev => ({ ...prev, previousHasResults: hasResults }));
  }, [hasResults, uiState.previousHasResults]);

  const handleViewModeChange = useCallback((newViewMode: string) => {
    setUiState(prev => ({ ...prev, viewMode: newViewMode }));
  }, []);

  const handleAssetView = useCallback((asset: any) => {
    setModalState({
      imageViewerOpen: true,
      selectedAsset: asset,
      selectedWellImage: null,
    });
  }, []);

  const handleCloseImageViewer = useCallback(() => {
    setModalState({
      imageViewerOpen: false,
      selectedAsset: null,
      selectedWellImage: null,
    });
  }, []);

  const updateFilter = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilterState({
      assetTypeFilter: "all",
      assetRoleFilter: "all",
      filenameFilter: "",
    });
  }, []);

  return (
    <>
      {/* Always visible experiment details at the top */}
      <ExperimentDetailsHeader />

      <TabbedShowLayout>
        <TabbedShowLayout.Tab label="Regions & Results">
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
            <RegionsResultsToggle
              viewMode={uiState.viewMode}
              onViewModeChange={handleViewModeChange}
              hasResults={hasResults}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Upload merged.xlsx files in the Assets tab for automatic
                processing
              </Typography>
            </Box>
          </Box>
          <RegionsDisplay viewMode={uiState.viewMode} />
        </TabbedShowLayout.Tab>

        <TabbedShowLayout.Tab
          label={`Assets${assetCount > 0 ? ` (${assetCount})` : ""}`}
        >
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
            <DownloadAllButton />
            <Box sx={{ flex: 1 }}>
              <ThinLineUploader
                title="Related Assets"
                component={
                  <UppyUploader
                    compact={true}
                    allowOverwrite={uiState.allowOverwrite}
                  />
                }
                icon={<CloudUploadIcon />}
                color="secondary"
                allowOverwrite={uiState.allowOverwrite}
                onOverwriteChange={(enabled) => setUiState(prev => ({ ...prev, allowOverwrite: enabled }))}
              />
            </Box>
          </Box>

          {/* Tabular Data Section */}
          <TabularDataSection onRefresh={() => assetsRefreshRef.current()} />

          {/* Asset Filters */}
          <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ whiteSpace: "nowrap" }}
            >
              Filter:
            </Typography>
            <MuiTextField
              size="small"
              label="Filename"
              value={filterState.filenameFilter}
              onChange={(e) => updateFilter({ filenameFilter: e.target.value })}
              sx={{ minWidth: 160 }}
              placeholder="Search by filename..."
            />
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filterState.assetTypeFilter}
                label="Type"
                onChange={(e: SelectChangeEvent) => updateFilter({ assetTypeFilter: e.target.value })}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="image">Images</MenuItem>
                <MenuItem value="tabular">Tabular</MenuItem>
                <MenuItem value="netcdf">NetCDF</MenuItem>
                <MenuItem value="unknown">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={filterState.assetRoleFilter}
                label="Role"
                onChange={(e: SelectChangeEvent) => updateFilter({ assetRoleFilter: e.target.value })}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="camera_image">Camera</MenuItem>
                <MenuItem value="analysis_data">Analysis</MenuItem>
                <MenuItem value="temperature_data">Temperature</MenuItem>
                <MenuItem value="configuration">Config</MenuItem>
              </Select>
            </FormControl>
            {(filterState.assetTypeFilter !== "all" ||
              filterState.assetRoleFilter !== "all" ||
              filterState.filenameFilter.trim()) && (
              <Button
                variant="text"
                size="small"
                onClick={clearFilters}
                sx={{ whiteSpace: "nowrap" }}
              >
                Clear
              </Button>
            )}
          </Box>
          <AssetsList
            filter={{
              ...(filterState.assetTypeFilter !== "all" && { type: filterState.assetTypeFilter }),
              ...(filterState.assetRoleFilter !== "all" && { role: filterState.assetRoleFilter }),
              ...(filterState.filenameFilter.trim() && {
                original_filename: filterState.filenameFilter.trim(),
              }),
            }}
            onAssetView={handleAssetView}
            onRefresh={assetsRefreshRef}
          />
        </TabbedShowLayout.Tab>
      </TabbedShowLayout>
      <AssetImageViewer
        record={modalState.selectedAsset}
        open={modalState.imageViewerOpen}
        onClose={handleCloseImageViewer}
      />
    </>
  );
};

export const ShowComponent = () => {
  return (
    <Show actions={<ShowComponentActions />}>
      <TabbedContent />
    </Show>
  );
};

export default ShowComponent;
