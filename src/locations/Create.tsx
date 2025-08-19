import {
  Create,
  SimpleForm,
  TextField,
  TextInput,
  required,
  DateTimeInput,
  ReferenceInput,
  SelectInput,
} from "react-admin";

const CreateComponent = () => {
  return (
    <Create redirect="show">
      <SimpleForm>
        <TextField source="id" />
        <ReferenceInput source="project_id" reference="projects">
          <SelectInput optionText="name" validate={[required()]} />
        </ReferenceInput>
        <TextInput source="name" validate={[required()]} />
        <TextInput source="comment" multiline />
      </SimpleForm>
    </Create>
  );
};

export default CreateComponent;
