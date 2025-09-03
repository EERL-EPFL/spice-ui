# SPICE

The SPICE project manages the data produced from ice nucleating particle
experiments. It manages the samples, locations, experiments, and their results.

There are three components to the project:

1. The [API](https://github.com/EERL-EPFL/spice-api)
   - Abstracts the database and file storage,
   - provides an authentication layer,
   - Consolidates logic for data summaries and results.
2. The [UI](https://github.com/EERL-EPFL/spice-ui) _<-- you are here_
   - To visualise and interact with the API.
3. The [Python client](https://github.com/EERL-EPFL/spice-client)
   - A client interface to interact with the database from Python.
   - All methods available in the UI can be programatically accessed through the API.
4. The [freezing-droplets library](https://github.com/EERL-EPFL/freezing-droplets)
   - The SPICE project expects results to be processed with the [freezing-droplets library](https://github.com/EERL-EPFL/freezing-droplets).
   - Although many of the database components in SPICE are agnostic to the results, the results
     processing pipeline is based on its exported outputs and its employed methodology.

# Installation

## Dependencies

The following external dependencies are required for this project

- PostgreSQL with PostGIS extensions
- S3, or S3 compatible storage
- Keycloak for authentication

For development, these are mocked locally in the docker-compose.yaml.

## Development

Inside this repository, a `docker-compose.yaml` provides the necessary services
for a local deployment, however, each individual repository must be first
cloned into their respective directory:

```bash
# Create folder and enter
mkdir spice && cd spice

# Clone this UI and the API
git clone https://github.com/EERL-EPFL/spice-ui.git
git clone https://github.com/EERL-EPFL/spice-api.git

# Enter the UI folder and start the deployment with docker compose
cd spice-ui

# Sync the UI with its dependencies
yarn
docker compose up --build
```

This will start a local Keycloak, MinIO (S3), and PostGIS instance, alongside
the UI and API.

By default, the traefik reverse proxy will listen on port `88`, at `spice`.
Also there is the local development keycloak that needs a separate host, it is
exposed on port 8888, and the development setup requires it to be at spice-keycloak,
Therefore, you should edit your `/etc/hosts` file to include the following lines:

```
127.0.0.1 spice
127.0.0.1 spice-keycloak
```

Then, point your browser to `http://spice:88`. You will be able to login as
an admin user with:

- user: admin
- pass: admin

**Note: Do not use the docker-compose.yaml or keycloak-realm-dev.json for production**. They
may, however, be used to understand the deployment structure. Follow the production guidelines below.

## Production

### Keycloak

A realm must be setup according to keycloak, with admin users assigned to
the **spice-admin** role.
