const express = require('express');
const app = express();
const port = 3000;
const userRoutes = require('./api/routes/user'); // Import the user routes from api/user.js

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Use the userRoutes for signup and login
app.use('/api', userRoutes); // Prefix user routes with '/api'

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
