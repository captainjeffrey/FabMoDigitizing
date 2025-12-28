/**
 * DXF Export Module for FabMo Probing Data
 * Converts scan data to DXF format for CAD import
 * Does not modify probing.js - reads from global scanData and rotaryScanData
 */

/**
 * Initialize DXF export when document is ready
 */
$(document).ready(function() {
    console.log('DXF Export module initializing...');
    
    // Attach DXF export button handlers
    $('#exportScanDxfBtn').click(exportScanDataDXF);
    $('#exportRotaryDxfBtn').click(exportRotaryScanDataDXF);
    
    console.log('DXF Export module ready!');
});

/**
 * Export surface scan data as DXF
 * Creates a 3D point cloud in DXF format
 */
function exportScanDataDXF() {
    // Access global scanData from probing-ui.js
    if (scanData.points.length === 0) {
        showStatus('No scan data to export', 'error');
        return;
    }
    
    console.log('Exporting ' + scanData.points.length + ' points to DXF...');
    
    try {
        const dxfContent = generateSurfaceScanDXF(scanData.points);
        downloadDXF(dxfContent, 'surface_scan_' + new Date().toISOString().slice(0, 10) + '.dxf');
        showStatus('✅ DXF exported successfully (' + scanData.points.length + ' points)', 'success');
    } catch (err) {
        showStatus('❌ Error exporting DXF: ' + err.message, 'error');
        console.error('DXF export error:', err);
    }
}

/**
 * Export rotary scan data as DXF
 * Creates a 3D point cloud with full 5-axis coordinates
 */
function exportRotaryScanDataDXF() {
    // Access global rotaryScanData from probing-ui.js
    if (rotaryScanData.points.length === 0) {
        showStatus('No rotary scan data to export', 'error');
        return;
    }
    
    console.log('Exporting ' + rotaryScanData.points.length + ' rotary points to DXF...');
    
    try {
        const dxfContent = generateRotaryScanDXF(rotaryScanData.points);
        downloadDXF(dxfContent, 'rotary_scan_' + new Date().toISOString().slice(0, 10) + '.dxf');
        showStatus('✅ DXF exported successfully (' + rotaryScanData.points.length + ' points with x,y,z,a,b)', 'success');
    } catch (err) {
        showStatus('❌ Error exporting DXF: ' + err.message, 'error');
        console.error('DXF export error:', err);
    }
}

/**
 * Generate DXF file content for surface scan data
 * Creates POINT entities for each scanned point
 */
function generateSurfaceScanDXF(points) {
    let dxf = '';
    
    // DXF Header Section
    dxf += '0\n';
    dxf += 'SECTION\n';
    dxf += '2\n';
    dxf += 'HEADER\n';
    dxf += '9\n';
    dxf += '$ACADVER\n';
    dxf += '1\n';
    dxf += 'AC1015\n';  // AutoCAD 2000 format
    dxf += '0\n';
    dxf += 'ENDSEC\n';
    
    // Tables Section (Layer definitions)
    dxf += '0\n';
    dxf += 'SECTION\n';
    dxf += '2\n';
    dxf += 'TABLES\n';
    dxf += '0\n';
    dxf += 'TABLE\n';
    dxf += '2\n';
    dxf += 'LAYER\n';
    dxf += '70\n';
    dxf += '1\n';  // Number of layers
    
    // Define SCAN_POINTS layer
    dxf += '0\n';
    dxf += 'LAYER\n';
    dxf += '2\n';
    dxf += 'SCAN_POINTS\n';
    dxf += '70\n';
    dxf += '0\n';
    dxf += '62\n';
    dxf += '7\n';  // Color: white
    dxf += '6\n';
    dxf += 'CONTINUOUS\n';
    
    dxf += '0\n';
    dxf += 'ENDTAB\n';
    dxf += '0\n';
    dxf += 'ENDSEC\n';
    
    // Entities Section (The actual scan points)
    dxf += '0\n';
    dxf += 'SECTION\n';
    dxf += '2\n';
    dxf += 'ENTITIES\n';
    
    // Add each point as a POINT entity
    points.forEach((point, index) => {
        dxf += '0\n';
        dxf += 'POINT\n';
        dxf += '8\n';
        dxf += 'SCAN_POINTS\n';  // Layer name
        dxf += '10\n';  // X coordinate
        dxf += point.x.toFixed(6) + '\n';
        dxf += '20\n';  // Y coordinate
        dxf += point.y.toFixed(6) + '\n';
        dxf += '30\n';  // Z coordinate
        dxf += point.z.toFixed(6) + '\n';
    });
    
    // Optional: Add 3D polyline connecting all points
    dxf += '0\n';
    dxf += 'POLYLINE\n';
    dxf += '8\n';
    dxf += 'SCAN_POINTS\n';
    dxf += '66\n';
    dxf += '1\n';  // Vertices follow
    dxf += '10\n';
    dxf += '0.0\n';
    dxf += '20\n';
    dxf += '0.0\n';
    dxf += '30\n';
    dxf += '0.0\n';
    dxf += '70\n';
    dxf += '8\n';  // 3D polyline flag
    
    // Add vertices
    points.forEach((point, index) => {
        dxf += '0\n';
        dxf += 'VERTEX\n';
        dxf += '8\n';
        dxf += 'SCAN_POINTS\n';
        dxf += '10\n';
        dxf += point.x.toFixed(6) + '\n';
        dxf += '20\n';
        dxf += point.y.toFixed(6) + '\n';
        dxf += '30\n';
        dxf += point.z.toFixed(6) + '\n';
        dxf += '70\n';
        dxf += '32\n';  // 3D polyline vertex
    });
    
    // End polyline
    dxf += '0\n';
    dxf += 'SEQEND\n';
    
    // End Entities Section
    dxf += '0\n';
    dxf += 'ENDSEC\n';
    
    // End of File
    dxf += '0\n';
    dxf += 'EOF\n';
    
    return dxf;
}

/**
 * Generate DXF file content for rotary scan data
 * Creates POINT entities with extended data for A and B axis values
 */
function generateRotaryScanDXF(points) {
    let dxf = '';
    
    // DXF Header Section
    dxf += '0\n';
    dxf += 'SECTION\n';
    dxf += '2\n';
    dxf += 'HEADER\n';
    dxf += '9\n';
    dxf += '$ACADVER\n';
    dxf += '1\n';
    dxf += 'AC1015\n';  // AutoCAD 2000 format
    dxf += '0\n';
    dxf += 'ENDSEC\n';
    
    // Tables Section (Layer definitions)
    dxf += '0\n';
    dxf += 'SECTION\n';
    dxf += '2\n';
    dxf += 'TABLES\n';
    dxf += '0\n';
    dxf += 'TABLE\n';
    dxf += '2\n';
    dxf += 'LAYER\n';
    dxf += '70\n';
    dxf += '1\n';
    
    // Define ROTARY_SCAN layer
    dxf += '0\n';
    dxf += 'LAYER\n';
    dxf += '2\n';
    dxf += 'ROTARY_SCAN\n';
    dxf += '70\n';
    dxf += '0\n';
    dxf += '62\n';
    dxf += '3\n';  // Color: green
    dxf += '6\n';
    dxf += 'CONTINUOUS\n';
    
    dxf += '0\n';
    dxf += 'ENDTAB\n';
    dxf += '0\n';
    dxf += 'ENDSEC\n';
    
    // Entities Section
    dxf += '0\n';
    dxf += 'SECTION\n';
    dxf += '2\n';
    dxf += 'ENTITIES\n';
    
    // Add each point as a POINT entity with text labels for A and B
    points.forEach((point, index) => {
        // Add the 3D point
        dxf += '0\n';
        dxf += 'POINT\n';
        dxf += '8\n';
        dxf += 'ROTARY_SCAN\n';
        dxf += '10\n';
        dxf += point.x.toFixed(6) + '\n';
        dxf += '20\n';
        dxf += point.y.toFixed(6) + '\n';
        dxf += '30\n';
        dxf += point.z.toFixed(6) + '\n';
        
        // Add text label every 10th point to show A/B values
        if (index % 10 === 0) {
            dxf += '0\n';
            dxf += 'TEXT\n';
            dxf += '8\n';
            dxf += 'ROTARY_SCAN\n';
            dxf += '10\n';
            dxf += point.x.toFixed(6) + '\n';
            dxf += '20\n';
            dxf += point.y.toFixed(6) + '\n';
            dxf += '30\n';
            dxf += (point.z + 0.1).toFixed(6) + '\n';  // Offset text slightly above point
            dxf += '40\n';
            dxf += '0.1\n';  // Text height
            dxf += '1\n';
            dxf += 'A:' + point.a.toFixed(1) + ' B:' + point.b.toFixed(1) + '\n';
        }
    });
    
    // End Entities Section
    dxf += '0\n';
    dxf += 'ENDSEC\n';
    
    // End of File
    dxf += '0\n';
    dxf += 'EOF\n';
    
    return dxf;
}

/**
 * Download DXF file
 */
function downloadDXF(dxfContent, filename) {
    const blob = new Blob([dxfContent], { type: 'application/dxf;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Show DXF export buttons when data is available
 * Called from probing-ui.js after successful data retrieval
 */
function showDxfExportButtons() {
    if (window.scanData && window.scanData.points && window.scanData.points.length > 0) {
        $('#exportScanDxfBtn').show();
    }
    
    if (window.rotaryScanData && window.rotaryScanData.points && window.rotaryScanData.points.length > 0) {
        $('#exportRotaryDxfBtn').show();
    }
}

// Make function available globally for probing-ui.js to call
window.showDxfExportButtons = showDxfExportButtons;
