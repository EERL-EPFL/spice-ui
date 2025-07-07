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
import './UppyUploader.css'; // Use same styles
import { PhaseChangeParser } from './PhaseChangeParser';

export const PhaseChangeUploader = () => {
    const record = useRecordContext();
    if (!record) {
        return null;
    }
    const { id } = record;
    const auth = useAuthProvider();
    const token = auth.getToken();
    const refresh = useRefresh();
    const notify = useNotify();
    
    const instructionText = `
        Drop merged.xlsx file from the freezing droplets application here
        The file will be automatically processed to extract phase states and temperature readings for each well
    `;
    const headers = {
        authorization: `Bearer ${token}`,
    };

    const [uppy] = useState(() => new Uppy({
        restrictions: { 
            allowedFileTypes: ['.xlsx'],
            maxNumberOfFiles: 1
        }
    }).use(XHR, {
        endpoint: `/api/experiments/${id}/phase_changes/upload`,
        headers: headers,
        limit: 1,
        onBeforeRequest: async (request) => {
            // Process the merged.xlsx file
            const files = uppy.getFiles();
            if (files.length > 0) {
                const file = files[0];
                
                try {
                    notify('Processing merged.xlsx file...', { type: 'info' });
                    
                    // Parse the Excel file
                    const result = await PhaseChangeParser.parseExcelFile(file.data);
                    
                    if (result.errors.length > 0) {
                        console.warn('Excel parsing warnings:', result.errors);
                        notify(`Parsing warnings: ${result.errors.length} issues found (see console)`, { type: 'warning' });
                    }
                    
                    if (result.rows.length === 0) {
                        throw new Error('No phase change data found in merged.xlsx file');
                    }
                    
                    // Convert to CSV format for backend
                    const csvData = PhaseChangeParser.convertToCSV(result.rows);
                    
                    // Create a new CSV blob
                    const csvBlob = new Blob([csvData], { type: 'text/csv' });
                    
                    // Replace the file data in the request
                    request.body.delete('file');
                    request.body.append('file', csvBlob, 'processed_phase_changes.csv');
                    
                    notify(`Processed ${result.rows.length} phase change records from merged.xlsx`, { type: 'success' });
                    
                } catch (error) {
                    notify(`Error processing merged.xlsx file: ${error.message}`, { type: 'error' });
                    return Promise.reject(error);
                }
            }
            
            return request;
        },
        onAfterResponse: (response) => {
            console.log('Phase change upload response', response);
            const parsedResponse = JSON.parse(response.response);

            if (response.status === 200) {
                notify(`Phase change data uploaded successfully. Processed ${parsedResponse.processed_count} records.`, { type: 'success' });
                refresh();
            } else {
                console.log("Error response", parsedResponse);
                notify(`Error uploading phase change data: ${parsedResponse.detail?.message || parsedResponse.detail}`, { type: 'error' });
            }
        }
    }));

    return (
        <>
            <DragDrop 
                id="phase-change-dragdrop" 
                uppy={uppy} 
                note={instructionText}
                locale={{
                    strings: {
                        dropHereOr: 'Drop merged.xlsx file here or %{browse}',
                        browse: 'browse'
                    }
                }}
            />
            <StatusBar id="phase-change-statusbar" uppy={uppy} />
        </>
    );
};