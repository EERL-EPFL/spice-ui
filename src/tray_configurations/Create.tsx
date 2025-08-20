import {
  Create,
  SimpleForm,
  TextInput,
  required,
  BooleanInput,
  ArrayInput,
  SimpleFormIterator,
} from "react-admin";
import { Paper } from "@mui/material";
import CompactTrayEditor from "../components/CompactTrayEditor";

const CreateComponent = () => {
  return (
    <Create
      redirect="show"
      transform={(data) => ({
        ...data,
        trays: Array.isArray(data.trays)
          ? data.trays.map((trayConfig, idx) => ({
              ...trayConfig,
              order_sequence: idx + 1,
            }))
          : data.trays,
      })}
    >
      <SimpleForm>
        {/* Top section with basic tray info */}
        <TextInput source="name" validate={[required()]} />
        <BooleanInput source="experiment_default" defaultValue={true} />
        <ArrayInput source="trays" label="Tray Configurations">
          <SimpleFormIterator>
            <CompactTrayEditor />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Create>
  );
};

export default CreateComponent;
