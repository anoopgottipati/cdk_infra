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
                body: JSON.stringify({ message: "Missing required fields: userId and deviceId are mandatory." }),
            };
        }

        // Remove the deviceId from the user's deviceIds list
        const params = {
            TableName: tableName,
            Key: { userId },
            UpdateExpression: 'DELETE #deviceIds :deviceId',
            ExpressionAttributeNames: {
                '#deviceIds': 'deviceIds',
            },
            ExpressionAttributeValues: {
                ':deviceId': dynamo.createSet([deviceId]),
            },
            ReturnValues: 'UPDATED_NEW',
        };

        const result = await dynamo.update(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Device removed from user successfully!', updatedAttributes: result.Attributes }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to remove device from user', error: error.message }),
        };
    }
};