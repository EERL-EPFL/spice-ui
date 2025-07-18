import {
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
    EditButton,
    DeleteButton,
    BooleanField,
    useRecordContext,
    ArrayField,
    Datagrid,
    DateField,
    useCreatePath,
} from "react-admin";
import { Box, Grid, Typography, Alert } from '@mui/material';
import TrayDisplay from '../components/TrayDisplay';

const TrayConfigurationDisplay = () => {
    const record = useRecordContext();

    if (!record || !record.trays) {
        return <Typography>No tray configuration data available</Typography>;
    }

    return (
        <Box>
            <Typography variant="h6" marginBottom={2}>
                Tray Configuration
            </Typography>
            <Grid container spacing={3}>
                {record.trays.map((trayConfig: any, configIndex: number) => (
                    <Grid item key={configIndex} xs={12}>
                        <Typography
                            variant="subtitle1"
                            marginBottom={1}
                            align="center"
                        >
                            Tray {trayConfig.order_sequence} - {trayConfig.rotation_degrees}° rotation
                        </Typography>
                        <Grid container spacing={2}>
                            {trayConfig.trays.map((tray: any, trayIndex: number) => (
                                <Grid item key={trayIndex}>
                                    <TrayDisplay
                                        name={tray.name}
                                        qtyXAxis={tray.qty_x_axis}
                                        qtyYAxis={tray.qty_y_axis}
                                        rotation={trayConfig.rotation_degrees}
                                        wellDiameter={tray.well_relative_diameter}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

const AssociatedExperimentsDisplay = () => {
    const record = useRecordContext();
    const createPath = useCreatePath();

    if (!record || !record.associated_experiments || record.associated_experiments.length === 0) {
        return null;
    }

    return (
        <Box marginTop={3}>
            <Typography variant="h6" marginBottom={2}>
                Associated Experiments ({record.associated_experiments.length})
            </Typography>
            <ArrayField source="associated_experiments" label="">
                <Datagrid 
                    bulkActionButtons={false} 
                    rowClick={(id) => createPath({ resource: 'experiments', id, type: 'show' })}
                >
                    <DateField source="performed_at" label="Date" showTime />
                    <TextField source="name" label="Experiment Name" />
                    <TextField source="username" label="Username" />

                </Datagrid>
            </ArrayField>
        </Box>
    );
};

const ConditionalTopToolbar = () => {
    const record = useRecordContext();
    const hasAssociatedExperiments = record?.associated_experiments && record.associated_experiments.length > 0;

    return (
        <TopToolbar>
            {!hasAssociatedExperiments && <EditButton />}
            {!hasAssociatedExperiments && <DeleteButton />}
        </TopToolbar>
    );
};

const AssociatedExperimentsWarning = () => {
    const record = useRecordContext();
    const hasAssociatedExperiments = record?.associated_experiments && record.associated_experiments.length > 0;

    if (!hasAssociatedExperiments) {
        return null;
    }

    return (
        <Alert severity="warning" sx={{ marginBottom: 2 }}>
            This tray configuration has {record.associated_experiments.length} associated experiment(s). 
            Editing or deleting this configuration is disabled as it would affect existing experiments.
        </Alert>
    );
};

export const ShowComponent = () => {
    return (
        <Show actions={<ConditionalTopToolbar />}>
            <SimpleShowLayout title="Tray Configuration">
                <AssociatedExperimentsWarning />
                <TextField source="name" />
                <BooleanField source="experiment_default" />
                <TrayConfigurationDisplay />
                <AssociatedExperimentsDisplay />
            </SimpleShowLayout>
        </Show>
    );
};

export default ShowComponent;
