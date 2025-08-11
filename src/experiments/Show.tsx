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
} from "react-admin";
import React, { useEffect, useState } from "react";
import { Button, Box, Card, CardContent, Typography, Tabs, Tab, ToggleButton, ToggleButtonGroup, Divider, Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ScienceIcon from '@mui/icons-material/Science';
import { Close } from '@mui/icons-material';
import { UppyUploader } from "../uploader/Uppy";
import { PhaseChangeUploader } from "../uploader/PhaseChangeUploader";
import OptimizedExcelUploader from "../uploader/OptimizedExcelUploader";
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
        'trays',
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
        <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={() => downloadAsset(record, authProvider)}
            sx={{ mr: 1 }}
        >
            Download
        </Button>
    );
};

// View button component for images
const AssetViewButton = ({ record, onView }: { record: any; onView: (record: any) => void }) => {
    const isImage = record.type === 'image';
    
    if (!isImage) return null;
    
    return (
        <Button
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => onView(record)}
        >
            Preview
        </Button>
    );
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
                            <ReferenceField source="tray_configuration_id" reference="trays" link="show">
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
                        <ThinLineUploader 
                            title="Phase Change Data" 
                            component={<OptimizedExcelUploader compact={true} onSuccess={refresh} />}
                            icon={<DescriptionIcon />}
                            color="primary"
                        />
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
                    <Datagrid rowClick={false}>
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
                        <DateField source="created_at" showTime />
                        <FunctionField
                            label="Actions"
                            render={record => (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <AssetDownloadButton record={record} />
                                    <AssetViewButton record={record} onView={handleAssetView} />
                                </div>
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
