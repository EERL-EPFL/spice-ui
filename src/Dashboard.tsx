import { usePermissions } from 'react-admin';
import { Typography } from '@mui/material';
// import FrontendMap from './maps/FrontendMap';
const Dashboard = () => {
    const { permissions } = usePermissions();

    return (
        <><Typography
            variant="h4"
            align='center'
            gutterBottom>
            Welcome to the SPICE project dashboard!
        </Typography>
            {(permissions && permissions === 'admin') ? (
                <></>
            ) : (
                <Typography
                    variant="body"
                    align='center'
                    gutterBottom
                    color='error'>
                    You do not have permission to view this page. Contact a member of the EERL lab for access.
                </Typography >
            )
            }
        </>
    );
};


export default Dashboard;