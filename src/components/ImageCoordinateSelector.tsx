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

// Freezing-droplets uses the actual image pixel coordinates (no scaling needed)
// The coordinate system matches the full image dimensions

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
  const [isDragging, setIsDragging] = useState<'upper_left' | 'lower_right' | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Connect to React-Admin form fields
  const upperLeftXField = useInput({ source: 'upper_left_corner_x' });
  const upperLeftYField = useInput({ source: 'upper_left_corner_y' });
  const lowerRightXField = useInput({ source: 'lower_right_corner_x' });
  const lowerRightYField = useInput({ source: 'lower_right_corner_y' });

  // Get the logical well coordinates for freezing-droplets library
  const getWellCoordinates = useCallback((qtyRows: number, qtyCols: number, rotation: number) => {
    // For freezing-droplets library, we ALWAYS need:
    // - upper_left_corner: A1 (row=0, col=0) 
    // - lower_right_corner: H12 (row=7, col=11) or last row/col
    // The rotation is handled internally by the freezing-droplets library
    
    // Helper function to create well coordinate string
    const makeWellCoord = (row: number, col: number) => {
      const letter = String.fromCharCode(65 + row); // A=0, B=1, etc.
      const number = col + 1; // 1-based column
      return `${letter}${number}`;
    };
    
    // Always select the logical grid corners regardless of visual rotation
    const upperLeftWell = makeWellCoord(0, 0); // A1 (logical upper-left)
    const lowerRightWell = makeWellCoord(qtyRows - 1, qtyCols - 1); // e.g. H12 (logical lower-right)
    
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

  // Helper function to get actual image bounds within container
  const getImageBounds = useCallback(() => {
    if (!imageRef.current) return null;
    
    const rect = imageRef.current.getBoundingClientRect();
    const img = imageRef.current;
    
    // Calculate the actual displayed image dimensions and position due to object-fit: contain
    const imgAspectRatio = img.naturalWidth / img.naturalHeight;
    const containerAspectRatio = rect.width / rect.height;
    
    let actualWidth, actualHeight, offsetX, offsetY;
    
    if (imgAspectRatio > containerAspectRatio) {
      // Image is wider - limited by container width
      actualWidth = rect.width;
      actualHeight = rect.width / imgAspectRatio;
      offsetX = 0;
      offsetY = (rect.height - actualHeight) / 2;
    } else {
      // Image is taller - limited by container height
      actualWidth = rect.height * imgAspectRatio;
      actualHeight = rect.height;
      offsetX = (rect.width - actualWidth) / 2;
      offsetY = 0;
    }
    
    
    return { actualWidth, actualHeight, offsetX, offsetY, containerRect: rect };
  }, []);

  const handleImageClick = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    if (!selectionMode || !imageRef.current) return;

    const bounds = getImageBounds();
    if (!bounds) return;
    
    const { containerRect, offsetX, offsetY, actualWidth, actualHeight } = bounds;
    const img = imageRef.current;
    
    // Get click position relative to the container
    const containerX = event.clientX - containerRect.left;
    const containerY = event.clientY - containerRect.top;
    
    // Check if click is within the actual image bounds
    if (containerX < offsetX || containerX > offsetX + actualWidth ||
        containerY < offsetY || containerY > offsetY + actualHeight) {
      return; // Click was outside the actual image
    }
    
    // Convert container coordinates to actual image pixel coordinates
    // Freezing-droplets expects actual image pixel coordinates directly
    const imageX = ((containerX - offsetX) / actualWidth) * img.naturalWidth;
    const imageY = ((containerY - offsetY) / actualHeight) * img.naturalHeight;
    
    const x = Math.round(imageX);
    const y = Math.round(imageY);
    

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

  // Handle dragging coordinate indicators
  const handleCoordinateMouseDown = useCallback((event: React.MouseEvent, type: 'upper_left' | 'lower_right') => {
    if (!imageRef.current) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const bounds = getImageBounds();
    if (!bounds) return;
    
    const { containerRect, offsetX, offsetY, actualWidth, actualHeight } = bounds;
    const img = imageRef.current;
    
    // Get current stored coordinates and convert to display coordinates
    const storedX = type === 'upper_left' ? upperLeftXField.field.value : lowerRightXField.field.value;
    const storedY = type === 'upper_left' ? upperLeftYField.field.value : lowerRightYField.field.value;
    
    // No scaling needed - stored coordinates are already actual image pixels
    const currentDisplayX = offsetX + (storedX / img.naturalWidth) * actualWidth;
    const currentDisplayY = offsetY + (storedY / img.naturalHeight) * actualHeight;
    
    // Calculate offset from mouse to center of indicator
    const dragOffsetX = event.clientX - containerRect.left - currentDisplayX;
    const dragOffsetY = event.clientY - containerRect.top - currentDisplayY;
    
    setIsDragging(type);
    setDragOffset({ x: dragOffsetX, y: dragOffsetY });
  }, [upperLeftXField, upperLeftYField, lowerRightXField, lowerRightYField, getImageBounds]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    if (isDragging && imageRef.current) {
      const bounds = getImageBounds();
      if (!bounds) return;
      
      const { containerRect, offsetX, offsetY, actualWidth, actualHeight } = bounds;
      const img = imageRef.current;
      
      // Get mouse position relative to container
      const containerX = event.clientX - containerRect.left - dragOffset.x;
      const containerY = event.clientY - containerRect.top - dragOffset.y;
      
      // Clamp to actual image display bounds
      const clampedContainerX = Math.max(offsetX, Math.min(offsetX + actualWidth, containerX));
      const clampedContainerY = Math.max(offsetY, Math.min(offsetY + actualHeight, containerY));
      
      // Convert to actual image pixel coordinates
      // No additional scaling needed - freezing-droplets expects actual image pixels
      const imageX = ((clampedContainerX - offsetX) / actualWidth) * img.naturalWidth;
      const imageY = ((clampedContainerY - offsetY) / actualHeight) * img.naturalHeight;
      
      const clampedX = Math.round(imageX);
      const clampedY = Math.round(imageY);
      
      // Update form fields
      if (isDragging === 'upper_left') {
        upperLeftXField.field.onChange(clampedX);
        upperLeftYField.field.onChange(clampedY);
      } else if (isDragging === 'lower_right') {
        lowerRightXField.field.onChange(clampedX);
        lowerRightYField.field.onChange(clampedY);
      }
      
      // Update local state
      const newCoordinates = {
        ...coordinates,
        [isDragging === 'upper_left' ? 'upper_left_corner_x' : 'lower_right_corner_x']: clampedX,
        [isDragging === 'upper_left' ? 'upper_left_corner_y' : 'lower_right_corner_y']: clampedY,
      };
      setCoordinates(newCoordinates);
      onChange(newCoordinates);
    } else {
      // Regular hover behavior
      handleImageHover(event);
    }
  }, [isDragging, dragOffset, coordinates, onChange, upperLeftXField, upperLeftYField, lowerRightXField, lowerRightYField, handleImageHover, getImageBounds]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Add global mouse listeners to handle dragging anywhere
  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(null);
        setDragOffset({ x: 0, y: 0 });
      }
    };

    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (isDragging && imageRef.current) {
        const bounds = getImageBounds();
        if (!bounds) return;
        
        const { containerRect, offsetX, offsetY, actualWidth, actualHeight } = bounds;
        const img = imageRef.current;
        
        // Get mouse position relative to container  
        const containerX = event.clientX - containerRect.left - dragOffset.x;
        const containerY = event.clientY - containerRect.top - dragOffset.y;
        
        // Clamp to actual image display bounds and store as display coordinates
        const clampedX = Math.max(offsetX, Math.min(offsetX + actualWidth, containerX));
        const clampedY = Math.max(offsetY, Math.min(offsetY + actualHeight, containerY));
        
        // Update form fields
        if (isDragging === 'upper_left') {
          upperLeftXField.field.onChange(clampedX);
          upperLeftYField.field.onChange(clampedY);
        } else if (isDragging === 'lower_right') {
          lowerRightXField.field.onChange(clampedX);
          lowerRightYField.field.onChange(clampedY);
        }
        
        // Update local state
        const newCoordinates = {
          ...coordinates,
          [isDragging === 'upper_left' ? 'upper_left_corner_x' : 'lower_right_corner_x']: clampedX,
          [isDragging === 'upper_left' ? 'upper_left_corner_y' : 'lower_right_corner_y']: clampedY,
        };
        setCoordinates(newCoordinates);
        onChange(newCoordinates);
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    }
  }, [isDragging, dragOffset, coordinates, onChange, upperLeftXField, upperLeftYField, lowerRightXField, lowerRightYField, getImageBounds]);

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
                    Upload an image of your tray to visually select the image coordinates of wells <strong>{upperLeftWell}</strong> and <strong>{lowerRightWell}</strong>. 
                    <br />Find these specific wells in your image regardless of how the tray is visually rotated.
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
                    {uploadedImage && (
                      <Button size="small" onClick={() => setDialogOpen(true)} color="warning">
                        Adjust Coordinates
                      </Button>
                    )}
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
                const qtyRows = parseInt(formData?.trays?.[0]?.qty_rows) || 8;
                const qtyCols = parseInt(formData?.trays?.[0]?.qty_cols) || 12;
                const rotation = parseInt(formData?.trays?.[0]?.rotation_degrees) || 0;
                const { upperLeftWell, lowerRightWell } = getWellCoordinates(qtyRows, qtyCols, rotation);
                
                return (
                  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    
                    {/* Current step indicator */}
                    <Box mb={3}>
                      <Grid container spacing={2}>
                        {upperLeftXField.field.value === undefined || lowerRightXField.field.value === undefined ? (
                          <>
                            <Grid item xs={6}>
                              <Button
                                variant={selectionMode === 'upper_left' ? 'contained' : 'outlined'}
                                size="large"
                                fullWidth
                                startIcon={<SelectIcon />}
                                onClick={() => setSelectionMode('upper_left')}
                                color={upperLeftXField.field.value !== undefined ? 'success' : 'primary'}
                              >
                                Step 1: Find well {upperLeftWell}
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
                                Step 2: Find well {lowerRightWell}
                              </Button>
                            </Grid>
                          </>
                        ) : (
                          <Grid item xs={12}>
                            <Button
                              variant={selectionMode ? 'outlined' : 'contained'}
                              size="large"
                              fullWidth
                              color="warning"
                              onClick={() => setSelectionMode(selectionMode ? null : 'upper_left')}
                            >
                              {selectionMode ? 'Exit Adjust Mode' : 'Adjust Coordinates'}
                            </Button>
                          </Grid>
                        )}
                      </Grid>
                    </Box>

                    {/* Full size image container */}
                    <Box 
                      sx={{ 
                        flex: 1, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        overflow: 'auto',
                        minHeight: 0, // Important for flex children to shrink
                        padding: 2
                      }}
                    >
                      {/* Image wrapper with relative positioning for crosshairs */}
                      <Box sx={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
                        <img
                          ref={imageRef}
                          src={uploadedImage}
                          alt="Tray setup"
                          style={{
                            width: 'auto',
                            height: 'auto',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            cursor: isDragging ? 'grabbing' : selectionMode ? 'crosshair' : 'default',
                            border: selectionMode ? '3px dashed #1976d2' : '2px solid #ddd',
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            display: 'block'
                          }}
                          onClick={handleImageClick}
                          onMouseMove={handleMouseMove}
                          onMouseLeave={handleImageLeave}
                          onMouseUp={handleMouseUp}
                        />
                      
                      {/* Coordinate Indicators - Crosshairs */}
                      {upperLeftXField.field.value !== undefined && upperLeftYField.field.value !== undefined && (() => {
                        const bounds = getImageBounds();
                        if (!bounds) return null;
                        
                        const { offsetX, offsetY, actualWidth, actualHeight } = bounds;
                        const img = imageRef.current;
                        
                        // Convert stored image pixel coordinates back to display coordinates
                        const displayX = offsetX + (upperLeftXField.field.value / img.naturalWidth) * actualWidth;
                        const displayY = offsetY + (upperLeftYField.field.value / img.naturalHeight) * actualHeight;
                        
                        return (
                          <Box
                            position="absolute"
                            top={displayY}
                            left={displayX}
                          sx={{
                            transform: 'translate(-50%, -50%)',
                            zIndex: 5,
                            pointerEvents: 'none',
                          }}
                        >
                          {/* Vertical line */}
                          <Box
                            sx={{
                              position: 'absolute',
                              left: '50%',
                              top: '-40px',
                              width: '3px',
                              height: '80px',
                              bgcolor: '#4caf50',
                              transform: 'translateX(-50%)',
                              boxShadow: '0 0 6px rgba(76, 175, 80, 0.6)',
                            }}
                          />
                          {/* Horizontal line */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '-40px',
                              height: '3px',
                              width: '80px',
                              bgcolor: '#4caf50',
                              transform: 'translateY(-50%)',
                              boxShadow: '0 0 6px rgba(76, 175, 80, 0.6)',
                            }}
                          />
                          {/* Center dot for dragging */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              width: '12px',
                              height: '12px',
                              bgcolor: '#4caf50',
                              border: '2px solid white',
                              borderRadius: '50%',
                              transform: 'translate(-50%, -50%)',
                              cursor: 'grab',
                              pointerEvents: 'auto',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                              '&:hover': {
                                bgcolor: '#45a049',
                                transform: 'translate(-50%, -50%) scale(1.2)',
                              },
                            }}
                            onMouseDown={(e) => handleCoordinateMouseDown(e, 'upper_left')}
                          />
                          {/* Label */}
                          <Box
                            position="absolute"
                            top={-50}
                            left="50%"
                            sx={{
                              transform: 'translateX(-50%)',
                              bgcolor: 'rgba(76, 175, 80, 0.9)',
                              color: 'white',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: '12px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              pointerEvents: 'none',
                            }}
                          >
                            {upperLeftWell}
                          </Box>
                        </Box>
                        );
                      })()}
                      
                      {lowerRightXField.field.value !== undefined && lowerRightYField.field.value !== undefined && (() => {
                        const bounds = getImageBounds();
                        if (!bounds) return null;
                        
                        const { offsetX, offsetY, actualWidth, actualHeight } = bounds;
                        const img = imageRef.current;
                        
                        // Convert stored image pixel coordinates back to display coordinates
                        const displayX = offsetX + (lowerRightXField.field.value / img.naturalWidth) * actualWidth;
                        const displayY = offsetY + (lowerRightYField.field.value / img.naturalHeight) * actualHeight;
                        
                        return (
                          <Box
                            position="absolute"
                            top={displayY}
                            left={displayX}
                          sx={{
                            transform: 'translate(-50%, -50%)',
                            zIndex: 5,
                            pointerEvents: 'none',
                          }}
                        >
                          {/* Vertical line */}
                          <Box
                            sx={{
                              position: 'absolute',
                              left: '50%',
                              top: '-40px',
                              width: '3px',
                              height: '80px',
                              bgcolor: '#f44336',
                              transform: 'translateX(-50%)',
                              boxShadow: '0 0 6px rgba(244, 67, 54, 0.6)',
                            }}
                          />
                          {/* Horizontal line */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '-40px',
                              height: '3px',
                              width: '80px',
                              bgcolor: '#f44336',
                              transform: 'translateY(-50%)',
                              boxShadow: '0 0 6px rgba(244, 67, 54, 0.6)',
                            }}
                          />
                          {/* Center dot for dragging */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              width: '12px',
                              height: '12px',
                              bgcolor: '#f44336',
                              border: '2px solid white',
                              borderRadius: '50%',
                              transform: 'translate(-50%, -50%)',
                              cursor: 'grab',
                              pointerEvents: 'auto',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                              '&:hover': {
                                bgcolor: '#d32f2f',
                                transform: 'translate(-50%, -50%) scale(1.2)',
                              },
                            }}
                            onMouseDown={(e) => handleCoordinateMouseDown(e, 'lower_right')}
                          />
                          {/* Label */}
                          <Box
                            position="absolute"
                            top={-50}
                            left="50%"
                            sx={{
                              transform: 'translateX(-50%)',
                              bgcolor: 'rgba(244, 67, 54, 0.9)',
                              color: 'white',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: '12px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              pointerEvents: 'none',
                            }}
                          >
                            {lowerRightWell}
                          </Box>
                        </Box>
                        );
                      })()}
                      
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
                      </Box> {/* Close image wrapper */}
                    </Box>

                    {/* Instructions */}
                    <Box mt={2}>
                      {selectionMode && (
                        <Alert severity="info">
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            Step {selectionMode === 'upper_left' ? '1' : '2'}: Click on well {selectionMode === 'upper_left' ? upperLeftWell : lowerRightWell}
                          </Typography>
                          Find and click precisely on the center of well <strong>{selectionMode === 'upper_left' ? upperLeftWell : lowerRightWell}</strong> in the image above. 
                          {selectionMode === 'upper_left' ? ' Look for the well labeled A1 (first row, first column).' : ` Look for the well labeled ${lowerRightWell} (last row, last column).`}
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