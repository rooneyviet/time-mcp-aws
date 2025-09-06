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

## Usage

### Command Line Options

```bash
# Default configuration (port 3000, timezone Asia/Tokyo)
pnpm start

# Custom port
pnpm start -- --port 8080

# Custom default timezone
pnpm start -- --local-timezone "America/New_York"  

# Both custom port and timezone
pnpm start -- --port 8080 --local-timezone "Europe/London"

# Show help
pnpm start -- --help
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

The server supports all IANA timezone names, including:
- `UTC`
- `America/New_York`
- `America/Los_Angeles` 
- `Europe/London`
- `Europe/Paris`
- `Asia/Tokyo`
- `Asia/Shanghai`
- `Australia/Sydney`
- And many more...

### Default Timezone

The default timezone is `Asia/Tokyo` but can be overridden:
- Via command line: `--local-timezone "America/New_York"`
- This timezone is used when no timezone is specified in tool calls

## Architecture

### Project Structure
```
src/
├── index.ts          # CLI entry point and argument parsing
├── server.ts         # MCP server with StreamableHTTP transport  
├── timeServer.ts     # Core time logic and timezone handling
└── types.ts          # TypeScript interfaces and Zod schemas
```

### Transport Mode
- Uses `StreamableHTTPServerTransport` in **stateless mode**
- Each request creates a new server instance for complete isolation
- No session management or persistent state
- Suitable for horizontal scaling

## Error Handling

The server provides comprehensive error handling for:
- Invalid timezone names
- Invalid time formats  
- Network errors
- Server startup failures

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the server logs for error details
- Verify timezone names are valid IANA identifiers
- Ensure time format is HH:MM (24-hour)
- Test with the health endpoint: `GET /health`
