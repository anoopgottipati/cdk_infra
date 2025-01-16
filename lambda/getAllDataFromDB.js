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

        console.log(`Fetching device IDs for userId: ${userId}`);

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

        console.log('Device IDs fetched from UserDeviceTable:', deviceIds);

        if (deviceIds.length === 0) {
            console.log('No device IDs found for the given userId.');
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
