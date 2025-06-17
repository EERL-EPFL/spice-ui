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
import { UppyUploader } from "../uploader/Uppy";
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
            </SimpleShowLayout>
        </Show>
    );
};


export default ShowComponent;
