import * as XLSX from 'xlsx';

export interface PhaseChangeRow {
    Date_Time: string;
    Well_Name: string;
    Tray_Name: string;
    Sample_Phase: number;
    Probe_1?: number;
    Probe_2?: number;
    Probe_3?: number;
    Probe_4?: number;
    Probe_5?: number;
    Probe_6?: number;
    Probe_7?: number;
    Probe_8?: number;
}

export interface TimePointData {
    timestamp: string;
    image_filename?: string;
    temperature_readings: TemperatureReading[];
    well_states: WellState[];
}

export interface TemperatureReading {
    probe_sequence: number;
    temperature: number;
}

export interface WellState {
    row: number;
    col: number;
    value: number;
}

export interface ExcelPhaseChangeData {
    rows: PhaseChangeRow[];
    errors: string[];
}

export class PhaseChangeParser {
    static parseExcelFile(file: File): Promise<ExcelPhaseChangeData> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get the first worksheet
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    const result = this.parseWorksheet(worksheet);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }
    
    static parseWorksheet(worksheet: XLSX.WorkSheet): ExcelPhaseChangeData {
        const rows: PhaseChangeRow[] = [];
        const errors: string[] = [];
        
        console.log('Parsing worksheet:', worksheet);
        
        // Get worksheet range
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        console.log('Worksheet range:', range);
        
        try {
            // Convert to JSON array to work with the data
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                header: 1, 
                defval: null,
                raw: false
            }) as any[][];
            
            console.log('Worksheet as JSON (first 10 rows):', jsonData.slice(0, 10));
            
            // Log more details about the file structure
            console.log('First row content:', jsonData[0]);
            console.log('Analyzing row structure...');
            for (let i = 0; i < Math.min(5, jsonData.length); i++) {
                const row = jsonData[i] || [];
                const trayNameCells = row.filter(cell => cell === 'P1' || cell === 'P2' || cell === 'P3' || cell === 'P4');
                const wellCoordCells = row.filter(cell => 
                    typeof cell === 'string' && 
                    /^[A-Z]\d+$/.test(cell.trim())
                );
                
                console.log(`Row ${i}:`);
                console.log(`  Tray names found: ${trayNameCells.length}`, trayNameCells.slice(0, 10));
                console.log(`  Well coords found: ${wellCoordCells.length}`, wellCoordCells.slice(0, 10));
                console.log(`  Row content: ${row.length} cells, first 10:`, row.slice(0, 10));
            }
            
            if (jsonData.length < 8) {
                return { rows: [], errors: ['Excel file has insufficient rows'] };
            }
            
            // Detect file format by checking for the merged format signature
            const firstRow = jsonData[0] || [];
            const secondRow = jsonData[1] || [];
            
            // Check if this is the merged format by looking for tray names anywhere in first 10 rows
            // Need to find multiple tray names to confirm it's the complex format
            let totalTrayNames = 0;
            for (let i = 0; i < Math.min(10, jsonData.length); i++) {
                const row = jsonData[i] || [];
                totalTrayNames += row.filter(cell => 
                    cell === 'P1' || cell === 'P2' || cell === 'P3' || cell === 'P4'
                ).length;
            }
            const hasTrayNames = totalTrayNames >= 10; // Need significant tray name presence
            
            if (firstRow[0] === 'Device Name:' && hasTrayNames) {
                // This is the complex merged phase change format
                console.log('Detected merged phase change format');
                return this.parseComplexPhaseChangeFormat(jsonData);
            } else if (firstRow[0] === 'Device Name:') {
                // This is just temperature logger data
                console.log('Detected simple temperature logger format');
                return this.parseTemperatureLoggerFormat(jsonData);
            } else {
                // Unknown format, try complex
                console.log('Unknown format, trying complex parser');
                return this.parseComplexPhaseChangeFormat(jsonData);
            }
            
        } catch (error) {
            errors.push(`General parsing error: ${error.message}`);
        }
        
        return { rows, errors };
    }
    
    static parseTemperatureLoggerFormat(jsonData: any[][]): ExcelPhaseChangeData {
        const rows: PhaseChangeRow[] = [];
        const errors: string[] = [];
        
        console.log('Parsing temperature logger format');
        
        // Find the header row (should contain "Date", "Time", temperature columns)
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row = jsonData[i];
            if (row && row[0] === 'Date' && row[1] === 'Time') {
                headerRowIndex = i;
                break;
            }
        }
        
        if (headerRowIndex === -1) {
            return { rows: [], errors: ['Could not find header row with Date and Time columns'] };
        }
        
        const headerRow = jsonData[headerRowIndex];
        console.log('Found header row at index', headerRowIndex, ':', headerRow);
        
        // Map temperature columns
        const tempColumns: { [key: number]: number } = {}; // column index -> probe number
        for (let col = 2; col < headerRow.length; col++) {
            const header = headerRow[col];
            if (header && typeof header === 'string' && header.includes('Temperature')) {
                // Extract probe number from header like "Temperature 1 (°C)"
                const match = header.match(/Temperature (\d+)/);
                if (match) {
                    const probeNum = parseInt(match[1]);
                    tempColumns[col] = probeNum;
                    console.log(`Found temperature column ${col} for probe ${probeNum}: ${header}`);
                }
            }
        }
        
        if (Object.keys(tempColumns).length === 0) {
            return { rows: [], errors: ['No temperature columns found in header'] };
        }
        
        // This format only has temperature data, no phase change data
        // We'll create a single dummy row per timestamp for now
        for (let rowIdx = headerRowIndex + 1; rowIdx < jsonData.length; rowIdx++) {
            const dataRow = jsonData[rowIdx];
            if (!dataRow || dataRow.length === 0) continue;
            
            const dateStr = dataRow[0];
            const timeStr = dataRow[1];
            
            if (!dateStr || !timeStr) continue;
            
            // Create a dummy phase change row for this timestamp
            const row: PhaseChangeRow = {
                Date_Time: `${dateStr}`,
                Well_Name: 'A1', // Dummy well name since this format doesn't have wells
                Tray_Name: 'Tray1', // Dummy tray name
                Sample_Phase: 0, // Dummy phase (liquid)
            };
            
            // Add temperature readings
            for (const [colIdx, probeNum] of Object.entries(tempColumns)) {
                const tempValue = dataRow[parseInt(colIdx)];
                if (tempValue !== null && tempValue !== undefined && !isNaN(parseFloat(tempValue))) {
                    (row as any)[`Probe_${probeNum}`] = parseFloat(tempValue);
                }
            }
            
            rows.push(row);
        }
        
        console.log(`Parsed ${rows.length} temperature logger rows`);
        return { rows, errors };
    }
    
    static parseComplexPhaseChangeFormat(jsonData: any[][]): ExcelPhaseChangeData {
        const rows: PhaseChangeRow[] = [];
        const errors: string[] = [];
        
        // Find the actual structure by searching for tray names and well coordinates
        try {
            console.log('Searching for tray and well coordinate rows...');
            
            // Find the row with tray names (P1, P2, etc.)
            let trayRowIndex = -1;
            let wellRowIndex = -1;
            let headerRowIndex = -1;
            
            for (let i = 0; i < Math.min(20, jsonData.length); i++) {
                const row = jsonData[i] || [];
                
                // Look for tray names - need multiple tray names in a row
                const trayNameCount = row.filter(cell => 
                    cell === 'P1' || cell === 'P2' || cell === 'P3' || cell === 'P4'
                ).length;
                if (trayNameCount >= 50 && trayRowIndex === -1) {  // Need many tray names
                    trayRowIndex = i;
                    console.log(`Found tray names at row ${i} (${trayNameCount} tray names):`, row.slice(0, 20));
                }
                
                // Look for well coordinates (A1, A2, B1, etc.) - need multiple coordinates
                // And make sure it's NOT the same row as tray names
                const wellCoordCount = row.filter(cell => 
                    typeof cell === 'string' && /^[A-Z]\d+$/.test(cell.trim())
                ).length;
                if (wellCoordCount >= 50 && wellRowIndex === -1 && i !== trayRowIndex) {  // Different from tray row
                    wellRowIndex = i;
                    console.log(`Found well coordinates at row ${i} (${wellCoordCount} coordinates):`, row.slice(0, 20));
                }
                
                // Look for Date/Time header
                if (row[0] === 'Date' && row[1] === 'Time' && headerRowIndex === -1) {
                    headerRowIndex = i;
                    console.log(`Found header row at row ${i}:`, row.slice(0, 10));
                }
            }
            
            // Log what we found for debugging
            console.log(`Row detection results: tray=${trayRowIndex}, well=${wellRowIndex}, header=${headerRowIndex}`);
            
            if (trayRowIndex === -1 || wellRowIndex === -1 || headerRowIndex === -1) {
                console.log(`Missing required rows: tray=${trayRowIndex}, well=${wellRowIndex}, header=${headerRowIndex}`);
                return { rows: [], errors: ['Could not find required header rows (tray names, well coordinates, or Date/Time header)'] };
            }
            
            const trayRow = jsonData[trayRowIndex] || [];
            const wellRow = jsonData[wellRowIndex] || [];
            const headerRow = jsonData[headerRowIndex] || [];
            
            // Log the actual content of these rows
            console.log(`Tray row content (columns 10-20):`, trayRow.slice(10, 20));
            console.log(`Well row content (columns 10-20):`, wellRow.slice(10, 20));
            console.log(`Header row content (columns 0-10):`, headerRow.slice(0, 10));
            
            // Find column mappings
            const columnMap = this.buildColumnMap(headerRow, trayRow, wellRow);
            
            console.log(`Built column map with ${columnMap.length} columns:`);
            const phaseColumns = columnMap.filter(col => col.type === 'phase');
            const tempColumns = columnMap.filter(col => col.type === 'temp');
            const dateColumns = columnMap.filter(col => col.type === 'datetime');
            console.log(`  Phase columns: ${phaseColumns.length}`);
            console.log(`  Temperature columns: ${tempColumns.length}`);
            console.log(`  DateTime columns: ${dateColumns.length}`);
            if (phaseColumns.length > 0) {
                console.log(`  Sample phase columns:`, phaseColumns.slice(0, 5));
            }
            
            // Process data rows (starting after the header row)
            const dataStartRow = headerRowIndex + 1;
            console.log(`Processing data rows starting from row ${dataStartRow}`);
            
            for (let rowIdx = dataStartRow; rowIdx < jsonData.length; rowIdx++) {
                const dataRow = jsonData[rowIdx];
                if (!dataRow || dataRow.length === 0) continue;
                
                try {
                    const parsedRows = this.parseDataRow(dataRow, columnMap, rowIdx + 1);
                    rows.push(...parsedRows);
                } catch (error) {
                    errors.push(`Row ${rowIdx + 1}: ${error.message}`);
                }
            }
        } catch (error) {
            errors.push(`Complex format parsing error: ${error.message}`);
        }
        
        return { rows, errors };
    }
    
    private static buildColumnMap(headerRow: any[], trayRow: any[], wellRow: any[]) {
        const map: Array<{
            colIndex: number;
            type: 'datetime' | 'temp' | 'phase';
            trayName?: string;
            wellName?: string;
            probeNumber?: number;
        }> = [];
        
        console.log(`Building column map for ${headerRow.length} columns`);
        
        for (let i = 0; i < headerRow.length; i++) {
            const header = String(headerRow[i] || '').toLowerCase().trim();
            const trayName = String(trayRow[i] || '').trim();
            const wellName = String(wellRow[i] || '').trim();
            
            // Log first few column mappings
            if (i >= 10 && i <= 20) {
                console.log(`Col ${i}: header="${header}", tray="${trayName}", well="${wellName}"`);
            }
            
            if (header.includes('date') || header.includes('time')) {
                map.push({ colIndex: i, type: 'datetime' });
            } else if (header.includes('temp') || header.includes('probe')) {
                // Extract probe number from header
                const probeMatch = header.match(/probe[_\s]*(\d+)|temp[_\s]*(\d+)/);
                const probeNumber = probeMatch ? parseInt(probeMatch[1] || probeMatch[2]) : null;
                
                if (probeNumber && probeNumber >= 1 && probeNumber <= 8) {
                    map.push({ 
                        colIndex: i, 
                        type: 'temp', 
                        probeNumber,
                        trayName: trayName || undefined,
                        wellName: wellName || undefined
                    });
                }
            } else if (trayName && wellName && 
                       trayName !== 'null' && wellName !== 'null' &&
                       (trayName === 'P1' || trayName === 'P2' || trayName === 'P3' || trayName === 'P4') &&
                       /^[A-Z]\d+$/.test(wellName)) {
                // This column has valid tray and well identifiers, assume it contains phase data
                map.push({ 
                    colIndex: i, 
                    type: 'phase',
                    trayName,
                    wellName
                });
            }
        }
        
        return map;
    }
    
    private static parseDataRow(dataRow: any[], columnMap: any[], rowNumber: number): PhaseChangeRow[] {
        const rows: PhaseChangeRow[] = [];
        
        // Extract timestamp
        const dateTimeCol = columnMap.find(col => col.type === 'datetime');
        if (!dateTimeCol) {
            throw new Error('No datetime column found');
        }
        
        const rawDateTime = dataRow[dateTimeCol.colIndex];
        const dateTime = this.parseDateTime(rawDateTime);
        
        // Group phase data by tray/well
        const phaseData = new Map<string, { trayName: string; wellName: string; phase: number }>();
        
        const phaseColumns = columnMap.filter(col => col.type === 'phase');
        console.log(`Processing row ${rowNumber}: found ${phaseColumns.length} phase columns`);
        
        let validPhaseCount = 0;
        columnMap.filter(col => col.type === 'phase').forEach((col, index) => {
            const phaseValue = dataRow[col.colIndex];
            
            // Log first few values for debugging
            if (index < 5) {
                console.log(`Phase col ${col.colIndex} (${col.trayName}_${col.wellName}): "${phaseValue}" (type: ${typeof phaseValue})`);
            }
            
            // Accept any numeric value (0 or 1) for phase data
            if (phaseValue !== null && phaseValue !== undefined && phaseValue !== '') {
                const numValue = parseInt(String(phaseValue));
                if (!isNaN(numValue) && (numValue === 0 || numValue === 1)) {
                    const key = `${col.trayName}_${col.wellName}`;
                    phaseData.set(key, {
                        trayName: col.trayName,
                        wellName: col.wellName,
                        phase: numValue
                    });
                    validPhaseCount++;
                }
            }
        });
        
        console.log(`Found ${validPhaseCount} valid phase values out of ${phaseColumns.length} phase columns`);
        
        // For each well with phase data, create a row
        phaseData.forEach(({ trayName, wellName, phase }) => {
            const row: PhaseChangeRow = {
                Date_Time: dateTime,
                Well_Name: wellName,
                Tray_Name: trayName,
                Sample_Phase: phase
            };
            
            // Add temperature probe readings
            for (let probeNum = 1; probeNum <= 8; probeNum++) {
                const tempCol = columnMap.find(col => 
                    col.type === 'temp' && 
                    col.probeNumber === probeNum
                );
                
                if (tempCol) {
                    const tempValue = dataRow[tempCol.colIndex];
                    if (tempValue !== null && tempValue !== undefined && tempValue !== '') {
                        const numValue = parseFloat(String(tempValue));
                        if (!isNaN(numValue)) {
                            row[`Probe_${probeNum}` as keyof PhaseChangeRow] = numValue;
                        }
                    }
                }
            }
            
            rows.push(row);
        });
        
        return rows;
    }
    
    private static parseDateTime(rawDateTime: any): string {
        if (!rawDateTime) {
            throw new Error('Missing datetime value');
        }
        
        const str = String(rawDateTime).trim();
        
        // Try different date formats
        const formats = [
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, // 2024-01-01 12:30:45
            /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/, // 01/01/2024 12:30:45
            /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}$/, // 01-01-2024 12:30:45
        ];
        
        // If it's already in the right format
        if (formats[0].test(str)) {
            return str;
        }
        
        // Try to parse and convert to standard format
        let date: Date | null = null;
        
        // Try parsing as Excel serial date
        const numValue = parseFloat(str);
        if (!isNaN(numValue) && numValue > 40000) { // Excel dates after 2009
            // Excel date serial number
            const excelEpoch = new Date(1900, 0, 1);
            date = new Date(excelEpoch.getTime() + (numValue - 2) * 24 * 60 * 60 * 1000);
        } else {
            // Try regular date parsing
            date = new Date(str);
        }
        
        if (!date || isNaN(date.getTime())) {
            throw new Error(`Invalid datetime format: ${str}`);
        }
        
        // Format as YYYY-MM-DD HH:MM:SS
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    static convertToCSV(rows: PhaseChangeRow[]): string {
        if (rows.length === 0) {
            return '';
        }
        
        // CSV header
        const headers = [
            'Date_Time', 'Well_Name', 'Tray_Name', 'Sample_Phase',
            'Probe_1', 'Probe_2', 'Probe_3', 'Probe_4',
            'Probe_5', 'Probe_6', 'Probe_7', 'Probe_8'
        ];
        
        const csvRows = [headers.join(',')];
        
        rows.forEach(row => {
            const csvRow = headers.map(header => {
                const value = row[header as keyof PhaseChangeRow];
                if (value === undefined || value === null) {
                    return '';
                }
                return String(value);
            });
            csvRows.push(csvRow.join(','));
        });
        
        return csvRows.join('\n');
    }
    
    static convertToTimePoints(rows: PhaseChangeRow[]): TimePointData[] {
        if (rows.length === 0) {
            return [];
        }
        
        // Group rows by timestamp
        const timePointMap = new Map<string, PhaseChangeRow[]>();
        
        rows.forEach(row => {
            const timestamp = this.convertToISO8601(row.Date_Time);
            if (!timePointMap.has(timestamp)) {
                timePointMap.set(timestamp, []);
            }
            timePointMap.get(timestamp)!.push(row);
        });
        
        // Convert each timestamp group to a TimePointData
        const timePoints: TimePointData[] = [];
        
        timePointMap.forEach((timestampRows, timestamp) => {
            const temperatureReadings: TemperatureReading[] = [];
            const wellStates: WellState[] = [];
            
            // Collect temperature readings (use first row's probe data)
            const firstRow = timestampRows[0];
            for (let i = 1; i <= 8; i++) {
                const probeKey = `Probe_${i}` as keyof PhaseChangeRow;
                const temp = firstRow[probeKey];
                if (temp !== undefined && temp !== null && !isNaN(Number(temp))) {
                    temperatureReadings.push({
                        probe_sequence: i,
                        temperature: Number(temp)
                    });
                }
            }
            
            // Collect well states
            timestampRows.forEach((row, index) => {
                const wellCoordinates = this.parseWellCoordinate(row.Well_Name);
                if (wellCoordinates) {
                    // Log first few well coordinates to debug the format
                    if (index < 5) {
                        console.log(`Well ${row.Well_Name} → row=${wellCoordinates.row}, col=${wellCoordinates.col}, phase=${row.Sample_Phase}`);
                    }
                    wellStates.push({
                        row: wellCoordinates.row,
                        col: wellCoordinates.col,
                        value: row.Sample_Phase
                    });
                }
            });
            
            // If no well states but we have temperature data, create some dummy wells
            if (wellStates.length === 0 && temperatureReadings.length > 0) {
                // Create dummy well states - one well per probe
                temperatureReadings.forEach((tempReading, index) => {
                    wellStates.push({
                        row: 1 + Math.floor(index / 12),  // Arrange in rows of 12
                        col: 1 + (index % 12),           // Columns 1-12
                        value: 0 // Default to liquid since we don't have phase data
                    });
                });
            }
            
            timePoints.push({
                timestamp,
                temperature_readings: temperatureReadings,
                well_states: wellStates
            });
        });
        
        // Sort by timestamp
        timePoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        return timePoints;
    }
    
    private static convertToISO8601(dateTimeStr: string): string {
        const normalized = this.normalizeDatetime(dateTimeStr);
        // Convert "YYYY-MM-DD HH:MM:SS" to ISO 8601 format
        return normalized.replace(' ', 'T') + 'Z';
    }
    
    private static normalizeDatetime(dateTimeStr: string): string {
        // If it's already in the right format, return as-is
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateTimeStr)) {
            return dateTimeStr;
        }
        
        // Try to parse and format consistently
        const date = new Date(dateTimeStr);
        if (isNaN(date.getTime())) {
            throw new Error(`Invalid datetime format: ${dateTimeStr}`);
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
    
    private static parseWellCoordinate(wellName: string): { row: number, col: number } | null {
        // Parse well names like "A1", "B12", etc. to row/col (1-based)
        const match = wellName.match(/^([A-Z]+)(\d+)$/);
        if (!match) {
            return null;
        }
        
        const letters = match[1];
        const numbers = parseInt(match[2]);
        
        // Convert letters to row number (A=1, B=2, etc.)
        let row = 0;
        for (let i = 0; i < letters.length; i++) {
            row = row * 26 + (letters.charCodeAt(i) - 64);
        }
        
        return {
            row: row,
            col: numbers
        };
    }
}