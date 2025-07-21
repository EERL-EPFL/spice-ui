import React from "react";
import {
    Show,
    SimpleShowLayout,
    TextField,
    TopToolbar,
    EditButton,
    DeleteButton,
    DateField,
    NumberField,
    ReferenceField,
    FunctionField,
    useRecordContext,
    useRedirect,
    Labeled,
    Button,
    Datagrid,
    ListContextProvider,
    ChipField,
    TabbedShowLayout,
    useList,
    Pagination,
} from "react-admin";
import { 
    Box, 
    Typography, 
    ToggleButton, 
    ToggleButtonGroup, 
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";
import { treatmentName } from ".";

const ExperimentalResultsTable = () => {
    const record = useRecordContext();
    const redirect = useRedirect();
    const [frozenFilter, setFrozenFilter] = React.useState('all');
    const [experimentFilter, setExperimentFilter] = React.useState('all');

    if (!record || !record.experimental_results || record.experimental_results.length === 0) {
        return (
            <Typography variant="body2" color="textSecondary" style={{ fontStyle: 'italic' }}>
                No associated experiments found for this treatment.
            </Typography>
        );
    }

    // Categorize results based on actual data
    const categorizeResult = (result) => {
        if (result.final_state === 'frozen') return 'frozen';
        
        // Check if we have actual measurement data for liquid state
        const hasTemperatureData = result.freezing_temperature_avg !== null;
        const hasTimeData = result.freezing_time_seconds !== null;
        
        if (result.final_state === 'liquid' && (hasTemperatureData || hasTimeData)) {
            return 'liquid';
        }
        
        return 'no_result'; // No actual measurement data
    };

    // Get unique experiments for dropdown
    const uniqueExperiments = Array.from(
        new Set(record.experimental_results.map(result => result.experiment_id))
    ).map(experimentId => {
        const result = record.experimental_results.find(r => r.experiment_id === experimentId);
        return {
            id: experimentId,
            name: result?.experiment_name || experimentId
        };
    }).sort((a, b) => a.name.localeCompare(b.name));

    // Filter results based on category and experiment
    const filteredResults = record.experimental_results.filter(result => {
        // Apply frozen state filter
        if (frozenFilter !== 'all' && categorizeResult(result) !== frozenFilter) {
            return false;
        }
        
        // Apply experiment filter
        if (experimentFilter !== 'all' && result.experiment_id !== experimentFilter) {
            return false;
        }
        
        return true;
    });

    const handleFilterChange = (newFilter) => {
        setFrozenFilter(newFilter);
    };

    const handleExperimentFilterChange = (event) => {
        setExperimentFilter(event.target.value);
    };

    const frozenCount = record.experimental_results.filter(r => categorizeResult(r) === 'frozen').length;
    const liquidCount = record.experimental_results.filter(r => categorizeResult(r) === 'liquid').length;
    const noResultCount = record.experimental_results.filter(r => categorizeResult(r) === 'no_result').length;
    const totalCount = record.experimental_results.length;

    // Transform data for React Admin Datagrid
    const resultsWithId = filteredResults.map((result, index) => ({
        id: `${result.experiment_id}-${result.well_coordinate}-${index}`,
        ...result
    }));

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${remainingSeconds}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        } else {
            return `${remainingSeconds}s`;
        }
    };

    const cleanTreatmentName = (name: string) => {
        // Remove the Rust Option wrapper "Some(...)" if present
        if (name && name.startsWith('Some(') && name.endsWith(')')) {
            return name.slice(5, -1);
        }
        return name;
    };

    // Create list context for React Admin
    const listContext = useList({ 
        data: resultsWithId, 
        isPending: false,
        perPage: 10
    });

    return (
        <Box>
            {/* Filter Controls */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <ToggleButtonGroup
                    value={frozenFilter}
                    exclusive
                    onChange={(_, newFilter) => {
                        if (newFilter) {
                            handleFilterChange(newFilter);
                        }
                    }}
                    size="small"
                >
                    <ToggleButton value="all">
                        All ({totalCount})
                    </ToggleButton>
                    <ToggleButton value="frozen">
                        <CheckCircle sx={{ mr: 0.5, fontSize: '1rem' }} />
                        Frozen ({frozenCount})
                    </ToggleButton>
                    <ToggleButton value="liquid">
                        <Cancel sx={{ mr: 0.5, fontSize: '1rem' }} />
                        Liquid ({liquidCount})
                    </ToggleButton>
                    <ToggleButton value="no_result">
                        No Result ({noResultCount})
                    </ToggleButton>
                </ToggleButtonGroup>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Filter by Experiment</InputLabel>
                    <Select
                        value={experimentFilter}
                        onChange={handleExperimentFilterChange}
                        label="Filter by Experiment"
                    >
                        <MenuItem value="all">All Experiments ({uniqueExperiments.length})</MenuItem>
                        {uniqueExperiments.map((experiment) => (
                            <MenuItem key={experiment.id} value={experiment.id}>
                                {experiment.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                
                {filteredResults.length > 0 && (
                    <Chip 
                        label={`${filteredResults.length} results`}
                        size="small"
                        variant="outlined"
                    />
                )}
            </Box>

            {/* Results Datagrid with React Admin */}
            {filteredResults.length > 0 ? (
                <ListContextProvider value={listContext}>
                    <Datagrid bulkActionButtons={false}>
                        <FunctionField 
                            source="experiment_name"
                            label="Experiment"
                            render={(record) => (
                                <Button
                                    onClick={() => redirect('show', 'experiments', record.experiment_id)}
                                    sx={{ 
                                        textTransform: 'none',
                                        p: 0,
                                        minWidth: 'auto',
                                        textDecoration: 'underline',
                                        '&:hover': { textDecoration: 'underline' }
                                    }}
                                >
                                    {record.experiment_name}
                                </Button>
                            )}
                        />
                        <FunctionField
                            source="experiment_date"
                            label="Date"
                            render={(record) => 
                                record.experiment_date ? new Date(record.experiment_date).toLocaleDateString() : '-'
                            }
                        />
                        <TextField source="well_coordinate" label="Well" />
                        <TextField source="tray_name" label="Tray" />
                        <FunctionField 
                            source="sample_name"
                            label="Sample"
                            render={(record) => (
                                record.sample_id ? (
                                    <Button
                                        onClick={() => redirect('show', 'samples', record.sample_id)}
                                        sx={{ 
                                            textTransform: 'none',
                                            p: 0,
                                            minWidth: 'auto',
                                            textDecoration: 'underline',
                                            '&:hover': { textDecoration: 'underline' }
                                        }}
                                    >
                                        {record.sample_name || '-'}
                                    </Button>
                                ) : (record.sample_name || '-')
                            )}
                        />
                        <TextField source="dilution_factor" label="Dilution" />
                        <FunctionField
                            source="freezing_time_seconds"
                            label="Freezing Time"
                            render={(record) => 
                                record.freezing_time_seconds ? formatTime(record.freezing_time_seconds) : '-'
                            }
                        />
                        <FunctionField
                            source="freezing_temperature_avg"
                            label="Avg Temp (°C)"
                            render={(record) => 
                                record.freezing_temperature_avg ? Number(record.freezing_temperature_avg).toFixed(2) : '-'
                            }
                        />
                        <FunctionField
                            source="final_state"
                            label="Final State"
                            render={(record) => (
                                <Chip 
                                    label={record.final_state}
                                    size="small"
                                    sx={{
                                        bgcolor: record.final_state === 'frozen' ? 'success.light' : 'info.light'
                                    }}
                                />
                            )}
                        />
                    </Datagrid>
                    <Pagination />
                </ListContextProvider>
            ) : (
                <Typography variant="body2" color="textSecondary" style={{ fontStyle: 'italic' }}>
                    No experiments found matching the selected filter.
                </Typography>
            )}
        </Box>
    );
};


const TabbedContentWithCounts = () => {
    const record = useRecordContext();
    const experimentCount = record?.experimental_results?.length || 0;
    
    return (
        <TabbedShowLayout>
                <TabbedShowLayout.Tab label="Treatment Details">
                    <Box display="flex" flexDirection="column" gap={2}>
                        <Box display="grid" gridTemplateColumns="1fr 1fr 1fr" gap={2}>
                            <Labeled>
                                <TextField source="id" />
                            </Labeled>
                            <Labeled>
                                <FunctionField
                                    source="name"
                                    label="Treatment Type"
                                    render={record => { return treatmentName[record.name] || record.name; }}
                                />
                            </Labeled>
                            <Labeled>
                                <ReferenceField source="sample_id" reference="samples" link="show">
                                    <TextField source="name" />
                                </ReferenceField>
                            </Labeled>
                        </Box>
                        
                        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                            <Labeled>
                                <NumberField source="enzyme_volume_litres" label="Enzyme Volume (L)" />
                            </Labeled>
                            <Labeled>
                                <TextField source="notes" />
                            </Labeled>
                        </Box>

                        <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                            <Labeled>
                                <DateField source="created_at" showTime />
                            </Labeled>
                            <Labeled>
                                <DateField source="last_updated" showTime />
                            </Labeled>
                        </Box>
                    </Box>
                </TabbedShowLayout.Tab>

                <TabbedShowLayout.Tab label={`Associated Experiments (${experimentCount})`}>
                    <ExperimentalResultsTable />
                </TabbedShowLayout.Tab>
        </TabbedShowLayout>
    );
};

export const ShowComponent = () => {
    return (
        <Show actions={<TopToolbar><EditButton /><DeleteButton /></TopToolbar>}>
            <TabbedContentWithCounts />
        </Show>
    );
};

export default ShowComponent;