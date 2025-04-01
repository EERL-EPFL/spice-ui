import {
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
    EditButton,
    DeleteButton,
    usePermissions,
    DateField,
    NumberField,
    BooleanField,
    ReferenceField,
    ArrayField,
    Datagrid,
    FunctionField,
    TabbedShowLayout,
} from "react-admin";
import { UppyUploader } from "../uploader/Uppy";


const ShowComponentActions = () => {
    const { permissions } = usePermissions();
    return (
        <TopToolbar>
            {permissions === 'admin' && (
                <>
                    <EditButton />
                    <DeleteButton />
                </>
            )}
        </TopToolbar>
    );
};

export const ShowComponent = () => {
    return (
        <Show actions={<ShowComponentActions />}>
            <SimpleShowLayout title="Experiment">
                <TextField source="id" />
                <TextField source="name" />
                <DateField source="performed_at" showTime label="Date"/>
                <BooleanField source="is_calibration" />
                <ReferenceField source="sample_id" reference="samples" link="show">
                    <TextField source="name"/>
                </ReferenceField>
                <TextField source="username" />
                <DateField source="created_at" showTime />
                <NumberField source="temperature_ramp" />
                <NumberField source="temperature_start" />
                <NumberField source="temperature_end" />
                <UppyUploader />
                <TabbedShowLayout>
                    <TabbedShowLayout.Tab label="Assets">
                <ArrayField source="assets">
                    <Datagrid
                        bulkActionButtons={false}
                        rowClick={false}
                    >
                        <TextField source="original_filename" />
                        <TextField source="type" />
                        <FunctionField source="size_bytes" render={record => record.size_bytes ? `${(record.size_bytes / 1024 / 1024).toFixed(2)} MB` : ''} />
                        <DateField source="created_at" showTime />
                        <NumberField source="size" />
                    </Datagrid>
                    </ArrayField>
                    </TabbedShowLayout.Tab>
                    </TabbedShowLayout>

            </SimpleShowLayout>
        </Show>
    );
};

export default ShowComponent;
