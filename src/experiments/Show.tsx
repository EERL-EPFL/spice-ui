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
} from "react-admin";

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
            <SimpleShowLayout>
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
            </SimpleShowLayout>
        </Show>
    );
};

export default ShowComponent;
