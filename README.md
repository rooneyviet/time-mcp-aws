# Time MCP Server

A TypeScript implementation of an MCP (Model Context Protocol) server that provides time and timezone conversion functionality. This server allows AI models to get current time in any timezone and convert time between different timezones.

## Features

- **Get Current Time**: Retrieve the current time in any IANA timezone
- **Time Conversion**: Convert time between different timezones
- **DST Support**: Automatic daylight saving time detection
- **StreamableHTTP Transport**: Uses modern MCP StreamableHTTP transport in stateless mode
- **TypeScript**: Full TypeScript implementation with type safety
- **Default Timezone**: Configurable default timezone (Asia/Tokyo by default)

## Installation

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Setup

```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Start the server
pnpm start
```

### Development

```bash
# Run in development mode with auto-reload
pnpm run dev

# Build the project
pnpm run build

# Clean build artifacts
pnpm run clean
```

## MCP Tools

The server provides two MCP tools:

### 1. get_current_time

Get the current time in a specified timezone.

**Parameters:**

- `timezone` (string): IANA timezone name (e.g., 'America/New_York', 'Europe/London')

**Example Response:**

```json
{
  "timezone": "Asia/Tokyo",
  "datetime": "2024-01-15T14:30:00",
  "day_of_week": "Monday",
  "is_dst": false
}
```

### 2. convert_time

Convert time between different timezones.

**Parameters:**

- `source_timezone` (string): Source IANA timezone name
- `time` (string): Time to convert in 24-hour format (HH:MM)
- `target_timezone` (string): Target IANA timezone name

**Example Response:**

```json
{
  "source": {
    "timezone": "America/New_York",
    "datetime": "2024-01-15T09:30:00",
    "day_of_week": "Monday",
    "is_dst": false
  },
  "target": {
    "timezone": "Asia/Tokyo",
    "datetime": "2024-01-15T23:30:00",
    "day_of_week": "Monday",
    "is_dst": false
  },
  "time_difference": "+14h"
}
```

## API Endpoints

### MCP Protocol

- `POST /mcp` - MCP protocol endpoint for tool calls

### Health Check

- `GET /health` - Server health status

## Configuration

### Supported Timezones

The server supports all IANA timezone names

### Project Structure

```
src/
├── index.ts          # CLI entry point and argument parsing
├── server.ts         # MCP server with StreamableHTTP transport
├── timeServer.ts     # Core time logic and timezone handling
└── types.ts          # TypeScript interfaces and Zod schemas
```

## Deployment

- Check [DEPLOYMENT.md](DEPLOYMENT.md) for instructions on deploying MCP to AWS Lambda and API Gateway.

## License

MIT
