// Express app: global middleware -> routes -> 404 -> central error handler.
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.use(helmet()); // secure HTTP headers
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' })); // parse JSON bodies into req.body
app.use(morgan('dev')); // request logging

app.get('/api/health', (req, res) => res.json({ success: true, message: 'OK' }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler); // must be last: it has 4 arguments (err, req, res, next)

module.exports = app;
