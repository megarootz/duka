
# Dukascopy Node.js API

A simple Express.js API for fetching historical forex data using the dukascopy-node library.

## Endpoints

### GET /
Health check endpoint

### GET /historical
Fetch historical forex data

**Query Parameters:**
- `instrument` (optional): Currency pair (default: eurusd)
- `from` (required): Start date in YYYY-MM-DD format
- `to` (required): End date in YYYY-MM-DD format  
- `timeframe` (optional): Data timeframe - tick, s1, m1, m5, m15, m30, h1, h4, d1 (default: h1)
- `format` (optional): Response format - json or csv (default: json)

**Example:**
```
/historical?instrument=eurusd&from=2024-01-01&to=2024-01-02&timeframe=h1&format=json
```

## Running the Project

```bash
npm install
npm start
```

The server will start on port 5000.
