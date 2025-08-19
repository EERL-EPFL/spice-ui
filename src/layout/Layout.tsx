import { Layout, AppBar, TitlePortal, Sidebar } from "react-admin";
import { CssBaseline, Typography } from "@mui/material";

const MyAppBar = (props: any) => {
  const appBarText = () => {
    if (props.deployment) {
      if (props.deployment == "local") {
        return "⭐Local Development⭐";
      }
      if (props.deployment == "dev") {
        return "⭐Development⭐";
      }
      if (props.deployment == "stage") {
        return "⭐Staging⭐";
      }
    }
  };

  return (
    <AppBar>
      <TitlePortal variant="body2" component="h3" />
      <Typography variant="h6" color="#FF69B4" id="react-admin-title">
        {props.deployment ? appBarText() : ""}
      </Typography>
    </AppBar>
  );
};

const MySidebar = (props: any) => (
  <Sidebar {...props} sx={{ '& .RaSidebar-drawerPaper': { width: 180 } }} />
);

const MyLayout = ({
  children,
  deployment,
}: {
  children: any;
  deployment: any;
}) => {
  return (
    <>
      <CssBaseline />
      <Layout 
        appBar={() => <MyAppBar deployment={deployment} />}
        sidebar={MySidebar}
      >
        {children}
      </Layout>
    </>
  );
};

export default MyLayout;
