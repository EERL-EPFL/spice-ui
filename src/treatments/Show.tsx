import {
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
    EditButton,
    DeleteButton,
    DateField,
    NumberField,
    ReferenceField,
    FunctionField,
} from "react-admin";
import { treatmentName } from ".";


export const ShowComponent = () => {
    return (
        <Show actions={<TopToolbar><EditButton /><DeleteButton /></TopToolbar>}>
            <SimpleShowLayout>
                <TextField source="id" />
                <FunctionField
                    source="name"
                    label="Treatment Type"
                    render={record => { return treatmentName[record.name] || record.name; }}
                />
                <ReferenceField source="sample_id" reference="samples" link="show">
                    <TextField source="name" />
                </ReferenceField>
                <NumberField source="enzyme_volume_litres" />
                <DateField source="created_at" showTime />
                <DateField source="last_updated" showTime />
                <TextField source="notes" />
            </SimpleShowLayout>
        </Show>
    );
};

export default ShowComponent;
