import * as cdk from '@aws-cdk/core';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as route53 from '@aws-cdk/aws-route53';
import * as certificatemanager from '@aws-cdk/aws-certificatemanager';
import * as route53targets from '@aws-cdk/aws-route53-targets';

export class DynamoLambdaApiStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, {
            env: {
                account: '664418960112',  // My AWS account ID
                region: 'us-east-1',  // AWS region
            },
            ...props,
        });

        // DynamoDB Table
        const dynamoTable = new dynamodb.Table(this, 'DeviveData_DynamoDBTable', {
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            tableName: 'DeviceTable',
            removalPolicy: cdk.RemovalPolicy.DESTROY, 
        });

        // add data Lambda Function
        const addDataLambda = new lambda.Function(this, 'AddDataToDBLambdaHandler', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'addDataToDB.handler',
            environment: {
                TABLE_NAME: dynamoTable.tableName,
            },
        });

        //get all data Lambda Function
        const getAllDataApiLambda = new lambda.Function(this, 'GetAllDataFromDBLambdaHandler', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'getAllDataFromDB.handler',
            environment: {
                TABLE_NAME: dynamoTable.tableName,
            },
        });

        //get data by id Lambda Function
        const getDataByIdApiLambda = new lambda.Function(this, 'GetDataByIdFromDBLambdaHandler', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'getDatabyIdFromDB.handler',
            environment: {
                TABLE_NAME: dynamoTable.tableName,
            },
        });

        // Grant Lambda permissions to interact with DynamoDB
        dynamoTable.grantReadWriteData(addDataLambda);
        dynamoTable.grantReadWriteData(getAllDataApiLambda);
        dynamoTable.grantReadWriteData(getDataByIdApiLambda);


        const api = new apigateway.RestApi(this, 'DeviceApiWithCors', {
            restApiName: 'DeviceApi',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS, // Allow all origins
                allowMethods: apigateway.Cors.ALL_METHODS, // Allow all HTTP methods
                allowHeaders: apigateway.Cors.DEFAULT_HEADERS, // Default headers
            },
        });

        // Integrate Lambda with API Gateway
        const addDataLambdaIntegration = new apigateway.LambdaIntegration(addDataLambda);
        const getAllDataLambdaIntegration = new apigateway.LambdaIntegration(getAllDataApiLambda);
        const getDataByIdLambdaIntegration = new apigateway.LambdaIntegration(getDataByIdApiLambda);

        const items = api.root.addResource('device');
        items.addMethod('POST', addDataLambdaIntegration);

        items.addMethod('GET', getAllDataLambdaIntegration, {
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                    },
                },
            ],
        });

        const itemsById = items.addResource('{id}');
        itemsById.addMethod('GET', getDataByIdLambdaIntegration, {
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                    },
                },
            ],
        });



        // Create a certificate for the custom domain
        /*
        const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
            domainName: 'iotlink.click',
        });
        */

        const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
            hostedZoneId: 'Z0655574274JOAEHFQ3IX', // my hosted zone ID
            zoneName: 'iotlink.click',
        });


        const certificate = new certificatemanager.Certificate(this, 'ApiCertificate', {
            domainName: 'api.iotlink.click',
            validation: certificatemanager.CertificateValidation.fromDns(hostedZone),
        });

        // Creating a custom domain in API Gateway
        const apiDomain = new apigateway.DomainName(this, 'ApiDomain', {
            domainName: 'api.iotlink.click',
            certificate: certificate,
            endpointType: apigateway.EndpointType.EDGE, // Edge-optimized endpoint
        });

        // Maping the custom domain to the API
        apiDomain.addBasePathMapping(api);

        // Creating a Route 53 A record to point to the API Gateway custom domain
        new route53.ARecord(this, 'ApiAliasRecord', {
            zone: hostedZone,
            recordName: 'api.iotlink.click',
            target: route53.RecordTarget.fromAlias(new route53targets.ApiGatewayDomain(apiDomain)),
        });



    }
}