import {
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
    EditButton,
    DeleteButton,
    BooleanField,
    useRecordContext,
} from "react-admin";
import { Box, Grid, Typography } from '@mui/material';
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

export const ShowComponent = () => {
    return (
        <Show actions={<TopToolbar><EditButton /><DeleteButton /></TopToolbar>}>
            <SimpleShowLayout title="Tray Configuration">
                <TextField source="name" />
                <BooleanField source="experiment_default" />
                <TrayConfigurationDisplay />
            </SimpleShowLayout>
        </Show>
    );
};

export default ShowComponent;
