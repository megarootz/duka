const express = require('express');
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

// Historical data endpoint
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

    // Fetch historical data
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

    // Hapus volume dari setiap bar data
    const dataWithoutVolume = data.map(bar => {
      const { volume, ...rest } = bar;
      return rest;
    });

    // Format response
    const response = {
      instrument: instrument.toLowerCase(),
      timeframe: timeframe.toLowerCase(),
      from: from,
      to: to,
      data_count: dataWithoutVolume.length,
      data: dataWithoutVolume
    };

    // Set appropriate content type
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${instrument}_${timeframe}_${from}_to_${to}.csv"`);

      // Convert to CSV format TANPA VOLUME
      const csvHeader = 'timestamp,open,high,low,close\n'; // Header tanpa volume
      const csvRows = dataWithoutVolume.map(bar => 
        `${bar.timestamp},${bar.open},${bar.high},${bar.low},${bar.close}`
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
  console.log(`  GET /historical - Get historical data`);
  console.log(`Example: /historical?instrument=xauusd&from=2024-01-01&to=2024-01-02&timeframe=m15&format=json`);
});
