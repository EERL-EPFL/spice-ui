import {
  BooleanInput,
  Edit,
  SimpleForm,
  TextInput,
  required,
  ArrayInput,
  SimpleFormIterator,
} from "react-admin";
import { Box, Grid } from "@mui/material";
import CompactTrayEditor from "../components/CompactTrayEditor";


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
            <CompactTrayEditor />
          </SimpleFormIterator>
        </ArrayInput>

      </SimpleForm>
    </Edit>
  );
};

export default EditComponent;
