import React, { useRef, useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Chip, Stack, Tooltip } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
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
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadMessage, setUploadMessage] = useState('');
    const [uploadDetails, setUploadDetails] = useState<{successful: any[], failed: any[]}>({successful: [], failed: []});
    
    const headers = {
        authorization: `Bearer ${token}`,
    };

    const [uppy] = useState(() => new Uppy({
        // Allow multiple files for general asset uploads
        restrictions: { 
            maxNumberOfFiles: 10,
            maxFileSize: 50 * 1024 * 1024, // 50MB per file
        },
        autoProceed: true, // Automatically upload files when they're added
    }).use(XHR, {
        endpoint: `/api/experiments/${id}/uploads`,
        headers: headers,
        limit: 25,
        validateStatus: (statusCode: number) => {
            // Tell Uppy to treat 409 as a validation error rather than network error
            return statusCode >= 200 && statusCode < 300;
        },
        onAfterResponse: (response, retryCount, options) => {
            console.log('onAfterResponse - full response object:', response);
            console.log('onAfterResponse - response.response:', response.response);
            console.log('onAfterResponse - response.status:', response.status);
            
            if (response.status === 200) {
                refresh();
                return response;
            } else if (response.status === 409) {
                // For 409, we want to extract the actual server message
                // and throw a more specific error that our error handler can catch
                let serverMessage = 'Duplicate file - already exists in experiment';
                
                // Server returns plain text for 409 errors
                if (response.response && typeof response.response === 'string') {
                    serverMessage = response.response;
                } else if (response.responseText) {
                    serverMessage = response.responseText;
                }
                
                console.log('Extracted server message for 409:', serverMessage);
                
                // Create a new error object that contains the server message
                const error = new Error(serverMessage) as any;
                error.isRequestError = true;
                error.source = { status: 409, responseText: serverMessage };
                throw error;
            }
            
            return response;
        }
    }));

    // Set up Uppy event listeners
    useEffect(() => {
        const handleUploadStart = () => {
            setIsUploading(true);
            setUploadStatus('uploading');
            setUploadProgress(0);
            setUploadMessage('');
            setUploadDetails({successful: [], failed: []});
        };

        const handleProgress = (progress: number) => {
            setUploadProgress(progress);
        };

        const handleComplete = (result: any) => {
            setIsUploading(false);
            
            // Store detailed results for tooltip
            setUploadDetails({
                successful: result.successful || [],
                failed: result.failed || []
            });
            
            // Check if there were actually successful uploads
            if (result.successful.length > 0 && result.failed.length === 0) {
                setUploadStatus('success');
                setUploadMessage(`Successfully uploaded ${result.successful.length} file(s)`);
            } else if (result.failed.length > 0 && result.successful.length === 0) {
                // If no successful uploads but there were failures
                setUploadStatus('error');
                setUploadMessage(`Failed to upload ${result.failed.length} file(s)`);
            } else if (result.successful.length > 0 && result.failed.length > 0) {
                // Mixed results
                setUploadStatus('error');
                setUploadMessage(`${result.successful.length} uploaded, ${result.failed.length} failed`);
            }
            
            // Clear Uppy state but keep status message until next upload
            setTimeout(() => {
                uppy.cancelAll();
            }, 1000);
        };

        const handleError = (error: any) => {
            setIsUploading(false);
            setUploadStatus('error');
            
            // Try to extract a meaningful error message
            let errorMessage = 'Upload failed';
            if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            setUploadMessage(errorMessage);
            setUploadDetails({successful: [], failed: [{name: 'Unknown file', error: errorMessage}]});
            console.error('Upload error:', error);
            
            // Clear Uppy state but keep status message until next upload
            setTimeout(() => {
                uppy.cancelAll();
            }, 1000);
        };

        const handleUploadError = (file: any, error: any, response: any) => {
            // Handle individual file upload errors - but don't immediately set status
            // Let the complete handler deal with final status based on overall results
            let errorMessage = 'Upload failed';
            let isFileConflict = false;
            
            console.log('Upload error details:', { error, response, file: file.name });
            
            // Check for file conflict (409 status)
            if (error?.isRequestError && error?.source?.status === 409) {
                errorMessage = error.source.responseText || error.message;
                isFileConflict = true;
            } else if (error?.message && error.message.includes('already exists in experiment')) {
                errorMessage = error.message;
                isFileConflict = true;
            } else if (response?.status === 409) {
                // Try to get the actual server message for 409 conflicts
                try {
                    if (response.body && typeof response.body === 'string') {
                        errorMessage = response.body;
                    } else if (response.response) {
                        errorMessage = response.response;
                    } else {
                        errorMessage = `File '${file.name}' already exists in this experiment`;
                    }
                    isFileConflict = true;
                } catch (e) {
                    errorMessage = `File '${file.name}' already exists in this experiment`;
                    isFileConflict = true;
                }
            } else if (response?.body?.detail?.message) {
                errorMessage = response.body.detail.message;
            } else if (response?.body?.message) {
                errorMessage = response.body.message;
            } else if (response?.body && typeof response.body === 'string') {
                errorMessage = response.body;
            } else if (response?.response && typeof response.response === 'string') {
                errorMessage = response.response;
            } else if (error?.message && !error.message.includes('network error')) {
                // Handle non-network errors from error object
                if (error.message.includes('JSON.parse')) {
                    if (response?.status === 413) {
                        errorMessage = 'File too large';
                    } else if (response?.status === 415) {
                        errorMessage = 'File type not supported';
                    } else if (response?.status === 500) {
                        errorMessage = 'Server error';
                    } else {
                        errorMessage = `Server error (${response?.status || 'unknown'})`;
                    }
                } else {
                    errorMessage = error.message;
                }
            } else if (response?.status) {
                // Fallback based on HTTP status code
                switch (response.status) {
                    case 409:
                        errorMessage = `File '${file.name}' already exists in this experiment`;
                        isFileConflict = true;
                        break;
                    case 413:
                        errorMessage = 'File too large';
                        break;
                    case 415:
                        errorMessage = 'File type not supported';
                        break;
                    case 500:
                        errorMessage = 'Server error';
                        break;
                    default:
                        errorMessage = `HTTP ${response.status} error`;
                }
            }
            
            // Show appropriate notification for file conflicts
            if (isFileConflict) {
                notify(`⚠️ ${errorMessage}. Delete the existing file first if you want to re-upload.`, { type: 'warning' });
            }
            
            // Store this error for the details
            setUploadDetails(prev => ({
                ...prev,
                failed: [...prev.failed, {
                    name: file.name,
                    error: errorMessage
                }]
            }));
            
            console.error(`Upload error for ${file.name}:`, errorMessage);
        };

        uppy.on('upload', handleUploadStart);
        uppy.on('progress', handleProgress);
        uppy.on('complete', handleComplete);
        uppy.on('error', handleError);
        uppy.on('upload-error', handleUploadError);

        return () => {
            uppy.off('upload', handleUploadStart);
            uppy.off('progress', handleProgress);
            uppy.off('complete', handleComplete);
            uppy.off('error', handleError);
            uppy.off('upload-error', handleUploadError);
        };
    }, [uppy]);

    const instructionText = compact 
        ? 'Drop files or click to browse'
        : 'Drop related assets to this experiment';

    // Create tooltip content for upload details
    const createTooltipContent = () => {
        return (
            <Box sx={{ maxWidth: 400 }}>
                {uploadDetails.successful.length > 0 && (
                    <Box sx={{ mb: uploadDetails.failed.length > 0 ? 2 : 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}>
                            ✅ Successfully uploaded:
                        </Typography>
                        {uploadDetails.successful.map((file, index) => (
                            <Typography key={index} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                                • {file.name}
                            </Typography>
                        ))}
                    </Box>
                )}
                
                {uploadDetails.failed.length > 0 && (
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main', mb: 1 }}>
                            ❌ Failed uploads:
                        </Typography>
                        {uploadDetails.failed.map((file, index) => (
                            <Box key={index} sx={{ ml: 2, mb: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    • {file.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 2, display: 'block' }}>
                                    {file.error || 'Unknown error'}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            // Style the Uppy DragDrop component to match OptimizedExcelUploader
            '& .uppy-DragDrop-container': {
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 2,
                padding: compact ? 1.5 : 4,
                textAlign: 'center',
                backgroundColor: 'transparent',
                transition: 'all 0.2s ease-in-out',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                minHeight: compact ? 'auto' : undefined,
                ...(!isUploading && {
                    '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                    }
                }),
                '&.uppy-DragDrop--isDragDropSupported': {
                    border: '2px dashed',
                    borderColor: 'grey.300',
                },
                ...(!isUploading && {
                    '&.uppy-DragDrop--isDragDropSupported:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: 'action.hover',
                    }
                })
            },
            '& .uppy-DragDrop-inner': {
                color: 'text.primary',
                display: 'flex',
                flexDirection: compact ? 'row' : 'column',
                alignItems: 'center',
                gap: compact ? 0.5 : 2,
                padding: 0,
            },
            '& .uppy-DragDrop-label': {
                fontSize: compact ? '0.75rem' : '1.25rem',
                fontWeight: compact ? 'normal' : 'bold',
                color: 'text.primary',
                margin: 0,
                display: compact ? 'none' : 'block',
            },
            '& .uppy-DragDrop-note': {
                fontSize: compact ? '0.75rem' : '0.875rem',
                color: 'text.primary',
                margin: 0,
                lineHeight: compact ? 1.2 : 1.5,
            },
            // Hide the arrow icon in compact mode
            '& .uppy-DragDrop-arrow': {
                display: compact ? 'none' : 'block',
                width: compact ? 0 : 'auto',
                height: compact ? 0 : 'auto',
                margin: 0,
            },
            // Hide default Uppy styling
            '& .uppy-DragDrop-browse': {
                color: 'primary.main',
                textDecoration: 'underline',
            },
            // Hide status bar in compact mode
            '& .uppy-StatusBar': {
                display: compact ? 'none' : 'block',
            }
        }}>
            {/* Upload area container */}
            <Box sx={{ flex: compact ? '0 0 auto' : 1 }}>
                {/* Add icon before the drag drop area in non-compact mode */}
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
                {!compact && uploadStatus === 'idle' && <StatusBar uppy={uppy} />}
            </Box>
            
            {/* Progress indicator and status messages - always reserve space in compact mode */}
            {compact && (
                <Box sx={{ 
                    flex: '1 1 auto', 
                    minWidth: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start'
                }}>
                    {isUploading && (
                        <Box sx={{ width: '100%' }}>
                            <LinearProgress 
                                variant="determinate" 
                                value={uploadProgress} 
                                sx={{ mb: 0.5 }}
                            />
                            <Typography variant="caption" color="text.secondary" align="center" display="block">
                                {uploadProgress}%
                            </Typography>
                        </Box>
                    )}
                    
                    {uploadStatus === 'success' && (
                        <Tooltip title={createTooltipContent()} arrow placement="top">
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ cursor: 'help' }}>
                                <CheckCircleIcon color="success" sx={{ fontSize: '1rem' }} />
                                <Typography variant="caption" color="success.main" noWrap>
                                    {uploadMessage}
                                </Typography>
                            </Stack>
                        </Tooltip>
                    )}
                    
                    {uploadStatus === 'error' && (
                        <Tooltip title={createTooltipContent()} arrow placement="top">
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ cursor: 'help' }}>
                                <ErrorIcon color="error" sx={{ fontSize: '1rem' }} />
                                <Typography variant="caption" color="error" noWrap>
                                    {uploadMessage}
                                </Typography>
                            </Stack>
                        </Tooltip>
                    )}
                </Box>
            )}
            
            {/* Non-compact mode status - below the upload area */}
            {!compact && (isUploading || uploadStatus !== 'idle') && (
                <Box sx={{ mt: 2 }}>
                    {isUploading && (
                        <Box sx={{ width: '100%' }}>
                            <LinearProgress 
                                variant="determinate" 
                                value={uploadProgress} 
                                sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary" align="center" display="block">
                                Uploading... {uploadProgress}%
                            </Typography>
                        </Box>
                    )}
                    
                    {uploadStatus === 'success' && (
                        <Tooltip title={createTooltipContent()} arrow placement="top">
                            <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ cursor: 'help' }}>
                                <CheckCircleIcon color="success" fontSize="small" />
                                <Typography variant="caption" color="success.main">
                                    {uploadMessage}
                                </Typography>
                            </Stack>
                        </Tooltip>
                    )}
                    
                    {uploadStatus === 'error' && (
                        <Tooltip title={createTooltipContent()} arrow placement="top">
                            <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" sx={{ cursor: 'help' }}>
                                <ErrorIcon color="error" fontSize="small" />
                                <Typography variant="caption" color="error">
                                    {uploadMessage}
                                </Typography>
                            </Stack>
                        </Tooltip>
                    )}
                </Box>
            )}
        </Box>
    );
};
