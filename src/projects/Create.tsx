import {
  Create,
  SimpleForm,
  TextField,
  TextInput,
  required,
  useInput,
} from "react-admin";
import { ColorInput } from "react-admin-color-picker";
import { Box } from "@mui/material";

// Extended ColorBrewer palette - colorblind-friendly and visually distinct
const COLOR_PALETTE = [
  // Dark2 palette (8 colors)
  "#1b9e77", // teal
  "#d95f02", // orange
  "#7570b3", // purple
  "#e7298a", // magenta
  "#66a61e", // green
  "#e6ab02", // yellow
  "#a6761d", // brown
  "#666666", // gray
  // Set2 palette (8 colors)
  "#66c2a5", // light teal
  "#fc8d62", // light orange
  "#8da0cb", // light purple
  "#e78ac3", // light pink
  "#a6d854", // light green
  "#ffd92f", // light yellow
  "#e5c494", // light brown
  "#b3b3b3", // light gray
  // Paired palette additions (12 more colors)
  "#a6cee3", // light blue
  "#1f78b4", // dark blue
  "#b2df8a", // pale green
  "#33a02c", // dark green
  "#fb9a99", // pale red
  "#e31a1c", // dark red
  "#fdbf6f", // pale orange
  "#ff7f00", // dark orange
  "#cab2d6", // pale purple
  "#6a3d9a", // dark purple
  "#ffff99", // pale yellow
  "#b15928", // dark brown
];

// Function to get a random color from the palette
const getRandomColor = () => {
  const randomIndex = Math.floor(Math.random() * COLOR_PALETTE.length);
  return COLOR_PALETTE[randomIndex];
};

const ColorInputWithInlinePreview = ({ source, label, defaultValue, helperText, ...props }) => {
  const { field } = useInput({ source, defaultValue });
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ColorInput
        source={source}
        label={label}
        helperText={helperText}
        defaultValue={defaultValue}
        sx={{ flex: 1 }}
        {...props}
      />
      {field.value && (
        <Box
          sx={{
            width: 32,
            height: 32,
            backgroundColor: field.value,
            border: "1px solid #ccc",
            borderRadius: 1,
            flexShrink: 0,
          }}
        />
      )}
    </Box>
  );
};

const CreateComponent = () => {
  return (
    <Create redirect="show">
      <SimpleForm>
        <TextField source="id" />
        <TextInput source="name" validate={[required()]} />
        <TextInput source="note" multiline />
        <ColorInputWithInlinePreview
          source="colour"
          label="Colour"
          helperText="Used to differentiate projects on maps"
          defaultValue={getRandomColor()}
        />
      </SimpleForm>
    </Create>
  );
};

export default CreateComponent;
