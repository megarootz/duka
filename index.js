
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

// Latest tick data endpoint - untuk current price sahaja
app.get('/latest-tick', async (req, res) => {
  try {
    const { 
      instrument = 'eurusd',
      format = 'json'
    } = req.query;

    // Get current date and go back just a few hours to get recent data
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - (6 * 60 * 60 * 1000)); // 6 hours ago

    console.log(`Fetching latest tick data for ${instrument}`);

    // Fetch recent data to get the latest tick - use hourly data to reduce memory usage
    const data = await getHistoricalRates({
      instrument: instrument.toLowerCase(),
      dates: {
        from: fromDate,
        to: toDate
      },
      timeframe: 'h1', // Use hourly data to reduce memory usage
      format: 'json'
    });

    let latestTick;
    if (Array.isArray(data) && data.length > 0) {
      // Get the most recent data point (last element)
      const latestData = data[data.length - 1];
      
      // Format response as simple current price
      latestTick = {
        instrument: instrument.toLowerCase(),
        current_price: latestData.close,
        bid: latestData.low || latestData.close,
        ask: latestData.high || latestData.close,
        timestamp: new Date().toISOString()
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
      const csvHeader = 'instrument,current_price,bid,ask,timestamp\n';
      const csvRow = `${latestTick.instrument},${latestTick.current_price},${latestTick.bid},${latestTick.ask},${latestTick.timestamp}\n`;
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

// Historical bar data endpoint - untuk data sejarah
app.get('/historical', async (req, res) => {
  try {
    const { 
      instrument = 'eurusd',
      from,
      to,
      timeframe = 'm15',
      format = 'json'
    } = req.query;

    // Validate required parameters
    if (!from || !to) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both "from" and "to" dates are required',
        example: '/historical?instrument=xauusd&from=2024-01-01&to=2024-01-02&timeframe=m15'
      });
    }

    console.log(`Fetching historical ${timeframe} data for ${instrument} from ${from} to ${to}`);

    // Parse dates
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Validate dates
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
        message: 'Please use YYYY-MM-DD format for dates'
      });
    }

    // Fetch historical bar data
    const data = await getHistoricalRates({
      instrument: instrument.toLowerCase(),
      dates: {
        from: fromDate,
        to: toDate
      },
      timeframe: timeframe.toLowerCase(),
      format: 'json'
    });

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({
        error: 'No data available',
        message: `No historical data found for ${instrument} between ${from} and ${to}`
      });
    }

    // Format response
    const response = {
      instrument: instrument.toLowerCase(),
      timeframe: timeframe.toLowerCase(),
      from: from,
      to: to,
      data_count: data.length,
      data: data
    };

    // Set appropriate content type
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${instrument}_${timeframe}_${from}_to_${to}.csv"`);
      
      // Convert to CSV format
      const csvHeader = 'timestamp,open,high,low,close,volume\n';
      const csvRows = data.map(bar => 
        `${bar.timestamp},${bar.open},${bar.high},${bar.low},${bar.close},${bar.volume || ''}`
      ).join('\n');
      res.send(csvHeader + csvRows);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.json(response);
    }

  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({
      error: 'Failed to fetch historical data',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET / - Health check`);
  console.log(`  GET /latest-tick - Get current price (latest tick)`);
  console.log(`  GET /historical - Get historical bar data`);
  console.log(`Examples:`);
  console.log(`  /latest-tick?instrument=xauusd&format=json`);
  console.log(`  /historical?instrument=xauusd&from=2024-01-01&to=2024-01-02&timeframe=m15&format=json`);
});
