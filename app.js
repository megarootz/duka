const express = require('express');
const moment = require('moment');
const cors = require('cors'); // Tambahkan ini
const { getCandles } = require('./dukascopy');
const { analyzeStrategy } = require('./strategy');

const app = express();

// Middleware
app.use(cors()); // Tambahkan CORS
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Dukascopy Trading API is running!',
    endpoints: [
      'POST /analysis - Analyze market with body: { symbol: "XAUUSD" }',
      'GET /price/:symbol - Get current price (e.g., /price/XAUUSD)'
    ]
  });
});

app.post('/analysis', async (req, res) => {
    try {
        const { symbol = 'XAUUSD' } = req.body;
        
        const tfParams = {
            'D1': { from: moment().subtract(30, 'days').toDate(), to: new Date() },
            'H4': { from: moment().subtract(7, 'days').toDate(), to: new Date() },
            'M15': { from: moment().subtract(1, 'days').toDate(), to: new Date() },
        };

        const result = {};

        for (const [tf, timeParams] of Object.entries(tfParams)) {
            const candles = await getCandles(symbol, tf, timeParams.from, timeParams.to);
            result[tf] = analyzeStrategy(candles);
        }

        res.json({ symbol, analysis: result });

    } catch (err) {
        console.error('Analysis error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/price/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const from = moment().subtract(5, 'minutes').toDate();
        const to = new Date();

        const candles = await getCandles(symbol, 'm1', from, to);
        const price = candles.length > 0 ? candles[candles.length - 1].close : null;
        
        res.json({ symbol, price });
    } catch (error) {
        console.error('Price error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Gunakan port dari environment variable atau 10000
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
});
