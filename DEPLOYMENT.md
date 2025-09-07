# AWS Lambda Deployment Guide

This guide explains how to deploy your Time MCP Server to AWS Lambda with API Gateway and Cognito JWT authorization.

## Prerequisites

1. **AWS CLI**: Install and configure AWS CLI with appropriate credentials
2. **Node.js**: Version 18+ required
3. **pnpm**: Install globally with `npm install -g pnpm`
4. **AWS CDK**: Install globally with `pnpm install -g aws-cdk`

## AWS Authentication

```bash
aws sso login --profile ${SSO_PROFILE_NAME}
export AWS_PROFILE=${SSO_PROFILE_NAME}
./scripts/admin_profile_sso.sh
```

Replace the placeholder SSO_PROFILE_NAME with your SSO profile name.

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
# One-command deployment (builds and deploys)
pnpm run deploy:all
```

## Deployment Outputs

After successful deployment, CDK will output important values:

- **UserPoolId**: Cognito User Pool ID
- **UserPoolClientId**: Cognito User Pool Client ID
- **ApiUrl**: HTTP API Gateway base URL
- **McpEndpoint**: Full MCP endpoint URL
- **HealthEndpoint**: Health check URL
- **Region**: AWS Region

## Post-Deployment Setup

### Create a Test User

```bash
./scripts/create-user.sh <USER_POOL_ID> <USERNAME> <EMAIL> <PASSWORD>
```

### Get JWT Token for Testing

```bash
./scripts/authenticate.sh
```

Input the User Pool ID, Client ID, and Region from deployment outputs.

## Architecture Overview

- **Lambda Function**: Runs your MCP server using Lambda Web Adapter
- **API Gateway**: HTTP API with Cognito JWT authorizer
- **Cognito**: User Pool for authentication and JWT token generation
- **Lambda Web Adapter**: Translates Lambda events to HTTP requests for your Express app
