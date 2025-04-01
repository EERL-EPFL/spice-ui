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
    ReferenceField,
    ReferenceArrayField,
    SingleFieldList,
    ChipField,
    ReferenceManyField,
    Datagrid,
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
                <ReferenceField source="campaign_id" reference="campaigns" link="show">
                    <TextField source="name"/>
                </ReferenceField>
                <TextField source="type" />
                <TextField source="treatment" />
                <TextField source="material_description" />
                <TextField source="extraction_procedure" />
                <TextField source="filter_substrate" />
                <NumberField source="suspension_volume_liters" />
                <NumberField source="air_volume_liters" />
                <NumberField source="water_volume_liters" />
                <NumberField source="initial_concentration_gram_l" />
                <NumberField source="well_volume_liters" />
                <TextField source="background_region_key" />
                <TextField source="remarks" />
                <DateField source="created_at" showTime />
                <DateField source="last_updated" showTime />
                <ReferenceManyField reference="experiments" target="sample_id" label="Experiments">
                    <Datagrid>
                        <TextField source="name" />
                        <DateField source="performed_at" />
                    </Datagrid>
                </ReferenceManyField>

            </SimpleShowLayout>
        </Show>
    );
};

export default ShowComponent;
