import React, { useRef, useState } from 'react';
import {
    useAuthProvider,
    useNotify,
    useRecordContext,
    useRefresh,
} from 'react-admin';

import Uppy from '@uppy/core';
import { DragDrop, ProgressBar, StatusBar } from '@uppy/react';
import XHR from '@uppy/xhr-upload';
import '@uppy/core/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';
import '@uppy/status-bar/dist/style.min.css';
import './UppyUploader.css'; // Import custom CSS

export const UppyUploader = () => {
    const record = useRecordContext();
    if (!record) {
        return null;
    }
    const { id } = record;
    const auth = useAuthProvider();
    const token = auth.getToken();
    const refresh = useRefresh();
    const notify = useNotify();
    const pondRef = useRef(null);
    const instructionText = `
        Drop related assets to this experiment
    `;
    const headers = {
        authorization: `Bearer ${token}`,
    };

    const [uppy] = useState(() => new Uppy({
        // restrictions: { allowedFileTypes: ['.tif'] }
    }).use(XHR, {
        endpoint: `/api/experiments/${id}/uploads`,
        headers: headers,
        limit: 25,
        onAfterResponse: (response) => {
            console.log('onAfterResponse', response);
            const parsedResponse = JSON.parse(response.response);

            if (response.status === 200) {
                notify('File uploaded successfully');
                refresh();
            } else {
                console.log("Response", parsedResponse);
                notify(`Error uploading file: ${parsedResponse.detail.message}`);
            }
        }
    }));

    return (
        <>
            <DragDrop id="dragdrop" uppy={uppy} note={instructionText} />
            <StatusBar id="statusbar" uppy={uppy} />
        </>
    );
};
