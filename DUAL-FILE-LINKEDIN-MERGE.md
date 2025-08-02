# LinkedIn Dual-File Data Merging

## New Feature: Connections + Contacts CSV Merge

### What It Does:
BeeTagged now supports uploading **two** LinkedIn CSV files simultaneously to create rich, complete contact profiles by merging data from both sources.

### The Two LinkedIn Export Types:

#### **1. Connections CSV** (Basic)
- Contains: First Name, Last Name, Connected On
- **Limited data** but includes your entire network
- Export from: LinkedIn > Settings > Data Privacy > Get a copy of your data > Connections

#### **2. Contacts CSV** (Rich)
- Contains: Names, Profile URLs, Email addresses, Companies, Job titles
- **Complete data** but may have fewer contacts
- Export from: LinkedIn > Settings > Data Privacy > Get a copy of your data > Contacts

### How The Merge Works:

1. **Name Matching**: Uses name-based matching to link records from both files
2. **Data Enhancement**: Connections provide the network scope, Contacts provide the details
3. **Smart Merging**: 
   - Email addresses from Contacts CSV
   - Company information from Contacts CSV  
   - Profile URLs from Contacts CSV
   - Connection dates from Connections CSV
   - Job titles and locations from both sources

### Upload Options:

#### **Single File Upload** (existing)
- Upload either Connections OR Contacts CSV
- Works with existing functionality
- Processes available data only

#### **Dual File Upload** (NEW)
- Upload both Connections AND Contacts CSV
- Automatically merges matching contacts
- Creates complete profiles with all available data
- Enhances existing contacts with missing information

### Expected Results:
- **Michael Higgins** would now show:
  - Name: ✅ From both files
  - Email: ✅ From Contacts CSV  
  - Company: ✅ From Contacts CSV
  - Profile URL: ✅ From Contacts CSV
  - Connected Date: ✅ From Connections CSV

### API Enhancement:
```
POST /api/import/linkedin
Files: 
- linkedinCsv: Connections export
- contactsCsv: Contacts export (optional)
```

This dual-file approach solves the "names only" limitation by cross-referencing LinkedIn's different export formats to build comprehensive contact profiles.