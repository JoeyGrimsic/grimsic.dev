<div align="center">
  <img src="tuxedo.png" alt="Cutting Stock Optimization Visual" width="300"/>
</div>

# Cutting Stock Optimization Web Application

A single-file web application that optimizes cutting patterns for stock rods to minimize waste using the First-Fit Decreasing algorithm.

## 📋 Problem Overview
The cutting stock problem involves determining optimal patterns to cut longer stock rods into required pieces while minimizing material waste. Waste occurs when leftover pieces are too small to be useful.

## 📁 Excel Format Requirements
**Input Excel File Must Contain Two Sheets:**

| Sheet Name       | Columns          | Description                     |
|------------------|------------------|---------------------------------|
| **Stock Inventory** | Quantity, Length | Available stock rod quantities |
| **Order Requirements** | Length          | Required piece lengths         |

## 🚀 Optimization Approach
**First-Fit Decreasing (FFD) Algorithm:**
1. Sort required pieces in descending length order
2. Place each piece in first available stock rod with sufficient remaining length
3. Track remaining lengths and calculate waste

## ✨ Key Features
### 📱 User Interface
- Drag-and-drop Excel file upload
- Responsive design for all devices
- Interactive color-coded pattern visualization
- Tabbed interface for navigation

### 📊 Data Processing
- Excel parsing with SheetJS library
- Input validation and error handling
- Template generation for proper formatting

### 📈 Optimization & Results
- Waste statistics (total & percentage)
- Visual cutting pattern representation
- Downloadable Excel results
- Detailed cutting plan documentation

## 🛠️ How to Use
1. **Prepare Excel File**  
   - Sheet 1 (Stock): `Quantity` | `Length`  
   - Sheet 2 (Order): `Length`

2. **Upload File**  
   Drag-and-drop or select your Excel file

3. **Process & Analyze**  
   Click "Process File" to:
   - View optimization results
   - See visual pattern breakdown
   - Access waste statistics

4. **Download Results**  
   Get optimized patterns in Excel format

## 📚 Algorithm Deep Dive
**First-Fit Decreasing Workflow:**
1. Sort all required pieces descending by length
2. For each piece:
   - Find first stock rod with sufficient remaining length
   - Place piece and update remaining length
3. Repeat until all pieces placed or no rods remain

_Note: While not always mathematically optimal, FFD provides practical solutions with minimal waste._

## 🔮 Potential Enhancements
- Advanced algorithms (Branch-and-Price)
- Multi-dimensional cutting optimization
- Custom wastage thresholds
- Kerf (cutting width) considerations
- Pattern-based optimization for repeat orders

---

**Note:** The tuxedo.png image shown above is a placeholder. Replace with your actual optimization visualization screenshot.
