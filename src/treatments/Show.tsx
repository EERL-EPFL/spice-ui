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
    Edit,
} from "react-admin";



export const ShowComponent = () => {
    return (
        <Show actions={<TopToolbar><EditButton /><DeleteButton /></TopToolbar>}>
            <SimpleShowLayout>
                <TextField source="id" />
                <TextField source="name" />
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
