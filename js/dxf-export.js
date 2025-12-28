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
    
    // DXF Header Section - MINIMAL for maximum compatibility
    dxf += '0\nSECTION\n';
    dxf += '2\nHEADER\n';
    dxf += '9\n$ACADVER\n';
    dxf += '1\nAC1009\n';  // AutoCAD R12 format (most compatible)
    dxf += '0\nENDSEC\n';
    
    // Tables Section (Layer definitions)
    dxf += '0\nSECTION\n';
    dxf += '2\nTABLES\n';
    
    // Layer table
    dxf += '0\nTABLE\n';
    dxf += '2\nLAYER\n';
    dxf += '70\n1\n';  // Number of layers
    
    // Define SCAN_POINTS layer
    dxf += '0\nLAYER\n';
    dxf += '2\nSCAN_POINTS\n';  // Layer name
    dxf += '70\n0\n';  // Layer flags
    dxf += '62\n7\n';  // Color: white
    dxf += '6\nCONTINUOUS\n';  // Linetype
    
    dxf += '0\nENDTAB\n';
    dxf += '0\nENDSEC\n';
    
    // Entities Section (The actual scan points)
    dxf += '0\nSECTION\n';
    dxf += '2\nENTITIES\n';
    
    // Add each point as a POINT entity
    points.forEach((point, index) => {
        dxf += '0\nPOINT\n';
        dxf += '8\nSCAN_POINTS\n';  // Layer name
        dxf += '10\n' + point.x.toFixed(6) + '\n';  // X coordinate
        dxf += '20\n' + point.y.toFixed(6) + '\n';  // Y coordinate
        dxf += '30\n' + point.z.toFixed(6) + '\n';  // Z coordinate
    });
    
    // Add 3D polyline connecting all points
    dxf += '0\nPOLYLINE\n';
    dxf += '8\nSCAN_POINTS\n';  // Layer name
    dxf += '66\n1\n';  // Vertices follow flag
    dxf += '10\n0.0\n';
    dxf += '20\n0.0\n';
    dxf += '30\n0.0\n';
    dxf += '70\n8\n';  // 3D polyline flag
    
    // Add vertices
    points.forEach((point, index) => {
        dxf += '0\nVERTEX\n';
        dxf += '8\nSCAN_POINTS\n';  // Layer name
        dxf += '10\n' + point.x.toFixed(6) + '\n';
        dxf += '20\n' + point.y.toFixed(6) + '\n';
        dxf += '30\n' + point.z.toFixed(6) + '\n';
        dxf += '70\n32\n';  // 3D polyline vertex flag
    });
    
    // End polyline
    dxf += '0\nSEQEND\n';
    dxf += '8\nSCAN_POINTS\n';  // Layer name for SEQEND
    
    // End Entities Section
    dxf += '0\nENDSEC\n';
    
    // End of File
    dxf += '0\nEOF\n';
    
    return dxf;
}

/**
 * Generate DXF file content for rotary scan data
 * Creates POINT entities with extended data for A and B axis values
 */
function generateRotaryScanDXF(points) {
    let dxf = '';
    
    // DXF Header Section - MINIMAL for maximum compatibility
    dxf += '0\nSECTION\n';
    dxf += '2\nHEADER\n';
    dxf += '9\n$ACADVER\n';
    dxf += '1\nAC1009\n';  // AutoCAD R12 format (most compatible)
    dxf += '0\nENDSEC\n';
    
    // Tables Section (Layer definitions)
    dxf += '0\nSECTION\n';
    dxf += '2\nTABLES\n';
    
    // Layer table
    dxf += '0\nTABLE\n';
    dxf += '2\nLAYER\n';
    dxf += '70\n1\n';
    
    // Define ROTARY_SCAN layer
    dxf += '0\nLAYER\n';
    dxf += '2\nROTARY_SCAN\n';  // Layer name
    dxf += '70\n0\n';  // Layer flags
    dxf += '62\n3\n';  // Color: green
    dxf += '6\nCONTINUOUS\n';  // Linetype
    
    dxf += '0\nENDTAB\n';
    dxf += '0\nENDSEC\n';
    
    // Entities Section
    dxf += '0\nSECTION\n';
    dxf += '2\nENTITIES\n';
    
    // Add each point as a POINT entity with text labels for A and B
    points.forEach((point, index) => {
        // Add the 3D point
        dxf += '0\nPOINT\n';
        dxf += '8\nROTARY_SCAN\n';  // Layer name
        dxf += '10\n' + point.x.toFixed(6) + '\n';  // X
        dxf += '20\n' + point.y.toFixed(6) + '\n';  // Y
        dxf += '30\n' + point.z.toFixed(6) + '\n';  // Z
        
        // Add text label every 10th point to show A/B values
        if (index % 10 === 0) {
            dxf += '0\nTEXT\n';
            dxf += '8\nROTARY_SCAN\n';  // Layer name
            dxf += '10\n' + point.x.toFixed(6) + '\n';  // X position
            dxf += '20\n' + point.y.toFixed(6) + '\n';  // Y position
            dxf += '30\n' + (point.z + 0.1).toFixed(6) + '\n';  // Z position (offset above point)
            dxf += '40\n0.1\n';  // Text height
            dxf += '1\nA:' + point.a.toFixed(1) + ' B:' + point.b.toFixed(1) + '\n';  // Text string
        }
    });
    
    // End Entities Section
    dxf += '0\nENDSEC\n';
    
    // End of File
    dxf += '0\nEOF\n';
    
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
