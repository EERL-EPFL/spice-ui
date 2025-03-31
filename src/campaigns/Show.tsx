import {
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
    EditButton,
    DeleteButton,
    usePermissions,
    DateField,
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
}

export const ShowComponent = () => {
    return (
        <Show actions={<ShowComponentActions />} >
            <SimpleShowLayout>
                <TextField source="id" />
                <TextField source="name" />
                <TextField source="description" />
                <DateField source="start_date" showTime />
                <DateField source="end_date" showTime />
                <DateField source="last_updated" showTime />
            </SimpleShowLayout>
        </Show>
    );
};

export default ShowComponent;
