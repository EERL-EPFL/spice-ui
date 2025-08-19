import { Edit, SimpleForm, TextInput, required } from "react-admin";
import { ColorInput } from "react-admin-color-picker";

const EditComponent = () => {
  return (
    <Edit redirect="show">
      <SimpleForm>
        <TextInput disabled label="Id" source="id" />
        <TextInput source="name" validate={[required()]} />
        <TextInput source="note" multiline />
        <ColorInput source="colour" label="Colour" />
      </SimpleForm>
    </Edit>
  );
};

export default EditComponent;
