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
    Button,
    Labeled,
} from "react-admin";
import { Box, Typography } from "@mui/material";

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
    const redirect = useRedirect();

    if (permissions !== 'admin') return null;
    if (!record) return null;

    // console.log("Record", record.id);
    const handleClick = () => {
        redirect('create', 'treatments', undefined, {}, { record: { sample_id: record.id } });
    };

    return (
        <Button
            label="Create Treatment"
            onClick={handleClick}
        />
    );
};

export const ShowComponent = () => {
    return (
        <Show actions={<ShowComponentActions />}>
            <SimpleShowLayout>
                <Box display="flex" gap={3}>
                    {/* Left column - Sample Properties */}
                    <Box flex={1} minWidth="400px" display="flex" flexDirection="column" gap={2}>
                        <Labeled>
                            <TextField source="id" />
                        </Labeled>
                        <Labeled>
                            <TextField source="name" />
                        </Labeled>
                        <Labeled>
                            <ReferenceField source="location_id" reference="locations" link="show">
                                <TextField source="name" />
                            </ReferenceField>
                        </Labeled>
                        <Labeled>
                            <TextField source="type" />
                        </Labeled>
                        <Labeled>
                            <NumberField source="latitude" label="Latitude (°)" />
                        </Labeled>
                        <Labeled>
                            <NumberField source="longitude" label="Longitude (°)" />
                        </Labeled>
                        <Labeled>
                            <TextField source="material_description" />
                        </Labeled>
                        <Labeled>
                            <TextField source="extraction_procedure" />
                        </Labeled>
                        <Labeled>
                            <TextField source="filter_substrate" />
                        </Labeled>
                        <Labeled>
                            <NumberField source="suspension_volume_litres" />
                        </Labeled>
                        <Labeled>
                            <NumberField source="air_volume_litres" />
                        </Labeled>
                        <Labeled>
                            <NumberField source="water_volume_litres" />
                        </Labeled>
                        <Labeled>
                            <NumberField source="initial_concentration_gram_l" />
                        </Labeled>
                        <Labeled>
                            <NumberField source="well_volume_litres" />
                        </Labeled>
                        <Labeled>
                            <TextField source="remarks" />
                        </Labeled>
                        <Labeled>
                            <DateField source="created_at" showTime />
                        </Labeled>
                        <Labeled>
                            <DateField source="last_updated" showTime />
                        </Labeled>
                    </Box>
                    
                    {/* Right column - Treatments */}
                    <Box flex={1} minWidth="400px">
                        <Typography variant="h6" gutterBottom>
                            Treatments
                        </Typography>
                        <ReferenceManyField reference="treatments" target="sample_id" label="">
                            <>
                                <TopToolbar>
                                    <CreateTreatmentButton />
                                </TopToolbar>
                                <Datagrid bulkActionButtons={false} rowClick="show">
                                    <TextField source="name" />
                                    <TextField source="notes" />
                                    <NumberField source="enzyme_volume_litres" />
                                    <DateField source="last_updated" showTime />
                                </Datagrid>
                            </>
                        </ReferenceManyField>
                    </Box>
                </Box>
            </SimpleShowLayout>
        </Show>
    );
};

export default ShowComponent;
