import React, { useState, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  CloudUpload as CloudUploadIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { useDropzone } from "react-dropzone";
import { useNotify, useDataProvider, useRecordContext } from "react-admin";

interface ExcelProcessingResult {
  success: boolean;
  records_processed: number;
  temperature_readings_created: number;
  csv_preview?: string;
  errors: string[];
  processing_time_ms: number;
  status?: string;
  error?: string | null;
}

interface OptimizedExcelUploaderProps {
  experimentId?: string;
  onUploadComplete?: (result: ExcelProcessingResult) => void;
  onSuccess?: () => void;
  compact?: boolean;
}

const OptimizedExcelUploader: React.FC<OptimizedExcelUploaderProps> = ({
  experimentId: propExperimentId,
  onUploadComplete,
  onSuccess,
  compact = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingResult, setProcessingResult] =
    useState<ExcelProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const record = useRecordContext();

  // Use prop experimentId if provided, otherwise get from record context
  const experimentId = propExperimentId || record?.id;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate experiment ID
      if (!experimentId) {
        setError("No experiment ID available");
        return;
      }

      // Validate file type
      if (
        !file.name.toLowerCase().endsWith(".xlsx") &&
        !file.name.toLowerCase().endsWith(".xls")
      ) {
        setError("Please upload an Excel file (.xlsx or .xls)");
        return;
      }

      setIsUploading(true);
      setError(null);
      setProcessingResult(null);
      setUploadProgress(0);

      try {
        // Upload and process the Excel file using dataProvider
        const result = await dataProvider.processExcel("experiments", {
          experimentId,
          file,
        });
        
        // Transform API response to match our interface
        const apiResponse = result.data;
        const transformedResult: ExcelProcessingResult = {
          success: apiResponse.status === "completed" && (apiResponse.error == null) && (!apiResponse.errors || apiResponse.errors.length === 0),
          records_processed: apiResponse.temperature_readings_created || 0,
          temperature_readings_created: apiResponse.temperature_readings_created || 0,
          csv_preview: apiResponse.csv_preview,
          errors: apiResponse.errors || [],
          processing_time_ms: apiResponse.processing_time_ms || 0,
          status: apiResponse.status,
          error: apiResponse.error,
        };
        
        setProcessingResult(transformedResult);

        if (transformedResult.success) {
          notify(
            `Successfully processed ${transformedResult.temperature_readings_created} temperature readings`,
            { type: "success" },
          );
          onUploadComplete?.(transformedResult);
          
          // Trigger success callback for page refresh
          setTimeout(() => {
            onSuccess?.();
          }, 1500); // Small delay to allow user to see success message
        } else {
          notify(
            "Upload completed with errors. Please check the details below.",
            { type: "warning" },
          );
        }
      } catch (err) {
        let errorMessage = "Upload failed";

        if (err instanceof Error) {
          errorMessage = err.message;

          // Handle specific error cases for better user experience
          if (err.message.includes("409") || err.message.includes("Conflict")) {
            errorMessage =
              "Duplicate file - this Excel file already exists in the experiment";
          } else if (err.message.includes("413")) {
            errorMessage = "File too large - please use a smaller file";
          } else if (err.message.includes("415")) {
            errorMessage =
              "Invalid file type - please upload an Excel file (.xlsx or .xls)";
          } else if (err.message.includes("500")) {
            errorMessage = "Server error - please try again later";
          }
        }

        setError(errorMessage);
        notify(`Upload failed: ${errorMessage}`, { type: "error" });
      } finally {
        setIsUploading(false);
        setUploadProgress(100);
      }
    },
    [experimentId, notify, onUploadComplete, onSuccess, dataProvider],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false,
    disabled: isUploading,
  });

  const formatProcessingTime = (timeMs: number) => {
    if (timeMs < 1000) return `${timeMs}ms`;
    if (timeMs < 60000) return `${(timeMs / 1000).toFixed(1)}s`;
    return `${(timeMs / 60000).toFixed(1)}min`;
  };

  const renderUploadArea = () => (
    <Box
      {...getRootProps()}
      sx={{
        border: "2px dashed",
        borderColor: isDragActive ? "primary.main" : "grey.300",
        borderRadius: 2,
        p: compact ? 1.5 : 4,
        textAlign: "center",
        cursor: isUploading ? "not-allowed" : "pointer",
        bgcolor: isDragActive ? "action.hover" : "transparent",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "action.hover",
        },
      }}
    >
      <input {...getInputProps()} />
      {!compact && (
        <CloudUploadIcon
          sx={{
            fontSize: 48,
            color: isUploading ? "grey.400" : "primary.main",
            mb: 2,
          }}
        />
      )}
      <Typography variant={compact ? "body2" : "h6"} gutterBottom>
        {isDragActive
          ? "Drop the Excel file here"
          : compact
            ? "Drop merged.xlsx file or click to browse"
            : "Upload Merged Excel File"}
      </Typography>
      {!compact && (
        <>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Drag and drop your merged.xlsx file here, or click to browse
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supported formats: .xlsx, .xls
          </Typography>
        </>
      )}
      {isUploading && (
        <Box sx={{ mt: compact ? 1 : 2 }}>
          <CircularProgress size={compact ? 16 : 24} />
          {!compact && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Processing Excel file...
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );

  const renderProgressBar = () =>
    isUploading && (
      <Box sx={{ mt: 2 }}>
        <LinearProgress variant="indeterminate" sx={{ mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Server-side processing in progress...
        </Typography>
      </Box>
    );

  const renderResults = () => {
    if (!processingResult) return null;

    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            {processingResult.success ? (
              <CheckCircleIcon color="success" />
            ) : (
              <ErrorIcon color="error" />
            )}
            <Typography variant="h6">
              Processing{" "}
              {processingResult.success ? "Completed" : "Completed with Errors"}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip
              label={`${processingResult.temperature_readings_created} temperature readings`}
              color="primary"
              size="small"
            />
            <Chip
              label={`${formatProcessingTime(processingResult.processing_time_ms)}`}
              color="info"
              size="small"
            />
          </Stack>

          {processingResult.errors.length > 0 && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography color="error">
                  {processingResult.errors.length} Error(s) Encountered
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={1}>
                  {processingResult.errors.map((error, index) => (
                    <Alert key={index} severity="error">
                      {error}
                    </Alert>
                  ))}
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          {processingResult.csv_preview && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <DescriptionIcon />
                  <Typography>CSV Preview (First 10 Records)</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Box
                  component="pre"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    whiteSpace: "pre-wrap",
                    bgcolor: "grey.50",
                    p: 2,
                    borderRadius: 1,
                    overflow: "auto",
                    maxHeight: "300px",
                  }}
                >
                  {processingResult.csv_preview}
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderError = () => {
    if (!error) return null;

    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        <Typography variant="body2">
          <strong>Upload Error:</strong> {error}
        </Typography>
      </Alert>
    );
  };

  return (
    <Box>
      {!compact && (
        <>
          <Typography variant="h6" gutterBottom>
            Optimized Excel Upload
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload your merged.xlsx file for server-side processing. This new
            method is much faster and can handle larger files more efficiently.
          </Typography>
        </>
      )}

      {renderUploadArea()}
      {renderProgressBar()}
      {renderResults()}
      {renderError()}

    </Box>
  );
};

export default OptimizedExcelUploader;
