const express = require('express');
const app = express();
// const serverless=require("serverless-http")
const port = 3001;
const userRoutes = require('./api/routes/user');
const productData = require('./api/routes/ProductData');
// const UploadCsv = require('./api/routes/UploadCsv');
// const fileUpload = require('express-fileupload');
const dotenv = require('dotenv');
const cors = require('cors');
// const uploadExcel = require('./api/routes/uploadExcel');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// app.use(fileUpload());
// app.use(express.json());


// Use the userRoutes for signup and login
app.use('/api', userRoutes); // Prefix user routes with '/api'
app.use('/api', productData);
// app.use('/api', uploadExcel);

// app.use('/api', UploadCsv);

// Use fileUpload middleware for handling file uploads
// app.use(fileUpload());

// Check if express1 is a valid router
app.use(cors());

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
// module.exports.handler = serverless(app);