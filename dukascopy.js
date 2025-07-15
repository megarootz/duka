const { getHistoricalRates } = require('dukascopy-node');

const timeframeMap = {
    'M1': 'm1',
    'M5': 'm5',
    'M15': 'm15',
    'M30': 'm30',
    'H1': 'h1',
    'H4': 'h4',
    'D1': 'd1'
};

async function getCandles(symbol, timeframe, from, to) {
    try {
        const tf = timeframeMap[timeframe.toUpperCase()] || 'm15';
        
        const data = await getHistoricalRates({
            instrument: symbol.toLowerCase(),
            dates: { from, to },
            timeframe: tf,
            format: 'json'
        });

        return data.map(d => ({
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
