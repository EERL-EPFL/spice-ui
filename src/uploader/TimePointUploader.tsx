import React, { useRef, useState } from 'react';
import {
    useAuthProvider,
    useNotify,
    useRecordContext,
    useRefresh,
} from 'react-admin';

import Uppy from '@uppy/core';
import { DragDrop, StatusBar } from '@uppy/react';
import '@uppy/core/dist/style.min.css';
import '@uppy/drag-drop/dist/style.min.css';
import '@uppy/status-bar/dist/style.min.css';
import './UppyUploader.css';
import { PhaseChangeParser, TimePointData } from './PhaseChangeParser';

export const TimePointUploader = () => {
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
        The file will be automatically processed and uploaded as time point data
    `;

    const [isProcessing, setIsProcessing] = useState(false);

    const processAndUploadTimePoints = async (file: File) => {
        if (isProcessing) return;
        
        setIsProcessing(true);
        try {
            notify('Processing merged.xlsx file...', { type: 'info' });
            
            // Parse the Excel file
            const result = await PhaseChangeParser.parseExcelFile(file);
            
            console.log('Parsed Excel result:', result);
            
            if (result.errors.length > 0) {
                console.warn('Excel parsing warnings:', result.errors);
                notify(`Parsing warnings: ${result.errors.length} issues found (see console)`, { type: 'warning' });
            }
            
            if (result.rows.length === 0) {
                console.error('No rows found in parsed result:', result);
                throw new Error('No phase change data found in merged.xlsx file. Check console for details.');
            }
            
            // Convert to time points format
            const timePoints = PhaseChangeParser.convertToTimePoints(result.rows);
            
            console.log('Converted time points:', timePoints);
            
            if (timePoints.length === 0) {
                throw new Error('No valid time points could be created from the data');
            }
            
            notify(`Converted to ${timePoints.length} time points. Uploading...`, { type: 'info' });
            
            // Upload all time points in a single batch request
            try {
                const response = await fetch(`/api/experiments/${id}/time_points/batch`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(timePoints),
                });
                
                if (response.ok) {
                    const result = await response.json();
                    const successCount = result.processed_count || 0;
                    const errors = result.errors || [];
                    
                    if (successCount > 0) {
                        notify(`Successfully uploaded ${successCount} time points!`, { type: 'success' });
                        refresh();
                    }
                    
                    if (errors.length > 0) {
                        console.error('Upload errors:', errors);
                        notify(`${errors.length} time points failed to upload (see console for details)`, { type: 'warning' });
                    }
                } else {
                    const errorText = await response.text();
                    console.error('Batch upload failed:', errorText);
                    throw new Error(`Batch upload failed: ${errorText}`);
                }
            } catch (error) {
                console.error('Error during batch upload:', error);
                throw new Error(`Batch upload failed: ${error.message}`);
            }
            
        } catch (error) {
            console.error('Error processing merged.xlsx file:', error);
            notify(`Error processing merged.xlsx file: ${error.message}`, { type: 'error' });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrop = (files: FileList) => {
        console.log('Files dropped:', files);
        if (files.length > 0) {
            const file = files[0];
            console.log('Processing file:', file.name);
            processAndUploadTimePoints(file);
        }
    };

    const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log('File input changed:', event.target.files);
        if (event.target.files && event.target.files.length > 0) {
            const file = event.target.files[0];
            console.log('Processing file:', file.name);
            processAndUploadTimePoints(file);
        }
    };

    return (
        <div>
            <div 
                style={{
                    border: '2px dashed #ccc',
                    borderRadius: '4px',
                    padding: '20px',
                    textAlign: 'center',
                    marginBottom: '10px',
                    backgroundColor: isProcessing ? '#f5f5f5' : 'white',
                    cursor: isProcessing ? 'not-allowed' : 'pointer'
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    if (!isProcessing) {
                        handleDrop(e.dataTransfer.files);
                    }
                }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !isProcessing && document.getElementById('file-input-time-points')?.click()}
            >
                <div style={{ color: isProcessing ? '#999' : '#666' }}>
                    {isProcessing ? 'Processing...' : instructionText}
                </div>
                <input
                    id="file-input-time-points"
                    type="file"
                    accept=".xlsx"
                    style={{ display: 'none' }}
                    onChange={handleFileInput}
                    disabled={isProcessing}
                />
            </div>
            {isProcessing && (
                <div style={{ textAlign: 'center', color: '#666' }}>
                    Processing file, please wait...
                </div>
            )}
        </div>
    );
};