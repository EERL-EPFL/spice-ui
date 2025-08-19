import {
    Create,
    SimpleForm,
    TextInput,
    required,
    NumberInput,
    SelectInput,
    BooleanInput,
    ArrayInput,
    SimpleFormIterator,
    FormDataConsumer,
} from 'react-admin';
import { Box, Paper, Typography } from '@mui/material';
import TrayDisplay from '../components/TrayDisplay';

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
                <TextInput source="name" validate={[required()]} />
                <BooleanInput source="experiment_default" defaultValue={true} />
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
                                        source="name"
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
                                        defaultValue={0}
                                    />
                                    <NumberInput
                                        source="qty_cols"
                                        label="Columns"
                                        helperText="Number of columns (numeric coordinate in microplate: 1, 2, 3, ...12)"
                                        validate={[required()]}
                                        min={1}
                                        max={50}
                                        fullWidth
                                        defaultValue={12}
                                    />
                                    <NumberInput
                                        source="qty_rows"
                                        label="Rows"
                                        helperText="Number of rows (letter coordinate in microplate: A, B, C, ...H)"
                                        validate={[required()]}
                                        min={1}
                                        max={50}
                                        fullWidth
                                        defaultValue={8}
                                    />
                                    <NumberInput
                                        source="well_relative_diameter"
                                        label="Well diameter (mm)"
                                        fullWidth
                                        defaultValue={6.4}
                                        step={0.1}
                                        min={0.1}
                                    />
                                </Box>
                                {/* Right: Tray preview (fixed width) */}
                                <Box sx={{ minWidth: 370, maxWidth: 420, flex: '0 0 370px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <FormDataConsumer>
                                        {({ scopedFormData }) => {
                                            if (scopedFormData?.name && scopedFormData?.qty_cols && scopedFormData?.qty_rows) {
                                                return (
                                                    <TrayDisplay
                                                        name={scopedFormData.name}
                                                        qtyCols={parseInt(scopedFormData.qty_cols) || 8}
                                                        qtyRows={parseInt(scopedFormData.qty_rows) || 12}
                                                        rotation={parseInt(scopedFormData.rotation_degrees) || 0}
                                                        wellDiameter={scopedFormData.well_relative_diameter || 6.4}
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
