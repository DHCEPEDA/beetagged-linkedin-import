# LinkedIn CSV Export Format Guide

## Current LinkedIn Export Format (2024-2025)

LinkedIn exports connections in this format:

### Standard LinkedIn Connections Export Headers:
```csv
First Name,Last Name,Email Address,Company,Position,Connected On
John,Doe,john.doe@company.com,Tech Corp,Software Engineer,03/15/2024
Jane,Smith,,Google,Product Manager,01/22/2024
```

### Alternative Headers Found:
- `First Name` / `Given Name`
- `Last Name` / `Surname` / `Family Name`
- `Email Address` / `Email` / `E-mail Address`
- `Company` / `Current Company` / `Organization`
- `Position` / `Current Position` / `Job Title` / `Title`
- `Connected On` / `Connection Date` / `Date Connected`

## Common Issues:

1. **Empty Email Fields**: Many LinkedIn connections don't share email addresses
2. **Quoted Company Names**: Companies with commas are quoted: `"Company, Inc."`
3. **Missing Fields**: Some exports may not include all columns
4. **Different Separators**: Some regions use semicolons instead of commas

## Current System Handling:

✅ **Enhanced CSV Parser**: Handles quoted fields with commas  
✅ **Flexible Headers**: Maps multiple header variations  
✅ **Empty Field Handling**: Processes contacts without email/company  
✅ **Name Combination**: Combines First Name + Last Name automatically  

## Sample LinkedIn Export:
```csv
First Name,Last Name,Email Address,Company,Position,Connected On
John,Doe,john@example.com,Google,Software Engineer,10/15/2023
Jane,Smith,,Microsoft,Product Manager,09/22/2023
Bob,Johnson,bob@startup.com,"Startup, Inc.",Founder,08/30/2023
```

The system should automatically handle this format and import all valid contacts.