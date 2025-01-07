#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkInfraStack } from '../lib/cdk_infra-stack';
import { DynamoLambdaApiStack } from '../lib/device_data_api-stack';

const app = new cdk.App();
new CdkInfraStack(app, 'CdkInfraStack', {
  env: {
    account: '664418960112', // Replace with your AWS Account ID
    region: 'us-east-1',     // Replace with your desired AWS Region (e.g., 'us-east-1')
  },
});

new DynamoLambdaApiStack(app, 'DynamoLambdaApiStack');