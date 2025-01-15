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

        // Update the user's deviceIds list
        const params = {
            TableName: tableName,
            Key: { userId },
            UpdateExpression: 'SET #deviceIds = list_append(if_not_exists(#deviceIds, :empty_list), :deviceId)',
            ExpressionAttributeNames: {
                '#deviceIds': 'deviceIds',
            },
            ExpressionAttributeValues: {
                ':deviceId': [deviceId],
                ':empty_list': [],
            },
            ReturnValues: 'UPDATED_NEW',
        };

        const result = await dynamo.update(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Device added to user successfully!', updatedAttributes: result.Attributes }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to add device to user', error: error.message }),
        };
    }
};