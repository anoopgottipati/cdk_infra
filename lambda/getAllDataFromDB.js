const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const userId = event.queryStringParameters.userId;

        if (!userId) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify({ error: 'Missing userId parameter' }),
            };
        }

        console.log(`Fetching device IDs for userId: ${userId}`);

        const userDeviceParams = {
            TableName: process.env.USER_DEVICE_TABLE,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            },
        };

        const userDevices = await dynamoDb.query(userDeviceParams).promise();

        if (!userDevices.Items || userDevices.Items.length === 0) {
            console.log('No devices found for the given userId.');
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify([]),
            };
        }

        // Extract device IDs
        const deviceIds = userDevices.Items.flatMap(item =>
            Array.isArray(item.deviceIds)
                ? item.deviceIds.map(device => device.S || device)
                : []
        ).filter(id => id);

        console.log('Device IDs fetched from UserDeviceTable:', deviceIds);

        if (deviceIds.length === 0) {
            console.log('No valid device IDs found.');
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify([]),
            };
        }

        console.log('Fetching device details from DeviceTable for device IDs:', deviceIds);

        const deviceParams = {
            RequestItems: {
                [process.env.DEVICE_TABLE]: {
                    Keys: deviceIds.map(id => ({ id })),
                },
            },
        };

        const devices = await dynamoDb.batchGet(deviceParams).promise();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(devices.Responses[process.env.DEVICE_TABLE]),
        };
    } catch (error) {
        console.error('Error fetching data:', error);

        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
