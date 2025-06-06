import {
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
    EditButton,
    DeleteButton,
    BooleanField,
    Datagrid,
    ArrayField,
} from "react-admin";

export const ShowComponent = () => {
    return (
        <Show actions={<TopToolbar><EditButton /><DeleteButton /></TopToolbar>}>
            <SimpleShowLayout title="Experiment">
                <TextField source="name" />
                <BooleanField source="experiment_default" />
                <ArrayField source="trays" label="Trays">
                    <Datagrid>
                        <TextField source="order_sequence" />
                        <TextField source="rotation_degrees" />
                    </Datagrid>
                </ArrayField>
            </SimpleShowLayout>
        </Show>
    );
};


export default ShowComponent;
