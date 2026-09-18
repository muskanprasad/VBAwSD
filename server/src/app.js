const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const voiceRoutes = require('./routes/voice');

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.send('VoiceAuth API running');
});

app.use('/api/auth', authRoutes);
app.use('/api/voice', voiceRoutes);

module.exports = app;
