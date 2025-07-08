import React, { useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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

export const UppyUploader = ({ compact = false }: { compact?: boolean } = {}) => {
    const record = useRecordContext();
    if (!record) {
        return null;
    }
    const { id } = record;
    const auth = useAuthProvider();
    const token = auth.getToken();
    const refresh = useRefresh();
    const notify = useNotify();
    const [isDragActive, setIsDragActive] = useState(false);
    
    const headers = {
        authorization: `Bearer ${token}`,
    };

    const [uppy] = useState(() => new Uppy({
        // Allow multiple files for general asset uploads
        restrictions: { 
            maxNumberOfFiles: 10,
            maxFileSize: 50 * 1024 * 1024, // 50MB per file
        }
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

    const instructionText = compact 
        ? 'Drop files or click to browse'
        : 'Drop related assets to this experiment';

    return (
        <Box sx={{ 
            // Style the Uppy DragDrop component to match OptimizedExcelUploader
            '& .uppy-DragDrop-container': {
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 2,
                padding: compact ? '12px' : '32px',
                textAlign: 'center',
                backgroundColor: 'transparent',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                },
                '&.uppy-DragDrop--isDragDropSupported': {
                    border: '2px dashed',
                    borderColor: 'grey.300',
                },
                '&.uppy-DragDrop--isDragDropSupported:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover',
                }
            },
            '& .uppy-DragDrop-inner': {
                color: 'text.primary',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: compact ? 0.5 : 2,
            },
            '& .uppy-DragDrop-label': {
                fontSize: compact ? '0.875rem' : '1.25rem',
                fontWeight: compact ? 'normal' : 'bold',
                color: 'text.primary',
                margin: 0,
            },
            '& .uppy-DragDrop-note': {
                fontSize: compact ? '0.75rem' : '0.875rem',
                color: 'text.secondary',
                margin: compact ? '4px 0 0 0' : '8px 0 0 0',
            },
            // Hide default Uppy styling
            '& .uppy-DragDrop-browse': {
                color: 'primary.main',
                textDecoration: 'underline',
            }
        }}>
            {/* Add icon before the drag drop area in compact mode */}
            {!compact && (
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <CloudUploadIcon 
                        sx={{ 
                            fontSize: 48, 
                            color: 'primary.main'
                        }} 
                    />
                </Box>
            )}
            <DragDrop 
                uppy={uppy} 
                note={compact ? instructionText : `${instructionText} • Multiple files supported • Max 50MB per file`}
            />
            <StatusBar uppy={uppy} />
        </Box>
    );
};
