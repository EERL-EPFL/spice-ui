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
    FunctionField,
    ReferenceField,
} from "react-admin";
import { treatmentName } from "../treatments";

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
    const redirect = useRedirect();
    const createPath = useCreatePath();
    return (
        <Show actions={<ShowComponentActions />}>
            <SimpleShowLayout>
                <TextField source="id" />
                <TextField source="name" />
                <ReferenceField source="project_id" reference="projects" link="show">
                    <TextField source="name" />
                </ReferenceField>
                <TextField source="comment" />
                <DateField source="last_updated" showTime />

                <TabbedShowLayout>
                    <TabbedShowLayout.Tab label="samples">
                        <ArrayField source="samples">
                            <Datagrid
                                bulkActionButtons={false}
                                rowClick={(id) => { return createPath({ resource: 'samples', id, type: 'show' }) }}
                            >
                                <TextField source="name" />
                                <TextField source="type" />
                                <FunctionField
                                    source="treatments"
                                    label="Treatments"
                                    render={(record) =>
                                        record.treatments?.map(t => treatmentName[t.name] || t.name).join(', ') || 'No treatments'
                                    }
                                />
                            </Datagrid>
                        </ArrayField>
                    </TabbedShowLayout.Tab>
                    <TabbedShowLayout.Tab label="Associated Experiments">
                        <ArrayField source="experiments">
                            <Datagrid
                                bulkActionButtons={false}
                                rowClick={(id) => { return createPath({ resource: 'experiments', id, type: 'show' }) }}
                            >
                                <DateField source="performed_at" label="Date" showTime />
                                <TextField source="name" />
                                <TextField source="remarks" />
                            </Datagrid>
                        </ArrayField>
                    </TabbedShowLayout.Tab>
                </TabbedShowLayout>
            </SimpleShowLayout>
        </Show>
    );
};

export default ShowComponent;