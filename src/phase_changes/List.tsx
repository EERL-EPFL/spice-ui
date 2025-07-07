import {
    List,
    Datagrid,
    TextField,
    DateField,
    ReferenceField,
    FunctionField,
    FilterButton,
    TopToolbar,
    ExportButton,
} from 'react-admin';

const ListActions = () => (
    <TopToolbar>
        <FilterButton />
        <ExportButton />
    </TopToolbar>
);

export const PhaseChangeList = () => (
    <List
        actions={<ListActions />}
        perPage={100}
        sort={{ field: 'timestamp', order: 'DESC' }}
    >
        <Datagrid rowClick={false}>
            <ReferenceField source="experiment_id" reference="experiments" link="show">
                <TextField source="name" />
            </ReferenceField>
            <TextField source="well_coordinate" label="Well" />
            <FunctionField
                source="phase_state"
                label="State"
                render={(record: any) => record.phase_state === 1 ? 'Frozen' : 'Liquid'}
            />
            <DateField source="timestamp" showTime label="Time" />
            <ReferenceField source="tray_id" reference="trays" link={false}>
                <TextField source="name" />
            </ReferenceField>
            <TextField source="tray_sequence" label="Tray Position" />
        </Datagrid>
    </List>
);

export { PhaseChangeList as List };