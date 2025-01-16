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

        // Fetch the current item
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

        // Check if the deviceId exists in the list
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

        // Remove the deviceId from the list
        const updatedDeviceIds = deviceIds.filter(id => id !== deviceId);

        // Update the item with the modified list
        const updateParams = {
            TableName: tableName,
            Key: { userId },
            UpdateExpression: 'SET #deviceIds = :updatedDeviceIds',
            ExpressionAttributeNames: {
                '#deviceIds': 'deviceIds',
            },
            ExpressionAttributeValues: {
                ':updatedDeviceIds': updatedDeviceIds,
            },
            ReturnValues: 'UPDATED_NEW',
        };

        const updateResult = await dynamo.update(updateParams).promise();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Device removed from user successfully!', updatedAttributes: updateResult.Attributes }),
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