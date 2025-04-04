import CreateComponent from './Create';
import EditComponent from './Edit';
import ListComponent from './List';
import ShowComponent from './Show';
import SaveIcon from '@mui/icons-material/Save';


export default {
    create: CreateComponent,
    edit: EditComponent,
    list: ListComponent,
    show: ShowComponent,
    icon: SaveIcon,
    options: {
        label: 'Data Assets',
    },
};
