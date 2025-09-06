#!/usr/bin/env node

import { createMcpServer } from './server.js';

interface CommandLineArgs {
  port?: number;
  localTimezone?: string;
  help?: boolean;
}

function parseArguments(args: string[]): CommandLineArgs {
  const result: CommandLineArgs = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--port':
        if (i + 1 < args.length) {
          const portValue = parseInt(args[i + 1], 10);
          if (isNaN(portValue) || portValue <= 0 || portValue > 65535) {
            console.error(`Invalid port number: ${args[i + 1]}`);
            process.exit(1);
          }
          result.port = portValue;
          i++; // Skip next argument as it's the port value
        } else {
          console.error('--port requires a value');
          process.exit(1);
        }
        break;
        
      case '--local-timezone':
        if (i + 1 < args.length) {
          result.localTimezone = args[i + 1];
          i++; // Skip next argument as it's the timezone value
        } else {
          console.error('--local-timezone requires a value');
          process.exit(1);
        }
        break;
        
      case '--help':
      case '-h':
        result.help = true;
        break;
        
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        break;
    }
  }
  
  return result;
}

function printHelp(): void {
  console.log(`
MCP Time Server - Time and timezone conversion functionality for MCP

Usage: npm start [options]
   or: pnpm start [options]  
   or: node dist/index.js [options]

Options:
  --port <number>           Port to run the server on (default: 3000)
  --local-timezone <name>   Default timezone for operations (default: Asia/Tokyo)
  --help, -h               Show this help message

Examples:
  npm start
  npm start -- --port 8080
  npm start -- --local-timezone "America/New_York"
  npm start -- --port 8080 --local-timezone "Europe/London"

Timezone Examples:
  Asia/Tokyo, America/New_York, Europe/London, UTC, America/Los_Angeles

Endpoints:
  POST /mcp              MCP protocol endpoint
  GET  /health           Health check endpoint

For more information about MCP (Model Context Protocol), visit:
https://modelcontextprotocol.io
`);
}

function validateTimezone(timezone: string): boolean {
  try {
    // Test timezone validity
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  try {
    const args = parseArguments(process.argv.slice(2));
    
    if (args.help) {
      printHelp();
      process.exit(0);
    }
    
    const port = args.port || 3000;
    const localTimezone = args.localTimezone || 'Asia/Tokyo';
    
    // Validate timezone before starting server
    if (!validateTimezone(localTimezone)) {
      console.error(`Invalid timezone: ${localTimezone}`);
      console.error('Please use a valid IANA timezone name (e.g., Asia/Tokyo, America/New_York, Europe/London)');
      process.exit(1);
    }
    
    console.log(`Starting MCP Time Server...`);
    console.log(`Configuration:`);
    console.log(`  Port: ${port}`);
    console.log(`  Default Timezone: ${localTimezone}`);
    console.log(`  Node.js Version: ${process.version}`);
    console.log('');
    
    // Start the server
    await createMcpServer(localTimezone, port);
    
  } catch (error) {
    console.error('Failed to start MCP Time Server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
// More reliable ES module entry point detection
if (import.meta.url.startsWith('file:')) {
  const modulePath = new URL(import.meta.url).pathname;
  const scriptPath = process.argv[1];
  
  if (modulePath === scriptPath || modulePath === scriptPath + '.js') {
    main();
  }
}