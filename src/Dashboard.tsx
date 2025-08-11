import React, { useState } from 'react';
import { usePermissions, useGetList } from 'react-admin';
import { 
    Typography, 
    Box, 
    Grid, 
    Card, 
    CardContent, 
    CardActions, 
    Button, 
    Alert,
    Chip,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Fab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Add,
    Science,
    Assessment,
    Timeline,
    PlayArrow,
    Visibility,
    Close,
} from '@mui/icons-material';

// Import the wizard
import ExperimentWizard from './wizard/ExperimentWizard';

const Dashboard = () => {
    const { permissions } = usePermissions();
    const [wizardOpen, setWizardOpen] = useState(false);
    const [resumeExperimentId, setResumeExperimentId] = useState<string | undefined>(undefined);

    // Fetch recent experiments for quick access
    const { data: recentExperiments, isLoading } = useGetList(
        'experiments',
        {
            pagination: { page: 1, perPage: 5 },
            sort: { field: 'performed_at', order: 'DESC' }
        }
    );

    const startNewExperiment = () => {
        setResumeExperimentId(undefined);
        setWizardOpen(true);
    };

    const resumeExperiment = (experimentId: string) => {
        setResumeExperimentId(experimentId);
        setWizardOpen(true);
    };

    const closeWizard = () => {
        setWizardOpen(false);
        setResumeExperimentId(undefined);
    };

    const handleWizardComplete = (experiment: any) => {
        console.log('Experiment completed:', experiment);
        closeWizard();
        // Could show success message or redirect
    };

    if (!permissions) {
        return (
            <Alert severity="error" sx={{ m: 2 }}>
                You do not have permission to view this page. Contact a member of the EERL lab for access.
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            {/* Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h3" gutterBottom color="primary">
                    SPICE Laboratory
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    Submicron Particle Ice Nucleation Experiments
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Manage your ice nucleation research workflow from sample collection to analysis
                </Typography>
            </Box>

            {/* Quick Actions */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Science color="primary" />
                                <Typography variant="h6">
                                    New Experiment
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Start a guided workflow to create and run a complete ice nucleation experiment.
                                From sample collection through final analysis.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button
                                variant="contained"
                                onClick={startNewExperiment}
                                startIcon={<Add />}
                                fullWidth
                                size="large"
                            >
                                Start New Experiment
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <Assessment color="secondary" />
                                <Typography variant="h6">
                                    View Results
                                </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Browse completed experiments, analyze results, and export data.
                                Access all your experimental data and visualizations.
                            </Typography>
                        </CardContent>
                        <CardActions>
                            <Button
                                variant="outlined"
                                startIcon={<Visibility />}
                                fullWidth
                                size="large"
                                href="#/experiments"
                            >
                                Browse Experiments
                            </Button>
                        </CardActions>
                    </Card>
                </Grid>
            </Grid>

            {/* Recent Experiments */}
            <Paper sx={{ p: 2, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Recent Experiments
                </Typography>
                {isLoading ? (
                    <Typography>Loading recent experiments...</Typography>
                ) : recentExperiments && recentExperiments.length > 0 ? (
                    <List>
                        {recentExperiments.map((experiment: any) => {
                            const hasResults = experiment.results_summary?.total_time_points > 0;
                            const isIncomplete = !hasResults;
                            
                            return (
                                <ListItem
                                    key={experiment.id}
                                    sx={{
                                        border: 1,
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                        mb: 1,
                                    }}
                                >
                                    <ListItemIcon>
                                        {hasResults ? <Assessment color="success" /> : <Timeline color="warning" />}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={experiment.name}
                                        secondary={
                                            <Box>
                                                <Typography variant="body2">
                                                    {new Date(experiment.performed_at).toLocaleDateString()}
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                                    <Chip
                                                        size="small"
                                                        label={hasResults ? 'Completed' : 'In Progress'}
                                                        color={hasResults ? 'success' : 'warning'}
                                                    />
                                                    {experiment.is_calibration && (
                                                        <Chip size="small" label="Calibration" variant="outlined" />
                                                    )}
                                                </Box>
                                            </Box>
                                        }
                                    />
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        {isIncomplete && (
                                            <Button
                                                size="small"
                                                onClick={() => resumeExperiment(experiment.id)}
                                                startIcon={<PlayArrow />}
                                                color="warning"
                                            >
                                                Resume
                                            </Button>
                                        )}
                                        <Button
                                            size="small"
                                            href={`#/experiments/${experiment.id}/show`}
                                            startIcon={<Visibility />}
                                        >
                                            View
                                        </Button>
                                    </Box>
                                </ListItem>
                            );
                        })}
                    </List>
                ) : (
                    <Alert severity="info">
                        No experiments found. Create your first experiment using the wizard above.
                    </Alert>
                )}
            </Paper>

            {/* Quick Statistics */}
            <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Total Experiments
                            </Typography>
                            <Typography variant="h4">
                                {recentExperiments?.length || 0}+
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Completed Today
                            </Typography>
                            <Typography variant="h4">
                                {recentExperiments?.filter((exp: any) => 
                                    new Date(exp.performed_at).toDateString() === new Date().toDateString()
                                ).length || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                In Progress
                            </Typography>
                            <Typography variant="h4">
                                {recentExperiments?.filter((exp: any) => 
                                    !exp.results_summary?.total_time_points
                                ).length || 0}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="subtitle2" color="text.secondary">
                                Success Rate
                            </Typography>
                            <Typography variant="h4">
                                {recentExperiments?.length ? 
                                    Math.round((recentExperiments.filter((exp: any) => 
                                        exp.results_summary?.total_time_points > 0
                                    ).length / recentExperiments.length) * 100)
                                    : 0}%
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Floating Action Button for Mobile */}
            <Fab
                color="primary"
                aria-label="start experiment"
                sx={{
                    position: 'fixed',
                    bottom: 16,
                    right: 16,
                    display: { md: 'none' },
                }}
                onClick={startNewExperiment}
            >
                <Add />
            </Fab>

            {/* Experiment Wizard - Embedded in Dashboard */}
            {wizardOpen && (
                <ExperimentWizard
                    experimentId={resumeExperimentId}
                    onComplete={handleWizardComplete}
                    onExit={closeWizard}
                />
            )}
        </Box>
    );
};


export default Dashboard;