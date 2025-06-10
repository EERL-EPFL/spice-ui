import {
    Create,
    SimpleForm,
    TextField,
    TextInput,
    required,
    NumberInput,
    DateTimeInput,
    ReferenceInput,
    SelectInput,
    BooleanField,
    BooleanInput,
    ArrayInput,
    SimpleFormIterator,
    FormDataConsumer,
} from 'react-admin';
import { Box, Paper, Typography } from '@mui/material';
import TrayDisplay from '../components/TrayDisplay'; // Adjust the import based on your file structure

const CreateComponent = () => {
    return (
        <Create
            redirect="show"
            transform={data => ({
                ...data,
                trays: Array.isArray(data.trays)
                    ? data.trays.map((trayConfig, idx) => ({
                        ...trayConfig,
                        order_sequence: idx + 1
                    }))
                    : data.trays
            })}
        >
            <SimpleForm>
                {/* Top section with basic tray info */}
                <TextField source="id" />
                <TextInput source="name" validate={[required()]} />
                <BooleanInput source="experiment_default" />
                <ArrayInput source="trays" label="Tray Configurations">
                    <SimpleFormIterator>
                        <Paper
                            elevation={2}
                            sx={{
                                padding: 3,
                                marginBottom: 3,
                                backgroundColor: (theme) => theme.palette.background.paper,
                                border: (theme) => `1px solid ${theme.palette.divider}`
                            }}
                        >
                            <Box sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                                gap: 3,
                                flexWrap: 'nowrap',
                                overflowX: 'auto',
                                minHeight: 420
                            }}>
                                {/* Left: Tray parameters (single column) */}
                                <Box sx={{ minWidth: 260, maxWidth: 340, flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextInput
                                        source="trays[0].name"
                                        label="Tray Name"
                                        validate={[required()]}
                                        fullWidth
                                    />
                                    <SelectInput
                                        source="rotation_degrees"
                                        label="Rotation"
                                        choices={[
                                            { id: 0, name: '0°' },
                                            { id: 90, name: '90°' },
                                            { id: 180, name: '180°' },
                                            { id: 270, name: '270°' }
                                        ]}
                                        validate={[required()]}
                                        fullWidth
                                    />
                                    <NumberInput
                                        source="trays[0].qty_x_axis"
                                        label="Columns"
                                        validate={[required()]}
                                        min={1}
                                        max={50}
                                        fullWidth
                                    />
                                    <NumberInput
                                        source="trays[0].qty_y_axis"
                                        label="Rows"
                                        validate={[required()]}
                                        min={1}
                                        max={50}
                                        fullWidth
                                    />
                                    <TextInput
                                        source="trays[0].well_relative_diameter"
                                        label="Well Diameter"
                                        fullWidth
                                    />
                                </Box>
                                {/* Right: Tray preview (fixed width) */}
                                <Box sx={{ minWidth: 370, maxWidth: 420, flex: '0 0 370px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FormDataConsumer>
                                        {({ scopedFormData }) => {
                                            const tray = scopedFormData?.trays?.[0] || {};
                                            if (tray.name && tray.qty_x_axis && tray.qty_y_axis) {
                                                return (
                                                    <TrayDisplay
                                                        name={tray.name}
                                                        qtyXAxis={parseInt(tray.qty_x_axis) || 8}
                                                        qtyYAxis={parseInt(tray.qty_y_axis) || 12}
                                                        rotation={parseInt(scopedFormData.rotation_degrees) || 0}
                                                        wellDiameter={tray.well_relative_diameter}
                                                        maxWidth={350}
                                                        maxHeight={350}
                                                    />
                                                );
                                            }
                                            return (
                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                    sx={{ fontStyle: 'italic' }}
                                                >
                                                    Fill out parameters to see preview
                                                </Typography>
                                            );
                                        }}
                                    </FormDataConsumer>
                                </Box>
                            </Box>
                        </Paper>
                    </SimpleFormIterator>
                </ArrayInput>
            </SimpleForm>
        </Create>
    );
};

export default CreateComponent;
