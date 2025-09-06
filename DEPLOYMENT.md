# AWS Lambda Deployment Guide

This guide explains how to deploy your Time MCP Server to AWS Lambda with API Gateway and Cognito JWT authorization.

## Prerequisites

1. **AWS CLI**: Install and configure AWS CLI with appropriate credentials
2. **Node.js**: Version 18+ required
3. **pnpm**: Install globally with `npm install -g pnpm`
4. **AWS CDK**: Install globally with `pnpm install -g aws-cdk`

## Available Commands Reference

All commands should be run from the **project root directory** unless specified:

| Command                | Description                                      | Directory |
| ---------------------- | ------------------------------------------------ | --------- |
| `pnpm run build`       | Build main TypeScript app                        | Root      |
| `pnpm run cdk:install` | Install CDK dependencies                         | Root      |
| `pnpm run cdk:build`   | Build CDK infrastructure code                    | Root      |
| `pnpm run cdk:synth`   | Generate CloudFormation templates (dry run)      | Root      |
| `pnpm run cdk:deploy`  | Deploy to AWS                                    | Root      |
| `pnpm run cdk:destroy` | Destroy AWS resources                            | Root      |
| `pnpm run deploy:all`  | Full deployment (build + cdk:build + cdk:deploy) | Root      |

## Quick Deployment (Recommended)

**📁 Start in project root directory**

### 1. Install Dependencies

```bash
# Install main project dependencies
pnpm install

# Install CDK infrastructure dependencies
pnpm run cdk:install
```

### 2. Bootstrap CDK (First time only)

```bash
pnpm run cdk:synth  # Generate templates first
pnpm run cdk:bootstrap
```

### 3. Deploy Everything

```bash
# One-command deployment (builds everything and deploys)
pnpm run deploy:all
```

## Step-by-Step Deployment (Alternative)

**📁 Start in project root directory**

If you prefer more control or debugging:

### 1. Build Application

```bash
pnpm run build
```

### 2. Build CDK Infrastructure

```bash
pnpm run cdk:build
```

### 3. Preview Changes (Optional)

```bash
pnpm run cdk:synth  # View generated CloudFormation
```

### 4. Deploy to AWS

```bash
pnpm run cdk:deploy
```

## Development Workflow

**📁 Always work from project root directory**

### Making Changes to Your MCP Server

```bash
# 1. Edit your code in src/
# 2. Test locally first
pnpm run build
pnpm run start

# 3. Deploy changes
pnpm run deploy:all
```

### When to Use Each Command

- **`pnpm run deploy:all`** - Use for most deployments (builds everything)
- **`pnpm run cdk:synth`** - Use to preview CloudFormation templates without deploying
- **`pnpm run cdk:build`** - Use before `cdk diff` to see infrastructure changes
- **`pnpm run cdk:destroy`** - Use to delete all AWS resources (careful!)

## Deployment Outputs

After successful deployment, CDK will output important values:

- **UserPoolId**: Cognito User Pool ID
- **UserPoolClientId**: Cognito User Pool Client ID
- **ApiUrl**: HTTP API Gateway base URL
- **McpEndpoint**: Full MCP endpoint URL
- **HealthEndpoint**: Health check URL (no auth required)
- **Region**: AWS Region

## Post-Deployment Setup

### Create a Test User

Replace `<USER_POOL_ID>` with the actual User Pool ID from deployment outputs:

```bash
aws cognito-idp admin-create-user \
  --user-pool-id <USER_POOL_ID> \
  --username testuser \
  --user-attributes Name=email,Value=test@example.com \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS
```

Set permanent password:

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id <USER_POOL_ID> \
  --username testuser \
  --password MySecurePassword123! \
  --permanent
```

### Get JWT Token for Testing

Create a script to authenticate and get JWT token:

```bash
# Create authenticate.sh script
cat > authenticate.sh << 'EOF'
#!/bin/bash
USER_POOL_ID="<USER_POOL_ID>"
CLIENT_ID="<USER_POOL_CLIENT_ID>"
REGION="us-east-1"

aws cognito-idp admin-initiate-auth \
  --user-pool-id $USER_POOL_ID \
  --region $REGION \
  --client-id $CLIENT_ID \
  --auth-flow ADMIN_USER_PASSWORD_AUTH \
  --auth-parameters USERNAME=testuser,PASSWORD=MySecurePassword123!
EOF

chmod +x authenticate.sh
```

Replace the placeholders and run:

```bash
./authenticate.sh
```

Copy the `IdToken` from the response for API calls.

## Testing the Deployment

### Health Check (No Auth Required)

```bash
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/health
```

### MCP Endpoint (Requires JWT)

```bash
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

### Test Time Tools

```bash
# Get current time
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "get_current_time",
      "arguments": {
        "timezone": "America/New_York"
      }
    },
    "id": 2
  }'
```

## Architecture Overview

- **Lambda Function**: Runs your MCP server using Lambda Web Adapter
- **API Gateway**: HTTP API with Cognito JWT authorizer
- **Cognito**: User Pool for authentication and JWT token generation
- **Lambda Web Adapter**: Translates Lambda events to HTTP requests for your Express app

## Useful Commands

```bash
# View deployed resources (from root)
pnpm run cdk:synth

# Show differences before deploy (from root)
pnpm run cdk:build  # Build first
cd infrastructure
pnpm cdk diff
cd ..  # Return to root

# Destroy the stack (careful! - from root)
pnpm run cdk:destroy

# View Lambda logs
aws logs tail /aws/lambda/TimeMcpStack-TimeMcpHandler --follow
```

## Troubleshooting

1. **Lambda Cold Starts**: First request might take longer
2. **CORS Issues**: Check if Authorization header is properly configured
3. **JWT Expiry**: JWT tokens expire, get a new one if requests fail
4. **Region Issues**: Ensure all resources are in the same region

## Security Notes

- JWT tokens are required for MCP endpoints
- Health endpoint is public (no authorization)
- User Pool requires email verification
- Strong password policy is enforced
