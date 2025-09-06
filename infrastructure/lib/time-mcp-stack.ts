import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayv2Integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as apigatewayv2Authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class TimeMcpStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Cognito User Pool
    const userPool = new cognito.UserPool(this, "TimeMcpUserPool", {
      userPoolName: "time-mcp-user-pool",
      selfSignUpEnabled: true,
      autoVerify: {
        email: true,
      },
      signInCaseSensitive: false,
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    // Create User Pool Client
    const userPoolClient = new cognito.UserPoolClient(
      this,
      "TimeMcpUserPoolClient",
      {
        userPool,
        userPoolClientName: "time-mcp-client",
        authFlows: {
          adminUserPassword: true,
          userPassword: true,
          userSrp: true,
        },
        generateSecret: false,
      }
    );

    // Create Lambda function with Lambda Web Adapter
    const timeMcpHandler = new lambdaNodejs.NodejsFunction(
      this,
      "TimeMcpHandler",
      {
        entry: "../src/index.ts",
        runtime: lambda.Runtime.NODEJS_20_X,
        timeout: cdk.Duration.minutes(3),
        handler: "run.sh",
        architecture: lambda.Architecture.X86_64,
        environment: {
          AWS_LAMBDA_EXEC_WRAPPER: "/opt/bootstrap",
          RUST_LOG: "info",
          DEFAULT_TIMEZONE: "Asia/Tokyo",
          PORT: "8080",
        },
        bundling: {
          minify: true,
          target: "node20",
          externalModules: ["@aws-sdk/*"],
          sourceMap: true,
          forceDockerBundling: false,
          commandHooks: {
            beforeInstall: () => [],
            beforeBundling: () => [],
            afterBundling: (inputDir: string, outputDir: string) => {
              return [`cp ${inputDir}/../lambda/run.sh ${outputDir}`];
            },
          },
        },
        layers: [
          lambda.LayerVersion.fromLayerVersionArn(
            this,
            "LambdaWebAdapterLayer",
            `arn:aws:lambda:${this.region}:753240598075:layer:LambdaAdapterLayerX86:25`
          ),
        ],
      }
    );

    // Create HTTP API with Cognito JWT authorizer
    const httpApi = new apigatewayv2.HttpApi(this, "TimeMcpApi", {
      apiName: "time-mcp-api",
      description: "Time MCP Server HTTP API",
      corsPreflight: {
        allowCredentials: false,
        allowHeaders: ["Content-Type", "Authorization"],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ["*"],
        maxAge: cdk.Duration.days(1),
      },
      defaultIntegration: new apigatewayv2Integrations.HttpLambdaIntegration(
        "TimeMcpLambdaIntegration",
        timeMcpHandler
      ),
      defaultAuthorizer: new apigatewayv2Authorizers.HttpUserPoolAuthorizer(
        "TimeMcpAuthorizer",
        userPool,
        {
          userPoolClients: [userPoolClient],
          identitySource: ["$request.header.Authorization"],
        }
      ),
    });

    // Add a route without authorization for health checks
    httpApi.addRoutes({
      path: "/health",
      methods: [apigatewayv2.HttpMethod.GET],
      integration: new apigatewayv2Integrations.HttpLambdaIntegration(
        "HealthCheckIntegration",
        timeMcpHandler
      ),
      // No authorizer specified = no authorization required
    });

    // Output important values
    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito User Pool Client ID",
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: httpApi.apiEndpoint,
      description: "HTTP API Gateway endpoint URL",
    });

    new cdk.CfnOutput(this, "McpEndpoint", {
      value: `${httpApi.apiEndpoint}/mcp`,
      description: "MCP Server endpoint URL",
    });

    new cdk.CfnOutput(this, "HealthEndpoint", {
      value: `${httpApi.apiEndpoint}/health`,
      description: "Health check endpoint URL (no auth required)",
    });

    new cdk.CfnOutput(this, "Region", {
      value: this.region,
      description: "AWS Region",
    });
  }
}
