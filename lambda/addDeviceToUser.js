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

        // Update the user's deviceIds list
        const params = {
            TableName: tableName,
            Key: { userId }, // Only userId is needed as the partition key
            UpdateExpression: 'SET #deviceIds = list_append(if_not_exists(#deviceIds, :empty_list), :deviceId)',
            ExpressionAttributeNames: {
                '#deviceIds': 'deviceIds', // Attribute name for the list of device IDs
            },
            ExpressionAttributeValues: {
                ':deviceId': [deviceId], // Add the new deviceId to the list
                ':empty_list': [], // Default empty list if the attribute doesn't exist
            },
            ReturnValues: 'UPDATED_NEW', // Return the updated attributes
        };

        const result = await dynamo.update(params).promise();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Device added to user successfully!', updatedAttributes: result.Attributes }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Failed to add device to user', error: error.message }),
        };
    }
};