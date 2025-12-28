/**
 * FabMo Probing UI Controller - Manual Data Retrieval
 * User clicks "Retrieve Data" buttons when scans are complete
 */

// Global state
let probeConfig = {
    plateThickness: 0.500,
    probeSpeed: 1.0,
    safeZ: 0.5,
    retractDistance: 0.125,
    inputNumber: 7,
    maxProbeDepth: -2.0,
    cornerBlockSize: 2.0
};

let scanData = {
    points: [],
    startTime: null,
    endTime: null
};

let rotaryScanData = {
    points: [],
    startTime: null,
    endTime: null
};

/**
 * Initialize UI when document is ready
 */
$(document).ready(function() {
    console.log('Probing UI initializing (Manual Retrieve Mode)...');
    
    loadConfiguration();
    attachEventHandlers();
    updateRotaryAxisLabels(); // Set initial labels
    
    console.log('Probing UI ready!');
});

/**
 * Attach all button click handlers
 */
function attachEventHandlers() {
    $('#saveConfigBtn').click(saveConfiguration);
    
    // Probe buttons
    $('#probeZBtn').click(runZAxisProbe);
    $('#probeXYZBtn').click(runXYZCornerProbe);
    $('#scanSurfaceBtn').click(runSurfaceScan);
    $('#scanRotaryBtn').click(runRotaryScan);
    
    // Retrieve buttons (NEW)
    $('#retrieveZBtn').click(retrieveZData);
    $('#retrieveScanBtn').click(retrieveSurfaceScanData);
    $('#retrieveRotaryBtn').click(retrieveRotaryScanData);
    
    // Export buttons
    $('#exportScanBtn').click(exportScanDataCSV);
    $('#exportRotaryBtn').click(exportRotaryScanDataCSV);
    
    // Dynamic UI updates for rotary section
    $('#parallelAxis').change(updateRotaryAxisLabels);
}

/**
 * Update rotary axis input labels based on selected parallel axis
 */
function updateRotaryAxisLabels() {
    const parallelAxis = $('#parallelAxis').val();
    
    if (parallelAxis === 'X') {
        // Cylinder parallel to X, scan along X
        $('#rotaryScanStartLabel').text('Start X (inches):');
        $('#rotaryScanEndLabel').text('End X (inches):');
    } else {
        // Cylinder parallel to Y, scan along Y
        $('#rotaryScanStartLabel').text('Start Y (inches):');
        $('#rotaryScanEndLabel').text('End Y (inches):');
    }
}

/**
 * Save configuration
 */
function saveConfiguration() {
    probeConfig.plateThickness = parseFloat($('#plateThickness').val());
    probeConfig.probeSpeed = parseFloat($('#probeSpeed').val());
    probeConfig.safeZ = parseFloat($('#safeZ').val());
    probeConfig.retractDistance = parseFloat($('#retractDistance').val());
    probeConfig.inputNumber = parseInt($('#inputNumber').val());
    probeConfig.maxProbeDepth = parseFloat($('#maxProbeDepth').val());
    probeConfig.cornerBlockSize = parseFloat($('#cornerBlockSize').val());
    
    localStorage.setItem('fabmoProbeConfig', JSON.stringify(probeConfig));
    
    if (typeof fabmo !== 'undefined') {
        fabmo.getAppConfig(function(err, config) {
            if (!err) {
                config.probeSettings = probeConfig;
                fabmo.setAppConfig(config, function(err) {
                    if (err) {
                        console.error('Error saving to app config:', err);
                    }
                });
            }
        });
    }
    
    showStatus('Configuration saved!', 'success');
}

/**
 * Load configuration
 */
function loadConfiguration() {
    const saved = localStorage.getItem('fabmoProbeConfig');
    if (saved) {
        try {
            probeConfig = JSON.parse(saved);
            updateConfigForm();
        } catch (e) {
            console.error('Error loading config:', e);
        }
    }
    
    if (typeof fabmo !== 'undefined') {
        fabmo.getAppConfig(function(err, config) {
            if (!err && config.probeSettings) {
                probeConfig = config.probeSettings;
                updateConfigForm();
            }
        });
    }
}

/**
 * Update form fields with current configuration
 */
function updateConfigForm() {
    $('#plateThickness').val(probeConfig.plateThickness);
    $('#probeSpeed').val(probeConfig.probeSpeed);
    $('#safeZ').val(probeConfig.safeZ);
    $('#retractDistance').val(probeConfig.retractDistance);
    $('#inputNumber').val(probeConfig.inputNumber);
    $('#maxProbeDepth').val(probeConfig.maxProbeDepth);
    $('#cornerBlockSize').val(probeConfig.cornerBlockSize);
}

/**
 * Run Z-axis probing routine (submits job only, no wait)
 */
async function runZAxisProbe() {
    saveConfiguration();
    
    showStatus('Starting Z-axis probe...', 'info');
    disableButtons(true);
    
    try {
        const program = generateZProbeProgram(probeConfig);
        
        console.log('Generated Z-probe program');
        
        showStatus('Executing probe program... Click "Retrieve Z Data" when complete.', 'info');
        await runSBPBatch(program);
        
        showStatus('✅ Z-probe program submitted! Click "Retrieve Z Data" when complete.', 'success');
        
    } catch (err) {
        showStatus('❌ Z-axis probing failed: ' + err.message, 'error');
        console.error('Probing error:', err);
    } finally {
        disableButtons(false);
    }
}

/**
 * Retrieve Z-axis probe data (manual button click)
 */
async function retrieveZData() {
    showStatus('Retrieving Z-axis data...', 'info');
    
    try {
        const data = await retrieveZProbeData();
        
        if (data && data.complete === 1) {
            showStatus('✅ Z-axis probing completed! ProbeZ=' + data.probeZ + ', FinalZ=' + data.finalZ, 'success');
        } else {
            showStatus('⚠️ No Z-probe data found. Make sure probe completed.', 'error');
        }
        
    } catch (err) {
        showStatus('❌ Error retrieving Z data: ' + err.message, 'error');
        console.error('Retrieval error:', err);
    }
}

/**
 * Run XYZ corner probing routine
 */
async function runXYZCornerProbe() {
    saveConfiguration();
    
    showStatus('XYZ corner probing not yet implemented', 'info');
    disableButtons(false);
}

/**
 * Run 2D surface scanning (submits job only, no wait)
 */
async function runSurfaceScan() {
    saveConfiguration();
    
    const startX = parseFloat($('#scanStartX').val());
    const startY = parseFloat($('#scanStartY').val());
    const endX = parseFloat($('#scanEndX').val());
    const endY = parseFloat($('#scanEndY').val());
    const spacing = parseFloat($('#gridSpacing').val());
    
    if (startX >= endX || startY >= endY) {
        showStatus('❌ Invalid scan area: End coordinates must be greater than start', 'error');
        return;
    }
    
    if (spacing <= 0) {
        showStatus('❌ Grid spacing must be positive', 'error');
        return;
    }
    
    const xPoints = Math.floor((endX - startX) / spacing) + 1;
    const yPoints = Math.floor((endY - startY) / spacing) + 1;
    const totalPoints = xPoints * yPoints;
    
    if (totalPoints > 10000) {
        showStatus('❌ Too many points (' + totalPoints + '). Maximum is 10,000. Increase grid spacing.', 'error');
        return;
    }
    
    showStatus('Starting surface scan: ' + xPoints + 'x' + yPoints + ' grid (' + totalPoints + ' points)', 'info');
    disableButtons(true);
    
    scanData.points = [];
    scanData.startTime = new Date();
    
    try {
        const scanParams = {
            startX: startX,
            startY: startY,
            endX: endX,
            endY: endY,
            spacing: spacing
        };
        
        const program = generateSurfaceScanProgram(scanParams, probeConfig);
        
        console.log('Generated surface scan program (' + program.split('\n').length + ' lines)');
        
        showStatus('Executing surface scan (' + totalPoints + ' points)... Click "Retrieve Scan Data" when complete.', 'info');
        await runSBPBatch(program);
        
        showStatus('✅ Surface scan program submitted! Click "Retrieve Scan Data" when complete.', 'success');
        
    } catch (err) {
        showStatus('❌ Surface scan failed: ' + err.message, 'error');
        console.error('Scan error:', err);
    } finally {
        disableButtons(false);
    }
}

/**
 * Retrieve surface scan data (manual button click)
 */
async function retrieveSurfaceScanData() {
    showStatus('Retrieving surface scan data...', 'info');
    
    try {
        scanData.endTime = new Date();
        scanData.points = await retrieveScanData();
        
        if (scanData.points.length === 0) {
            showStatus('⚠️ No scan data found. Make sure scan completed.', 'error');
            return;
        }
        
        showStatus('✅ Surface scan completed! Retrieved ' + scanData.points.length + ' points', 'success');
        
        displayScanResults();
        $('#exportScanBtn').show();
        $('#exportScanDxfBtn').show();  // Show DXF export button
        
        
    } catch (err) {
        showStatus('❌ Error retrieving scan data: ' + err.message, 'error');
        console.error('Retrieval error:', err);
    }
}

/**
 * Run 4D rotary surface scanning (submits job only, no wait)
 */
async function runRotaryScan() {
    saveConfiguration();
    
    const rotaryAxis = $('#rotaryAxis').val(); // 'A' or 'B'
    const parallelAxis = $('#parallelAxis').val(); // 'X' or 'Y'
    const manualRotary = $('#manualRotary').is(':checked');
    
    const start = parseFloat($('#rotaryScanStart').val());
    const end = parseFloat($('#rotaryScanEnd').val());
    const spacing = parseFloat($('#rotaryGridSpacing').val());
    const angleStep = parseFloat($('#rotaryAngleSteps').val());
    
    if (start >= end) {
        showStatus('❌ Invalid range: End position must be greater than start', 'error');
        return;
    }
    
    if (spacing <= 0) {
        showStatus('❌ Spacing must be positive', 'error');
        return;
    }
    
    const numAngles = Math.floor(360 / angleStep);
    const linearPoints = Math.floor((end - start) / spacing) + 1;
    const totalPoints = numAngles * linearPoints;
    
    if (totalPoints > 10000) {
        showStatus('❌ Too many points (' + totalPoints + '). Maximum is 10,000. Reduce angles or increase spacing.', 'error');
        return;
    }
    
    const rotaryType = manualRotary ? 'Manual' : 'Automatic';
    showStatus('Starting rotary scan (' + rotaryType + '): ' + numAngles + ' angles × ' + linearPoints + ' points = ' + totalPoints + ' total', 'info');
    disableButtons(true);
    
    rotaryScanData.points = [];
    rotaryScanData.startTime = new Date();
    
    try {
        const scanParams = {
            start: start,
            end: end,
            spacing: spacing,
            angleStep: angleStep,
            axis: parallelAxis,
            rotaryAxis: rotaryAxis,
            manualRotary: manualRotary
        };
        
        const program = generateRotaryScanProgram(scanParams, probeConfig);
        
        console.log('Generated rotary scan program (' + program.split('\n').length + ' lines)');
        console.log('Rotary axis: ' + rotaryAxis + ', Manual: ' + manualRotary);
        
        if (manualRotary) {
            showStatus('Manual rotation mode: You will be prompted to rotate to each angle', 'info');
        }
        
        showStatus('Executing rotary scan (' + totalPoints + ' points)... Click "Retrieve Rotary Data" when complete.', 'info');
        await runSBPBatch(program);
        
        showStatus('✅ Rotary scan program submitted! Click "Retrieve Rotary Data" when complete.', 'success');
        
    } catch (err) {
        showStatus('❌ Rotary scan failed: ' + err.message, 'error');
        console.error('Rotary scan error:', err);
    } finally {
        disableButtons(false);
    }
}

/**
 * Retrieve rotary scan data (manual button click)
 */
async function retrieveRotaryScanData() {
    showStatus('Retrieving rotary scan data...', 'info');
    
    try {
        rotaryScanData.endTime = new Date();
        rotaryScanData.points = await retrieveRotaryData();
        
        if (rotaryScanData.points.length === 0) {
            showStatus('⚠️ No rotary data found. Make sure scan completed.', 'error');
            return;
        }
        
        showStatus('✅ Rotary scan completed! Retrieved ' + rotaryScanData.points.length + ' points (x,y,z,a,b)', 'success');
        
        $('#exportRotaryBtn').show();
        $('#exportRotaryDxfBtn').show();  // Show DXF export button
       
        
    } catch (err) {
        showStatus('❌ Error retrieving rotary data: ' + err.message, 'error');
        console.error('Retrieval error:', err);
    }
}

/**
 * Display scan results with statistics and visualization
 */
function displayScanResults() {
    if (scanData.points.length === 0) {
        return;
    }
    
    const zValues = scanData.points.map(p => p.z);
    const minZ = Math.min(...zValues);
    const maxZ = Math.max(...zValues);
    const avgZ = zValues.reduce((a, b) => a + b, 0) / zValues.length;
    const rangeZ = maxZ - minZ;
    
    const duration = (scanData.endTime - scanData.startTime) / 1000;
    
    const statsHtml = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
            <div class="stat-box">
                <strong>Points Scanned:</strong><br>${scanData.points.length}
            </div>
            <div class="stat-box">
                <strong>Duration:</strong><br>${duration.toFixed(1)}s
            </div>
            <div class="stat-box">
                <strong>Z Range:</strong><br>${rangeZ.toFixed(4)}"
            </div>
            <div class="stat-box">
                <strong>Min Z:</strong><br>${minZ.toFixed(4)}"
            </div>
            <div class="stat-box">
                <strong>Max Z:</strong><br>${maxZ.toFixed(4)}"
            </div>
            <div class="stat-box">
                <strong>Avg Z:</strong><br>${avgZ.toFixed(4)}"
            </div>
        </div>
    `;
    
    $('#resultsStats').html(statsHtml);
    
    let tableHtml = '<h3>Data Points (showing first 50):</h3><table class="results-data-table"><thead><tr><th>#</th><th>X</th><th>Y</th><th>Z</th></tr></thead><tbody>';
    
    const displayPoints = scanData.points.slice(0, 50);
    displayPoints.forEach(p => {
        tableHtml += `<tr><td>${p.index}</td><td>${p.x.toFixed(3)}</td><td>${p.y.toFixed(3)}</td><td>${p.z.toFixed(4)}</td></tr>`;
    });
    
    tableHtml += '</tbody></table>';
    
    if (scanData.points.length > 50) {
        tableHtml += `<p style="margin-top: 10px;"><em>... and ${scanData.points.length - 50} more points. Export CSV to see all data.</em></p>`;
    }
    
    $('#resultsTable').html(tableHtml);
    
    drawScanVisualization();
    
    $('#resultsSection').show();
}

/**
 * Draw a heat map visualization of the scan
 */
function drawScanVisualization() {
    const canvas = document.getElementById('resultsCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);
    
    if (scanData.points.length === 0) return;
    
    const xs = scanData.points.map(p => p.x);
    const ys = scanData.points.map(p => p.y);
    const zs = scanData.points.map(p => p.z);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    
    const padding = 50;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;
    
    scanData.points.forEach(p => {
        const x = padding + ((p.x - minX) / (maxX - minX || 1)) * plotWidth;
        const y = height - padding - ((p.y - minY) / (maxY - minY || 1)) * plotHeight;
        
        const normalized = (p.z - minZ) / (maxZ - minZ || 1);
        const hue = (1 - normalized) * 240;
        
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
    });
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, plotWidth, plotHeight);
    
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText('X: ' + minX.toFixed(1) + '"', padding, height - 10);
    ctx.fillText('X: ' + maxX.toFixed(1) + '"', width - padding - 50, height - 10);
    ctx.fillText('Y: ' + minY.toFixed(1) + '"', 10, height - padding);
    ctx.fillText('Y: ' + maxY.toFixed(1) + '"', 10, padding + 10);
    
    ctx.fillText('Z Height Map', padding, 20);
    ctx.fillText('Blue = Low (' + minZ.toFixed(4) + '")', padding, 35);
    ctx.fillText('Red = High (' + maxZ.toFixed(4) + '")', padding + 150, 35);
}

/**
 * Export scan data as CSV
 */
function exportScanDataCSV() {
    if (scanData.points.length === 0) {
        showStatus('No scan data to export', 'error');
        return;
    }
    
    let csv = 'Index,X (in),Y (in),Z (in)\n';
    
    scanData.points.forEach(p => {
        csv += `${p.index},${p.x},${p.y},${p.z}\n`;
    });
    
    downloadCSV(csv, 'surface_scan_' + new Date().toISOString().slice(0, 10) + '.csv');
    showStatus('✅ CSV exported successfully (' + scanData.points.length + ' points)', 'success');
}

/**
 * Export rotary scan data as CSV with all 5 axes
 */
function exportRotaryScanDataCSV() {
    if (rotaryScanData.points.length === 0) {
        showStatus('No rotary scan data to export', 'error');
        return;
    }
    
    let csv = 'Index,X (in),Y (in),Z (in),A (deg),B (deg)\n';
    
    rotaryScanData.points.forEach(p => {
        csv += `${p.index},${p.x},${p.y},${p.z},${p.a},${p.b}\n`;
    });
    
    downloadCSV(csv, 'rotary_scan_' + new Date().toISOString().slice(0, 10) + '.csv');
    showStatus('✅ CSV exported successfully (' + rotaryScanData.points.length + ' points with x,y,z,a,b)', 'success');
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (navigator.msSaveBlob) {
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
 * Show status message
 */
function showStatus(message, type) {
    const statusDiv = $('#status');
    
    statusDiv.removeClass('status-info status-success status-error');
    statusDiv.addClass('status-' + type);
    statusDiv.html(message);
    statusDiv.show();
    
    console.log('[Status ' + type + ']', message);
    
    if (type === 'success') {
        setTimeout(function() {
            statusDiv.fadeOut();
        }, 5000);
    }
}

/**
 * Disable/enable all probe buttons
 */
function disableButtons(disable) {
    $('#probeZBtn, #probeXYZBtn, #scanSurfaceBtn, #scanRotaryBtn').prop('disabled', disable);
}
