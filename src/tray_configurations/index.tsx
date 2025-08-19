import CreateComponent from "./Create";
import EditComponent from "./Edit";
import ListComponent from "./List";
import ShowComponent from "./Show";
import AppRegistrationIcon from "@mui/icons-material/AppRegistration";

export default {
  create: CreateComponent,
  edit: EditComponent,
  list: ListComponent,
  show: ShowComponent,
  icon: AppRegistrationIcon,
  options: {
    label: "Trays",
  },
};
