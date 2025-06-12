import React, { useState, useCallback } from 'react';
import { useDataProvider } from 'react-admin';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Button,
    Box,
    Typography,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    Paper,
} from '@mui/material';

export const TreatmentSelector = (props: {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
    disabled?: boolean;
}) => {
    const dataProvider = useDataProvider();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [campaignId, setCampaignId] = useState<string | null>(null);
    const [sampleId, setSampleId] = useState<string | null>(null);
    const [treatmentId, setTreatmentId] = useState<string | null>(null);

    // Add state for options
    const [campaignOptions, setCampaignOptions] = useState<Array<{ id: string, name: string }>>([]);
    const [sampleOptions, setSampleOptions] = useState<Array<{ id: string, name: string }>>([]);
    const [treatmentOptions, setTreatmentOptions] = useState<Array<{ id: string, name: string }>>([]);

    // Load campaigns when dialog opens
    const loadCampaigns = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await dataProvider.getList('campaigns', {
                pagination: { page: 1, perPage: 500 },
                sort: { field: 'name', order: 'ASC' },
                filter: {}
            });
            setCampaignOptions(data);
        } catch (error) {
            console.error('Error loading campaigns:', error);
            setCampaignOptions([]);
        } finally {
            setLoading(false);
        }
    }, [dataProvider]);

    // Load samples for a selected campaign
    const loadSamples = useCallback(async (campaignId: string) => {
        if (!campaignId) {
            setSampleOptions([]);
            return;
        }

        setLoading(true);
        try {
            const { data } = await dataProvider.getList('samples', {
                pagination: { page: 1, perPage: 500 },
                sort: { field: 'name', order: 'ASC' },
                filter: { campaign_id: campaignId }
            });
            setSampleOptions(data);
        } catch (error) {
            console.error('Error loading samples:', error);
            setSampleOptions([]);
        } finally {
            setLoading(false);
        }
    }, [dataProvider]);

    // Load treatments for a selected sample
    const loadTreatments = useCallback(async (sampleId: string) => {
        if (!sampleId) {
            setTreatmentOptions([]);
            return;
        }

        setLoading(true);
        try {
            const { data } = await dataProvider.getList('treatments', {
                pagination: { page: 1, perPage: 500 },
                sort: { field: 'name', order: 'ASC' },
                filter: { sample_id: sampleId }
            });
            setTreatmentOptions(data);
        } catch (error) {
            console.error('Error loading treatments:', error);
            setTreatmentOptions([]);
        } finally {
            setLoading(false);
        }
    }, [dataProvider]);

    // Handle campaign selection
    const handleCampaignChange = useCallback((event: SelectChangeEvent<string>) => {
        const newCampaignId = event.target.value;
        setCampaignId(newCampaignId);
        setSampleId(null);
        setTreatmentId(null);
        setSampleOptions([]);
        setTreatmentOptions([]);
        if (newCampaignId) {
            loadSamples(newCampaignId);
        }
    }, [loadSamples]);

    // Handle sample selection
    const handleSampleChange = useCallback((event: SelectChangeEvent<string>) => {
        const newSampleId = event.target.value;
        setSampleId(newSampleId);
        setTreatmentId(null);
        setTreatmentOptions([]);
        if (newSampleId) {
            loadTreatments(newSampleId);
        }
    }, [loadTreatments]);

    // Handle treatment selection
    const handleTreatmentChange = useCallback((event: SelectChangeEvent<string>) => {
        setTreatmentId(event.target.value);
    }, []);

    // Handle final selection
    const handleSelect = useCallback(() => {
        if (treatmentId) {
            props.onChange(treatmentId);
            setOpen(false);
        }
    }, [treatmentId, props]);

    // Get treatment name from ID
    const getTreatmentName = useCallback(async () => {
        if (!props.value) return '';

        try {
            const { data } = await dataProvider.getOne('treatments', { id: props.value });
            return data ? `${data.name} (${data.id})` : '';
        } catch (error) {
            console.error('Error fetching treatment:', error);
            return '';
        }
    }, [props.value, dataProvider]);

    // Display the selected treatment name
    const [displayValue, setDisplayValue] = useState('');

    React.useEffect(() => {
        if (props.value) {
            getTreatmentName().then(setDisplayValue);
        } else {
            setDisplayValue('');
        }
    }, [props.value, getTreatmentName]);

    const openDialog = () => {
        setCampaignId(null);
        setSampleId(null);
        setTreatmentId(null);
        setCampaignOptions([]);
        setSampleOptions([]);
        setTreatmentOptions([]);
        setOpen(true);
        loadCampaigns();
    };

    return (
        <div>
            <Box display="flex" alignItems="center" gap={1}>
                <Paper
                    variant="outlined"
                    sx={{
                        padding: '8px 12px',
                        minHeight: '40px',
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: props.disabled ? 'action.disabledBackground' : 'background.paper',
                        color: props.disabled ? 'text.disabled' : 'text.primary'
                    }}
                >
                    <Typography variant="body1" color="inherit">
                        {displayValue || 'No treatment selected'}
                    </Typography>
                </Paper>
                <Button
                    variant="contained"
                    onClick={openDialog}
                    size="small"
                    disabled={props.disabled}
                >
                    Select Treatment
                </Button>
            </Box>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Select a Treatment</DialogTitle>
                <DialogContent>
                    <Box display="flex" flexDirection="column" gap={2} p={1}>
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                1. Select Campaign
                            </Typography>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Campaign</InputLabel>
                                <Select
                                    value={campaignId || ''}
                                    onChange={handleCampaignChange}
                                    label="Campaign"
                                    disabled={loading}
                                >
                                    <MenuItem value="">
                                        <em>Select a campaign...</em>
                                    </MenuItem>
                                    {campaignOptions.map(campaign => (
                                        <MenuItem key={campaign.id} value={campaign.id}>
                                            {campaign.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {campaignId && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    2. Select Sample
                                </Typography>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel>Sample</InputLabel>
                                    <Select
                                        value={sampleId || ''}
                                        onChange={handleSampleChange}
                                        label="Sample"
                                        disabled={loading || sampleOptions.length === 0}
                                    >
                                        <MenuItem value="">
                                            <em>Select a sample...</em>
                                        </MenuItem>
                                        {sampleOptions.map(sample => (
                                            <MenuItem key={sample.id} value={sample.id}>
                                                {sample.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        )}

                        {sampleId && (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>
                                    3. Select Treatment
                                </Typography>

                                {loading ? (
                                    <Box display="flex" justifyContent="center" p={2}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : (
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Treatment</InputLabel>
                                        <Select
                                            value={treatmentId || ''}
                                            onChange={handleTreatmentChange}
                                            label="Treatment"
                                            disabled={treatmentOptions.length === 0}
                                        >
                                            <MenuItem value="">
                                                <em>Select a treatment...</em>
                                            </MenuItem>
                                            {treatmentOptions.map(treatment => (
                                                <MenuItem key={treatment.id} value={treatment.id}>
                                                    {treatment.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </Box>
                        )}
                    </Box>

                    <Box display="flex" justifyContent="flex-end" mt={2}>
                        <Button onClick={() => setOpen(false)} color="inherit">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSelect}
                            color="primary"
                            disabled={!treatmentId}
                            variant="contained"
                            sx={{ ml: 1 }}
                        >
                            Select
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TreatmentSelector;