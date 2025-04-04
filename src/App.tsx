import { useState, useRef, useEffect } from 'react';
import {
    Admin,
    Resource,
    AuthProvider,
    DataProvider,
} from 'react-admin';
import simpleRestProvider from './dataProvider/index'
import Keycloak, {
    KeycloakTokenParsed,
    KeycloakInitOptions,
} from 'keycloak-js';
import { httpClient } from 'ra-keycloak';
import { keycloakAuthProvider } from './authProvider';
import MyLayout from './layout/Layout';
import samples from './samples';
import assets from './assets';
import campaigns from "./campaigns";
import experiments from './experiments';
import axios from 'axios';
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
                            <Resource name="campaigns" {...campaigns} />
                            <Resource name="samples" {...samples} />
                            <Resource name="experiments" {...experiments} />
                            <Resource name="assets" {...assets} />
                        </>
                    ) : null}
                </>
            )}
        </Admin>
    );
};
export default App;
