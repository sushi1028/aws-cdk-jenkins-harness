#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MyLambdaCdkStack } from '../lib/cdk-stack';

const app = new cdk.App();
new MyLambdaCdkStack(app, 'MyLambdaCdkStack');
