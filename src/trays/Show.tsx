import {
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
    EditButton,
    DeleteButton,
    BooleanField,
} from "react-admin";

export const ShowComponent = () => {
    return (
        <Show actions={<TopToolbar><EditButton /><DeleteButton /></TopToolbar>}>
            <SimpleShowLayout title="Experiment">
                <TextField source="name" />
                <BooleanField source="experiment_default" />
            </SimpleShowLayout>
        </Show>
    );
};


export default ShowComponent;
