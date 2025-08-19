import React from "react";
import { usePermissions, useGetList } from "react-admin";
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  Add,
  Science,
  Assessment,
  PlayArrow,
  Visibility,
} from "@mui/icons-material";

const Dashboard = () => {
  const { permissions } = usePermissions();

  // Fetch recent experiments for quick access
  const { data: recentExperiments, isLoading } = useGetList("experiments", {
    pagination: { page: 1, perPage: 5 },
    sort: { field: "updated_at", order: "DESC" },
  });

  if (!permissions) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        You do not have permission to view this page. Contact a member of the
        EERL lab for access.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom color="primary">
          SPICE Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Submicron Particle Ice Nucleation Analysis
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Experiments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create new experiments or browse existing ones
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  size="medium"
                  href="#/experiments/create"
                >
                  Create New
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Visibility />}
                  size="medium"
                  href="#/experiments"
                >
                  Browse All
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sample Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage samples and treatments
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<Science />}
                  size="medium"
                  href="#/samples"
                >
                  Samples
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Assessment />}
                  size="medium"
                  href="#/treatments"
                >
                  Treatments
                </Button>
              </Box>
            </CardContent>
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
            {recentExperiments.map((experiment: any) => (
              <ListItem
                key={experiment.id}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemIcon>
                  <Assessment color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={experiment.name}
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        Last updated:{" "}
                        {new Date(
                          experiment.updated_at || experiment.performed_at,
                        ).toLocaleString()}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        {experiment.is_calibration && (
                          <Chip
                            size="small"
                            label="Calibration"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    href={`#/experiments/${experiment.id}/show`}
                    startIcon={<Visibility />}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    href={`#/experiments/${experiment.id}/edit`}
                    startIcon={<PlayArrow />}
                    variant="outlined"
                  >
                    Edit
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        ) : (
          <Alert severity="info">
            No experiments found. Create your first experiment using the button
            above.
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard;
