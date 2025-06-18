import {
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
    EditButton,
    DeleteButton,
    usePermissions,
    FunctionField,
    ReferenceManyField,
    Datagrid,
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
};

export const ShowComponent = () => {
    return (
        <Show actions={<ShowComponentActions />}>
            <SimpleShowLayout>
                <TextField source="id" />
                <TextField source="name" />
                <TextField source="note" />
                <FunctionField
                    source="colour"
                    label="Color"
                    render={record => (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <div style={{
                                width: '30px',
                                height: '30px',
                                backgroundColor: record.colour || '#ccc',
                                border: '1px solid #000',
                                borderRadius: '3px'
                            }} />
                            <span>{record.colour || 'No color set'}</span>
                        </div>
                    )}
                />

                <ReferenceManyField reference="locations" target="project_id" label="Locations">
                    <Datagrid bulkActionButtons={false} rowClick="show">
                        <TextField source="name" />
                        <TextField source="description" />
                        <DateField source="start_date" showTime />
                        <DateField source="end_date" showTime />
                    </Datagrid>
                </ReferenceManyField>
            </SimpleShowLayout>
        </Show>
    );
};

export default ShowComponent;