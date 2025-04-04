import { Typography } from '@mui/material';
import {
    Create,
    SimpleForm,
    TextField,
    TextInput,
    required,
    NumberInput,
    DateTimeInput,
    ReferenceInput,
    SelectInput,
    BooleanField,
    BooleanInput,
} from 'react-admin';

const CreateComponent = () => {
    return (
        <Create redirect="show">
            <Typography variant="body1" color="textSecondary">
                To upload files, do it from an experiment
            </Typography>

        </Create>
    );
};

export default CreateComponent;
