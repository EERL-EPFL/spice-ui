import CreateComponent from './Create';
import EditComponent from './Edit';
import ListComponent from './List';
import ShowComponent from './Show';
import ScienceIcon from '@mui/icons-material/Science';

export default {
    create: CreateComponent,
    edit: EditComponent,
    list: ListComponent,
    show: ShowComponent,
    recordRepresentation: 'name',
    icon: ScienceIcon,
};

export const sampleType = {
    'bulk': 'Bulk',
    'filter': 'Filter',
    'procedural_blank': 'ProceduralBlank',
    'pure_water': 'PureWater'
};