/**
 * Matrix-based coordinate transformation for tray rotations
 * Uses standard 2D rotation matrices to handle coordinate transformations
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface WellPosition {
  row: number; // 0-based row index
  col: number; // 0-based column index
}

/**
 * Create a 2D rotation matrix for the given angle in degrees
 * Rotation is clockwise (positive angle = clockwise rotation)
 */
function createRotationMatrix(degrees: number): number[][] {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  // Standard 2D rotation matrix (clockwise)
  return [
    [cos, sin],
    [-sin, cos],
  ];
}

/**
 * Apply matrix transformation to a point
 */
function applyMatrix(matrix: number[][], point: Point2D): Point2D {
  return {
    x: matrix[0][0] * point.x + matrix[0][1] * point.y,
    y: matrix[1][0] * point.x + matrix[1][1] * point.y,
  };
}

/**
 * Transform well coordinates based on tray rotation
 *
 * @param position - The grid position (row, col) to transform
 * @param rotation - Rotation in degrees (0, 90, 180, 270)
 * @param cols - Number of columns in the grid
 * @param rows - Number of rows in the grid
 * @returns The well coordinate string (e.g., "A1", "H12") that should be displayed at this position
 */
/**
 * Get the well coordinate that should appear at a given grid position after rotation
 * This is now just a wrapper around getWellAtVisualPosition for consistency
 */
export function getWellCoordinateForRotatedPosition(
  position: WellPosition,
  rotation: number,
  cols: number,
  rows: number,
): string {
  return getWellAtVisualPosition(
    position.row,
    position.col,
    rotation,
    cols,
    rows,
  );
}

/**
 * Get the visual position where a specific well should appear after rotation
 * Uses the same matrix transformation as buildRotatedWellGrid
 */
export function getVisualPositionForWell(
  wellCoord: string,
  rotation: number,
  cols: number,
  rows: number,
): WellPosition {
  // Parse well coordinate
  const letter = wellCoord.charAt(0);
  const number = parseInt(wellCoord.slice(1), 10);

  const logicalRow = letter.charCodeAt(0) - 65; // A=0, B=1, etc.
  const logicalCol = number - 1; // Convert to 0-based

  // Center the coordinate system for rotation
  const centerX = (cols - 1) / 2;
  const centerY = (rows - 1) / 2;

  // Convert to centered coordinates
  const centered: Point2D = {
    x: logicalCol - centerX,
    y: logicalRow - centerY,
  };

  // Apply rotation matrix
  const rotationMatrix = createRotationMatrix(rotation);
  const rotated = applyMatrix(rotationMatrix, centered);

  // Convert back to grid coordinates
  const visualCol = Math.round(rotated.x + centerX);
  const visualRow = Math.round(rotated.y + centerY);

  return {
    row: visualRow,
    col: visualCol,
  };
}

/**
 * Find which well coordinate appears at a given visual position
 * This is the inverse of getVisualPositionForWell
 */
export function getWellAtVisualPosition(
  visualRow: number,
  visualCol: number,
  rotation: number,
  cols: number,
  rows: number,
): string {
  // Build the rotated grid and look up the coordinate
  const rotatedGrid = buildRotatedWellGrid(rotation, cols, rows);

  if (
    visualRow >= 0 &&
    visualRow < rows &&
    visualCol >= 0 &&
    visualCol < cols
  ) {
    return rotatedGrid[visualRow][visualCol] || "ERR";
  }

  return "ERR";
}

/**
 * Build a logical well matrix without rotation
 * Returns a 2D array where grid[row][col] = well coordinate string
 * For standard 96-well: A1 is at [0][0], H12 is at [7][11]
 */
export function buildLogicalWellMatrix(
  cols: number, // number of columns (1-12)
  rows: number, // number of rows (A-H)
): string[][] {
  const matrix: string[][] = [];

  for (let row = 0; row < rows; row++) {
    const rowArray: string[] = [];
    for (let col = 0; col < cols; col++) {
      const letter = String.fromCharCode(65 + row); // A=0, B=1, etc.
      const number = col + 1; // 1-based column number
      rowArray.push(`${letter}${number}`);
    }
    matrix.push(rowArray);
  }

  return matrix;
}

/**
 * Apply matrix rotation to transform logical positions to visual positions
 * Uses proper 2D rotation matrices to determine where each well appears after rotation
 */
export function buildRotatedWellGrid(
  rotation: number,
  cols: number,
  rows: number,
): string[][] {
  // Now that getDisplayIndices rotation is fixed, just return the logical matrix
  // getDisplayIndices will handle the visual positioning correctly

  return buildLogicalWellMatrix(cols, rows);
}

/**
 * Debug helper: Print the well grid to console with clear formatting
 */
export function printWellGrid(
  grid: string[][],
  title: string = "Well Grid Layout",
): void {
  for (let row = 0; row < grid.length; row++) {
    const rowStr = grid[row].map((cell) => (cell || "ERR").padEnd(4)).join(" ");
  }
}
