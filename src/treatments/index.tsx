import CreateComponent from './Create';
import EditComponent from './Edit';
import ListComponent from './List';
import ShowComponent from './Show';
import ColorizeIcon from '@mui/icons-material/Colorize';

export default {
    create: CreateComponent,
    edit: EditComponent,
    // list: ListComponent,
    show: ShowComponent,
    recordRepresentation: (record) => `${treatmentName[record.name] || record.name} (${record.id.slice(0, 8)}...)`,
    icon: ColorizeIcon,
};

export const treatmentName = {
    'none': 'None',
    'heat': 'Heat',
    'h2o2': 'H2O2'
}