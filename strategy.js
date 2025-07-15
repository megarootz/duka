const technicalindicators = require('technicalindicators');

function analyzeStrategy(candles) {
    if (!candles || candles.length < 100) {
        return { signal: "Insufficient data" };
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    const ema50 = technicalindicators.EMA.calculate({ period: 50, values: closes });
    const ema200 = technicalindicators.EMA.calculate({ period: 200, values: closes });
    const rsi = technicalindicators.RSI.calculate({ period: 14, values: closes });
    const atr = technicalindicators.ATR.calculate({
        high: highs,
        low: lows,
        close: closes,
        period: 14
    });

    const currentClose = closes.at(-1);
    const currentEma50 = ema50.at(-1);
    const currentEma200 = ema200.at(-1);
    const currentRsi = rsi.at(-1);
    const currentAtr = atr.at(-1);

    let trend = "Neutral";
    if (currentEma50 > currentEma200) trend = "Uptrend";
    else if (currentEma50 < currentEma200) trend = "Downtrend";

    // BOS logic
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
        entry: Number(entry.toFixed(5)),
        stop_loss: Number(sl.toFixed(5)),
        take_profit: Number(tp.toFixed(5)),
        price: Number(currentClose.toFixed(5)),
        rsi: Number(currentRsi.toFixed(2)),
        atr: Number(currentAtr.toFixed(5))
    };
}

module.exports = {
    analyzeStrategy
};
