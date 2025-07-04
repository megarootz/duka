# Dukascopy Node.js API

A simple Express.js API for fetching historical forex data using the dukascopy-node library.

## Endpoints

### GET /
Health check endpoint

### GET /historical
Fetch historical data for forex analysis

**Query Parameters:**
- `instrument` (optional): Currency pair (default: eurusd)
- `from` (required): Start date in YYYY-MM-DD format
- `to` (required): End date in YYYY-MM-DD format  
- `timeframe` (optional): Data timeframe - s1, m1, m5, m15, m30, h1, h4, d1 (default: m15)
- `format` (optional): Response format - json or csv (default: json)

**Example:**
```
/historical?instrument=xauusd&from=2024-01-01&to=2024-01-02&timeframe=m15&format=json
```

**Response:**
```json
{
  "instrument": "xauusd",
  "timeframe": "m15",
  "from": "2024-01-01",
  "to": "2024-01-02",
  "data_count": 128,
  "data": [
    {
      "timestamp": "2024-01-01T00:00:00.000Z",
      "open": 2340.25,
      "high": 2341.75,
      "low": 2339.80,
      "close": 2341.50,
      "volume": 1250
    }
  ]
}
```

## Running the Project

```bash
npm install
npm start
```

The server will start on port 5000.

## Usage Examples

### Get Historical Data
```
GET /historical?instrument=xauusd&from=2024-01-01&to=2024-01-02&timeframe=m15
