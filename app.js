const express = require('express');
const app = express();
const cors = require('cors');
const db = require('./db');
const authRoutes = require('./routes/auth');  

app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);  

const bookRoutes = require('./routes/books');
app.use('/api/books', bookRoutes);


app.listen(5000, () => {
  console.log('Server running on port 5000');
});
