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
    CreateButton,
    useCreatePath,
    useRecordContext, 
    useRedirect,
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



const CreateTreatmentButton = () => {
    const { permissions } = usePermissions();
    const record = useRecordContext();
    const createPath = useCreatePath();
    const redirect = useRedirect();

    if (permissions !== 'admin') return null;
    if (!record) return null;

    console.log("Record", record.id);
    const handleClick = () => {
        redirect(
            'create', "treatments", undefined, {}, { sample_id: record.id  }
        );
    };

    return (
        <CreateButton
            resource="treatments"
            label="Create"
            onClick={handleClick}
        />
    );
};

export const ShowComponent = () => {
    return (
        <Show actions={<ShowComponentActions />}>
            <SimpleShowLayout>
                <TextField source="id" />
                <TextField source="name" />
                <ReferenceField source="campaign_id" reference="campaigns" link="show">
                    <TextField source="name" />
                </ReferenceField>
                <TextField source="type" />
                <NumberField source="latitude" label="Latitude (°)" />
                <NumberField source="longitude" label="Longitude (°)" />
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
                <ReferenceManyField reference="treatments" target="sample_id" label="Sample Treatments">
                    <>
                        <TopToolbar>
                            <CreateTreatmentButton />
                        </TopToolbar>
                        <Datagrid bulkActionButtons={false} rowClick="show">
                            <TextField source="name" />
                            <TextField source="notes" />
                            <NumberField source="enzyme_volume_microlitres" />
                            <DateField source="last_updated" showTime />
                        </Datagrid>
                    </>
                </ReferenceManyField>
            </SimpleShowLayout>
        </Show>
    );
};

export default ShowComponent;
