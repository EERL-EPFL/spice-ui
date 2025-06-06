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
} from "react-admin";
import React from "react";
import { Button, Grid } from "@mui/material";
import { UppyUploader } from "../uploader/Uppy";


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

export const ShowComponent = () => {
    return (
        <Show actions={<ShowComponentActions />}>
            <SimpleShowLayout title="Experiment">
                <Grid container spacing={2}>
                    {/* Left column with fields */}
                    <Grid item xs={8}>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Labeled>
                                    <TextField source="id" />
                                </Labeled>
                            </Grid>
                            <Grid item xs={6}>
                                <Labeled>
                                    <TextField source="name" />
                                </Labeled>
                            </Grid>
                            <Grid item xs={6}>
                                <Labeled>
                                    <DateField source="performed_at" showTime label="Date" />
                                </Labeled>
                            </Grid>
                            <Grid item xs={6}>
                                <Labeled>
                                    <BooleanField source="is_calibration" />
                                </Labeled>
                            </Grid>
                            <Grid item xs={6}>
                                <Labeled>
                                    <ReferenceField source="sample_id" reference="samples" link="show">
                                        <TextField source="name" />
                                    </ReferenceField>
                                </Labeled>
                            </Grid>
                            <Grid item xs={6}>
                                <Labeled>
                                    <TextField source="username" />
                                </Labeled>
                            </Grid>
                            <Grid item xs={6}>
                                <Labeled>
                                    <DateField source="created_at" showTime />
                                </Labeled>
                            </Grid>
                            <Grid item xs={6}>
                                <Labeled>
                                    <NumberField source="temperature_ramp" />
                                </Labeled>
                            </Grid>
                            <Grid item xs={6}>
                                <Labeled>
                                    <NumberField source="temperature_start" />
                                </Labeled>
                            </Grid>
                            <Grid item xs={6}>
                                <Labeled>
                                    <NumberField source="temperature_end" />
                                </Labeled>
                            </Grid>
                        </Grid>
                    </Grid>
                    {/* Right column with uploader */}
                    <Grid item xs={4}>
                        <UppyUploader />
                    </Grid>
                </Grid>
                <TabbedShowLayout>
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
