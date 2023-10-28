const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); // Import the UUID module

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '1357',
    database: 'aashcart',
    connectionLimit: 10,
});

// Signup
router.post('/signup', async (req, res) => {
    const { name, email, phone, password, confirmPassword } = req.body;
    const userId = uuidv4(); // Generate a unique user ID using UUID

    if (!name || !email || !phone || !password) {
        res.status(400).json({ error: 'All required fields must be provided.' });
        return;
    }

    try {
        // Check if the email already exists in the signup table
        const [rows] = await db.execute('SELECT * FROM signup WHERE email = ?', [email]);

        if (rows.length > 0) {
            res.status(400).json({ error: 'Email already exists in the signup table.' });
        } else {
            // Insert a new user into the signup table
            await db.execute('INSERT INTO signup (id, name, email, phone, password) VALUES (?, ?, ?, ?, ?)',
                [userId, name, email, phone, password]);

            res.status(201).json({ message: 'User registered successfully.' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error during data insertion into the signup table.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required for login.' });
        return;
    }

    try {
        const [rows] = await db.execute('SELECT * FROM signup WHERE email = ? AND password = ?', [email, password]);

        if (rows.length > 0) {
            // Generate and return a JWT token for authentication.
            const token = jwt.sign({ email }, 'your_secret_key'); // Replace 'your_secret_key' with your actual secret key.
            res.json({ token });
        } else {
            res.status(401).json({ error: 'Authentication failed.' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error logging in.' });
    }
});

module.exports = router;
