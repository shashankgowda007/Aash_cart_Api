const express = require('express');
const fileUpload = require('express-fileupload');
const { parseCSV, checkTableExists, createTable, addColumn, getColumns, insertData } = require('./UploadCsvFunction');

const app = express();
const PORT = 3000;

// Use the express-fileupload middleware
app.use(fileUpload());

// Your other middleware and route handlers go here, before the /upload route

app.post('/upload', async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).send('No files were uploaded.');
        }

        const uploadedFile = req.files.file;
        const csvData = uploadedFile.data.toString('utf8');

        // Extract table name from the request, or use a default name
        const tableName = req.body.tableName || 'default_table';

        // Parse CSV data
        const parsedData = await parseCSV(csvData);

        // Check if the table exists
        const tableExists = await checkTableExists(tableName);

        if (!tableExists) {
            // Create the table if it doesn't exist
            const headerFields = Object.keys(parsedData[0]);
            await createTable(tableName, headerFields);
        } else {
            // Check if there are any new columns in the CSV and add them to the table
            const existingColumns = await getColumns(tableName);
            const newColumns = Object.keys(parsedData[0]).filter((col) => !existingColumns.includes(col));

            for (const newColumn of newColumns) {
                await addColumn(tableName, newColumn);
            }
        }

        // Insert data into the table
        await insertData(tableName, parsedData);

        res.send('File uploaded and data inserted into the table.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
