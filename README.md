# FabMo Digitizing & Probing App

A comprehensive digitizing probe application for FabMo-powered CNC machines. Scan, measure, and digitize surfaces and objects with precision using a touch probe.

## 🎯 Features

### Probing Modes

- **Z-Axis Probing** - Set tool height with automatic plate thickness compensation
- **Surface Scanning** - Create 2D height maps of workpiece surfaces
- **4D Rotary Scanning** - Digitize cylindrical objects with full 5-axis data capture
- **Manual Retrieval** - User-controlled data retrieval after scan completion

### Data Export

- **CSV Export** - Spreadsheet-compatible data with all coordinates
- **DXF Export** - Import scan data directly into CAD software (AutoCAD, Fusion 360, FreeCAD, etc.)
  - Surface scans: 3D point cloud with polyline connections
  - Rotary scans: Points with A/B axis annotations

### Advanced Capabilities

- **JSON Variable Storage** - Unlimited scan points (no 1000-point limit)
- **Dynamic UI** - Context-aware axis labels for rotary scanning
- **Manual Rotary Support** - Works with rotary indexers (non-CNC rotary axes)
- **Automatic Z-Zeroing** - Dialog-based height/radius setup for accurate scans
- **Real-time Visualization** - Heat map display of scan data

---

## 📦 Installation

### Requirements

- FabMo-powered CNC machine (ShopBot, Handibot, etc.)
- Touch probe connected to digital input
- FabMo Dashboard v1.9.0 or later

### Install from GitHub

1. Download the latest `.fma` file from this repository
2. In FabMo Dashboard, go to **Apps** → **Install App**
3. Select the downloaded `.fma` file
4. The app will appear in your apps list


---

## 🚀 Quick Start

### 1. Configure Probe Settings


Set up your probe parameters:
- **Plate Thickness** - Thickness of your touch probe plate (inches)
- **Probe Speed** - Safe probing speed (inches/min)
- **Safe Z Height** - Clearance height above workpiece
- **Input Number** - Digital input your probe is connected to (1-8)

### 2. Run a Z-Axis Probe

Simple tool height setup:

1. Position tool above workpiece
2. Click **"Probe Z-Axis"**
3. Machine probes down, finds surface
4. Tool height is set automatically

### 3. Scan a Surface

Create a height map of your workpiece:

1. Set scan area:
   - Start X/Y coordinates
   - End X/Y coordinates  
   - Grid spacing
2. Click **"Scan Surface"**
3. Follow Z-zeroing dialog prompts
4. Machine scans all points automatically
5. Click **"Retrieve Scan Data"** when complete
6. Export as CSV or DXF

### 4. Scan a Rotary Object

Digitize cylindrical parts:

1. Mount object on rotary axis
2. Select rotary axis (A or B)
3. Choose axis parallel to cylinder
4. Set scan parameters
5. Click **"Scan Rotary Surface"**
6. For manual rotary: Follow rotation prompts
7. Click **"Retrieve Rotary Data"** when complete
8. Export full 5-axis data

---

## 📖 Detailed Documentation

### Probing Modes

#### Z-Axis Probing

Simple tool height setup with automatic plate thickness compensation.

**Workflow:**
1. Position tool above workpiece
2. Click "Probe Z-Axis"
3. Machine probes down until contact
4. Zeros Z-axis accounting for plate thickness
5. Retracts to safe height

**Use Cases:**
- Setting tool height before machining
- Measuring material thickness
- Verifying Z-axis calibration

---

#### Surface Scanning

Creates a 3D point cloud of your workpiece surface.

**Configuration:**
- **Start X/Y** - Bottom-left corner of scan area
- **End X/Y** - Top-right corner of scan area
- **Grid Spacing** - Distance between probe points

**Scan Pattern:**
- Serpentine (back-and-forth) for efficiency
- Automatic retraction between points
- Up to 10,000 points per scan

**Z-Zeroing:**
1. Position probe over known flat area
2. Enter reference height
3. Machine sets coordinate system

**Output:**
- Points: X, Y, Z coordinates
- Index: Sequential point number
- Visualization: Color-coded height map

**Export Formats:**
- CSV: `Index,X (in),Y (in),Z (in)`
- DXF: 3D points + polyline on SCAN_POINTS layer

---

#### 4D Rotary Scanning

Digitizes cylindrical objects with full angular and linear data.

**Configuration:**
- **Rotary Axis** - A-axis (4th) or B-axis (5th)
- **Parallel Axis** - Which axis cylinder is parallel to (X or Y)
- **Start/End Position** - Linear scan range
- **Linear Spacing** - Distance between linear probe points
- **Angle Steps** - Rotation increment (15°, 30°, 45°, 90°)
- **Manual Rotary** - Check for rotary indexer support

**Automatic Rotary:**
- Machine rotates axis automatically
- Probes at each angle
- Full automation

**Manual Rotary:**
- Dialog prompts for each rotation
- User rotates manually
- Press OK to continue
- Perfect for rotary indexers

**Z-Zeroing:**
1. Position probe at TOP of cylinder
2. Enter cylinder radius
3. Machine sets Z-axis to radius

**Output:**
- Points: X, Y, Z, A, B coordinates
- Full 5-axis data capture
- Sequential indexing

**Export Formats:**
- CSV: `Index,X (in),Y (in),Z (in),A (deg),B (deg)`
- DXF: 3D points with A/B text labels on ROTARY_SCAN layer

---

### Data Retrieval

**Manual Retrieval Mode:**
- No automatic waiting/polling
- User clicks "Retrieve Data" when ready
- SK dialog confirms scan completion
- Can retrieve multiple times
- More reliable than auto-detection

**Why Manual?**
- Eliminates timeout issues
- User controls timing
- Works even if completion detection fails
- Flexibility for long scans

---

### Export Formats

#### CSV Export

Spreadsheet-compatible data for analysis:

**Surface Scan CSV:**
```csv
Index,X (in),Y (in),Z (in)
1,0.0,0.0,0.1234
2,1.0,0.0,0.1235
3,2.0,0.0,0.1233
```

**Rotary Scan CSV:**
```csv
Index,X (in),Y (in),Z (in),A (deg),B (deg)
1,5.0,0.0,0.123,0.0,0.0
2,6.0,0.0,0.124,0.0,0.0
3,5.0,0.0,0.123,45.0,0.0
```

**Use Cases:**
- Import to Excel/Sheets for analysis
- Plot graphs of surface profiles
- Calculate statistics (min/max/average)
- Compare multiple scans

---

#### DXF Export

CAD-ready format for design work:

**Surface Scan DXF:**
- Format: AutoCAD R12 (AC1009) - universal compatibility
- Layer: SCAN_POINTS (white color)
- Entities:
  - POINT for each scanned location
  - POLYLINE connecting all points in scan order
- Coordinates in inches

**Rotary Scan DXF:**
- Format: AutoCAD R12 (AC1009)
- Layer: ROTARY_SCAN (green color)
- Entities:
  - POINT for each scanned location
  - TEXT labels every 10th point showing A/B angles
- Coordinates in inches

**Compatible With:**
- AutoCAD (all versions R12+)
- Fusion 360
- SolidWorks
- FreeCAD
- LibreCAD
- QCAD
- Rhino
- Blender (with DXF import addon)

**Use Cases:**
- Create surfaces from point clouds
- Reverse engineering
- Quality control comparisons
- CAM programming reference
- Documentation

---

## ⚙️ Configuration Reference

### Probe Settings

| Setting | Description | Typical Value | Range |
|---------|-------------|---------------|-------|
| Plate Thickness | Touch probe plate thickness | 0.500" | 0.1" - 1.0" |
| Probe Speed | Safe probing speed | 1.0 in/min | 0.5 - 2.0 in/min |
| Safe Z | Clearance height above work | 0.5" | 0.25" - 2.0" |
| Retract Distance | Move up after probe | 0.125" | 0.05" - 0.5" |
| Input Number | Digital input for probe | 7 | 1 - 8 |
| Max Probe Depth | Maximum downward travel | -2.0" | -0.5" to -5.0" |

### Scan Parameters

| Parameter | Surface Scan | Rotary Scan |
|-----------|--------------|-------------|
| Area Definition | Start/End X,Y | Start/End Position |
| Resolution | Grid Spacing | Linear Spacing + Angle Steps |
| Max Points | 10,000 | 10,000 |
| Typical Grid | 0.1" - 1.0" | 0.1" - 1.0" spacing, 15° - 90° angles |

---

## 🔧 Technical Details

### Architecture

**Frontend:**
- HTML5 interface with Foundation CSS framework
- jQuery for DOM manipulation and AJAX
- Real-time canvas visualization

**Backend:**
- OpenSBP program generation (ShopBot language)
- JSON variable storage in FabMo config
- Batch execution mode for reliability

**Data Flow:**
```
User Input → Generate OpenSBP → Execute on Machine → 
Store in JSON Variables → Manual Retrieve → 
Parse & Display → Export (CSV/DXF)
```

### File Structure

```
FabMoDigitizing/
├── probing.html          # Main UI
├── css/
│   ├── probeStyle.css    # App-specific styles
│   ├── foundation.css    # Framework styles
│   └── ...
├── js/
│   ├── probing.js        # Core probing logic
│   ├── probing-ui.js     # UI controllers
│   ├── dxf-export.js     # DXF file generation
│   └── ...
├── package.json          # App metadata
├── icon.png             # App icon
└── LICENSE              # Apache 2.0
```

### Key Technologies

- **OpenSBP** - ShopBot part program language
- **DIALOG Command** - User input dialogs (new FabMo syntax)
- **SK Command** - Synchronous pause with messages
- **JSON Storage** - Unlimited data points via single variable
- **HTML Entities** - `&quot;` for FabMo-safe string handling
- **DXF R12** - Universal CAD file format

### Variable Storage

All variables stored in UPPERCASE (FabMo convention):

| Variable | Contains | Format |
|----------|----------|--------|
| `SCANDATA` | Surface scan points | JSON array |
| `ROTARYDATA` | Rotary scan points | JSON array |
| `PROBEDATA` | Z-probe results | JSON object |
| `KNOWNHEIGHT` | Reference Z height | Number |
| `CYLINDERRADIUS` | Cylinder radius | Number |
| `TOTALPOINTS` | Point count | Number |
| `SCANCOMPLETE` | Scan status flag | 1 or 0 |

### OpenSBP Commands Used

| Command | Purpose |
|---------|---------|
| `M2` | Move XY to position |
| `MZ` | Move Z to absolute position |
| `PZ` | Probe Z-axis |
| `MA` / `MB` | Move rotary A/B axis |
| `ZZ` | Zero current axis |
| `ZZ` | Set axis position (offset) |
| `VS` | Set move/jog speeds |
| `SK` | Show dialog, wait for OK |
| `DIALOG` | Show input dialog |
| `&VARIABLE` | Persistent variable |

---

## 🎨 User Interface

### Main Sections

**Configuration Panel:**
- Probe settings (always visible)
- Save/load from localStorage
- Input validation

**Z-Axis Probing:**
- Single-click operation
- Automatic plate compensation
- Manual data retrieval

**Surface Scanning:**
- Grid parameter inputs
- Point count calculation
- Z-zeroing workflow
- Heat map visualization
- CSV and DXF export

**Rotary Scanning:**
- Dynamic axis selection
- Manual/automatic rotation modes
- Context-aware labels
- Full 5-axis export

**Results Display:**
- Statistics (min/max/avg Z, point count)
- Data table (first 50 points)
- Color-coded heat map
- Export buttons

### Button States

**Always Visible:**
- Probe Z-Axis
- Scan Surface
- Scan Rotary Surface
- Retrieve Data buttons

**Shown After Retrieval:**
- Export Scan as CSV
- Export Scan as DXF
- Export Rotary as CSV
- Export Rotary as DXF

---

## 🐛 Troubleshooting

### Probe Not Triggering

**Check:**
- Probe connected to correct digital input
- Alligator clip attached to tool/collet
- Green light on dashboard shows input active
- Input Number setting matches your hardware

**Solution:**
- Test input manually (touch probe to collet)
- Check wiring connections
- Try different input number

### Scan Data Not Retrieved

**Check:**
- SK dialog appeared showing "scan complete"
- Clicked "Retrieve Data" button after scan
- Console shows variable retrieval

**Solution:**
- Wait for SK completion dialog
- Click retrieve button again
- Check browser console for errors
- Verify FabMo engine is running

### DXF Won't Open

**Check:**
- File downloaded completely
- CAD software supports DXF R12
- File size is reasonable (not empty)

**Solution:**
- Try different CAD software (FreeCAD, LibreCAD)
- Check file in text editor (should start with `0\nSECTION`)
- Re-export the DXF

### Too Many Points Error

**Message:** "Too many points (X). Maximum is 10,000."

**Solution:**
- Increase grid spacing (surface scan)
- Increase linear spacing (rotary scan)
- Increase angle steps (rotary scan)
- Scan area in sections

### Z-Zeroing Issues

**Problem:** Probe doesn't touch or crashes

**Check:**
- Max Probe Depth is sufficient
- Safe Z is high enough
- Workpiece is positioned correctly

**Solution:**
- Increase Max Probe Depth (more negative)
- Jog manually to test clearances
- Verify probe plate thickness setting

---

## 📊 Performance

### Scan Speed

**Surface Scan:**
- Typical: 1-2 minutes for 25-point grid
- Large: 10-15 minutes for 100-point grid
- Depends on: Grid spacing, probe speed, retract distance

**Rotary Scan:**
- Typical: 5-10 minutes for 8 angles × 10 points
- Large: 30-60 minutes for dense scans
- Manual rotary: Add ~10 seconds per rotation

### Data Limits

| Metric | Limit | Notes |
|--------|-------|-------|
| Points per scan | 10,000 | Enforced by UI |
| JSON variable size | ~1MB | FabMo limitation |
| Practical scan size | 100×100 grid | ~20 minutes |
| Export file size | ~5MB | Large scans |

---

## 🤝 Contributing

Contributions welcome! This is an open-source project under the Apache 2.0 license.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

1. Clone repository
2. Make changes to HTML/CSS/JS files
3. Zip as `.fma` file for testing
4. Install in FabMo Dashboard
5. Test on real hardware

### Reporting Issues

Please include:
- FabMo version
- Browser and version
- Machine type (ShopBot, Handibot, etc.)
- Steps to reproduce
- Console errors (if any)

---

## 📄 License

Copyright 2025

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

---

## 🙏 Acknowledgments

- **FabMo Project** - Open-source motion control platform
- **ShopBot Tools** - CNC machine manufacturer and OpenSBP language
- **Foundation Framework** - CSS framework for UI
- **AutoCAD** - DXF format specification

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/captainjeffrey/FabMoDigitizing/issues)
- **Documentation:** This README
- **FabMo Forum:** [FabMo Community](https://forum.fabmo.org)

---

## 🚀 Roadmap

### Planned Features

- [ ] 3D mesh generation from point clouds
- [ ] Comparison mode (scan vs. CAD model)
- [ ] STL export
- [ ] Automatic surface fitting
- [ ] Multi-scan alignment
- [ ] Real-time scan preview
- [ ] Touch probe calibration wizard
- [ ] Custom scan patterns

### Version History

**v1.0.0** - Initial Release
- Z-axis probing
- Surface scanning
- Rotary scanning
- CSV export
- DXF export
- Manual data retrieval
- JSON variable storage

---

## 🎓 Use Cases

### Manufacturing

- **Reverse Engineering:** Digitize existing parts
- **Quality Control:** Compare manufactured vs. designed dimensions
- **Fixture Setup:** Measure workpiece location and orientation
- **Tool Height:** Quick tool change offsets

### Fabrication

- **Material Thickness:** Measure stock before machining
- **Surface Mapping:** Account for warped or uneven material
- **Part Alignment:** Locate reference points on workpiece
- **Multi-sided Machining:** Register part orientation

### Education

- **CNC Training:** Learn probing and coordinate systems
- **CAD/CAM Integration:** Import scan data into design software
- **Metrology:** Understand measurement and inspection
- **Reverse Engineering Projects:** Digitize physical objects

### Art & Design

- **Sculpture Digitizing:** Capture organic forms
- **Relief Mapping:** Create height maps for engraving
- **Texture Analysis:** Measure surface characteristics
- **Replica Creation:** Copy existing artwork

---

**Made for the FabMo Community**
