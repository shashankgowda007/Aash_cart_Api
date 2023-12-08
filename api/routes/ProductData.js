const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const fuzzysearch = require('fuzzysearch');
const multer = require('multer');
const db = mysql.createPool({
    host: 'project-database.cpytoutng4j0.eu-north-1.rds.amazonaws.com',
    user: 'admin',
    password: 'qazwsxedc',
    database: 'aashcartProductDB',
    connectionLimit: 10,
});

router.use(express.json());
router.post('/insertData', async (req, res) => {
    const data = req.body;

    try {
        // Use a transaction to ensure data consistency
        const connection = await db.getConnection();
        await connection.beginTransaction();

        for (const item of data) {
            const sql = `
                INSERT INTO aashcartProductDB
                (uniq_id, crawl_timestamp, product_url, product_name, product_category_tree, pid, retail_price, discounted_price, image, is_FK_Advantage_product, description, product_rating, overall_rating, brand, product_specifications)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const values = [
                item.uniq_id,
                new Date(item.crawl_timestamp), 
                item.product_url,
                item.product_name,
                item.product_category_tree,
                item.pid,
                item.retail_price,
                item.discounted_price,
                JSON.stringify(item.image), // Convert image array to a JSON string
                item.is_FK_Advantage_product,
                item.description,
                item.product_rating,
                item.overall_rating,
                item.brand,
                JSON.stringify(item.product_specifications), // Convert product_specifications to a JSON string
            ];

            await connection.execute(sql, values);
        }

        await connection.commit();
        connection.release();

        res.status(200).json({ message: 'Data inserted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

const upload = multer();

router.use(express.json());

router.get('/products/getall', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM aashcartProductDB');
        res.json(results);
    } catch (err) {
        console.error('Error retrieving products:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/products/:uniq_id', async (req, res) => {
    try {
        const { uniq_id } = req.params;
        console.log(uniq_id);
        const [results] = await db.query('SELECT * FROM aashcartProductDB WHERE uniq_id = ?', [uniq_id]);
        res.json(results);
    } catch (err) {
        console.error('Error retrieving product by uniq_id:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.get('/products/:page/:pageSize', async (req, res) => {
    try {
        const { page = 1, pageSize = 10 } = req.query; // Use req.query instead of req.params
        const offset = (page - 1) * pageSize;

        // Log the values
        console.log('Page:', page);
        console.log('PageSize:', pageSize);
        console.log('Offset:', offset);

        // Log the SQL query
        const sqlQuery = 'SELECT * FROM aashcartProductDB LIMIT ? OFFSET ?';
        const sqlValues = [parseInt(pageSize, 10), offset];
        console.log('SQL Query:', sqlQuery, sqlValues);

        const [results] = await db.query(sqlQuery, sqlValues);

        // Check if results array is empty or undefined
        if (!results || results.length === 0) {
            // If no results, send a message
            console.log('No products found.');
            return res.json({ message: 'No products found.' });
        }

        res.json(results);
    } catch (err) {
        console.error('Error retrieving paginated products:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/products/search/:q', async (req, res) => {
    try {
        let { q } = req.params;

        // Trim and handle special characters
        q = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // Split by spaces and join with '%'
        const searchTerm = q.split(/\s+/).join('%');

        // Using COLLATE for case-insensitive search
        const query = 'SELECT * FROM aashcartProductDB WHERE product_name COLLATE utf8_general_ci LIKE ?';
        const [results] = await db.query(query, [`%${searchTerm}%`]);

        res.json(results);
    } catch (err) {
        console.error('Error searching products:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.delete('/products/:uniq_id', async (req, res) => {
    try {
        const { uniq_id } = req.params;
        await db.query('DELETE FROM aashcartProductDB WHERE uniq_id = ?', [uniq_id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product by uniq_id:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.delete('/products', async (req, res) => {
    try {
        const connection = await db.getConnection();

        // Delete all rows from the aashcartProductDB table
        const result = await connection.query('DELETE FROM aashcartProductDB');

        connection.release();

        res.status(200).json({ message: 'All products deleted successfully.' });
    } catch (error) {
        console.error('Error deleting all products:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
