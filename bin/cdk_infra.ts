#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkInfraStack } from '../lib/cdk_infra-stack';
import { DynamoLambdaApiStack } from '../lib/device_data_api-stack';
import { BackendPipelineStack } from '../lib/backend_pipeline-stack';

const app = new cdk.App();
new CdkInfraStack(app, 'BackendPipelineStack',{
  env: {
    account: '664418960112',
    region: 'us-east-1',
  },
});
new CdkInfraStack(app, 'CdkInfraStack', {
  env: {
    account: '664418960112',
    region: 'us-east-1',
  },
});

new DynamoLambdaApiStack(app, 'DynamoLambdaApiStack');