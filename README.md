# AWS CDK to Harness.io CI/CD Migration

This project demonstrates the migration of a Jenkins CI/CD pipeline for an AWS service (`MyApp`) to Harness.io. The project includes infrastructure deployment using AWS CDK and a multi-environment pipeline setup (Development, Staging, and Production) with approval gates and rollback strategies.

---

## 📁 **Project Structure**
```
.
├── .harness
│   ├── deployment.yml
│   └── lambda.yaml
├── Jenkinsfile
├── README.md
├── cdk
│   ├── .gitignore
│   ├── .npmignore
│   ├── Dockerfile
│   ├── README.md
│   ├── bin
│   │   └── cdk.ts
│   ├── cdk.context.json
│   ├── cdk.json
│   ├── jest.config.js
│   ├── lib
│   │   └── cdk-stack.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── test
│   │   └── cdk.test.ts
│   └── tsconfig.json
└── src
    └── index.js
```

---

## 🚀 **Problem Statement**
1. **Migration:** Migrate an existing Jenkins CI/CD pipeline for an AWS service (`MyApp`) to Harness.io.
2. **Deployment Strategy:** Deploy `MyApp` across Development, Staging, and Production environments using AWS CDK.
3. **Approval Gates:** Implement approval gates before promoting to higher environments.
4. **Rollback Strategy:** Provide a rollback strategy in case of a failure.

---

## 🏗️ **Solution Overview**
### 1. **Jenkins Pipeline Setup**
- Created a Jenkins pipeline using Docker for local setup.
- Configured pipeline to build and deploy AWS CDK infrastructure.

**Jenkinsfile:**
```groovy
pipeline {
    agent any

    environment {
        AWS_REGION = 'us-east-1'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                dir('cdk') {
                    sh 'npm install'
                }
            }
        }

        stage('CDK Bootstrap') {
            steps {
                withAWS(credentials: 'aws-credentials', region: "${AWS_REGION}") {
                    dir('cdk') {
                        sh 'cdk bootstrap'
                    }
                }
            }
        }

        stage('CDK Synth') {
            steps {
                withAWS(credentials: 'aws-credentials', region: "${AWS_REGION}") {
                    dir('cdk') {
                        sh 'cdk synth'
                    }
                }
            }
        }

        stage('CDK Deploy') {
            steps {
                withAWS(credentials: 'aws-credentials', region: "${AWS_REGION}") {
                    dir('cdk') {
                        sh 'cdk deploy --require-approval never'
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment Successful!'
        }
        failure {
            echo 'Deployment Failed!'
        }
    }
}
```

### 2. **Harness Pipeline Setup**
- Created a free Harness account.
- Installed the Harness delegate on an EC2 instance and Minikube cluster for Kubernetes.
- Configured GitHub and AWS connectors.
- Created a custom Docker image (`sushanteno8/harness:v4`) with CDK version `2.138.0` for compatibility.
- Configured the pipeline to build, synth, diff, and deploy AWS CDK.

---

### 📌 **Harness Pipeline Configuration**
- **Development Stage**  
  - Cloned repository.
  - CDK Bootstrap → CDK Synth → CDK Diff → CDK Deploy.

- **Staging Stage**  
  - Same steps as Development.
  - Added an **approval gate** before deployment.

- **Production Stage**  
  - Same steps as Staging.
  - Added an **approval gate** before deployment.

**Example Snippet:**
```yaml
- step:
    type: AwsCdkDeploy
    name: CDK Deploy
    spec:
      connectorRef: account.harnessImage
      envVariables:
        AWS_ACCESS_KEY_ID: <+secrets.getValue("AWS_ACCESS_KEY_ID")>
        AWS_SECRET_ACCESS_KEY: <+secrets.getValue("AWS_SECRET_ACCESS_KEY")>
        AWS_DEFAULT_REGION: <+secrets.getValue("AWS_DEFAULT_REGION")>
      image: sushanteno8/harness:v5
      provisionerIdentifier: dev
      resources:
        limits:
          memory: 1000Mi
          cpu: 1000m
    timeout: 10m
```

---

### 🔑 **Secret Management**
- Secrets (AWS credentials) are stored in **AWS Secrets Manager**.
- Accessed using Harness `secrets.getValue()`.

Example:
```yaml
AWS_ACCESS_KEY_ID: <+secrets.getValue("AWS_ACCESS_KEY_ID")>
AWS_SECRET_ACCESS_KEY: <+secrets.getValue("AWS_SECRET_ACCESS_KEY")>
AWS_DEFAULT_REGION: <+secrets.getValue("AWS_DEFAULT_REGION")>
```

---

### 🖥️ **CDK Code Overview**
- **CDK Stack (`cdk-stack.ts`):**  
  - Reads secrets from AWS Secrets Manager.
  - Deploys a Lambda function using CDK.

Example:
```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const secret = secretsmanager.Secret.fromSecretNameV2(
      this, 'MySecret', 'my-secret'
    );

    new lambda.Function(this, 'MyFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src'),
      environment: {
        SECRET_VALUE: secret.secretValue.toString(),
      }
    });
  }
}
```

---

### ✅ **Approval Gates**
- Added Harness **approval step** before promoting from:
  - Development → Staging  
  - Staging → Production  

Example:
```yaml
- step:
    type: HarnessApproval
    name: Stage Approval
    spec:
      approvers:
        userGroups:
          - account._account_all_users
        minimumCount: 1
```

---

### 🚨 **Rollback Strategy**
- Defined a rollback strategy using Harness.
- CDK rollback is currently commented out but can be enabled as needed.

Example:
```yaml
- step:
    type: AwsCdkRollback
    name: AWS CDK Rollback
    spec:
      provisionerIdentifier: test1
      envVariables:
        AWS_ACCESS_KEY_ID: <+secrets.getValue("AWS_ACCESS_KEY_ID")>
        AWS_SECRET_ACCESS_KEY: <+secrets.getValue("AWS_SECRET_ACCESS_KEY")>
```

---

## 🏆 **Best Practices**
✅ Use AWS Secrets Manager for secure key management.  
✅ Ensure AWS CDK compatibility by creating a custom Docker image.  
✅ Use approval gates to control deployment to higher environments.  
✅ Implement rollback steps to quickly revert in case of failures.  
✅ Keep pipeline configuration DRY (Don't Repeat Yourself).  

---

## 🖼️ **Architecture Diagram**
**[Insert Architecture Diagram Here]**  
- Lambda deployed using AWS CDK.  
- Multi-stage pipeline managed via Harness.  
- Secrets stored in AWS Secrets Manager.  

---

## 🌟 **Challenges & Solutions**
- **CDK Version Issue:**  
  Resolved by creating a custom Docker image (`v2.138.0`).  
- **Secret Handling:**  
  Used AWS Secrets Manager + Harness Secrets.  

---

## 🔗 **Function URL**
Deployed Lambda URL:  
[https://o7xwfgdoby7uj73lmhnsejelsa0zsldy.lambda-url.us-east-1.on.aws](https://o7xwfgdoby7uj73lmhnsejelsa0zsldy.lambda-url.us-east-1.on.aws)

---

## 📬 **Submission**
- ✅ Code committed to GitHub repository  
- ✅ Pipeline configured in Harness  
- ✅ Documentation included  

---

**✅ Status: Completed**