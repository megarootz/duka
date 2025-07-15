const { getHistoricalRates } = require('dukascopy-node');

// Mapping timeframe to Dukascopy format
const timeframeMap = {
  'D1': 'd1',
  'H4': 'h4',
  'M15': 'm15',
  'M1': 'm1'
};

// Batas maksimum jumlah candle yang diambil per timeframe
const MAX_CANDLES = {
  'D1': 365,    // 1 tahun
  'H4': 90 * 6, // 90 hari * 6 candle per hari (h4 = 6 candle per hari)
  'M15': 7 * 96 // 7 hari * 96 candle per hari (m15 = 96 per hari)
};

async function getCandles(symbol, timeframe, from, to) {
  try {
    const tf = timeframeMap[timeframe.toUpperCase()] || 'm15';
    
    // Hitung tanggal awal yang diizinkan berdasarkan MAX_CANDLES
    const maxFrom = new Date(to);
    const daysBack = MAX_CANDLES[timeframe] / (timeframe === 'D1' ? 1 : (timeframe === 'H4' ? 6 : 96));
    maxFrom.setDate(maxFrom.getDate() - daysBack);
    
    // Jika from lebih awal dari maxFrom, gunakan maxFrom
    const adjustedFrom = from < maxFrom ? maxFrom : from;
    
    const data = await getHistoricalRates({
      instrument: symbol.toLowerCase(),
      dates: {
        from: adjustedFrom,
        to: to
      },
      timeframe: tf,
      format: 'json',
      batchSize: 1000  // Batasi ukuran batch
    });

    // Potong data jika melebihi MAX_CANDLES
    const maxData = data.slice(-MAX_CANDLES[timeframe]);
    
    return maxData.map(d => ({
      timestamp: d.timestamp,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close
    }));

  } catch (error) {
    console.error(`Error fetching ${symbol} ${timeframe} data:`, error);
    return [];
  }
}

module.exports = { getCandles };
