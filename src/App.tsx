/* eslint react/jsx-key: off */
import { useState, useRef, useEffect } from 'react';
import {
    Admin,
    Resource,
    AuthProvider,
    DataProvider,
} from 'react-admin';
import { Route } from 'react-router-dom';
import simpleRestProvider from './dataProvider/index'
import Keycloak, {
    KeycloakTokenParsed,
    KeycloakInitOptions,
} from 'keycloak-js';
import { httpClient } from 'ra-keycloak';
import { keycloakAuthProvider } from './authProvider';
import MyLayout from './layout/Layout';
// import users from './users';
import sensors from './sensors';
import campaigns from "./campaigns";
import plots from './plots';
import experiments from './experiments';
import projects from './projects';
// import transects from './transects';
// import gnss from './gnss';
import axios from 'axios';
// import instruments from './instruments';
import Dashboard from './Dashboard';
import './App.css';


const initOptions: KeycloakInitOptions = { onLoad: 'login-required', checkLoginIframe: false };

const getPermissions = (decoded: KeycloakTokenParsed) => {
    const roles = decoded?.realm_access?.roles;
    if (!roles) {
        return false;
    }
    if (roles.includes('spice-admin')) return 'admin';
    if (roles.includes('spice-user')) return 'user';
    return false;
};


const UIConfigUrl = '/api/config';
export const apiUrl = '/api';

const App = () => {
    const [keycloak, setKeycloak] = useState();
    const initializingPromise = useRef<Promise<Keycloak>>(undefined);
    const authProvider = useRef<AuthProvider>();
    const dataProvider = useRef<DataProvider>();
    const [deployment, setDeployment] = useState(undefined);

    useEffect(() => {
        const initKeyCloakClient = async () => {
            const response = await axios.get(UIConfigUrl);
            const keycloakConfig = response.data;
            setDeployment(response.data.deployment);

            // Initialize Keycloak here, once you have the configuration
            const keycloakClient = new Keycloak({
                url: keycloakConfig.url,
                realm: keycloakConfig.realm,
                clientId: keycloakConfig.clientId,
            });
            await keycloakClient.init(initOptions);

            authProvider.current = keycloakAuthProvider(keycloakClient, {
                onPermissions: getPermissions,
            });
            dataProvider.current = simpleRestProvider(
                apiUrl,
                httpClient(keycloakClient)
            );
            return keycloakClient;
        };

        if (!initializingPromise.current) {
            initializingPromise.current = initKeyCloakClient();
        }

        initializingPromise.current.then(keycloakClient => {
            setKeycloak(keycloakClient);
        });
    }, [keycloak]);

    if (!keycloak) return <p>Loading...</p>;

    return (
        <Admin
            authProvider={authProvider.current}
            dataProvider={dataProvider.current}
            dashboard={Dashboard}
            title="SPICE"
            layout={(props) => <MyLayout {...props} deployment={deployment} />}
        >
            {permissions => (
                <>

                    {permissions ? (
                        <>
                            {/* <Resource name="projects" {...projects} /> */}
                            <Resource name="campaigns" {...campaigns} />
                            <Resource name="experiments" {...experiments} />
                            {/* <Resource name="plots" {...plots.plot} />
                            <Resource name="plot_samples" {...plots.sample} />
                            <Resource name="sensors" {...sensors.sensor} />
                            <Resource name="sensor_profiles" {...sensors.profile} />
                            <Resource name="sensor_profile_assignments" {...sensors.assignments} />
                            <Resource name="sensordata" {...sensors.sensordata} /> */}

                        </>
                    ) : null}
                </>
            )}
        </Admin>
    );
};
export default App;
