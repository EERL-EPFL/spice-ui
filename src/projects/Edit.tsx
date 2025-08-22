import { Edit, SimpleForm, TextInput, required, useInput } from "react-admin";
import { ColorInput } from "react-admin-color-picker";
import { Box } from "@mui/material";

const ColorInputWithInlinePreview = ({ source, label, ...props }) => {
  const { field } = useInput({ source });
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ColorInput
        source={source}
        label={label}
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

const EditComponent = () => {
  return (
    <Edit redirect="show">
      <SimpleForm>
        <TextInput disabled label="Id" source="id" />
        <TextInput source="name" validate={[required()]} />
        <TextInput source="note" multiline />
        <ColorInputWithInlinePreview source="colour" label="Colour" />
      </SimpleForm>
    </Edit>
  );
};

export default EditComponent;
