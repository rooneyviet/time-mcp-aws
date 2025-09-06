import express, { Request, Response } from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { TimeServer } from './timeServer.js';
import { 
  TimeTools, 
  GetCurrentTimeInputSchema, 
  ConvertTimeInputSchema,
  GetCurrentTimeInput,
  ConvertTimeInput 
} from './types.js';

export async function createMcpServer(localTimezone: string = 'Asia/Tokyo', port: number = 3000): Promise<void> {
  const app = express();
  app.use(express.json());

  // CORS configuration for browser-based clients
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  });

  // Initialize TimeServer
  const timeServer = new TimeServer(localTimezone);

  // Helper function to create and configure MCP server
  const createServer = (): McpServer => {
    const server = new McpServer({
      name: 'time-mcp-server',
      version: '1.0.0'
    });

    // Register get_current_time tool
    server.registerTool(
      TimeTools.GET_CURRENT_TIME,
      {
        title: 'Get Current Time',
        description: 'Get current time in a specific timezone',
        inputSchema: GetCurrentTimeInputSchema.shape
      },
      async (input: GetCurrentTimeInput) => {
        try {
          // Validate input against Zod schema
          const validatedInput = GetCurrentTimeInputSchema.parse(input);
          const timezone = validatedInput.timezone || localTimezone;
          const result = timeServer.getCurrentTime(timezone);
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [{
              type: 'text',
              text: `Error processing get_current_time query: ${errorMessage}`
            }],
            isError: true
          };
        }
      }
    );

    // Register convert_time tool
    server.registerTool(
      TimeTools.CONVERT_TIME,
      {
        title: 'Convert Time Between Timezones',
        description: 'Convert time between different timezones',
        inputSchema: ConvertTimeInputSchema.shape
      },
      async (input: ConvertTimeInput) => {
        try {
          // Validate input against Zod schema
          const validatedInput = ConvertTimeInputSchema.parse(input);
          const sourceTimezone = validatedInput.source_timezone || localTimezone;
          const targetTimezone = validatedInput.target_timezone || localTimezone;
          
          const result = timeServer.convertTime(
            sourceTimezone,
            validatedInput.time,
            targetTimezone
          );
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [{
              type: 'text',
              text: `Error processing convert_time query: ${errorMessage}`
            }],
            isError: true
          };
        }
      }
    );

    return server;
  };

  // Handle POST requests for client-to-server communication (stateless mode)
  app.post('/mcp', async (req: Request, res: Response) => {
    try {
      // Create a new instance for each request to ensure complete isolation
      const server = createServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // Stateless mode
      });

      // Clean up transport when response closes
      res.on('close', () => {
        transport.close();
        server.close();
      });

      // Connect and handle the request
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  // SSE notifications not supported in stateless mode
  app.get('/mcp', async (req: Request, res: Response) => {
    console.log('Received GET MCP request');
    res.writeHead(405).end(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.'
      },
      id: null
    }));
  });

  // Session termination not needed in stateless mode
  app.delete('/mcp', async (req: Request, res: Response) => {
    console.log('Received DELETE MCP request');
    res.writeHead(405).end(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed.'
      },
      id: null
    }));
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'time-mcp-server',
      version: '1.0.0',
      defaultTimezone: localTimezone,
      timestamp: new Date().toISOString()
    });
  });

  // Start the server
  app.listen(port, (error?: Error) => {
    if (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
    console.log(`MCP Time Server listening on port ${port}`);
    console.log(`Default timezone: ${localTimezone}`);
    console.log(`Health check: http://localhost:${port}/health`);
    console.log(`MCP endpoint: http://localhost:${port}/mcp`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT. Shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM. Shutting down gracefully...');
    process.exit(0);
  });
}