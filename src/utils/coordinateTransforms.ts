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
    qtyXAxis: number,
    qtyYAxis: number
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
            yIndex = qtyXAxis - 1 - logicalCol;
            break;
        case 180:
            xIndex = qtyXAxis - 1 - logicalCol;
            yIndex = qtyYAxis - 1 - logicalRow;
            break;
        case 270:
            xIndex = qtyYAxis - 1 - logicalRow;
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
 * Transform cell to well coordinate with rotation (matches RegionInput.tsx logic)
 */
export function transformCellToWellCoordinate(
    cell: Cell,
    rotationDegrees: number,
    qtyXAxis: number,
    qtyYAxis: number
): string {
    // Convert 0-based cell to 1-based coordinate
    const coord: WellCoordinate = {
        column: cell.col + 1,
        row: cell.row + 1,
    };
    
    // Apply rotation transformation
    const transformedCoord = transformCoordinatesForRotation(
        coord,
        rotationDegrees,
        qtyXAxis,
        qtyYAxis
    );
    
    // Convert to string
    return coordinatesToString(transformedCoord);
}