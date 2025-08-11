import {
    Show,
    TextField,
    TopToolbar,
    EditButton,
    DeleteButton,
    usePermissions,
    DateField,
    NumberField,
    BooleanField,
    ReferenceField,
    Datagrid,
    FunctionField,
    TabbedShowLayout,
    ReferenceManyField,
    Pagination,
    useRecordContext,
    useAuthProvider,
    Labeled,
    useGetOne,
    useRefresh,
    useDataProvider,
    useNotify,
} from "react-admin";
import React, { useEffect, useState } from "react";
import { Button, Box, Card, CardContent, Typography, Tabs, Tab, ToggleButton, ToggleButtonGroup, Divider, Dialog, DialogContent, DialogTitle, IconButton, Chip, CircularProgress, Tooltip } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ScienceIcon from '@mui/icons-material/Science';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { UppyUploader } from "../uploader/Uppy";
import { PhaseChangeUploader } from "../uploader/PhaseChangeUploader";
import RegionInput from '../components/RegionInput';


const ShowComponentActions = () => {
    const { permissions } = usePermissions();
    return (
        <TopToolbar>
            {permissions === 'admin' && (
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
    const authProvider = useAuthProvider();
    const [isDownloading, setIsDownloading] = React.useState(false);

    if (!record || !authProvider) return null;
    if (!record.assets || record.assets.length === 0) return null;

    const handleDownload = async () => {
        if (!record) return;

        setIsDownloading(true);

        try {
            const token = await authProvider.getToken(); // Assuming getToken is available and retrieves the auth token

            const response = await fetch(`/api/experiments/${record.id}/download`, {
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
                a.download = `experiment_${record.id}_assets.zip`;
                a.click();
                window.URL.revokeObjectURL(url);
            } else {
                console.error("Failed to download assets");
            }
        } catch (error) {
            console.error("Error during download:", error);
        } finally {
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
            {isDownloading ? "Downloading..." : "Download all"}
        </Button>
    );
};

// Standalone Regions/Results Toggle Component
const RegionsResultsToggle = ({ viewMode, onViewModeChange, hasResults }: { viewMode: string; onViewModeChange: (mode: string) => void; hasResults: boolean }) => {
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
                        color: 'text.disabled',
                        '&.Mui-disabled': {
                            color: 'text.disabled'
                        }
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

const RegionsDisplay = ({ viewMode }: { viewMode: string }) => {
    const record = useRecordContext();
    const { data: trayConfiguration, isLoading } = useGetOne(
        'tray_configurations',
        { id: record?.tray_configuration_id },
        { enabled: !!record?.tray_configuration_id }
    );

    if (isLoading) {
        return <div>Loading tray configuration...</div>;
    }

    if (!record?.regions || !Array.isArray(record.regions)) {
        return <div>No regions defined for this experiment.</div>;
    }

    // Check if we have time point data to show visualization
    const hasTimePointData = record?.results_summary && record.results_summary.total_time_points > 0;

    return (
        <RegionInput
            source="regions"
            label=""
            trayConfiguration={trayConfiguration}
            readOnly={true}
            value={record.regions}
            showTimePointVisualization={hasTimePointData}
            viewMode={viewMode as "regions" | "results"}
            hideInternalToggle={true}
        />
    );
};


// Compact uploader wrapper component
const CompactUploader: React.FC<{
    title: string;
    description: string;
    component: React.ReactNode;
    icon: React.ReactNode;
    color: 'primary' | 'secondary';
}> = ({ title, description, component, icon, color }) => {
    return (
        <Card 
            sx={{ 
                minHeight: '120px',
                border: `1px solid`,
                borderColor: color === 'primary' ? 'primary.main' : 'secondary.main',
                '&:hover': {
                    boxShadow: 2
                }
            }}
        >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Box sx={{ color: color === 'primary' ? 'primary.main' : 'secondary.main' }}>
                        {icon}
                    </Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                        {title}
                    </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    {description}
                </Typography>
                <Box sx={{ '& > *': { transform: 'scale(0.85)', transformOrigin: 'top left', width: '117.6%' } }}>
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
    color: 'primary' | 'secondary';
}> = ({ title, component, icon, color }) => {
    return (
        <Box 
            sx={{ 
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1,
                border: `1px solid`,
                borderColor: color === 'primary' ? 'primary.main' : 'secondary.main',
                borderRadius: 1,
                backgroundColor: 'background.paper',
                minHeight: '40px'
            }}
        >
            <Box display="flex" alignItems="center" gap={1} sx={{ minWidth: '150px' }}>
                <Box sx={{ color: color === 'primary' ? 'primary.main' : 'secondary.main' }}>
                    {icon}
                </Box>
                <Typography variant="body2" fontWeight="500">
                    {title}
                </Typography>
            </Box>
            <Box sx={{ flex: 1, '& > *': { transform: 'scale(0.8)', transformOrigin: 'left center' } }}>
                {component}
            </Box>
        </Box>
    );
};

// Download function for individual assets
const downloadAsset = async (record: any, authProvider: any) => {
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
        console.error("Error during download:", error);
    }
};

// Image viewer modal component
const AssetImageViewer = ({ record, open, onClose }: { record: any; open: boolean; onClose: () => void }) => {
    const authProvider = useAuthProvider();
    const dataProvider = useDataProvider();
    const [imageSrc, setImageSrc] = React.useState<string>('');
    const [loading, setLoading] = React.useState(false);
    
    React.useEffect(() => {
        if (!record || !open) return;
        
        const loadImage = async () => {
            setLoading(true);
            try {
                const token = await authProvider.getToken();
                const result = await dataProvider.loadAssetImage(record.id, token);
                setImageSrc(result.data.blobUrl);
            } catch (error) {
                console.error("Error loading image:", error);
            } finally {
                setLoading(false);
            }
        };

        loadImage();
    }, [record, open, authProvider, dataProvider]);

    // Clean up the object URL when closing or changing record
    React.useEffect(() => {
        return () => {
            if (imageSrc && imageSrc.startsWith('blob:')) {
                window.URL.revokeObjectURL(imageSrc);
            }
        };
    }, [imageSrc]);
    
    if (!record || !open) return null;
    
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {record.original_filename}
                <IconButton onClick={onClose}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                {loading ? (
                    <Typography>Loading image...</Typography>
                ) : imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={record.original_filename}
                        style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
                        onError={(e) => {
                            console.error("Image failed to load:", e);
                            setImageSrc('');
                        }}
                    />
                ) : (
                    <Typography color="error">Failed to load image</Typography>
                )}
            </DialogContent>
        </Dialog>
    );
};

// Download button component for assets
const AssetDownloadButton = ({ record }: { record: any }) => {
    const authProvider = useAuthProvider();
    
    return (
        <Tooltip title="Download file">
            <IconButton
                size="small"
                onClick={() => downloadAsset(record, authProvider)}
                color="primary"
            >
                <DownloadIcon />
            </IconButton>
        </Tooltip>
    );
};

// View button component for images
const AssetViewButton = ({ record, onView }: { record: any; onView: (record: any) => void }) => {
    const isImage = record.type === 'image';
    
    if (!isImage) return null;
    
    return (
        <Tooltip title="View image">
            <IconButton
                size="small"
                onClick={() => onView(record)}
                color="primary"
            >
                <VisibilityIcon />
            </IconButton>
        </Tooltip>
    );
};

// Processing status indicator component
const ProcessingStatusIndicator = ({ record }: { record: any }) => {
    const isMergedXlsx = (record.original_filename?.toLowerCase().includes('merged') || 
                         record.original_filename?.toLowerCase() === 'merged.xlsx') && 
                        record.type === 'tabular';

    if (!isMergedXlsx) {
        return null;
    }

    const status = record.processing_status;
    
    if (status === 'processing') {
        return (
            <Tooltip title="Processing experiment data...">
                <Chip 
                    icon={<CircularProgress size={16} />} 
                    label="Processing" 
                    color="info" 
                    size="small" 
                />
            </Tooltip>
        );
    }
    
    if (status === 'completed') {
        return (
            <Tooltip title={record.processing_message || "Processing completed successfully"}>
                <Chip 
                    icon={<CheckCircleIcon />} 
                    label="Processed" 
                    color="success" 
                    size="small" 
                />
            </Tooltip>
        );
    }
    
    if (status === 'error') {
        return (
            <Tooltip title={record.processing_message || "Processing failed"}>
                <Chip 
                    icon={<ErrorIcon />} 
                    label="Error" 
                    color="error" 
                    size="small" 
                />
            </Tooltip>
        );
    }
    
    return (
        <Chip 
            label="Ready" 
            color="default" 
            size="small" 
        />
    );
};

// Reprocess button component for merged.xlsx files
const AssetReprocessButton = ({ record, onReprocess }: { record: any; onReprocess: () => void }) => {
    const [isReprocessing, setIsReprocessing] = useState(false);
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const authProvider = useAuthProvider();

    const isMergedXlsx = (record.original_filename?.toLowerCase().includes('merged') || 
                         record.original_filename?.toLowerCase() === 'merged.xlsx') && 
                        record.type === 'tabular';

    if (!isMergedXlsx || record.processing_status === 'processing') {
        return null;
    }

    const handleReprocess = async () => {
        setIsReprocessing(true);
        try {
            const token = await authProvider.getToken();
            const result = await fetch(`/api/assets/${record.id}/reprocess`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await result.json();
            
            if (data.success) {
                notify(`Reprocessing completed: ${data.message}`, { type: 'success' });
                onReprocess(); // Refresh the data
            } else {
                notify(`Reprocessing failed: ${data.message}`, { type: 'error' });
            }
        } catch (error) {
            notify('Reprocessing failed: Network error', { type: 'error' });
            console.error('Reprocess error:', error);
        } finally {
            setIsReprocessing(false);
        }
    };

    return (
        <Button
            size="small"
            startIcon={isReprocessing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleReprocess}
            disabled={isReprocessing}
        >
            {isReprocessing ? 'Reprocessing...' : 'Reprocess'}
        </Button>
    );
};

// Delete button component for assets
const AssetDeleteButton = ({ record, onDelete }: { record: any; onDelete: () => void }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const dataProvider = useDataProvider();
    const notify = useNotify();

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete "${record.original_filename}"?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await dataProvider.delete('assets', { id: record.id });
            notify('File deleted successfully', { type: 'success' });
            onDelete();
        } catch (error: any) {
            console.error('Delete error:', error);
            notify(`Failed to delete file: ${error.message || 'Unknown error'}`, { type: 'error' });
        } finally {
            setIsDeleting(false);
        }
    };

    return (
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
    );
};

// Processing status/actions for tabular files (icons only)
const ProcessingColumn = ({ record, onProcess }: { record: any; onProcess: () => void }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isClearingResults, setIsClearingResults] = useState(false);
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const authProvider = useAuthProvider();

    const isTabular = record.type === 'tabular';
    const status = record.processing_status;
    const hasProcessedData = status === 'completed';
    
    // Check if file is Excel format (.xlsx, .xls)
    const filename = record.original_filename || '';
    const fileExtension = filename.toLowerCase().split('.').pop() || '';
    const isExcel = fileExtension === 'xlsx' || fileExtension === 'xls';
    
    if (!isTabular || !isExcel) {
        return null;
    }

    const handleProcess = async () => {
        setIsProcessing(true);
        try {
            // Call the dedicated processing endpoint directly
            const token = await authProvider.getToken();
            
            const response = await fetch(`/api/experiments/${record.experiment_id}/process-asset`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    assetId: record.id
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    notify(`✅ ${result.message}`, { type: 'success' });
                    onProcess(); // Refresh to show updated status
                } else {
                    throw new Error(result.message || 'Processing failed');
                }
            } else {
                // Handle error responses - read once and try to parse as JSON
                const responseText = await response.text();
                let errorMessage = 'Processing failed';
                
                try {
                    const errorResult = JSON.parse(responseText);
                    errorMessage = errorResult.message || errorResult.error || 'Processing failed';
                } catch {
                    // If JSON parsing fails, use the plain text response
                    errorMessage = responseText || 'Processing failed';
                }
                throw new Error(errorMessage);
            }
            
        } catch (error: any) {
            console.error('Processing error:', error);
            notify(`❌ Processing failed: ${error.message || 'Unknown error'}`, { type: 'error' });
            onProcess(); // Refresh to show error status
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClearResults = async () => {
        if (!window.confirm('Are you sure you want to clear all processed experiment data? This will remove temperature readings, well transitions, and results from the database.')) {
            return;
        }

        setIsClearingResults(true);
        try {
            // Call the dedicated clear results endpoint directly
            const token = await authProvider.getToken();
            
            const response = await fetch(`/api/experiments/${record.experiment_id}/clear-results`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    assetId: record.id
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    notify(`🗑️ ${result.message}`, { type: 'success' });
                    onProcess(); // Refresh to show updated status
                } else {
                    throw new Error(result.message || 'Failed to clear data');
                }
            } else {
                // Handle error responses - read once and try to parse as JSON
                const responseText = await response.text();
                let errorMessage = 'Failed to clear data';
                
                try {
                    const errorResult = JSON.parse(responseText);
                    errorMessage = errorResult.message || errorResult.error || 'Failed to clear data';
                } catch {
                    // If JSON parsing fails, use the plain text response
                    errorMessage = responseText || 'Failed to clear data';
                }
                throw new Error(errorMessage);
            }
            
        } catch (error: any) {
            console.error('Clear results error:', error);
            notify(`❌ Failed to clear data: ${error.message || 'Unknown error'}`, { type: 'error' });
        } finally {
            setIsClearingResults(false);
        }
    };

    if (status === 'processing' || isProcessing) {
        return (
            <Tooltip title="Processing...">
                <CircularProgress size={20} color="info" />
            </Tooltip>
        );
    } else if (status === 'completed') {
        return (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Tooltip title="Reprocess data">
                    <IconButton
                        size="small"
                        onClick={handleProcess}
                        disabled={isProcessing}
                        color="success"
                    >
                        <ScienceIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Clear processed data">
                    <IconButton
                        size="small"
                        onClick={handleClearResults}
                        disabled={isClearingResults}
                        color="error"
                    >
                        {isClearingResults ? <CircularProgress size={16} /> : <CloseIcon />}
                    </IconButton>
                </Tooltip>
            </div>
        );
    } else if (status === 'error') {
        return (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <Tooltip title="Retry processing">
                    <IconButton
                        size="small"
                        onClick={handleProcess}
                        disabled={isProcessing}
                        color="error"
                    >
                        <ScienceIcon />
                    </IconButton>
                </Tooltip>
            </div>
        );
    } else {
        // No processing status - show process button
        return (
            <Tooltip title="Process experiment data">
                <IconButton
                    size="small"
                    onClick={handleProcess}
                    disabled={isProcessing}
                    color="warning"
                >
                    {isProcessing ? <CircularProgress size={20} /> : <ScienceIcon />}
                </IconButton>
            </Tooltip>
        );
    }
};

const TabbedContent = () => {
    const record = useRecordContext();
    const refresh = useRefresh();
    const [viewMode, setViewMode] = useState('regions');
    const [previousHasResults, setPreviousHasResults] = useState(false);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    
    // Get asset count for tab label
    const assetCount = record?.assets?.length || 0;
    
    // Check if results are available
    const hasResults = record?.results_summary && record.results_summary.total_time_points > 0;
    
    // Auto-switch to Results view when results become newly available
    useEffect(() => {
        if (hasResults && !previousHasResults) {
            // Results just became available, switch to results view
            setViewMode('results');
        }
        setPreviousHasResults(hasResults);
    }, [hasResults, previousHasResults]);

    const handleViewModeChange = (newViewMode: string) => {
        setViewMode(newViewMode);
    };

    const handleAssetView = (asset: any) => {
        setSelectedAsset(asset);
        setImageViewerOpen(true);
    };

    const handleCloseImageViewer = () => {
        setImageViewerOpen(false);
        setSelectedAsset(null);
    };

    return (
        <>
            <TabbedShowLayout>
                <TabbedShowLayout.Tab label="Details">
                <Box sx={{ mb: 3 }}>
                    {/* Top section with key info in 3 columns */}
                    <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={3} sx={{ mb: 3 }}>
                        <Labeled>
                            <TextField source="id" />
                        </Labeled>
                        <Labeled>
                            <TextField source="name" />
                        </Labeled>
                        <Labeled>
                            <DateField source="performed_at" showTime label="Date" />
                        </Labeled>
                    </Box>
                    
                    {/* General details section */}
                    <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2} sx={{ mb: 3 }}>
                        <Labeled>
                            <BooleanField source="is_calibration" />
                        </Labeled>
                        <Labeled>
                            <ReferenceField source="tray_configuration_id" reference="tray_configurations" link="show">
                                <TextField source="name" />
                            </ReferenceField>
                        </Labeled>
                        <Labeled>
                            <TextField source="username" />
                        </Labeled>
                    </Box>
                    
                    {/* Divider between general info and temperature settings */}
                    <Divider sx={{ mb: 3 }} />
                    
                    {/* Temperature settings section */}
                    <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2} sx={{ mb: 3 }}>
                        <Labeled>
                            <NumberField source="temperature_ramp" />
                        </Labeled>
                        <Labeled>
                            <NumberField source="temperature_start" />
                        </Labeled>
                        <Labeled>
                            <NumberField source="temperature_end" />
                        </Labeled>
                    </Box>
                </Box>
            </TabbedShowLayout.Tab>
            
            <TabbedShowLayout.Tab label="Regions & Results">
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <RegionsResultsToggle 
                        viewMode={viewMode}
                        onViewModeChange={handleViewModeChange}
                        hasResults={hasResults}
                    />
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Upload merged.xlsx files in the Assets tab for automatic processing
                        </Typography>
                    </Box>
                </Box>
                <RegionsDisplay viewMode={viewMode} />
            </TabbedShowLayout.Tab>
            
            <TabbedShowLayout.Tab label={`Assets${assetCount > 0 ? ` (${assetCount})` : ''}`}>
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <DownloadAllButton />
                    <Box sx={{ flex: 1 }}>
                        <ThinLineUploader 
                            title="Related Assets" 
                            component={<UppyUploader compact={true} />}
                            icon={<CloudUploadIcon />}
                            color="secondary"
                        />
                    </Box>
                </Box>
                <ReferenceManyField
                    reference="assets"
                    target="experiment_id"
                    label="Tags"
                    pagination={<Pagination />}
                >
                    <Datagrid rowClick={false} bulkActionButtons={false}>
                        <TextField source="original_filename" />
                        <TextField source="type" />
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
                            render={record => (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <AssetDownloadButton record={record} />
                                    <AssetDeleteButton record={record} onDelete={refresh} />
                                    <AssetViewButton record={record} onView={handleAssetView} />
                                </div>
                            )}
                        />
                        <FunctionField
                            label="Process"
                            render={record => (
                                <ProcessingColumn record={record} onProcess={refresh} />
                            )}
                        />
                    </Datagrid>
                </ReferenceManyField>
                </TabbedShowLayout.Tab>
            </TabbedShowLayout>
            <AssetImageViewer
                record={selectedAsset}
                open={imageViewerOpen}
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
