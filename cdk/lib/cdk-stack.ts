import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class MyLambdaCdkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const secretName = "myAppSecret"; // Change this to your secret name

        // IAM Role for Lambda with Secrets Manager access
        const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        });

        // Allow Lambda to read the secret from Secrets Manager
        lambdaRole.addToPolicy(new iam.PolicyStatement({
            actions: ["secretsmanager:GetSecretValue"],
            resources: [`arn:aws:secretsmanager:${this.region}:${this.account}:secret:${secretName}-*`]
        }));

        // Create Lambda function
        const helloWorldLambda = new lambda.Function(this, 'HelloWorldLambda', {
            functionName: "hello-world-nodejs",
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: 'index.handler',
            code: lambda.Code.fromAsset('../src'),
            role: lambdaRole,
            environment: {
                SECRET_NAME: secretName, // Pass secret name as an env variable
                REGION: this.region
            }
        });

        // Add Function URL (Public Access)
        const functionUrl = helloWorldLambda.addFunctionUrl({
            authType: lambda.FunctionUrlAuthType.NONE, // Use AWS_IAM for restricted access
        });

        // Output Function URL
        new cdk.CfnOutput(this, 'FunctionURL', {
            value: functionUrl.url,
            description: "Invoke this URL to test the Lambda function"
        });
    }
}
