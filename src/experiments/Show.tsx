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
} from "react-admin";
import React, { useEffect, useState } from "react";
import { Button, Box, Card, CardContent, Typography, Tabs, Tab, ToggleButton, ToggleButtonGroup, Divider } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ScienceIcon from '@mui/icons-material/Science';
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
const RegionsResultsToggle = ({ viewMode, onViewModeChange, hasResults }) => {
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

const RegionsDisplay = ({ viewMode }) => {
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
            viewMode={viewMode}
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

const TabbedContent = () => {
    const record = useRecordContext();
    const [currentTab, setCurrentTab] = useState(0);
    const [viewMode, setViewMode] = useState('regions');
    
    // Get asset count for tab label
    const assetCount = record?.assets?.length || 0;
    
    // Check if results are available
    const hasResults = record?.results_summary && record.results_summary.total_time_points > 0;

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const handleViewModeChange = (newViewMode: string) => {
        setViewMode(newViewMode);
    };

    return (
        <TabbedShowLayout syncWithLocation={false} value={currentTab} onChange={handleTabChange}>
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
                            component={<OptimizedExcelUploader compact={true} />}
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
                    </Datagrid>
                </ReferenceManyField>
            </TabbedShowLayout.Tab>
        </TabbedShowLayout>
    );
};

export const ShowComponent = () => {
    return (
        <Show actions={<ShowComponentActions />}>
            <SimpleShowLayout title="Experiment">
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
                
                <TabbedContent />
            </SimpleShowLayout>
        </Show>
    );
};


export default ShowComponent;
