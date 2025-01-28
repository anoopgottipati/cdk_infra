// In addDevice.js
const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const deviceTableName = process.env.TABLE_NAME;
const deviceInfoTableName = process.env.DEVICE_INFO_TABLE;

exports.handler = async (event) => {
    try {
        const item = JSON.parse(event.body);
        const { id, deviceName, location, deviceType, roomTemperature, humidity, lightStatus } = item;

        if (!id || !deviceName || !location || !deviceType) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: "Missing required fields: id, deviceName, location, and deviceType are mandatory." }),
            };
        }

        // Add to DeviceTable
        const deviceParams = {
            TableName: deviceTableName,
            Item: {
                id,
                deviceName,
                location,
                deviceType,
            },
        };

        await dynamo.put(deviceParams).promise();

        // Add to DeviceInformationTable
        const deviceInfoParams = {
            TableName: deviceInfoTableName,
            Item: {
                deviceId: id,
                roomTemperature,
                humidity,
                lightStatus,
            },
        };

        await dynamo.put(deviceInfoParams).promise();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Item added successfully!' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
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


