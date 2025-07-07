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
import React from "react";
import { Button, Box } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import { UppyUploader } from "../uploader/Uppy";
import { PhaseChangeUploader } from "../uploader/PhaseChangeUploader";
import { TimePointUploader } from "../uploader/TimePointUploader";
import { TimePointVisualization } from "../components/TimePointVisualization";
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

    return (
        <RegionInput
            source="regions"
            label="Experiment Well Regions"
            trayConfiguration={trayConfiguration}
            readOnly={true}
            value={record.regions}
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
                    {/* Right column with uploader */}
                    <Box flex={1}>
                        <UppyUploader />
                    </Box>
                </Box>
                <TabbedShowLayout>
                    <TabbedShowLayout.Tab label="Regions">
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
                    <TabbedShowLayout.Tab label="Time Points">
                        <Box>
                            <h3>Upload Phase Change Data</h3>
                            <TimePointUploader />
                        </Box>
                        <Box mt={4}>
                            <TimePointVisualization />
                        </Box>
                    </TabbedShowLayout.Tab>
                    <TabbedShowLayout.Tab label="Phase Changes (Legacy)">
                        <Box>
                            <h3>Upload Phase Change Data (Legacy CSV)</h3>
                            <PhaseChangeUploader />
                        </Box>
                        <Box mt={4}>
                            <ReferenceManyField
                                reference="phase_change_events"
                                target="experiment_id"
                                label="Phase Change Events"
                                pagination={<Pagination />}
                            >
                                <Datagrid rowClick={false}>
                                    <TextField source="well_coordinate" label="Well" />
                                    <FunctionField
                                        source="phase_state"
                                        label="State"
                                        render={(record) => record.phase_state === 1 ? 'Frozen' : 'Liquid'}
                                    />
                                    <DateField source="timestamp" showTime label="Time" />
                                    <ReferenceField source="tray_id" reference="trays" link={false}>
                                        <TextField source="name" />
                                    </ReferenceField>
                                </Datagrid>
                            </ReferenceManyField>
                        </Box>
                    </TabbedShowLayout.Tab>
                </TabbedShowLayout>
            </SimpleShowLayout>
        </Show>
    );
};


export default ShowComponent;
