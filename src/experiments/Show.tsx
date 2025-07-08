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
import { Button, Box, Card, CardContent, Typography } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
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

const RegionsDisplay = () => {
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
            label={hasTimePointData ? "Experiment Regions & Time Point Results" : "Experiment Well Regions"}
            trayConfiguration={trayConfiguration}
            readOnly={true}
            value={record.regions}
            showTimePointVisualization={hasTimePointData}
        />
    );
};

const ExportRegionsButton = () => {
    const record = useRecordContext();
    const { data: trayConfiguration, isLoading, error } = useGetOne(
        'trays',
        { id: record?.tray_configuration_id },
        { enabled: !!record?.tray_configuration_id }
    );

    if (!record?.regions || !Array.isArray(record.regions) || record.regions.length === 0) {
        return null;
    }

    const handleYAMLExport = () => {
        // Check if tray configuration is loaded
        if (isLoading) {
            alert('Tray configuration is still loading. Please wait and try again.');
            return;
        }

        if (error) {
            alert('Error loading tray configuration. Cannot export.');
            console.error('Tray configuration error:', error);
            return;
        }

        if (!trayConfiguration) {
            alert('Tray configuration not available. Cannot export.');
            return;
        }

        const regions = record.regions;
        const groupedRegions: { [key: string]: any[] } = {};

        regions.forEach((region: any) => {
            const regionName = region.name || 'Unnamed';

            if (!groupedRegions[regionName]) {
                groupedRegions[regionName] = [];
            }

            // MIGRATION LOGIC: Handle old regions that don't have tray_sequence_id set
            let effectiveTrayId = region.tray_sequence_id;
            if (effectiveTrayId === undefined || effectiveTrayId === null) {
                effectiveTrayId = 1; // Default to first tray configuration
                console.warn(`Region "${region.name}" has no tray_sequence_id, defaulting to 1`);
            }

            // Convert from numeric coordinates back to letter+number format for YAML export
            const colLetter = String.fromCharCode(65 + (region.col_min || 0)); // A, B, C...
            const rowNumber = (region.row_min || 0) + 1; // 1, 2, 3...
            const upperLeft = `${colLetter}${rowNumber}`;

            const colLetterMax = String.fromCharCode(65 + (region.col_max || 0));
            const rowNumberMax = (region.row_max || 0) + 1;
            const lowerRight = `${colLetterMax}${rowNumberMax}`;

            // Find the actual tray name from the tray configuration
            let trayName = `Tray_${effectiveTrayId}`;

            if (trayConfiguration?.trays && Array.isArray(trayConfiguration.trays)) {
                const trayConfigInfo = trayConfiguration.trays.find(tc => {
                    return tc.order_sequence === effectiveTrayId;
                });

                if (trayConfigInfo && trayConfigInfo.trays && trayConfigInfo.trays.length > 0) {
                    const foundTrayName = trayConfigInfo.trays[0].name;
                    if (foundTrayName) {
                        trayName = foundTrayName;
                    }
                }
            }

            groupedRegions[regionName].push({
                tray: trayName,
                upper_left: upperLeft,
                lower_right: lowerRight
            });
        });

        let yamlContent = '';
        Object.entries(groupedRegions).forEach(([regionName, regionData], index) => {
            if (index > 0) yamlContent += '\n';
            yamlContent += `${regionName}:\n`;

            regionData.forEach(region => {
                yamlContent += `  - tray: ${region.tray}\n`;
                yamlContent += `    upper_left: ${region.upper_left}\n`;
                yamlContent += `    lower_right: ${region.lower_right}\n`;
                yamlContent += '\n';
            });
        });

        // Create and download file
        const blob = new Blob([yamlContent.trim()], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `experiment_${record.id}_regions.yaml`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Button
            variant="contained"
            size="small"
            onClick={handleYAMLExport}
            startIcon={<DownloadIcon />}
            sx={{ fontSize: '0.8rem', padding: '6px 12px', marginBottom: 2 }}
        >
            Export Regions YAML
        </Button>
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

const TabbedContent = () => {
    const record = useRecordContext();
    const [currentTab, setCurrentTab] = useState(0);
    const [hasAutoSwitched, setHasAutoSwitched] = useState(false);
    
    // Check if results are available
    const hasResults = record?.results_summary && record.results_summary.total_time_points > 0;
    
    // Force re-render when results become available
    useEffect(() => {
        if (hasResults && !hasAutoSwitched) {
            // Force re-render by switching tab temporarily
            setCurrentTab(1);
            setTimeout(() => {
                setCurrentTab(0);
            }, 100);
            setHasAutoSwitched(true);
        }
    }, [hasResults, hasAutoSwitched]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    return (
        <TabbedShowLayout syncWithLocation={false} value={currentTab} onChange={handleTabChange}>
            <TabbedShowLayout.Tab label={hasResults ? "Results" : "Regions"}>
                <ExportRegionsButton />
                <RegionsDisplay />
            </TabbedShowLayout.Tab>
            <TabbedShowLayout.Tab label="Asset list">
                <DownloadAllButton />
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
                <Box display="flex" gap={2}>
                    {/* Left column with fields */}
                    <Box flex={2}>
                        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                            <Labeled>
                                <TextField source="id" />
                            </Labeled>
                            <Labeled>
                                <TextField source="name" />
                            </Labeled>
                            <Labeled>
                                <DateField source="performed_at" showTime label="Date" />
                            </Labeled>
                            <Labeled>
                                <BooleanField source="is_calibration" />
                            </Labeled>
                            <Labeled>
                                <ReferenceField source="sample_id" reference="samples" link="show">
                                    <TextField source="name" />
                                </ReferenceField>
                            </Labeled>
                            <Labeled>
                                <ReferenceField source="tray_configuration_id" reference="trays" link="show">
                                    <TextField source="name" />
                                </ReferenceField>
                            </Labeled>
                            <Labeled>
                                <TextField source="username" />
                            </Labeled>
                            <Labeled>
                                <DateField source="created_at" showTime />
                            </Labeled>
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
                    {/* Right column with uploaders */}
                    <Box flex={1} display="flex" flexDirection="column" gap={2}>
                        <CompactUploader 
                            title="Phase Change Data" 
                            description="Upload merged.xlsx file with temperature and well state data"
                            component={<OptimizedExcelUploader compact={true} />}
                            icon={<DescriptionIcon />}
                            color="primary"
                        />
                        <CompactUploader 
                            title="Related Assets" 
                            description="Drop any related files to this experiment (images, docs, etc.)"
                            component={<UppyUploader compact={true} />}
                            icon={<CloudUploadIcon />}
                            color="secondary"
                        />
                    </Box>
                </Box>
                <TabbedContent />
            </SimpleShowLayout>
        </Show>
    );
};


export default ShowComponent;
