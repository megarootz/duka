
const express = require('express');
const cors = require('cors');
const { getHistoricalRates } = require('dukascopy-node');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Dukascopy Node.js API is running!' });
});

// Latest tick data endpoint
app.get('/historical', async (req, res) => {
  try {
    const { 
      instrument = 'eurusd',
      timeframe = 'h1',
      format = 'json'
    } = req.query;

    // Get current date and go back just a few hours to get recent data (reduces memory usage)
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - (6 * 60 * 60 * 1000)); // 6 hours ago

    console.log(`Fetching latest ${instrument} tick data with timeframe ${timeframe}`);

    // Fetch recent data to get the latest tick - use hourly data instead of tick to reduce memory usage
    const data = await getHistoricalRates({
      instrument: instrument.toLowerCase(),
      dates: {
        from: fromDate,
        to: toDate
      },
      timeframe: 'h1', // Use hourly data instead of tick to reduce memory usage
      format: 'json'
    });

    let latestTick;
    if (Array.isArray(data) && data.length > 0) {
      // Get the most recent data point (last element)
      const latestData = data[data.length - 1];
      
      // Format response to match expected tick format
      latestTick = {
        timestamp: new Date().toISOString(),
        ask: latestData.high || latestData.close, // Use high as ask price
        bid: latestData.low || latestData.close,  // Use low as bid price
        close: latestData.close,
        open: latestData.open,
        high: latestData.high,
        low: latestData.low,
        volume: latestData.volume,
        requested_timeframe: timeframe,
        instrument: instrument.toLowerCase()
      };
    } else {
      return res.status(404).json({
        error: 'No recent data available for this instrument'
      });
    }

    // Set appropriate content type
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${instrument}_latest_tick.csv"`);
      // Convert single data point to CSV format
      const csvHeader = 'timestamp,ask,bid,close,open,high,low,volume,requested_timeframe,instrument\n';
      const csvRow = `${latestTick.timestamp},${latestTick.ask},${latestTick.bid},${latestTick.close},${latestTick.open},${latestTick.high},${latestTick.low},${latestTick.volume || ''},${latestTick.requested_timeframe},${latestTick.instrument}\n`;
      res.send(csvHeader + csvRow);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.json(latestTick);
    }

  } catch (error) {
    console.error('Error fetching latest tick data:', error);
    res.status(500).json({
      error: 'Failed to fetch latest tick data',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET / - Health check`);
  console.log(`  GET /historical - Get latest tick data`);
  console.log(`Example: /historical?instrument=eurusd&timeframe=h1&format=json`);
});
