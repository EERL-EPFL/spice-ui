import { Menu, MenuItemLink, DashboardMenuItem, useResourceDefinitions } from 'react-admin';
import { Divider } from '@mui/material';

export const CustomMenu = () => {
  const resources = useResourceDefinitions();
  
  return (
    <Menu>
      <DashboardMenuItem />
      <Divider sx={{ my: 1 }} />
      {/* Projects */}
      {resources.projects && (
        <MenuItemLink
          to="/projects"
          state={{ _scrollToTop: true }}
          primaryText="Projects"
          leftIcon={resources.projects.icon ? <resources.projects.icon /> : null}
        />
      )}

      {/* Trays */}
      {resources.tray_configurations && (
        <MenuItemLink
          to="/tray_configurations"
          state={{ _scrollToTop: true }}
          primaryText="Trays"
          leftIcon={resources.tray_configurations.icon ? <resources.tray_configurations.icon /> : null}
        />
      )}

      {/* First Divider - before main entities */}
      <Divider sx={{ my: 1 }} />

      {/* Locations */}
      {resources.locations && (
        <MenuItemLink
          to="/locations"
          state={{ _scrollToTop: true }}
          primaryText="Locations"
          leftIcon={resources.locations.icon ? <resources.locations.icon /> : null}
        />
      )}

      {/* Samples */}
      {resources.samples && (
        <MenuItemLink
          to="/samples"
          state={{ _scrollToTop: true }}
          primaryText="Samples"
          leftIcon={resources.samples.icon ? <resources.samples.icon /> : null}
        />
      )}

      {/* Experiments */}
      {resources.experiments && (
        <MenuItemLink
          to="/experiments"
          state={{ _scrollToTop: true }}
          primaryText="Experiments"
          leftIcon={resources.experiments.icon ? <resources.experiments.icon /> : null}
        />
      )}

    </Menu>
  );
};