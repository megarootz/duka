const technicalindicators = require('technicalindicators');

// Helper: Find significant support/resistance levels
function findSignificantLevels(highs, lows, closingPrices, period = 50) {
  const significantLevels = [];
  const pivotHighs = [];
  const pivotLows = [];

  // Identifikasi pivot points
  for (let i = period; i < highs.length - period; i++) {
    const highWindow = highs.slice(i - period, i + period + 1);
    const lowWindow = lows.slice(i - period, i + period + 1);
    
    if (highs[i] === Math.max(...highWindow)) {
      pivotHighs.push(highs[i]);
    }
    
    if (lows[i] === Math.min(...lowWindow)) {
      pivotLows.push(lows[i]);
    }
  }

  // Gabungkan dan urutkan level signifikan
  significantLevels.push(...pivotHighs, ...pivotLows);
  significantLevels.sort((a, b) => a - b);
  
  return [...new Set(significantLevels)]; // Hapus duplikat
}

function analyzeStrategy(candles) {
  // Validasi data
  if (!candles || candles.length < 50) {
    return {
      trend: 'Insufficient Data',
      signal: 'No Signal',
      entry: 0,
      sl: 0,
      tp: 0,
      rsi: 0,
      atr: 0,
      error: 'Insufficient historical data for analysis'
    };
  }

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume || 0);

  try {
    const currentClose = closes[closes.length - 1];
    
    // Calculate technical indicators
    const rsi = technicalindicators.RSI.calculate({
      period: 14,
      values: closes
    });
    const currentRsi = rsi[rsi.length - 1] || 50;

    const atr = technicalindicators.ATR.calculate({
      period: 14,
      high: highs,
      low: lows,
      close: closes
    });
    const currentAtr = atr[atr.length - 1] || 0;

    // Calculate moving averages for trend
    const sma20 = technicalindicators.SMA.calculate({
      period: 20,
      values: closes
    });
    const sma50 = technicalindicators.SMA.calculate({
      period: 50,
      values: closes
    });

    const currentSma20 = sma20[sma20.length - 1] || currentClose;
    const currentSma50 = sma50[sma50.length - 1] || currentClose;

    // Determine trend
    let trend = 'Sideways';
    if (currentClose > currentSma20 && currentSma20 > currentSma50) {
      trend = 'Uptrend';
    } else if (currentClose < currentSma20 && currentSma20 < currentSma50) {
      trend = 'Downtrend';
    }

    // Initialize signal variables
    let signal = 'Hold';
    let entry = 0, sl = 0, tp = 0;

    // 1. Tentukan level support/resistance signifikan
    const significantLevels = findSignificantLevels(highs, lows, closes, 20);
    
    // 2. Identifikasi level breakout terdekat
    const resistanceLevels = significantLevels.filter(l => l > currentClose);
    const supportLevels = significantLevels.filter(l => l < currentClose);
    
    const nearestResistance = resistanceLevels.length > 0 ? Math.min(...resistanceLevels) : currentClose * 1.02;
    const nearestSupport = supportLevels.length > 0 ? Math.max(...supportLevels) : currentClose * 0.98;
    
    // 3. Deteksi breakout
    let breakoutLevel = null;
    let breakoutDirection = null;
    
    if (currentClose > nearestResistance) {
      breakoutLevel = nearestResistance;
      breakoutDirection = "UP";
    } else if (currentClose < nearestSupport) {
      breakoutLevel = nearestSupport;
      breakoutDirection = "DOWN";
    }

    // 4. Konfirmasi retest dan candle
    let confirmedBreakout = false;
    
    if (breakoutLevel) {
      // Cek retest (harga kembali mendekati level breakout)
      const retestThreshold = breakoutLevel * 0.995; // 0.5% tolerance
      const recentPrices = closes.slice(-5);
      
      const hasRetest = breakoutDirection === "UP" 
        ? recentPrices.some(p => p <= breakoutLevel * 1.005 && p >= retestThreshold)
        : recentPrices.some(p => p >= breakoutLevel * 0.995 && p <= breakoutLevel * 1.005);
      
      // Cek candle konfirmasi (candle besar atau volume tinggi)
      const currentCandle = candles[candles.length - 1];
      const candleSize = currentCandle.high - currentCandle.low;
      const avgCandleSize = technicalindicators.SMA.calculate({
        period: 10,
        values: highs.map((h, i) => h - lows[i])
      }).at(-1) || 0;
      
      const isLargeCandle = candleSize > avgCandleSize * 1.5;
      const isHighVolume = volumes.length > 0 && volumes.slice(-10).length > 0
        ? currentCandle.volume > technicalindicators.SMA.calculate({
            period: 10,
            values: volumes.slice(-10)
          }).at(-1) * 1.5
        : false;
      
      confirmedBreakout = hasRetest && (isLargeCandle || isHighVolume);
    }

    // 5. Generate sinyal berdasarkan konfirmasi breakout
    if (confirmedBreakout) {
      if (breakoutDirection === "UP" && trend === "Uptrend") {
        signal = "BUY";
        entry = currentClose;
        sl = entry - (currentAtr * 1.5);
        tp = entry + ((entry - sl) * 2); // RR 1:2
      } else if (breakoutDirection === "DOWN" && trend === "Downtrend") {
        signal = "SELL";
        entry = currentClose;
        sl = entry + (currentAtr * 1.5);
        tp = entry - ((sl - entry) * 2); // RR 1:2
      }
    } else {
      // Fallback signals based on RSI and trend
      if (trend === 'Uptrend' && currentRsi < 40) {
        signal = 'BUY';
        entry = currentClose;
        sl = entry - (currentAtr * 2);
        tp = entry + (currentAtr * 3);
      } else if (trend === 'Downtrend' && currentRsi > 60) {
        signal = 'SELL';
        entry = currentClose;
        sl = entry + (currentAtr * 2);
        tp = entry - (currentAtr * 3);
      }
    }

    return {
      trend: trend,
      signal: signal,
      entry: Number(entry.toFixed(5)),
      sl: Number(sl.toFixed(5)),
      tp: Number(tp.toFixed(5)),
      rsi: Number(currentRsi.toFixed(2)),
      atr: Number(currentAtr.toFixed(5)),
      breakout_level: breakoutLevel ? Number(breakoutLevel.toFixed(5)) : null,
      breakout_direction: breakoutDirection,
      breakout_confirmed: confirmedBreakout
    };

  } catch (error) {
    console.error('Strategy analysis error:', error);
    return {
      trend: 'Error',
      signal: 'Error',
      entry: 0,
      sl: 0,
      tp: 0,
      rsi: 0,
      atr: 0,
      error: error.message
    };
  }
}

// CRITICAL: This export statement must be at the end of your strategy.js file
module.exports = { analyzeStrategy };
