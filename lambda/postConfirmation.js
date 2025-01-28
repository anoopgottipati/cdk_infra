const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    const tableName = process.env.USER_DEVICE_TABLE;
    const userId = event.userName; // Cognito user's username
    const email = event.request.userAttributes.email;

    const params = {
        TableName: tableName,
        Item: {
            userId: userId,
            email: email,
            createdAt: new Date().toISOString(),
        },
    };

    try {
        await dynamodb.put(params).promise();
        console.log(`User ${userId} added to ${tableName}`);
        return event;
    } catch (error) {
        console.error('Error adding user to DynamoDB:', error);
        throw error;
    }
};