const express = require('express');
const moment = require('moment');
const cors = require('cors');
const { getCandles } = require('./dukascopy');
const { analyzeStrategy } = require('./strategy');

const app = express();

// Middleware
app.use(cors());
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

// Market analysis endpoint
app.post('/analysis', async (req, res) => {
  try {
    const { symbol = 'XAUUSD' } = req.body;
    
    const timeframes = [
      { name: 'H1', days: 30 },   // Timeframe utama
      { name: 'H4', days: 90 },   // Konteks jangka menengah
      { name: 'D1', days: 365 }   // Konteks jangka panjang
    ];
    const result = {};

    // Proses satu per satu untuk hemat memory
    for (const tf of timeframes) {
      const from = moment().subtract(tf.days, 'days').toDate();
      const to = new Date();

      console.log(`Fetching ${symbol} ${tf.name} data from ${from} to ${to}`);
      const candles = await getCandles(symbol, tf.name, from, to);
      
      // Beri jeda 100ms antara timeframe untuk mengurangi beban memory
      await new Promise(resolve => setTimeout(resolve, 100));
      
      result[tf.name] = analyzeStrategy(candles);
    }

    res.json({ symbol, analysis: result });

  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: err.message 
    });
  }
});

// Real-time price endpoint
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
