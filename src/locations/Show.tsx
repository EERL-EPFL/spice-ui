import React from "react";
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
  useDataProvider,
} from "react-admin";
import { Box, Typography, Card, CardContent, Chip, Button, TablePagination, TextField as MuiTextField, InputAdornment, TableSortLabel } from "@mui/material";
import { Add as AddIcon, Search as SearchIcon } from "@mui/icons-material";
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

// Helper component to create tab labels with counts
const TabLabelWithCount = ({ label, count }: { label: string; count: number }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Typography>{label}</Typography>
    <Chip 
      label={count} 
      size="small" 
      color="primary" 
      sx={{ 
        height: 20, 
        fontSize: '0.75rem',
        '& .MuiChip-label': { px: 1 }
      }} 
    />
  </Box>
);

// Samples tab content with create button - uses data provider for JWT auth
const SamplesTabContent = ({ onCountChange }: { onCountChange?: (count: number) => void }) => {
  const record = useRecordContext();
  const redirect = useRedirect();
  const createPath = useCreatePath();
  const dataProvider = useDataProvider();
  const [samples, setSamples] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [totalSamples, setTotalSamples] = React.useState(0);

  React.useEffect(() => {
    if (record?.id) {
      dataProvider.getLocationSamples('locations', { locationId: record.id })
        .then(response => {
          console.log('Samples API response:', response.data);
          // Ensure data is always an array
          const samplesArray = Array.isArray(response.data) ? response.data : [];
          setSamples(samplesArray);
          setTotalSamples(samplesArray.length);
          // Update parent count
          onCountChange?.(samplesArray.length);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching samples:', error);
          setSamples([]); // Set empty array on error
          setTotalSamples(0);
          onCountChange?.(0);
          setLoading(false);
        });
    }
  }, [record?.id, dataProvider]);

  const handleCreateSample = () => {
    // Use redirect with state data to prefill the location_id
    redirect('create', 'samples', undefined, {}, { record: { location_id: record?.id } });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter, sort, and paginate samples
  const filteredSamples = searchQuery
    ? samples.filter((s: any) => s.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : samples;
  const sortedSamples = [...filteredSamples].sort((a: any, b: any) => {
    const cmp = (a.name ?? '').localeCompare(b.name ?? '');
    return sortDirection === 'asc' ? cmp : -cmp;
  });
  const paginatedSamples = sortedSamples.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) return <div>Loading samples...</div>;

  return (
    <Box>
      {/* Header with search and create button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2, alignItems: 'center' }}>
        <MuiTextField
          size="small"
          placeholder="Search samples..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
          sx={{ width: 250 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateSample}
          size="small"
        >
          Create Sample
        </Button>
      </Box>

      {/* Samples data grid - manual table since we're using custom data */}
      <Box sx={{ mt: 2 }}>
        {filteredSamples.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
            No samples found for this location
          </Typography>
        ) : (
          <>
            <Box sx={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600 }}>
                      <TableSortLabel
                        active
                        direction={sortDirection}
                        onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                      >
                        Name
                      </TableSortLabel>
                    </th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600 }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600 }}>Treatments</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSamples.map((sample: any) => (
                    <tr 
                      key={sample.id} 
                      style={{ 
                        borderBottom: '1px solid #f0f0f0',
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                      }}
                      onClick={() => {
                        const path = createPath({ resource: "samples", id: sample.id, type: "show" });
                        redirect(path);
                      }}
                    >
                      <td style={{ padding: '12px 8px' }}>{sample.name}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <SampleTypeChip sampleType={sample.type} />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <TreatmentChips treatments={sample.treatments} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
            
            {/* Pagination controls */}
            <TablePagination
              component="div"
              count={filteredSamples.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
              showFirstButton
              showLastButton
            />
          </>
        )}
      </Box>
    </Box>
  );
};

// Experiments tab content - uses data provider for JWT auth
const ExperimentsTabContent = ({ onCountChange }: { onCountChange?: (count: number) => void }) => {
  const record = useRecordContext();
  const redirect = useRedirect();
  const createPath = useCreatePath();
  const dataProvider = useDataProvider();
  const [experiments, setExperiments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [totalExperiments, setTotalExperiments] = React.useState(0);

  React.useEffect(() => {
    if (record?.id) {
      dataProvider.getLocationExperiments('locations', { locationId: record.id })
        .then(response => {
          console.log('Experiments API response:', response.data);
          // Ensure data is always an array
          const experimentsArray = Array.isArray(response.data) ? response.data : [];
          setExperiments(experimentsArray);
          setTotalExperiments(experimentsArray.length);
          // Update parent count
          onCountChange?.(experimentsArray.length);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching experiments:', error);
          setExperiments([]); // Set empty array on error
          setTotalExperiments(0);
          onCountChange?.(0);
          setLoading(false);
        });
    }
  }, [record?.id, dataProvider]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Filter, sort, and paginate experiments
  const filteredExperiments = searchQuery
    ? experiments.filter((e: any) => e.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : experiments;
  const sortedExperiments = [...filteredExperiments].sort((a: any, b: any) => {
    const cmp = (a.name ?? '').localeCompare(b.name ?? '');
    return sortDirection === 'asc' ? cmp : -cmp;
  });
  const paginatedExperiments = sortedExperiments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) return <div>Loading experiments...</div>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <MuiTextField
          size="small"
          placeholder="Search experiments..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
          sx={{ width: 250 }}
        />
      </Box>
      {filteredExperiments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
          No experiments found for this location
        </Typography>
      ) : (
        <>
          <Box sx={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600 }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600 }}>
                    <TableSortLabel
                      active
                      direction={sortDirection}
                      onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    >
                      Name
                    </TableSortLabel>
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600 }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {paginatedExperiments.map((experiment: any) => (
                  <tr 
                    key={experiment.id} 
                    style={{ 
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const path = createPath({ resource: "experiments", id: experiment.id, type: "show" });
                      redirect(path);
                    }}
                  >
                    <td style={{ padding: '12px 8px' }}>
                      {experiment.performed_at ? new Date(experiment.performed_at).toLocaleString() : '-'}
                    </td>
                    <td style={{ padding: '12px 8px' }}>{experiment.name}</td>
                    <td style={{ padding: '12px 8px' }}>{experiment.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
          
          {/* Pagination controls */}
          <TablePagination
            component="div"
            count={filteredExperiments.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            showFirstButton
            showLastButton
          />
        </>
      )}
    </Box>
  );
};

export const ShowComponent = () => {
  const redirect = useRedirect();
  const createPath = useCreatePath();
  const record = useRecordContext();
  const [samplesCount, setSamplesCount] = React.useState(0);
  const [experimentsCount, setExperimentsCount] = React.useState(0);

  // Wrapper components that pass count setters to content components
  const SamplesTabWithCount = () => <SamplesTabContent onCountChange={setSamplesCount} />;
  const ExperimentsTabWithCount = () => <ExperimentsTabContent onCountChange={setExperimentsCount} />;
  
  return (
    <Show actions={<ShowComponentActions />}>
      <SimpleShowLayout>
        <LocationInfo />
        <TabbedShowLayout>
          <TabbedShowLayout.Tab 
            label={<TabLabelWithCount label="Samples" count={samplesCount} />}
          >
            <SamplesTabWithCount />
          </TabbedShowLayout.Tab>
          <TabbedShowLayout.Tab 
            label={<TabLabelWithCount label="Experiments" count={experimentsCount} />}
          >
            <ExperimentsTabWithCount />
          </TabbedShowLayout.Tab>
        </TabbedShowLayout>
      </SimpleShowLayout>
    </Show>
  );
};

export default ShowComponent;
