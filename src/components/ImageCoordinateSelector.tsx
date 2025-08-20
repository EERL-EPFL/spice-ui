import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  Grid,
  Chip,
  IconButton,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Clear as ClearIcon,
  CropFree as SelectIcon,
} from "@mui/icons-material";

interface ImageCoordinateSelectorProps {
  value?: {
    upper_left_corner_x?: number;
    upper_left_corner_y?: number;
    lower_right_corner_x?: number;
    lower_right_corner_y?: number;
  };
  onChange: (coordinates: any) => void;
}

const ImageCoordinateSelector: React.FC<ImageCoordinateSelectorProps> = ({
  value = {},
  onChange,
}) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<'upper_left' | 'lower_right' | null>(null);
  const [coordinates, setCoordinates] = useState(value || {});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    if (!selectionMode || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);

    const newCoordinates = {
      upper_left_corner_x: coordinates.upper_left_corner_x,
      upper_left_corner_y: coordinates.upper_left_corner_y,
      lower_right_corner_x: coordinates.lower_right_corner_x,
      lower_right_corner_y: coordinates.lower_right_corner_y,
      [`${selectionMode}_x`]: x,
      [`${selectionMode}_y`]: y,
    };

    setCoordinates(newCoordinates);
    onChange(newCoordinates);
    setSelectionMode(null);
  }, [selectionMode, coordinates, onChange]);

  const clearImage = () => {
    setUploadedImage(null);
    setSelectionMode(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearCoordinates = () => {
    const clearedCoordinates = {
      upper_left_corner_x: undefined,
      upper_left_corner_y: undefined,
      lower_right_corner_x: undefined,
      lower_right_corner_y: undefined,
    };
    setCoordinates(clearedCoordinates);
    onChange(clearedCoordinates);
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="subtitle2" gutterBottom color="primary">
        Image Corner Coordinates
      </Typography>

      {!uploadedImage ? (
        <Box>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            fullWidth
          >
            Upload Tray Image
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Upload an image of your tray to visually select corner coordinates
          </Typography>
        </Box>
      ) : (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="body2" fontWeight="bold">
              Click corners on the image
            </Typography>
            <Box>
              <IconButton size="small" onClick={clearCoordinates} title="Clear coordinates">
                <ClearIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={clearImage} title="Remove image">
                <ClearIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          <Grid container spacing={2} mb={2}>
            <Grid item xs={6}>
              <Button
                variant={selectionMode === 'upper_left' ? 'contained' : 'outlined'}
                size="small"
                fullWidth
                startIcon={<SelectIcon />}
                onClick={() => setSelectionMode('upper_left')}
                color={coordinates.upper_left_corner_x !== undefined ? 'success' : 'primary'}
              >
                Upper Left
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant={selectionMode === 'lower_right' ? 'contained' : 'outlined'}
                size="small"
                fullWidth
                startIcon={<SelectIcon />}
                onClick={() => setSelectionMode('lower_right')}
                color={coordinates.lower_right_corner_x !== undefined ? 'success' : 'primary'}
              >
                Lower Right
              </Button>
            </Grid>
          </Grid>

          <Box position="relative" display="inline-block">
            <img
              ref={imageRef}
              src={uploadedImage}
              alt="Tray setup"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                cursor: selectionMode ? 'crosshair' : 'default',
                border: selectionMode ? '2px dashed #1976d2' : '1px solid #ddd',
              }}
              onClick={handleImageClick}
            />

            {/* Show selected coordinates as overlays */}
            {coordinates.upper_left_corner_x !== undefined && coordinates.upper_left_corner_y !== undefined && (
              <Box
                position="absolute"
                top={coordinates.upper_left_corner_y}
                left={coordinates.upper_left_corner_x}
                sx={{
                  width: 8,
                  height: 8,
                  bgcolor: 'success.main',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  border: '2px solid white',
                  boxShadow: 1,
                }}
              />
            )}

            {coordinates.lower_right_corner_x !== undefined && coordinates.lower_right_corner_y !== undefined && (
              <Box
                position="absolute"
                top={coordinates.lower_right_corner_y}
                left={coordinates.lower_right_corner_x}
                sx={{
                  width: 8,
                  height: 8,
                  bgcolor: 'error.main',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  border: '2px solid white',
                  boxShadow: 1,
                }}
              />
            )}
          </Box>

          {selectionMode && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Click on the {selectionMode.replace('_', ' ')} corner of your tray area in the image above.
            </Alert>
          )}

          {/* Show coordinate values */}
          {(coordinates.upper_left_corner_x !== undefined || coordinates.lower_right_corner_x !== undefined) && (
            <Box mt={2}>
              <Typography variant="body2" gutterBottom>Selected Coordinates:</Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {coordinates.upper_left_corner_x !== undefined && (
                  <Chip 
                    size="small" 
                    label={`UL: (${coordinates.upper_left_corner_x}, ${coordinates.upper_left_corner_y})`}
                    color="success"
                  />
                )}
                {coordinates.lower_right_corner_x !== undefined && (
                  <Chip 
                    size="small" 
                    label={`LR: (${coordinates.lower_right_corner_x}, ${coordinates.lower_right_corner_y})`}
                    color="error"
                  />
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default ImageCoordinateSelector;