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

        // Import the userDeviceTable from CdkInfraStack
        const userDeviceTable = dynamodb.Table.fromTableAttributes(this, 'UserDeviceTable', {
            tableName: cdk.Fn.importValue('UserDeviceTableName'),
            //tableArn: cdk.Fn.importValue('UserDeviceTableArn'),
        });

        // DynamoDB Table
        const deviceTable = new dynamodb.Table(this, 'DeviveData_DynamoDBTable', {
            partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
            tableName: 'DeviceTable',
            removalPolicy: cdk.RemovalPolicy.DESTROY, 
        });



        // add data Lambda Function
        const addDeviceLambda = new lambda.Function(this, 'addDeviceLambda', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'addDevice.handler',
            environment: {
                TABLE_NAME: deviceTable.tableName,
            },
        });

        // Delete data by id Lambda Function
        const deleteDeviceByIDApiLambda = new lambda.Function(this, 'deleteDeviceByIDApiLambda', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'deleteDeviceById.handler',
            environment: {
                TABLE_NAME: deviceTable.tableName,
            },
        });

        //get all data Lambda Function
        const getAllDataApiLambda = new lambda.Function(this, 'GetAllDataFromDBLambdaHandler', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'getAllDataFromDB.handler',
            environment: {
                DEVICE_TABLE: deviceTable.tableName,
                USER_DEVICE_TABLE: userDeviceTable.tableName,
            },
        });

        //get data by id Lambda Function
        const getDataByIdApiLambda = new lambda.Function(this, 'GetDataByIdFromDBLambdaHandler', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'getDatabyIdFromDB.handler',
            environment: {
                TABLE_NAME: deviceTable.tableName,
            },
        });

        const addDeviceToUserLambda = new lambda.Function(this, 'addDeviceToUserLambda', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'addDeviceToUser.handler',
            environment: {
            USER_DEVICE_TABLE: userDeviceTable.tableName,
            },
        });

        const removeDeviceFromUserLambda = new lambda.Function(this, 'removeDeviceFromUserLambda', {
            runtime: lambda.Runtime.NODEJS_16_X,
            code: lambda.Code.fromAsset('lambda'),
            handler: 'removeDeviceFromUser.handler',
            environment: {
            USER_DEVICE_TABLE: userDeviceTable.tableName,
            },
        });




        // Grant Lambda permissions to interact with DynamoDB
        deviceTable.grantReadWriteData(addDeviceLambda);
        deviceTable.grantReadWriteData(deleteDeviceByIDApiLambda);
        deviceTable.grantReadWriteData(getAllDataApiLambda);
        deviceTable.grantReadWriteData(getDataByIdApiLambda);

        userDeviceTable.grantReadWriteData(addDeviceToUserLambda);
        userDeviceTable.grantReadWriteData(removeDeviceFromUserLambda);
        userDeviceTable.grantReadData(getAllDataApiLambda);
        userDeviceTable.grantReadData(getDataByIdApiLambda);

        


        const api = new apigateway.RestApi(this, 'DeviceApiWithCors', {
            restApiName: 'DeviceApi',
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS, // Allow all origins
                allowMethods: apigateway.Cors.ALL_METHODS, // Allow all HTTP methods
                allowHeaders: apigateway.Cors.DEFAULT_HEADERS, // Default headers
            },
        });

        // Integrate Lambda with API Gateway
        const addDataLambdaIntegration = new apigateway.LambdaIntegration(addDeviceLambda);
        const deleteDataByIdLambdaIntegration = new apigateway.LambdaIntegration(deleteDeviceByIDApiLambda);
        const getAllDataLambdaIntegration = new apigateway.LambdaIntegration(getAllDataApiLambda);
        const getDataByIdLambdaIntegration = new apigateway.LambdaIntegration(getDataByIdApiLambda);
        const addDeviceToUserLambdaIntegration = new apigateway.LambdaIntegration(addDeviceToUserLambda);
        const removeDeviceFromUserLambdaIntegration = new apigateway.LambdaIntegration(removeDeviceFromUserLambda);
        

        const items = api.root.addResource('device');

        items.addMethod('POST', addDataLambdaIntegration, {
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                    },
                },
            ],
        });

        items.addMethod('GET', getAllDataLambdaIntegration, {
            requestParameters: {
                'method.request.querystring.userId': true, // Allow userId as a query parameter
            },
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

        itemsById.addMethod('DELETE', deleteDataByIdLambdaIntegration, {
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                    },
                },
            ],
        });


        const userDeviceResource = api.root.addResource('user');
        userDeviceResource.addMethod('POST', addDeviceToUserLambdaIntegration, {
            methodResponses: [
                {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                    },
                },
            ],
        });
        userDeviceResource.addMethod('DELETE', removeDeviceFromUserLambdaIntegration, {
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