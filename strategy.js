const technicalindicators = require('technicalindicators');

function analyzeStrategy(candles) {
  // Validasi: minimal 50 candle
  if (!candles || candles.length < 50) {
    return { 
      error: `Insufficient data (only ${candles?.length || 0} candles)`,
      trend: "Unknown",
      signal: "No Signal",
      entry: null,
      stop_loss: null,
      take_profit: null,
      price: null,
      rsi: null,
      atr: null
    };
  }

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  try {
    // Hitung indikator
    const ema50 = technicalindicators.EMA.calculate({ period: 50, values: closes });
    const ema200 = technicalindicators.EMA.calculate({ period: 200, values: closes });
    const rsi = technicalindicators.RSI.calculate({ period: 14, values: closes });
    const atr = technicalindicators.ATR.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14
    });

    // Ambil nilai terkini (indikator mungkin lebih pendek dari candles karena periode)
    const currentClose = closes[closes.length - 1];
    const currentEma50 = ema50[ema50.length - 1];
    const currentEma200 = ema200[ema200.length - 1];
    const currentRsi = rsi[rsi.length - 1];
    const currentAtr = atr[atr.length - 1];

    // Tentukan trend
    let trend = "Neutral";
    if (currentEma50 > currentEma200) trend = "Uptrend";
    else if (currentEma50 < currentEma200) trend = "Downtrend";

    // Break of Structure (BOS): swing high/low 5 candle terakhir
    const swingHigh = Math.max(...highs.slice(-5));
    const swingLow = Math.min(...lows.slice(-5));

    let signal = "No Signal";
    let entry = 0, sl = 0, tp = 0;

    if (currentClose > swingHigh && trend === "Uptrend") {
      signal = "BUY";
      entry = currentClose;
      sl = entry - (currentAtr * 1.5);
      tp = entry + ((entry - sl) * 2);
    } else if (currentClose < swingLow && trend === "Downtrend") {
      signal = "SELL";
      entry = currentClose;
      sl = entry + (currentAtr * 1.5);
      tp = entry - ((sl - entry) * 2);
    }

    return {
      trend,
      signal,
      entry: entry ? Number(entry.toFixed(5)) : null,
      stop_loss: sl ? Number(sl.toFixed(5)) : null,
      take_profit: tp ? Number(tp.toFixed(5)) : null,
      price: currentClose ? Number(currentClose.toFixed(5)) : null,
      rsi: currentRsi ? Number(currentRsi.toFixed(2)) : null,
      atr: currentAtr ? Number(currentAtr.toFixed(5)) : null
    };

  } catch (error) {
    console.error('Error in technical analysis:', error);
    return {
      error: "Technical indicator error",
      trend: "Unknown",
      signal: "No Signal",
      entry: null,
      stop_loss: null,
      take_profit: null,
      price: null,
      rsi: null,
      atr: null
    };
  }
}

module.exports = { analyzeStrategy };
