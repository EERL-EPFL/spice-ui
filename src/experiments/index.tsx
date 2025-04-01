import CreateComponent from './Create';
import EditComponent from './Edit';
import ListComponent from './List';
import ShowComponent from './Show';
import BiotechIcon from '@mui/icons-material/Biotech';


export default {
    create: CreateComponent,
    edit: EditComponent,
    list: ListComponent,
    show: ShowComponent,
    // recordRepresentation: (record: { name: string }) => record.name,
    icon: BiotechIcon,
};
