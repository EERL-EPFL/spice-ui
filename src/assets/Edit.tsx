import {
  BooleanField,
  BooleanInput,
  DateTimeInput,
  Edit,
  NumberInput,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required,
} from "react-admin";

const EditComponent = () => {
  return (
    <Edit redirect="show">
      <SimpleForm>
        <TextInput source="id" disabled />
        <TextInput source="original_filename" disabled />
        <TextInput source="type" disabled />
      </SimpleForm>
    </Edit>
  );
};

export default EditComponent;
