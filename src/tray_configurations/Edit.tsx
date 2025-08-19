import {
  BooleanInput,
  Edit,
  SimpleForm,
  TextInput,
  required,
  ArrayInput,
  SimpleFormIterator,
  NumberInput,
  SelectInput,
  useRecordContext,
  FormDataConsumer,
} from "react-admin";
import { Box, Grid, Typography, Paper } from "@mui/material";
import TrayDisplay from "../components/TrayDisplay";

const TrayConfigurationItem = ({
  trayConfig,
  configIndex,
}: {
  trayConfig: any;
  configIndex: number;
}) => {
  if (!trayConfig.trays || trayConfig.trays.length === 0) {
    return null;
  }

  return (
    <Box sx={{ marginBottom: 2 }}>
      <Typography variant="subtitle2" marginBottom={1} color="primary">
        Sequence {configIndex + 1} - {trayConfig.rotation_degrees || 0}°
        rotation
      </Typography>
      <Grid container spacing={1}>
        {trayConfig.trays.map((tray: any, trayIndex: number) => (
          <Grid item key={trayIndex}>
            <TrayDisplay
              name={tray.name || `Tray ${trayIndex + 1}`}
              qtyCols={tray.qty_cols || 8}
              qtyRows={tray.qty_rows || 12}
              rotation={trayConfig.rotation_degrees || 0}
              wellDiameter={tray.well_relative_diameter}
              maxWidth={450}
              maxHeight={350}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

const EditComponent = () => {
  return (
    <Edit
      transform={(data) => ({
        ...data,
        trays: Array.isArray(data.trays)
          ? data.trays.map((trayConfig, idx) => ({
              ...trayConfig,
              order_sequence: idx + 1,
            }))
          : data.trays,
      })}
      redirect="show"
      mutationMode="pessimistic"
    >
      <SimpleForm>
        {/* Top section with basic tray info */}
        <Box sx={{ marginBottom: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextInput disabled label="Id" source="id" fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextInput source="name" validate={[required()]} fullWidth />
            </Grid>
            <Grid item xs={12} sm={3}>
              <BooleanInput
                source="experiment_default"
                label="Experiment Default"
              />
            </Grid>
          </Grid>
        </Box>

        <ArrayInput source="trays" label="Tray Configurations">
          <SimpleFormIterator>
            <Paper
              elevation={2}
              sx={{
                padding: 3,
                marginBottom: 3,
                backgroundColor: (theme) => theme.palette.background.paper,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 3,
                  flexWrap: "nowrap",
                  overflowX: "auto",
                  minHeight: 420,
                }}
              >
                {/* Left: Tray parameters (single column) */}
                <Box
                  sx={{
                    minWidth: 260,
                    maxWidth: 340,
                    flex: "0 0 320px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
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
                      { id: 0, name: "0°" },
                      { id: 90, name: "90°" },
                      { id: 180, name: "180°" },
                      { id: 270, name: "270°" },
                    ]}
                    validate={[required()]}
                    fullWidth
                  />
                  <NumberInput
                    source="qty_cols"
                    label="Columns"
                    helperText="Number of columns (numeric coordinate in microplate: 1, 2, 3, ...12)"
                    validate={[required()]}
                    min={1}
                    max={50}
                    fullWidth
                  />
                  <NumberInput
                    source="qty_rows"
                    label="Rows"
                    helperText="Number of rows (letter coordinate in microplate: A, B, C, ...H)"
                    validate={[required()]}
                    min={1}
                    max={50}
                    fullWidth
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
                <Box
                  sx={{
                    minWidth: 370,
                    maxWidth: 420,
                    flex: "0 0 370px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FormDataConsumer>
                    {({ scopedFormData }) => {
                      if (
                        scopedFormData?.name &&
                        scopedFormData?.qty_cols &&
                        scopedFormData?.qty_rows
                      ) {
                        return (
                          <TrayDisplay
                            name={scopedFormData.name}
                            qtyCols={parseInt(scopedFormData.qty_cols) || 8}
                            qtyRows={parseInt(scopedFormData.qty_rows) || 12}
                            rotation={
                              parseInt(scopedFormData.rotation_degrees) || 0
                            }
                            wellDiameter={
                              scopedFormData.well_relative_diameter || 6.4
                            }
                            maxWidth={350}
                            maxHeight={350}
                          />
                        );
                      }
                      return (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontStyle: "italic" }}
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
    </Edit>
  );
};

export default EditComponent;
