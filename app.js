const express = require('express');
const moment = require('moment');
const { getCandles } = require('./index.js'); // Import fetcher dari duka asli anda
const { analyzeStrategy } = require('./strategy.js');

const app = express();
app.use(express.json());

// 🔁 Multi-timeframe analysis
app.post('/analysis', async (req, res) => {
    try {
        const { symbol = 'XAUUSD' } = req.body;
        
        const tfParams = {
            'D1': { fromDate: moment().subtract(30, 'days').format('YYYY-MM-DD') },
            'H4': { fromDate: moment().subtract(7, 'days').format('YYYY-MM-DD') },
            'M15': { fromDate: moment().subtract(1, 'days').format('YYYY-MM-DD') },
        };

        const result = {};

        for (const [tf, tfData] of Object.entries(tfParams)) {
            const candles = await getCandles(symbol, tf, tfData.fromDate, moment().format('YYYY-MM-DD'));
            result[tf] = analyzeStrategy(candles || []);
        }

        res.json({ symbol, analysis: result });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 💰 Current price endpoint
app.get('/price/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const fromDate = moment().subtract(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        const toDate = moment().format('YYYY-MM-DD HH:mm:ss');

        const candles = await getCandles(symbol, 'M1', fromDate, toDate);
        const price = candles.length > 0 ? candles.at(-1).close : null;
        res.json({ symbol, price });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
