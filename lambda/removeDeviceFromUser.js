const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.USER_DEVICE_TABLE;

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { userId, deviceId } = body;

        if (!userId || !deviceId) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: "Missing required fields: userId and deviceId are mandatory." }),
            };
        }

        // Fetch the user's current entry
        const getParams = {
            TableName: tableName,
            Key: { userId },
        };

        const getResult = await dynamo.get(getParams).promise();

        if (!getResult.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: "User not found." }),
            };
        }

        const deviceIds = getResult.Item.deviceIds || [];

        // Check if the deviceId exists
        if (!deviceIds.includes(deviceId)) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: "Device not found for the user." }),
            };
        }

        // Remove the deviceId from the array
        const updatedDeviceIds = deviceIds.filter(d => d !== deviceId);

        // Update the user's entry
        const updateParams = {
            TableName: tableName,
            Key: { userId },
            UpdateExpression: 'SET deviceIds = :updatedDeviceIds',
            ExpressionAttributeValues: {
                ':updatedDeviceIds': updatedDeviceIds,
            },
        };

        await dynamo.update(updateParams).promise();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Device removed from user successfully!' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Failed to remove device from user', error: error.message }),
        };
    }
};