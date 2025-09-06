#!/usr/bin/env node

import { createMcpServer } from './server.js';

async function main(): Promise<void> {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    const localTimezone = process.env.LOCAL_TIMEZONE || 'Asia/Tokyo';
    
    await createMcpServer(localTimezone, port);
    
  } catch (error) {
    console.error('Failed to start MCP Time Server:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

main();