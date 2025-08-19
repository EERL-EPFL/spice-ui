/**
 * Coordinate transformation utilities for tray rotations
 * This matches the logic in spice-api/src/routes/tray_configurations/services.rs
 */

export interface WellCoordinate {
    column: number; // 1-based column number
    row: number;    // 1-based row number
}

export interface Cell {
    row: number; // 0-based
    col: number; // 0-based
}

/**
 * Transform coordinates based on tray rotation to match UI display logic
 * This matches the getDisplayIndices function in TrayDisplay.tsx and the Rust implementation
 */
export function transformCoordinatesForRotation(
    coord: WellCoordinate,
    rotationDegrees: number,
    qtyCols: number,
    qtyRows: number
): WellCoordinate {
    // Convert 1-based coordinates to 0-based for calculations
    const logicalRow = coord.row - 1;
    const logicalCol = coord.column - 1;
    
    // Apply the same transformation as TrayDisplay.tsx getDisplayIndices
    let xIndex: number;
    let yIndex: number;
    
    switch (rotationDegrees) {
        case 90:
            xIndex = logicalRow;
            yIndex = qtyCols - 1 - logicalCol;
            break;
        case 180:
            xIndex = qtyCols - 1 - logicalCol;
            yIndex = qtyRows - 1 - logicalRow;
            break;
        case 270:
            xIndex = qtyRows - 1 - logicalRow;
            yIndex = logicalCol;
            break;
        default: // 0 degrees or invalid
            xIndex = logicalCol;
            yIndex = logicalRow;
            break;
    }
    
    // Convert back to 1-based coordinates
    return {
        column: xIndex + 1,
        row: yIndex + 1,
    };
}

/**
 * Convert cell coordinates to well coordinate string (A1, B2, etc.)
 * Matches the Rust coordinates_to_str function
 */
export function coordinatesToString(coord: WellCoordinate): string {
    if (coord.column < 1 || coord.row < 1) {
        throw new Error('Invalid coordinate: must be 1-based');
    }
    if (coord.row > 26) {
        throw new Error('Only supports A-Z for rows');
    }
    
    const letter = String.fromCharCode(65 + (coord.row - 1)); // A=1, B=2, etc.
    const number = coord.column;
    
    return `${letter}${number}`;
}

/**
 * Parse coordinate string (A1, B2, etc.) into WellCoordinate
 * Matches the Rust str_to_coordinates function
 */
export function stringToCoordinates(coordinate: string): WellCoordinate {
    if (coordinate.length < 2) {
        throw new Error(`Invalid coordinate format, must be like 'A1', provided: ${coordinate}`);
    }
    
    const letter = coordinate.charAt(0);
    const numberStr = coordinate.slice(1);
    
    if (!/^[A-Z]$/.test(letter) || !/^\d+$/.test(numberStr)) {
        throw new Error(`Invalid coordinate format, must be like 'A1', provided: ${coordinate}`);
    }
    
    const row = letter.charCodeAt(0) - 65 + 1; // A=1, B=2, etc.
    const column = parseInt(numberStr, 10);
    
    if (column < 1) {
        throw new Error('Invalid column number, must be a positive integer');
    }
    
    return { column, row };
}

/**
 * Inverse transformation: convert display coordinates back to logical well coordinates
 * This is what we need when user clicks on a visual position and we want to know the actual well
 */
export function displayCoordinatesToLogicalWell(
    displayRow: number, // 0-based display row
    displayCol: number, // 0-based display col
    rotationDegrees: number,
    qtyCols: number,
    qtyRows: number
): string {
    // For each rotation, we need to reverse the getDisplayIndices transformation
    let logicalRow: number;
    let logicalCol: number;
    
    console.log(`Transform: display(${displayRow},${displayCol}) at ${rotationDegrees}° with grid ${qtyCols}x${qtyRows}`);
    
    // Test: where should A1 (logical 0,0) appear for this rotation?
    let a1XIndex: number, a1YIndex: number;
    switch (rotationDegrees) {
        case 90:
            a1XIndex = 0; // logicalRow
            a1YIndex = qtyCols - 1 - 0; // qtyCols - 1 - logicalCol
            break;
        case 180:
            a1XIndex = qtyCols - 1 - 0; // qtyCols - 1 - logicalCol
            a1YIndex = qtyRows - 1 - 0; // qtyRows - 1 - logicalRow
            break;
        case 270:
            a1XIndex = qtyRows - 1 - 0; // qtyRows - 1 - logicalRow
            a1YIndex = 0; // logicalCol
            break;
        default:
            a1XIndex = 0; // logicalCol
            a1YIndex = 0; // logicalRow
            break;
    }
    console.log(`  A1 should appear at display position (${a1YIndex}, ${a1XIndex})`);
    
    switch (rotationDegrees) {
        case 90:
            // Original: xIndex = logicalRow, yIndex = qtyCols - 1 - logicalCol
            // In TrayGrid rendering: cx = leftMargin + xIndex * SPACING, cy = topMargin + yIndex * SPACING
            // So displayCol corresponds to xIndex, displayRow corresponds to yIndex
            // Inverse: logicalRow = displayCol, logicalCol = qtyCols - 1 - displayRow
            logicalRow = displayCol;
            logicalCol = qtyCols - 1 - displayRow;
            break;
        case 180:
            // Original: xIndex = qtyCols - 1 - logicalCol, yIndex = qtyRows - 1 - logicalRow
            // Inverse: logicalCol = qtyCols - 1 - displayCol, logicalRow = qtyRows - 1 - displayRow
            logicalCol = qtyCols - 1 - displayCol;
            logicalRow = qtyRows - 1 - displayRow;
            break;
        case 270:
            // Original: xIndex = qtyRows - 1 - logicalRow, yIndex = logicalCol
            // Inverse: logicalRow = qtyRows - 1 - displayCol, logicalCol = displayRow
            logicalRow = qtyRows - 1 - displayCol;
            logicalCol = displayRow;
            break;
        default: // 0 degrees
            logicalRow = displayRow;
            logicalCol = displayCol;
            break;
    }
    
    console.log(`  -> logical(${logicalRow},${logicalCol})`);
    
    // Validate logical coordinates are within bounds
    if (logicalRow < 0 || logicalRow >= qtyRows || logicalCol < 0 || logicalCol >= qtyCols) {
        console.error(`Invalid logical coordinates: (${logicalRow},${logicalCol}) for grid ${qtyCols}x${qtyRows}`);
        return 'ERR';
    }
    
    // Convert to 1-based coordinates and create string
    const wellCoord: WellCoordinate = {
        row: logicalRow + 1,
        column: logicalCol + 1
    };
    
    const result = coordinatesToString(wellCoord);
    console.log(`  -> well coordinate: ${result}`);
    
    return result;
}

/**
 * Transform logical grid position to the well coordinate that should be displayed there
 * This is what the TrayGrid component needs - given a logical grid position, what well name to show
 */
export function transformCellToWellCoordinate(
    cell: Cell,
    rotationDegrees: number,
    qtyCols: number,
    qtyRows: number
): string {
    // For rotation, we need to figure out what original well position would appear at this logical grid position
    // This is the inverse of getDisplayIndices - given a logical position, find the original well
    
    let originalRow: number, originalCol: number;
    
    switch (rotationDegrees) {
        case 90:
            // For 90° clockwise rotation:
            // Original position (r,c) appears at grid position (c, qtyRows-1-r)
            // So: grid position (cell.row, cell.col) came from original (qtyRows-1-cell.col, cell.row)
            // But wait, this is wrong. Let me think step by step:
            
            // The getDisplayIndices for 90° says: xIndex = row, yIndex = qtyCols - 1 - col
            // This means original (row,col) gets displayed at visual position (row, qtyCols-1-col)
            // But we're working in the logical grid, not visual positions
            
            // Actually, the logical grid IS the visual display in TrayGrid rendering
            // So if original A1 (0,0) appears at visual (0, 11), then:
            // grid position (0,11) should show A1
            // So: for grid (row,col), find original that would appear there
            
            // From getDisplayIndices: original (origR, origC) appears at (origR, qtyCols-1-origC)
            // We want: which original position appears at (cell.row, cell.col)?
            // So: origR = cell.row, qtyCols-1-origC = cell.col
            // Therefore: origC = qtyCols-1-cell.col
            originalRow = cell.row;
            originalCol = qtyCols - 1 - cell.col;
            break;
            
        case 180:
            // From getDisplayIndices: original (origR, origC) appears at (qtyCols-1-origC, qtyRows-1-origR)
            // We want: which original appears at (cell.row, cell.col)?
            // So: qtyCols-1-origC = cell.row, qtyRows-1-origR = cell.col
            // Therefore: origC = qtyCols-1-cell.row, origR = qtyRows-1-cell.col
            originalRow = qtyRows - 1 - cell.col;
            originalCol = qtyCols - 1 - cell.row;
            break;
            
        case 270:
            // From getDisplayIndices: original (origR, origC) appears at (qtyRows-1-origR, origC)
            // We want: which original appears at (cell.row, cell.col)?
            // So: qtyRows-1-origR = cell.row, origC = cell.col
            // Therefore: origR = qtyRows-1-cell.row, origC = cell.col
            originalRow = qtyRows - 1 - cell.row;
            originalCol = cell.col;
            break;
            
        default: // 0 degrees
            originalRow = cell.row;
            originalCol = cell.col;
            break;
    }
    
    // Validate bounds
    if (originalRow < 0 || originalRow >= qtyRows || originalCol < 0 || originalCol >= qtyCols) {
        console.error(`Invalid original coordinates: (${originalRow},${originalCol}) for grid ${qtyCols}x${qtyRows}`);
        return 'ERR';
    }
    
    // Convert to well coordinate string
    const wellCoord: WellCoordinate = {
        row: originalRow + 1, // Convert to 1-based
        column: originalCol + 1 // Convert to 1-based
    };
    
    return coordinatesToString(wellCoord);
}