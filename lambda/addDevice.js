const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TABLE_NAME;

exports.handler = async (event) => {
    try {
        const item = JSON.parse(event.body);
        const { id, deviceName, location, deviceType, roomTemperature, humidity, lightStatus } = item;

        if (!id || !deviceName || !location || !deviceType) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: "Missing required fields: id, deviceName, location, and deviceType are mandatory." }),
            };
        }

        const params = {
            TableName: tableName,
            Item: {
                id,
                deviceName,
                location,
                deviceType,
                roomTemperature,
                humidity,
                lightStatus,
            },
        };

        await dynamo.put(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Item added successfully!' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Failed to add item', error: error.message }),
        };
    }
};


/*

Valid JSON Request: Input

{
    "id": "12345",
    "deviceName": "Thermostat-X",
    "location": "Living Room",
    "deviceType": "Thermostat",
    "roomTemperature": 22.5,
    "humidity": 45,
    "lightStatus": "ON"
}


*/


