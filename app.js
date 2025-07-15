const express = require('express');
const moment = require('moment');
const { getCandles } = require('./dukascopy');
const { analyzeStrategy } = require('./strategy');

const app = express();
app.use(express.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
