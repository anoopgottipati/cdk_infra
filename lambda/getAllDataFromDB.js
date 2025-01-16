const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const userId = event.queryStringParameters.userId;

        // Validate input
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

        // Fetch device IDs from UserDeviceTable
        const userDeviceParams = {
            TableName: process.env.USER_DEVICE_TABLE,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId,
            },
        };

        const userDevices = await dynamoDb.query(userDeviceParams).promise();
        const deviceIds = userDevices.Items.map(item => item.deviceId);

        if (deviceIds.length === 0) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': true,
                },
                body: JSON.stringify([]),
            };
        }

        // Fetch devices from DeviceTable
        const deviceParams = {
            TableName: process.env.DEVICE_TABLE,
            FilterExpression: 'id IN (:deviceIds)',
            ExpressionAttributeValues: {
                ':deviceIds': deviceIds,
            },
        };

        const devices = await dynamoDb.scan(deviceParams).promise();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': true,
            },
            body: JSON.stringify(devices.Items),
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
