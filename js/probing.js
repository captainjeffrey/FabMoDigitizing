/**
 * FabMo Batch Command Execution with JSON Variable Storage
 
 * All variables in UPPERCASE (FabMo converts to uppercase anyway)
 */

/**
 * Run a batch of SBP commands as a single job
 */
function runSBPBatch(code) {
    return new Promise((resolve, reject) => {
        fabmo.runSBP(code, function(err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

/**
 * Get persistent variable from FabMo config
 */
function getConfigVariable(varName) {
    return new Promise((resolve, reject) => {
        fabmo.getConfig(function(err, config) {
            if (err) {
                reject(err);
                return;
            }
            
            if (config.opensbp && config.opensbp.variables) {
                // FabMo converts all variables to uppercase
                const upperVarName = varName.toUpperCase();
                const value = config.opensbp.variables[upperVarName];
                console.log('Got variable &' + upperVarName + ' = ' + (typeof value === 'string' && value.length > 100 ? value.substring(0, 100) + '...' : value));
                resolve(value);
            } else {
                console.warn('No variables found in config');
                resolve(undefined);
            }
        });
    });
}

/**
 * Generate Z-zeroing routine for surface scans
 * Uses SK and DIALOG commands for user input
 * All variables in UPPERCASE
 */
function generateSurfaceZZeroRoutine(config) {
    const program = [
        '\'=== Z-Axis Zeroing Routine (Surface Scan) ===',
        ' &safeZ = 0',
        ' &retractBack = 0',
        '',
        '\' Pause for user to position probe',
        'SK "Position the probe over a known flat area on your workpiece, then press X"',
        '',
        '\' Set probe speed',
        'VS,' + config.probeSpeed + ',' + config.probeSpeed,
        '',
        '\' Probe down to find surface',
        'PZ,' + config.maxProbeDepth + ',' + config.probeSpeed + ',' + config.inputNumber,
        '',
        '\' Zero at probe contact',
        'ZZ',
        '',
        '\' Get the known height from user using DIALOG',
        '&KNOWNHEIGHT = 0',
        'DIALOG "Enter the Z height of this reference surface (in inches): ", INPUT="&KNOWNHEIGHT", OKTEXT="Continue"',
        '&KNOWNHEIGHT = &KNOWNHEIGHT/1',
        '\' Set Z to the known height',
        'VA, ,,&KNOWNHEIGHT',
        '',
        '\' Move to safe height',
        '&safeZ = 0.00 + ' + config.safeZ.toFixed(4) + ' + &KNOWNHEIGHT',
        '',
        'MZ, &safeZ',
        '',
        'PAUSE "Z-axis zeroed! Reference height set to " + &KNOWNHEIGHT + " inches. Press OK to continue."',
        ''
    ];
    
    return program.join('\n');
}

/**
 * Generate Z-zeroing routine for rotary scans  
 * Uses SK and DIALOG commands for user input
 * All variables in UPPERCASE
 */
function generateRotaryZZeroRoutine(config) {
    const program = [
        '\'=== Z-Axis Zeroing Routine (Rotary Scan) ===',
        '',
        ' &safeZ = 0',
        ' &retractBack = 0',
        '',
        '\' Pause for user to position probe',
        'SK "Position the probe at the TOP of the cylinder, then press OK"',
        '',
        '\' Set probe speed', 
        'VS,' + config.probeSpeed + ',' + config.probeSpeed,
        '',
        '\' Probe down to find cylinder top',
        'PZ,' + config.maxProbeDepth + ',' + config.probeSpeed + ',' + config.inputNumber,
        '',
        '\' Get the cylinder radius from user using DIALOG',
        '&CYLINDERRADIUS = 0',
        'DIALOG "Enter the radius of the cylinder (in inches): ", INPUT="&CYLINDERRADIUS", OKTEXT="Continue"',
        '&CYLINDERRADIUS = &CYLINDERRADIUS/1',
        '\' Set Z to the radius (top of cylinder)',
        'VA, ,,&CYLINDERRADIUS',
        '',
        '\' Move to safe height',
        '&safeZ = 0.00 + ' + config.safeZ.toFixed(4) + ' + &CYLINDERRADIUS',
        '',
        'MZ, &safeZ',
        '',
        'PAUSE "Z-axis zeroed! Cylinder radius set to "  + &CYLINDERRADIUS + " inches. Press OK to continue."',
        ''
    ];
    
    return program.join('\n');
}

/**
 * Generate Z-axis probe program with JSON storage
 * Uses &COMPLETE flag for job completion detection
 */
function generateZProbeProgram(config) {
    const program = [
        '\'=== Z-Axis Probing with JSON Storage ===',
        '',
        ' &safeZ = 0',
        ' &retractBack = 0',
        '',
        '\' Clear completion flag at start',
        '&COMPLETE = 0',
        '',
        '\' Initialize JSON data - using &quot; for quotes',
        '&PROBEDATA = "{"',
        '',
        '\' Pause for user to position probe',
        'SK "Position the probe over the flat area to zero to , then press X"',
        '',
        '\' Set probe speed',
        'VS,' + config.probeSpeed + ',' + config.probeSpeed,
        '',
        '\' Probe down',
        'PZ,' + config.maxProbeDepth + ',' + config.probeSpeed + ',' + config.inputNumber,
        '',
        '\' Append probe Z to JSON using &quot;',
        '&PROBEDATA = &PROBEDATA + "&quot;probeZ&quot;:" + %(3)',
        '',
        '\' Zero at contact point',
        'ZZ',
        '',
        '\' Move to safe height',
        '',
        'MZ, ' + config.safeZ.toFixed(4),
        '',
        '\' Close JSON',
        '&PROBEDATA = &PROBEDATA + ",&quot;complete&quot;:1}"',
        '',
        '\' Set completion flag',
        '&COMPLETE = 1',
        'PAUSE "Complete"',
        ''
    ];
    console.log(program.join('\n'));
    return program.join('\n');
}

/**
 * Generate surface scan program with JSON storage
 * Uses &COMPLETE flag for reliable job completion detection
 */
function generateSurfaceScanProgram(scanParams, probeConfig) {
    const { startX, startY, endX, endY, spacing } = scanParams;
    
    const xPoints = Math.floor((endX - startX) / spacing) + 1;
    const yPoints = Math.floor((endY - startY) / spacing) + 1;
    const totalPoints = xPoints * yPoints;
    
    const program = [
        '\'=== Surface Scan with JSON Storage ===',
        '\' Grid: ' + xPoints + 'x' + yPoints + ' = ' + totalPoints + ' points',
        '\' Using &quot; for quotes (FabMo-safe)',
        '\' Using DIALOG for user input (new FabMo syntax)',
        '\' Using &COMPLETE flag for job completion',
        '',
        ' &safeZ = 0',
        ' &retractBack = 0',
        '',
        '\' Clear completion flag at start',
        '&COMPLETE = 0',
        '',
        '\' === STEP 1: Z-AXIS ZEROING ===',
        generateSurfaceZZeroRoutine(probeConfig),
        '',
        '\' === STEP 2: SURFACE SCANNING ===',
        '\' Initialize JSON array',
        '&SCANDATA = "["',
        '',
        '\' Setup',
        '&safeZ =   0.00 + ' + probeConfig.safeZ.toFixed(4)+ ' + &KNOWNHEIGHT',
        '',
        'MZ, &safeZ',
        'VS,' + probeConfig.probeSpeed + ',' + probeConfig.probeSpeed,
        ''
    ];
    
    // Generate scan pattern
    let pointIndex = 0;
    
    for (let yi = 0; yi < yPoints; yi++) {
        const y = startY + (yi * spacing);
        const xReversed = (yi % 2 === 1);
        
        for (let xi = 0; xi < xPoints; xi++) {
            const xIndex = xReversed ? (xPoints - 1 - xi) : xi;
            const x = startX + (xIndex * spacing);
            
            pointIndex++;
            const isFirstPoint = pointIndex === 1;
            
            program.push('\' Point ' + pointIndex + ' of ' + totalPoints);
            program.push('M2,' + x.toFixed(4) + ',' + y.toFixed(4));
            
            if (!isFirstPoint) {
                program.push('&SCANDATA = &SCANDATA + ","');
            }
            
            // Build JSON object using &quot; instead of \"
            program.push('&SCANDATA = &SCANDATA + "{"');
            program.push('&SCANDATA = &SCANDATA + "&quot;x&quot;:" + %(1)');
            program.push('&SCANDATA = &SCANDATA + ",&quot;y&quot;:" + %(2)');
            program.push('PZ,' + probeConfig.maxProbeDepth + ',' + probeConfig.probeSpeed + ',' + probeConfig.inputNumber);
            program.push('&SCANDATA = &SCANDATA + ",&quot;z&quot;:" + %(3)');
            program.push('&SCANDATA = &SCANDATA + ",&quot;i&quot;:" + ' + pointIndex + ' + "}"');
            program.push('&retractBack = 0.00 + ' + probeConfig.retractDistance.toFixed(4) + ' + &KNOWNHEIGHT');
            //program.push('PAUSE "&safeZ = " + &safeZ + "and  &retractBack = " + &retractBack ');
            program.push('MZ, &retractBack');
            program.push('');
        }
    }
    
    program.push('\' Finalize JSON');
    program.push('&SCANDATA = &SCANDATA + "]"');
    program.push('');
    program.push('\' Return to start');
    program.push('&safeZ = 0.00 + ' + probeConfig.safeZ.toFixed(4) + ' + &KNOWNHEIGHT');
    //program.push('PAUSE "&safeZ = " + &safeZ + "and  &retractBack = " + &retractBack ');
    program.push('MZ, &safeZ');
    program.push('M2,' + startX.toFixed(4) + ',' + startY.toFixed(4));
    program.push('');
    program.push('\' Store metadata');
    program.push('&TOTALPOINTS = ' + totalPoints);
    program.push('&SCANCOMPLETE = 1');
    program.push('');
    program.push('\' Set completion flag');
    program.push('&COMPLETE = 1');
    program.push('PAUSE "Complete"');
    
    console.log(program.join('\n'));
    return program.join('\n');
}

/**
 * Generate rotary scan program with JSON storage
 * Uses &COMPLETE flag for reliable job completion detection
 */
function generateRotaryScanProgram(scanParams, probeConfig) {
    const { start, end, spacing, angleStep, axis, rotaryAxis, manualRotary } = scanParams;
    
    const numAngles = Math.floor(360 / angleStep);
    const linearPoints = Math.floor((end - start) / spacing) + 1;
    const totalPoints = numAngles * linearPoints;
    
    // Determine which axis to rotate (MA for A-axis, MB for B-axis)
    const rotateCommand = rotaryAxis === 'B' ? 'MB' : 'MA';
    
    const program = [
        '\'=== 4D Rotary Scan with JSON Storage ===',
        '\' Rotary Axis: ' + rotaryAxis,
        '\' Angles: ' + numAngles + ', Linear points: ' + linearPoints,
        '\' Total points: ' + totalPoints,
        '\' Manual rotation: ' + (manualRotary ? 'YES' : 'NO'),
        '\' Using &quot; for quotes (FabMo-safe)',
        '\' Using DIALOG for user input (new FabMo syntax)',
        '\' Using &COMPLETE flag for job completion',
        '',
        ' &safeZ = 0',
        ' &retractBack = 0',
        '',
        '\' Clear completion flag at start',
        '&COMPLETE = 0',
        '',
        '\' === STEP 1: Z-AXIS ZEROING ===',
        generateRotaryZZeroRoutine(probeConfig),
        '',
        '\' === STEP 2: ROTARY SCANNING ===',
        '\' Initialize JSON array',
        '&ROTARYDATA = "["',
        '',
        '\' Setup',
        '&safeZ =   0.00 + ' + probeConfig.safeZ.toFixed(4) + ' + &CYLINDERRADIUS',
        '',
        'MZ, &safeZ',
        'VS,' + probeConfig.probeSpeed + ',' + probeConfig.probeSpeed,
        ''
    ];
    
    let pointIndex = 0;
    
    // For each angle
    for (let a = 0; a < numAngles; a++) {
        const angle = a * angleStep;
        
        program.push('\' === Angle: ' + angle + ' degrees ===');
        
        if (manualRotary) {
            // Manual rotation - pause and ask user to rotate
            program.push('PAUSE "Rotate the ' + rotaryAxis + '-axis to ' + angle + ' degrees, then press OK"');
        } 
        
        // Automatic rotation it needs to pretend so that the file shows the correct angle
        program.push(rotateCommand + ',' + angle);
        
        
        program.push('');
        
        // Scan along the selected axis
        for (let pos = start; pos <= end; pos += spacing) {
            pointIndex++;
            const isFirstPoint = pointIndex === 1;
            
            if (axis === 'X') {
                program.push('\' Point ' + pointIndex + ': X=' + pos.toFixed(4) + ', ' + rotaryAxis + '=' + angle);
                program.push('M2,' + pos.toFixed(4) + ',0');
            } else {
                program.push('\' Point ' + pointIndex + ': Y=' + pos.toFixed(4) + ', ' + rotaryAxis + '=' + angle);
                program.push('M2,0,' + pos.toFixed(4));
            }
            
            if (!isFirstPoint) {
                program.push('&ROTARYDATA = &ROTARYDATA + ","');
            }
            
            // Build JSON object using &quot; for all keys
            program.push('&ROTARYDATA = &ROTARYDATA + "{"');
            
            // Add all 5 axes: x, y, z, a, b
            program.push('&ROTARYDATA = &ROTARYDATA + "&quot;x&quot;:" + %(1)');
            program.push('&ROTARYDATA = &ROTARYDATA + ",&quot;y&quot;:" + %(2)');
            
            program.push('PZ,' + probeConfig.maxProbeDepth + ',' + probeConfig.probeSpeed + ',' + probeConfig.inputNumber);
            program.push('&ROTARYDATA = &ROTARYDATA + ",&quot;z&quot;:" + %(3)');
            
            program.push('&ROTARYDATA = &ROTARYDATA + ",&quot;a&quot;:" + %(4)');
            program.push('&ROTARYDATA = &ROTARYDATA + ",&quot;b&quot;:" + %(5)');
            
            program.push('&ROTARYDATA = &ROTARYDATA + ",&quot;i&quot;:" + ' + pointIndex + ' + "}"');
            
            program.push('&retractBack =  0.00 + ' + probeConfig.retractDistance.toFixed(4) + ' + &CYLINDERRADIUS');
            //program.push('PAUSE "&safeZ = " + &safeZ + "and  &retractBack = " + &retractBack ');
            program.push('MZ, &retractBack');
            program.push('');
        }
    }
    
    program.push('\' Finalize JSON');
    program.push('&ROTARYDATA = &ROTARYDATA + "]"');
    program.push('');
    
    // Return to origin
    program.push('\' Return to origin');
    if (!manualRotary) {
        program.push(rotateCommand + ',0');
    }
    program.push('M2,0,0');
    program.push('&safeZ =   0.00 + ' + probeConfig.safeZ.toFixed(4) + '+ &CYLINDERRADIUS');
    //program.push('PAUSE "&safeZ = " + &safeZ + "and  &retractBack = " + &retractBack ');
    program.push('MZ, &safeZ');
    program.push('');
    program.push('\' Store metadata');
    program.push('&TOTALPOINTS = ' + totalPoints);
    program.push('&ROTARYCOMPLETE = 1');
    program.push('');
    program.push('\' Set completion flag');
    program.push('&COMPLETE = 1');
    program.push('PAUSE "Complete"');
    console.log(program.join('\n'));
    return program.join('\n');
}


/**
 * Retrieve surface scan data from JSON variable
 * FabMo converts all variable names to UPPERCASE
 */
function retrieveScanData() {
    return new Promise((resolve, reject) => {
        console.log('Retrieving scan data from JSON variable...');
        
        fabmo.getConfig(function(err, config) {
            if (err) {
                console.error('Error getting config:', err);
                reject(err);
                return;
            }
            
            // Get the SCANDATA variable (FabMo converts to uppercase)
            const jsonString = config.opensbp.tempVariables.SCANDATA;
            
            if (!jsonString) {
                console.error('No scan data found in config');
                resolve([]);
                return;
            }
            
            try {
                console.log('Got variable &SCANDATA = ' + jsonString.substring(0, 100) + '...');
                
                // Replace &quot; with " for JSON parsing
                const cleanJson = jsonString.replace(/&quot;/g, '"').replace(/&#34;/g, '"');
                
                const points = JSON.parse(cleanJson);
                console.log('✅ Retrieved ' + points.length + ' points from JSON');
                
                const mappedPoints = points.map(p => ({
                    x: p.x,
                    y: p.y,
                    z: p.z,
                    index: p.i
                }));
                
                resolve(mappedPoints);
                
            } catch (err) {
                console.error('Error parsing JSON:', err);
                console.log('Raw JSON:', jsonString);
                console.log('Cleaned JSON:', jsonString.replace(/&quot;/g, '"'));
                resolve([]);
            }
        });
    });
}

/**
 * Retrieve rotary scan data from JSON variable
 * FabMo converts all variable names to UPPERCASE
 */
function retrieveRotaryData() {
    return new Promise((resolve, reject) => {
        console.log('Retrieving rotary scan data from JSON variable...');
        
        fabmo.getConfig(function(err, config) {
            if (err) {
                console.error('Error getting config:', err);
                reject(err);
                return;
            }
            
            // Get the ROTARYDATA variable (FabMo converts to uppercase)
            const jsonString = config.opensbp.tempVariables.ROTARYDATA;
            
            if (!jsonString) {
                console.error('No rotary data found in config');
                resolve([]);
                return;
            }
            
            try {
                console.log('Got variable &ROTARYDATA = ' + jsonString.substring(0, 100) + '...');
                
                // Replace &quot; with " for JSON parsing
                const cleanJson = jsonString.replace(/&quot;/g, '"').replace(/&#34;/g, '"');
                
                const points = JSON.parse(cleanJson);
                console.log('✅ Retrieved ' + points.length + ' rotary points from JSON');
                
                const mappedPoints = points.map(p => ({
                    x: p.x,
                    y: p.y,
                    z: p.z,
                    a: p.a,
                    b: p.b,
                    index: p.i
                }));
                
                resolve(mappedPoints);
                
            } catch (err) {
                console.error('Error parsing rotary JSON:', err);
                console.log('Raw JSON:', jsonString);
                console.log('Cleaned JSON:', jsonString.replace(/&quot;/g, '"'));
                resolve([]);
            }
        });
    });
}

/**
 * Retrieve Z probe data from JSON variable
 * FabMo converts all variable names to UPPERCASE
 */
function retrieveZProbeData() {
    return new Promise((resolve, reject) => {
        console.log('Retrieving Z probe data from JSON variable...');
        
        fabmo.getConfig(function(err, config) {
            if (err) {
                console.error('Error getting config:', err);
                reject(err);
                return;
            }
            
            // Get the PROBEDATA variable (FabMo converts to uppercase)
            //const jsonString = config.opensbp && config.opensbp.variables && config.opensbp.variables.PROBEDATA;
             const jsonString = JSON.stringify(config.opensbp.tempVariables.PROBEDATA);
            
            if (!jsonString) {
                console.error('No probe data found in config');
                resolve(null);
                return;
            }
            
            try {
                console.log('Got variable &PROBEDATA = ' + jsonString);
                
                // Replace &quot; with " for JSON parsing
                const cleanJson = jsonString.replace(/&quot;/g, '"');
                
                //const data = JSON.parse(cleanJson);
                console.log('✅ Retrieved Z probe data:', cleanJson); //data);
                
                resolve(cleanJson);
                
            } catch (err) {
                console.error('Error parsing probe JSON:', err);
                console.log('Raw JSON:', jsonString);
                console.log('Cleaned JSON:', jsonString.replace(/&quot;/g, '"'));
                resolve(null);
            }
        });
    });
}
