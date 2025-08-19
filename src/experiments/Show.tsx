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
import React, { useEffect, useState, useRef } from "react";
import { Button, Box, Card, CardContent, Typography, Tabs, Tab, ToggleButton, ToggleButtonGroup, Divider, Dialog, DialogContent, DialogTitle, IconButton, Chip, CircularProgress, Tooltip, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Switch, FormControlLabel, TextField as MuiTextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import GetAppIcon from '@mui/icons-material/GetApp';
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

// Helper functions for asset display
const formatRole = (role: string | null | undefined): string => {
    if (!role) return 'unspecified';
    return role.replace(/_/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
};

const getTypeColor = (type: string | null | undefined) => {
    switch (type) {
        case 'image': return 'info';
        case 'tabular': return 'success';
        case 'netcdf': return 'warning';
        default: return 'default';
    }
};

const getRoleColor = (role: string | null | undefined) => {
    switch (role) {
        case 'camera_image': return 'secondary';
        case 'analysis_data': return 'primary';
        case 'temperature_data': return 'info';
        case 'configuration': return 'warning';
        default: return 'default';
    }
};


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
    
    // Get asset count directly from API
    const { total: assetCount = 0 } = useGetList(
        'assets',
        {
            filter: { experiment_id: record?.id },
            pagination: { page: 1, perPage: 1 },
            sort: { field: 'uploaded_at', order: 'DESC' }
        }
    );

    if (!record || !authProvider) return null;
    if (assetCount === 0) return null;

    const handleDownload = async () => {
        if (!record) return;

        setIsDownloading(true);

        try {
            const token = await authProvider.getToken();

            // Step 1: Request a download token from the API
            const tokenResponse = await fetch(`/api/experiments/${record.id}/download-token`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                throw new Error(errorText || `Failed to create download token: HTTP ${tokenResponse.status}`);
            }

            const { download_url } = await tokenResponse.json();

            // Step 2: Navigate browser directly to download URL
            // This triggers immediate browser download with progress bar
            window.location.href = download_url;

            // Reset button after a short delay
            setTimeout(() => {
                setIsDownloading(false);
            }, 1000);
        } catch (error) {
            console.error("Error during download:", error);
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

// Image viewer component for well freeze images  
const WellImageViewer = ({ 
    open, 
    onClose, 
    imageAssetId, 
    wellCoordinate 
}: { 
    open: boolean; 
    onClose: () => void; 
    imageAssetId: string | null; 
    wellCoordinate: string;
}) => {
    const authProvider = useAuthProvider();
    const dataProvider = useDataProvider();
    const [imageSrc, setImageSrc] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (!imageAssetId || !open) {
            setImageSrc('');
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
                console.error('Error loading well image:', error);
                setError('Failed to load image');
            } finally {
                setLoading(false);
            }
        };
        
        loadImage();
    }, [imageAssetId, open, authProvider, dataProvider]);

    if (!open || !imageAssetId) return null;
    
    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Well {wellCoordinate} at Freeze Time
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ ml: 2 }}>Loading image...</Typography>
                    </Box>
                )}
                {error && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                        <Typography variant="body2" color="error">{error}</Typography>
                    </Box>
                )}
                {imageSrc && !loading && !error && (
                    <>
                        <img
                            src={imageSrc}
                            alt={`Well ${wellCoordinate} at freeze time`}
                            style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
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
    const hasTimePointData = record?.results && record.results.summary?.total_time_points > 0;

    // Handler for when user clicks on well to view image
    const handleWellImageClick = (wellSummary: any) => {
        if (wellSummary.image_asset_id) {
            setSelectedWellImage({
                imageAssetId: wellSummary.image_asset_id,
                wellCoordinate: wellSummary.coordinate
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
                wellCoordinate={selectedWellImage?.wellCoordinate || ''}
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
    allowOverwrite?: boolean;
    onOverwriteChange?: (enabled: boolean) => void;
}> = ({ title, component, icon, color, allowOverwrite, onOverwriteChange }) => {
    return (
        <Box>
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
            
            {/* Overwrite switch underneath the uploader boundary box */}
            {onOverwriteChange && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
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
                            '& .MuiFormControlLabel-label': {
                                fontSize: '0.875rem',
                                color: 'text.secondary'
                            }
                        }}
                    />
                </Box>
            )}
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
                    <CloseIcon />
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

// React-admin bulk action components for assets
const AssetBulkDeleteButton = () => {
    const [isDeleting, setIsDeleting] = useState(false);
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const refresh = useRefresh();
    
    return (
        <BulkDeleteButton
            mutationMode="pessimistic"
            confirmTitle="Delete Assets"
            confirmContent="Are you sure you want to delete the selected assets? This action cannot be undone."
        />
    );
};

const AssetBulkDownloadButton = () => {
    const [isDownloading, setIsDownloading] = useState(false);
    const { selectedIds } = useListContext();
    const notify = useNotify();
    const authProvider = useAuthProvider();
    
    if (selectedIds.length === 0) return null;
    
    return (
        <Button
            variant="contained"
            color="primary"
            startIcon={isDownloading ? <CircularProgress size={16} /> : <GetAppIcon />}
            onClick={async () => {
                setIsDownloading(true);
                try {
                    const token = await authProvider.getToken();
                    
                    // Step 1: Request a download token from the API
                    const tokenResponse = await fetch('/api/assets/bulk-download-token', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            asset_ids: selectedIds
                        })
                    });
                    
                    if (!tokenResponse.ok) {
                        const errorText = await tokenResponse.text();
                        throw new Error(errorText || `Failed to create download token: HTTP ${tokenResponse.status}`);
                    }
                    
                    const { download_url } = await tokenResponse.json();
                    
                    // Step 2: Navigate browser directly to download URL
                    // This triggers immediate browser download with progress bar
                    window.location.href = download_url;
                    
                    // Show notification after a short delay
                    setTimeout(() => {
                        notify(`Downloading ${selectedIds.length} selected files...`, { type: 'info' });
                        setIsDownloading(false);
                    }, 500);
                } catch (error: any) {
                    console.error('Bulk download error:', error);
                    notify(`Failed to download files: ${error.message || 'Unknown error'}`, { type: 'error' });
                } finally {
                    setIsDownloading(false);
                }
            }}
            disabled={isDownloading}
            size="small"
            sx={{ mr: 1 }}
        >
            {isDownloading ? 'Preparing...' : 'Download Selected'}
        </Button>
    );
};

// Combined bulk actions component
const AssetBulkActions = () => (
    <Box sx={{ display: 'flex', gap: 1 }}>
        <AssetBulkDownloadButton />
        <AssetBulkDeleteButton />
    </Box>
);

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

// Condensed experiment details component
const ExperimentDetailsHeader = () => {
    const record = useRecordContext();
    
    return (
        <Card sx={{ mb: 2 }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                {/* Compact 2-row layout with essential info only */}
                <Box display="grid" gridTemplateColumns="2fr 1fr 1fr 1fr" gap={2} sx={{ mb: 1 }}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Name</Typography>
                        <Typography variant="body2" fontWeight="medium">{record?.name}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Date</Typography>
                        <Typography variant="body2"><DateField source="performed_at" showTime /></Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">User</Typography>
                        <Typography variant="body2">{record?.username}</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Calibration</Typography>
                        <Typography variant="body2"><BooleanField source="is_calibration" /></Typography>
                    </Box>
                </Box>
                
                <Box display="grid" gridTemplateColumns="2fr 1fr 1fr 1fr" gap={2}>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Tray Configuration</Typography>
                        <Typography variant="body2">
                            <ReferenceField source="tray_configuration_id" reference="tray_configurations" link="show">
                                <TextField source="name" />
                            </ReferenceField>
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Start Temp</Typography>
                        <Typography variant="body2"><NumberField source="temperature_start" />°C</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">End Temp</Typography>
                        <Typography variant="body2"><NumberField source="temperature_end" />°C</Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" color="text.secondary">Ramp Rate</Typography>
                        <Typography variant="body2"><NumberField source="temperature_ramp" />°C/min</Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

// Tabular Data Section Component using direct API call
const TabularDataSection = ({ onRefresh }: { onRefresh: () => void }) => {
    const record = useRecordContext();
    const refresh = useRefresh();
    const { data: tabularAssets, isLoading, refetch } = useGetList(
        'assets',
        {
            filter: { experiment_id: record?.id, type: 'tabular' },
            pagination: { page: 1, perPage: 50 },
            sort: { field: 'uploaded_at', order: 'DESC' }
        }
    );

    const handleRefresh = () => {
        refetch();
        refresh();
        onRefresh();
    };

    if (isLoading) {
        return (
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DescriptionIcon color="primary" />
                    Data Processing Files
                </Typography>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon color="primary" />
                Data Processing Files
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Tabular data for experiment data processing - always visible for easy access. Select one to process results from.
            </Typography>
            <Box>
                {(tabularAssets || []).map((asset: any) => (
                    <Card key={asset.id} variant="outlined" sx={{ mb: 1, p: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                    {asset.original_filename}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
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
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ProcessingColumn record={asset} onProcess={handleRefresh} />
                                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                                <AssetDownloadButton record={asset} />
                                <AssetDeleteButton record={asset} onDelete={handleRefresh} />
                            </Box>
                        </Box>
                    </Card>
                ))}
                {(!tabularAssets || tabularAssets.length === 0) && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                        No data files uploaded yet. Upload Excel files (.xlsx) to process experiment data.
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
    onRefresh 
}: { 
    filter: Record<string, any>; 
    onAssetView: (asset: any) => void;
    onRefresh: React.MutableRefObject<() => void>;
}) => {
    const record = useRecordContext();
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(25);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    
    const { data: assets, total, isLoading, refetch } = useGetList(
        'assets',
        {
            filter: { experiment_id: record?.id, ...filter },
            pagination: { page, perPage },
            sort: { field: 'uploaded_at', order: 'DESC' }
        }
    );

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
        setSelectedIds(prev => 
            prev.includes(id) 
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    };

    const handleUnselectItems = () => {
        setSelectedIds([]);
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
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
                resource: 'assets',
                displayedFilters: {},
                filterValues: filter,
                setFilters: () => {},
                showFilter: () => {},
                hideFilter: () => {},
                sort: { field: 'uploaded_at', order: 'DESC' },
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
                    '& .MuiTableCell-root': {
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                    },
                    '& .MuiTableRow-root': {
                        minHeight: '32px',
                    },
                    '& .MuiChip-root': {
                        height: '20px',
                        fontSize: '0.65rem',
                        '& .MuiChip-label': {
                            paddingLeft: '6px',
                            paddingRight: '6px',
                        }
                    }
                }}
            >
                <TextField source="original_filename" />
                <FunctionField
                    label="Type"
                    render={record => (
                        <Chip 
                            label={record.type || 'unknown'} 
                            size="small" 
                            color={getTypeColor(record.type)}
                            variant="outlined"
                        />
                    )}
                />
                <FunctionField
                    label="Role"
                    render={record => (
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
                    render={record => (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <AssetDownloadButton record={record} />
                            <AssetDeleteButton record={record} onDelete={() => refetch()} />
                            <AssetViewButton record={record} onView={onAssetView} />
                        </div>
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
    const [viewMode, setViewMode] = useState('regions');
    const [previousHasResults, setPreviousHasResults] = useState(false);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [assetTypeFilter, setAssetTypeFilter] = useState('all');
    const [assetRoleFilter, setAssetRoleFilter] = useState('all');
    const [filenameFilter, setFilenameFilter] = useState('');
    const [allowOverwrite, setAllowOverwrite] = useState(false);
    const assetsRefreshRef = useRef(() => {});
    
    // Use direct API call to get asset count for tab label
    const { total: assetCount = 0 } = useGetList(
        'assets',
        {
            filter: { experiment_id: record?.id },
            pagination: { page: 1, perPage: 1 },
            sort: { field: 'uploaded_at', order: 'DESC' }
        }
    );
    
    // Check if results are available
    const hasResults = record?.results && record.results.summary?.total_time_points > 0;
    
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
            {/* Always visible experiment details at the top */}
            <ExperimentDetailsHeader />
            
            <TabbedShowLayout>
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
                            component={
                                <UppyUploader 
                                    compact={true} 
                                    allowOverwrite={allowOverwrite}
                                />
                            }
                            icon={<CloudUploadIcon />}
                            color="secondary"
                            allowOverwrite={allowOverwrite}
                            onOverwriteChange={setAllowOverwrite}
                        />
                    </Box>
                </Box>
                
                {/* Tabular Data Section */}
                <TabularDataSection onRefresh={() => assetsRefreshRef.current()} />

                {/* Asset Filters */}
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        Filter:
                    </Typography>
                    <MuiTextField
                        size="small"
                        label="Filename"
                        value={filenameFilter}
                        onChange={(e) => setFilenameFilter(e.target.value)}
                        sx={{ minWidth: 160 }}
                        placeholder="Search by filename..."
                    />
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                            value={assetTypeFilter}
                            label="Type"
                            onChange={(e: SelectChangeEvent) => setAssetTypeFilter(e.target.value)}
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
                            value={assetRoleFilter}
                            label="Role"
                            onChange={(e: SelectChangeEvent) => setAssetRoleFilter(e.target.value)}
                        >
                            <MenuItem value="all">All</MenuItem>
                            <MenuItem value="camera_image">Camera</MenuItem>
                            <MenuItem value="analysis_data">Analysis</MenuItem>
                            <MenuItem value="temperature_data">Temperature</MenuItem>
                            <MenuItem value="configuration">Config</MenuItem>
                        </Select>
                    </FormControl>
                    {(assetTypeFilter !== 'all' || assetRoleFilter !== 'all' || filenameFilter.trim()) && (
                        <Button 
                            variant="text" 
                            size="small" 
                            onClick={() => {
                                setAssetTypeFilter('all');
                                setAssetRoleFilter('all');
                                setFilenameFilter('');
                            }}
                            sx={{ whiteSpace: 'nowrap' }}
                        >
                            Clear
                        </Button>
                    )}
                </Box>
                <AssetsList
                    filter={{
                        ...(assetTypeFilter !== 'all' && { type: assetTypeFilter }),
                        ...(assetRoleFilter !== 'all' && { role: assetRoleFilter }),
                        ...(filenameFilter.trim() && { original_filename: filenameFilter.trim() })
                    }}
                    onAssetView={handleAssetView}
                    onRefresh={assetsRefreshRef}
                />
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
