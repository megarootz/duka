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
  // ... validasi data ...

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume || 0); // Gunakan 0 jika volume tidak tersedia

  try {
    // ... perhitungan indikator ...

    // 1. Tentukan level support/resistance signifikan
    const significantLevels = findSignificantLevels(highs, lows, closes, 20);
    
    // 2. Identifikasi level breakout terdekat
    const nearestResistance = Math.min(...significantLevels.filter(l => l > currentClose));
    const nearestSupport = Math.max(...significantLevels.filter(l => l < currentClose));
    
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
    let entry = 0, sl = 0, tp = 0;
    
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
      const isHighVolume = volumes.length > 0 
        ? currentCandle.volume > technicalindicators.SMA.calculate({
            period: 10,
            values: volumes
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
    }

    // ... kode sisanya sama ...
    
    return {
      // ... properti lainnya ...
      breakout_level: breakoutLevel ? Number(breakoutLevel.toFixed(2)) : null,
      breakout_direction: breakoutDirection,
      breakout_confirmed: confirmedBreakout
    };

  } catch (error) {
    // ... error handling ...
  }
}
