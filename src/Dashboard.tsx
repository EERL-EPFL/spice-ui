import { usePermissions, useGetList, useRefresh } from "react-admin";
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
  Paper,
} from "@mui/material";
import {
  Add,
  Visibility,
} from "@mui/icons-material";
import { LocationsMapDashboard } from "./components/LocationsMapDashboard";

const Dashboard = () => {
  const { permissions } = usePermissions();

  // Fetch recent experiments for quick access
  const { data: recentExperiments, isLoading: experimentsLoading } = useGetList("experiments", {
    pagination: { page: 1, perPage: 3 },
    sort: { field: "last_updated", order: "DESC" },
  });

  // Fetch recent samples for quick access
  const { data: recentSamples, isLoading: samplesLoading } = useGetList("samples", {
    pagination: { page: 1, perPage: 3 },
    sort: { field: "last_updated", order: "DESC" },
  });

  // Fetch recent locations for quick access
  const { data: recentLocations, isLoading: locationsLoading } = useGetList("locations", {
    pagination: { page: 1, perPage: 3 },
    sort: { field: "last_updated", order: "DESC" },
  });

  // Fetch all locations for the map
  const { data: allLocations, isLoading: mapLocationsLoading } = useGetList("locations", {
    pagination: { page: 1, perPage: 100 },
    sort: { field: "name", order: "ASC" },
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
    <Box sx={{ p: 1.5, maxHeight: '100vh', overflow: 'hidden' }}>
      {/* Main Content Grid */}
      <Grid container spacing={1.5} sx={{ height: 'calc(100vh - 150px)' }}>
        {/* Left Column: Three Cards Stacked */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
            {/* Experiments Card */}
            <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1">
                    Experiments
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ minWidth: 'auto', p: 0.25, minHeight: 'auto' }}
                      href="#/experiments/create"
                    >
                      <Add sx={{ fontSize: 16 }} />
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ minWidth: 'auto', p: 0.25, minHeight: 'auto' }}
                      href="#/experiments"
                    >
                      <Visibility sx={{ fontSize: 16 }} />
                    </Button>
                  </Box>
                </Box>
                
                {/* Recent Experiments List */}
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Recent (3 most recent)
                </Typography>
                <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                  {experimentsLoading ? (
                    <Typography variant="body2" color="text.secondary">Loading...</Typography>
                  ) : recentExperiments && recentExperiments.length > 0 ? (
                    <Box>
                      {recentExperiments.map((experiment: any) => (
                        <Box
                          key={experiment.id}
                          component="a"
                          href={`#/experiments/${experiment.id}/show`}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            py: 0.25,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            "&:last-child": { borderBottom: "none" },
                            textDecoration: "none",
                            color: "inherit",
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: "action.hover"
                            }
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap>
                              {experiment.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(experiment.last_updated).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No experiments yet
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Samples Card */}
            <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1">
                    Samples
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ minWidth: 'auto', p: 0.25, minHeight: 'auto' }}
                      href="#/samples/create"
                    >
                      <Add sx={{ fontSize: 16 }} />
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ minWidth: 'auto', p: 0.25, minHeight: 'auto' }}
                      href="#/samples"
                    >
                      <Visibility sx={{ fontSize: 16 }} />
                    </Button>
                  </Box>
                </Box>
                
                {/* Recent Samples List */}
                <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                  Recent (3 most recent)
                </Typography>
                <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                  {samplesLoading ? (
                    <Typography variant="body2" color="text.secondary">Loading...</Typography>
                  ) : recentSamples && recentSamples.length > 0 ? (
                    <Box>
                      {recentSamples.map((sample: any) => (
                        <Box
                          key={sample.id}
                          component="a"
                          href={`#/samples/${sample.id}/show`}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            py: 0.25,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            "&:last-child": { borderBottom: "none" },
                            textDecoration: "none",
                            color: "inherit",
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: "action.hover"
                            }
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" noWrap>
                              {sample.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(sample.last_updated).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No samples yet
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Locations Card */}
            <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1">
                  Locations
                </Typography>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ minWidth: 'auto', p: 0.25, minHeight: 'auto' }}
                    href="#/locations/create"
                  >
                    <Add sx={{ fontSize: 16 }} />
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ minWidth: 'auto', p: 0.25, minHeight: 'auto' }}
                    href="#/locations"
                  >
                    <Visibility sx={{ fontSize: 16 }} />
                  </Button>
                </Box>
              </Box>
              
              {/* Recent Locations List */}
              <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                Recent (3 most recent)
              </Typography>
              <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                {locationsLoading ? (
                  <Typography variant="body2" color="text.secondary">Loading...</Typography>
                ) : recentLocations && recentLocations.length > 0 ? (
                  <Box>
                    {recentLocations.map((location: any) => (
                      <Box
                        key={location.id}
                        component="a"
                        href={`#/locations/${location.id}/show`}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 0.25,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          "&:last-child": { borderBottom: "none" },
                          textDecoration: "none",
                          color: "inherit",
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: "action.hover"
                          }
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap>
                            {location.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(location.last_updated).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No locations yet
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
          </Box>
        </Grid>

        {/* Right Column: Locations Map */}
        <Grid item xs={12} md={8} sx={{ flex: 1, minWidth: 0 }}>
          <Paper sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', p: 1.5 }}>
            <Typography variant="subtitle1" gutterBottom>
              Locations Map
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Click on a location polygon to view its details
            </Typography>
            {mapLocationsLoading ? (
              <Typography>Loading locations...</Typography>
            ) : allLocations && allLocations.length > 0 ? (
              <Box sx={{ flex: 1, minHeight: 0, width: '100%' }}>
                <LocationsMapDashboard locations={allLocations} />
              </Box>
            ) : (
              <Alert severity="info">
                No locations found. Create your first location to see it on the map.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
