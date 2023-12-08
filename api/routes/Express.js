const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');
const { google } = require('googleapis');
const fs = require('fs');
const fileUpload = require('express-fileupload'); // Import express-fileupload

router.use(fileUpload()); // Use the fileUpload middleware in the router

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    connectionLimit: 10,
});

const drive = google.drive({
    version: 'v3',
    auth: {
        client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY,
    },
});

router.post('/upload', async (req, res) => {
    const { name } = req.body;
    const images = req.files; 

    if (!name || !images) {
        return res.status(400).json({ error: 'Invalid request. Please provide a name and images.' });
    }

    const imageKeys = ['image1', 'image2', 'image3', 'image4', 'image5'];
    const imageLinks = [];

    for (const key of imageKeys) {
        if (images[key]) {
            const image = images[key];
            const imageFile = fs.readFileSync(image.tempFilePath);

            const response = await drive.files.create({
                resource: {
                    name: image.name,
                    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
                },
                media: {
                    mimeType: image.mimetype,
                    body: imageFile,
                },
            });
            const imageLink = response.data.webViewLink;
            imageLinks.push(imageLink);
        }
    }
    try {
        const [results] = await db.execute(
            'INSERT INTO products1 (id, name, image_links) VALUES (?, ?, ?)',
            [uuidv4(), name, JSON.stringify(imageLinks)]
        );

        if (results.affectedRows === 1) {
            return res.status(201).json({ message: 'Product uploaded successfully.' });
        } else {
            console.error('Error: Data insertion failed.');
            return res.status(500).json({ error: 'Error during data insertion into the products1 table.' });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Error during data insertion into the products1 table.' });
    }
});
module.exports = router;
