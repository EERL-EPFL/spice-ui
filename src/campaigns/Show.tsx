import {
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
    EditButton,
    DeleteButton,
    usePermissions,
    DateField,
    ArrayField,
    Datagrid,
    TabbedShowLayout,
    useRedirect,
    useCreatePath,
    NumberField,
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
    const redirect = useRedirect();
    const createPath = useCreatePath();
    return (
        <Show actions={<ShowComponentActions />} >
            <SimpleShowLayout>
                <TextField source="id" />
                <TextField source="name" />
                <TextField source="description" />
                <DateField source="start_date" showTime />
                <DateField source="end_date" showTime />
                <DateField source="last_updated" showTime />
                <TabbedShowLayout>
                    <TabbedShowLayout.Tab label="samples">
                    <ArrayField source="samples">
                        <Datagrid 
                        bulkActionButtons={false}
                        rowClick={(id) => { return createPath({ resource: 'samples', id, type: 'show' })}}
                        >
                            <TextField source="name" />
                            <TextField source="type" />
                            <TextField source="treatment" />
                        </Datagrid>
                    </ArrayField>
                </TabbedShowLayout.Tab>
                <TabbedShowLayout.Tab label="experiments">
                    <ArrayField source="experiments">
                        <Datagrid
                            bulkActionButtons={false}
                            rowClick={(id) => { return createPath({ resource: 'experiments', id, type: 'show' })}}
                        >
                            <TextField source="name" />
                            <TextField source="type" />
                            <TextField source="treatment" />
                        </Datagrid>
                    </ArrayField>
                </TabbedShowLayout.Tab>
            </TabbedShowLayout>
            </SimpleShowLayout>
        </Show>
    );
};

export default ShowComponent;
