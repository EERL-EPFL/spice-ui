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
  useRecordContext,
  Labeled,
} from "react-admin";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { treatmentName } from "../treatments";
import { LocationConvexHullMap } from "../components/LocationConvexHullMap";
import { TreatmentChips } from "../components/TreatmentChips";
import { SampleTypeChip } from "../components/SampleTypeChips";

const ShowComponentActions = () => {
  const { permissions } = usePermissions();
  return (
    <TopToolbar>
      {permissions === "admin" && (
        <>
          <EditButton />
          <DeleteButton />
        </>
      )}
    </TopToolbar>
  );
};

// Main location information display with map
const LocationInfo = () => {
  const record = useRecordContext();
  if (!record) return null;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          {record.name}
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          {/* Left column - Location information */}
          <Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2 }}>
              {record.project_id && (
                <Labeled label="Project">
                  <ReferenceField
                    source="project_id"
                    reference="projects"
                    link="show"
                  >
                    <TextField source="name" />
                  </ReferenceField>
                </Labeled>
              )}

              {record.comment && (
                <Labeled label="Comment">
                  <TextField source="comment" />
                </Labeled>
              )}
            </Box>

            <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Created: <DateField source="created_at" showTime />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Updated: <DateField source="last_updated" showTime />
              </Typography>
            </Box>
          </Box>

          {/* Right column - Map */}
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Box sx={{ flex: 1, border: 1, borderColor: 'divider', borderRadius: 1, minHeight: 250 }}>
              <LocationConvexHullMap
                locationId={record.id}
                locationName={record.name}
                compact={true}
              />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export const ShowComponent = () => {
  const redirect = useRedirect();
  const createPath = useCreatePath();
  return (
    <Show actions={<ShowComponentActions />}>
      <SimpleShowLayout>
        <LocationInfo />
        <TabbedShowLayout>
          <TabbedShowLayout.Tab label="Samples">
            <ArrayField source="samples">
              <Datagrid
                bulkActionButtons={false}
                rowClick={(id) => {
                  return createPath({ resource: "samples", id, type: "show" });
                }}
              >
                <TextField source="name" />
                <FunctionField
                  source="type"
                  label="Type"
                  render={(record) => (
                    <SampleTypeChip sampleType={record.type} />
                  )}
                />
                <FunctionField
                  source="treatments"
                  label="Treatments"
                  render={(record) => (
                    <TreatmentChips treatments={record.treatments} />
                  )}
                />
              </Datagrid>
            </ArrayField>
          </TabbedShowLayout.Tab>
          <TabbedShowLayout.Tab label="Experiments">
            <ArrayField source="experiments">
              <Datagrid
                bulkActionButtons={false}
                rowClick={(id) => {
                  return createPath({
                    resource: "experiments",
                    id,
                    type: "show",
                  });
                }}
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
