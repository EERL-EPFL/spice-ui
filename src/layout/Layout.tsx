import {
    Layout,
    AppBar,
    TitlePortal,
} from 'react-admin';
import { CssBaseline, Typography } from '@mui/material';

const MyAppBar = (props: any) => {
    console.log("props", props)
    const appBarText = () => {
        if (props.deployment) {
            if (props.deployment == 'local') {
                return "⭐Local Development⭐"
            }
            if (props.deployment == 'dev') {
                return "⭐Development⭐"
            }
            if (props.deployment == 'stage') {
                return "⭐Staging⭐"
            }
        }
    }

    return (
        <AppBar>
            <TitlePortal variant="body2" component="h3" />
            <Typography
                variant="h6"
                color='#FF69B4'
                id="react-admin-title"
            >
                {props.deployment ? appBarText() : ""}
            </Typography>

        </AppBar >
    )
};


const MyLayout = ({ children, deployment }: { children: any; deployment: any }) => {
    console.log("MyLayout deployment", deployment)
    console.log("MyLayout children", children)
    return (
        <>
            <CssBaseline />
            <Layout appBar={() => <MyAppBar deployment={deployment} />} >
                {children}
            </Layout>
        </>
    )
};

export default MyLayout;
