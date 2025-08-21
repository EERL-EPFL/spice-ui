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
  Dialog,
  DialogContent,
  AppBar,
  Toolbar,
  Slide,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  CropFree as SelectIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useInput, FormDataConsumer } from "react-admin";
import { TransitionProps } from "@mui/material/transitions";
import { transformCellToWellCoordinate } from "../utils/coordinateTransforms";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState<'upper_left' | 'lower_right' | null>(null);
  const [coordinates, setCoordinates] = useState(value || {});
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [magnifiedCanvas, setMagnifiedCanvas] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Connect to React-Admin form fields
  const upperLeftXField = useInput({ source: 'upper_left_corner_x' });
  const upperLeftYField = useInput({ source: 'upper_left_corner_y' });
  const lowerRightXField = useInput({ source: 'lower_right_corner_x' });
  const lowerRightYField = useInput({ source: 'lower_right_corner_y' });

  // Calculate well coordinates by finding what wells appear at the visual corners
  const getWellCoordinates = useCallback((qtyRows: number, qtyCols: number, rotation: number) => {
    // Calculate which original wells appear at the visual display corners after rotation
    let upperLeftWell: string, lowerRightWell: string;
    
    // Helper function to create well coordinate string
    const makeWellCoord = (row: number, col: number) => {
      const letter = String.fromCharCode(65 + row); // A=0, B=1, etc.
      const number = col + 1; // 1-based column
      return `${letter}${number}`;
    };
    
    switch (rotation) {
      case 90:
        // For 90° clockwise rotation:
        // Upper left display corner shows original (qtyRows-1, 0) = bottom-left original
        // Lower right display corner shows original (0, qtyCols-1) = top-right original
        upperLeftWell = makeWellCoord(qtyRows - 1, 0); // Bottom row, first column
        lowerRightWell = makeWellCoord(0, qtyCols - 1); // Top row, last column
        break;
      case 180:
        // For 180° rotation:
        // Upper left display shows original (qtyRows-1, qtyCols-1) = bottom-right original
        // Lower right display shows original (0, 0) = top-left original  
        upperLeftWell = makeWellCoord(qtyRows - 1, qtyCols - 1);
        lowerRightWell = makeWellCoord(0, 0);
        break;
      case 270:
        // For 270° clockwise rotation:
        // Upper left display shows original (0, qtyCols-1) = top-right original
        // Lower right display shows original (qtyRows-1, 0) = bottom-left original
        upperLeftWell = makeWellCoord(0, qtyCols - 1);
        lowerRightWell = makeWellCoord(qtyRows - 1, 0);
        break;
      default: // 0 degrees
        // No rotation: upper left is A1, lower right is last row/column
        upperLeftWell = makeWellCoord(0, 0); // A1
        lowerRightWell = makeWellCoord(qtyRows - 1, qtyCols - 1); // e.g. H12
        break;
    }
    
    
    return { upperLeftWell, lowerRightWell };
  }, []);

  // Create magnified view of image area around cursor
  const createMagnifiedView = useCallback((x: number, y: number) => {
    if (!imageRef.current || !uploadedImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const zoomFactor = 1.05; // Very subtle magnification
      const sourceSize = 120; // Much larger source area for context
      const canvasSize = 126; // Adjusted canvas size (120 * 1.05)
      
      canvas.width = canvasSize;
      canvas.height = canvasSize;

      // Calculate source coordinates (centered on cursor position)
      const sourceX = Math.max(0, Math.min(img.width - sourceSize, x - sourceSize/2));
      const sourceY = Math.max(0, Math.min(img.height - sourceSize, y - sourceSize/2));

      // Draw magnified portion
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceSize, sourceSize,
        0, 0, canvasSize, canvasSize
      );

      // Add crosshair
      ctx.strokeStyle = '#1976d2';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvasSize/2, 0);
      ctx.lineTo(canvasSize/2, canvasSize);
      ctx.moveTo(0, canvasSize/2);
      ctx.lineTo(canvasSize, canvasSize/2);
      ctx.stroke();

      setMagnifiedCanvas(canvas.toDataURL());
    };
    img.src = uploadedImage;
  }, [uploadedImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setDialogOpen(true);
        setSelectionMode('upper_left'); // Start with upper left selection
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    if (!selectionMode || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);

    // Update form fields directly
    if (selectionMode === 'upper_left') {
      upperLeftXField.field.onChange(x);
      upperLeftYField.field.onChange(y);
    } else if (selectionMode === 'lower_right') {
      lowerRightXField.field.onChange(x);
      lowerRightYField.field.onChange(y);
    }

    const newCoordinates = {
      upper_left_corner_x: selectionMode === 'upper_left' ? x : coordinates.upper_left_corner_x,
      upper_left_corner_y: selectionMode === 'upper_left' ? y : coordinates.upper_left_corner_y,
      lower_right_corner_x: selectionMode === 'lower_right' ? x : coordinates.lower_right_corner_x,
      lower_right_corner_y: selectionMode === 'lower_right' ? y : coordinates.lower_right_corner_y,
    };

    setCoordinates(newCoordinates);
    onChange(newCoordinates);
    
    // Auto-progress to next selection or close dialog
    if (selectionMode === 'upper_left') {
      setSelectionMode('lower_right');
    } else if (selectionMode === 'lower_right') {
      setSelectionMode(null);
      // Close dialog after both coordinates are selected
      setTimeout(() => {
        setDialogOpen(false);
      }, 500);
    }
  }, [selectionMode, coordinates, onChange, upperLeftXField, upperLeftYField, lowerRightXField, lowerRightYField]);

  // Handle mouse hover for zoom effect
  const handleImageHover = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Calculate relative position for magnification (scale to actual image dimensions)
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;
    const imageX = x * scaleX;
    const imageY = y * scaleY;
    
    setHoverPosition({ x, y });
    createMagnifiedView(imageX, imageY);
  }, [createMagnifiedView]);

  const handleImageLeave = useCallback(() => {
    setHoverPosition(null);
    setMagnifiedCanvas(null);
  }, []);

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectionMode(null);
    setHoverPosition(null);
  };

  const clearCoordinates = () => {
    upperLeftXField.field.onChange(undefined);
    upperLeftYField.field.onChange(undefined);
    lowerRightXField.field.onChange(undefined);
    lowerRightYField.field.onChange(undefined);
    
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
    <>
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle2" gutterBottom color="primary">
          Image Corner Coordinates
        </Typography>

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
            sx={{ mb: 2 }}
          >
            Upload Tray Image
          </Button>
          
          <FormDataConsumer>
            {({ formData }) => {
              const upperLeftX = upperLeftXField.field.value;
              const upperLeftY = upperLeftYField.field.value;
              const lowerRightX = lowerRightXField.field.value;
              const lowerRightY = lowerRightYField.field.value;
              
              const qtyRows = parseInt(formData?.trays?.[0]?.qty_rows) || 8;
              const qtyCols = parseInt(formData?.trays?.[0]?.qty_cols) || 12;
              const rotation = parseInt(formData?.trays?.[0]?.rotation_degrees) || 0;
              const { upperLeftWell, lowerRightWell } = getWellCoordinates(qtyRows, qtyCols, rotation);
              
              if (!upperLeftX && !lowerRightX) {
                return (
                  <Alert severity="info">
                    Upload an image of your tray to visually select the corner coordinates of wells {upperLeftWell} and {lowerRightWell}.
                  </Alert>
                );
              }
              
              return (
                <Box>
                  <Typography variant="body2" gutterBottom fontWeight="bold">
                    Selected Coordinates:
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                    {upperLeftX !== undefined && (
                      <Chip 
                        size="small" 
                        label={`${upperLeftWell}: (${upperLeftX}, ${upperLeftY})`}
                        color="success"
                        variant="filled"
                      />
                    )}
                    {lowerRightX !== undefined && (
                      <Chip 
                        size="small" 
                        label={`${lowerRightWell}: (${lowerRightX}, ${lowerRightY})`}
                        color="error" 
                        variant="filled"
                      />
                    )}
                  </Box>
                  
                  {upperLeftX !== undefined && lowerRightX !== undefined && (
                    <Alert severity="success">
                      ✓ Tray mapping complete! Your well coordinates are configured.
                    </Alert>
                  )}
                  
                  <Box display="flex" gap={1} mt={2}>
                    <Button size="small" onClick={clearCoordinates} color="error">
                      Clear Coordinates
                    </Button>
                    <Button size="small" onClick={() => fileInputRef.current?.click()}>
                      Upload New Image
                    </Button>
                  </Box>
                </Box>
              );
            }}
          </FormDataConsumer>
        </Box>
      </Paper>

      {/* Full-screen Image Selection Dialog */}
      <Dialog
        fullScreen
        open={dialogOpen}
        onClose={closeDialog}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flex: 1 }}>
              Select Tray Corner Coordinates
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={closeDialog}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <DialogContent sx={{ p: 3, bgcolor: 'background.default' }}>
          {uploadedImage && (
            <FormDataConsumer>
              {({ formData }) => {
                console.log('FormData in ImageCoordinateSelector:', formData);
                const qtyRows = parseInt(formData?.trays?.[0]?.qty_rows) || 8;
                const qtyCols = parseInt(formData?.trays?.[0]?.qty_cols) || 12;
                const rotation = parseInt(formData?.trays?.[0]?.rotation_degrees) || 0;
                console.log('Parsed values:', { qtyRows, qtyCols, rotation, raw_rotation: formData?.rotation_degrees });
                const { upperLeftWell, lowerRightWell } = getWellCoordinates(qtyRows, qtyCols, rotation);
                
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    
                    {/* Current step indicator */}
                    <Box mb={3}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Button
                            variant={selectionMode === 'upper_left' ? 'contained' : 'outlined'}
                            size="large"
                            fullWidth
                            startIcon={<SelectIcon />}
                            onClick={() => setSelectionMode('upper_left')}
                            color={upperLeftXField.field.value !== undefined ? 'success' : 'primary'}
                          >
                            Step 1: Upper Left ({upperLeftWell})
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            variant={selectionMode === 'lower_right' ? 'contained' : 'outlined'}
                            size="large" 
                            fullWidth
                            startIcon={<SelectIcon />}
                            onClick={() => setSelectionMode('lower_right')}
                            color={lowerRightXField.field.value !== undefined ? 'success' : 'primary'}
                            disabled={upperLeftXField.field.value === undefined}
                          >
                            Step 2: Lower Right ({lowerRightWell})
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Full size image */}
                    <Box 
                      sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <img
                        ref={imageRef}
                        src={uploadedImage}
                        alt="Tray setup"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          cursor: selectionMode ? 'crosshair' : 'default',
                          border: selectionMode ? '3px dashed #1976d2' : '2px solid #ddd',
                          borderRadius: '8px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                        onClick={handleImageClick}
                        onMouseMove={handleImageHover}
                        onMouseLeave={handleImageLeave}
                      />
                      
                      {/* Enhanced hover zoom bubble with magnified image */}
                      {hoverPosition && selectionMode && (
                        <Box
                          position="absolute"
                          top={Math.max(20, hoverPosition.y - 90)}
                          left={Math.min(window.innerWidth - 160, hoverPosition.x + 20)}
                          sx={{
                            pointerEvents: 'none',
                            zIndex: 10,
                          }}
                        >
                          {/* Magnified image circle */}
                          <Box
                            sx={{
                              width: 130,
                              height: 130,
                              border: '3px solid #1976d2',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                              bgcolor: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {magnifiedCanvas ? (
                              <img
                                src={magnifiedCanvas}
                                alt="Magnified view"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  color: '#666',
                                  fontSize: '12px',
                                  textAlign: 'center'
                                }}
                              >
                                Loading...
                              </Box>
                            )}
                          </Box>
                          
                          {/* Label below the magnified circle */}
                          <Box
                            sx={{
                              mt: 1,
                              bgcolor: 'rgba(0,0,0,0.8)',
                              color: 'white',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1,
                              textAlign: 'center',
                              minWidth: 100,
                            }}
                          >
                            <Typography variant="caption" fontWeight="bold" display="block">
                              Click: {selectionMode === 'upper_left' ? upperLeftWell : lowerRightWell}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {/* Instructions */}
                    <Box mt={2}>
                      {selectionMode && (
                        <Alert severity="info">
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Step {selectionMode === 'upper_left' ? '1' : '2'}: Click on well {selectionMode === 'upper_left' ? upperLeftWell : lowerRightWell}
                          </Typography>
                          Click precisely on the center of the {selectionMode === 'upper_left' ? upperLeftWell : lowerRightWell} well in the image above. 
                          {selectionMode === 'upper_left' ? ' This is the top-left well of your tray.' : ' This is the bottom-right well of your tray.'}
                        </Alert>
                      )}
                      
                      {!selectionMode && upperLeftXField.field.value !== undefined && lowerRightXField.field.value !== undefined && (
                        <Alert severity="success">
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            ✓ Both coordinates selected successfully!
                          </Typography>
                          The dialog will close automatically. Your tray mapping is now complete.
                        </Alert>
                      )}
                    </Box>
                    
                  </Box>
                );
              }}
            </FormDataConsumer>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ImageCoordinateSelector;