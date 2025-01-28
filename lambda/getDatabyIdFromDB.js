const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const deviceTableName = process.env.TABLE_NAME; // Device table
const deviceInfoTableName = process.env.DEVICE_INFO_TABLE; // Device information table

exports.handler = async (event) => {
    try {
        const { id } = event.pathParameters;

        if (!id) {
            return {
                statusCode: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: "Missing required field: id" }),
            };
        }

        // Fetch data from the Device Table
        const deviceParams = {
            TableName: deviceTableName,
            Key: { id },
        };

        const deviceResult = await dynamo.get(deviceParams).promise();

        if (!deviceResult.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: "Device not found" }),
            };
        }

        // Fetch data from the Device Information Table
        const deviceInfoParams = {
            TableName: deviceInfoTableName,
            Key: { deviceId: id },
        };

        const deviceInfoResult = await dynamo.get(deviceInfoParams).promise();

        if (!deviceInfoResult.Item) {
            return {
                statusCode: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: "Device information not found" }),
            };
        }

        // Combine data from both tables
        const combinedData = {
            id: deviceResult.Item.id,
            deviceName: deviceResult.Item.deviceName,
            location: deviceResult.Item.location,
            deviceType: deviceResult.Item.deviceType,
            roomTemperature: deviceInfoResult.Item.roomTemperature,
            humidity: deviceInfoResult.Item.humidity,
            lightStatus: deviceInfoResult.Item.lightStatus,
        };

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(combinedData),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Failed to get item', error: error.message }),
        };
    }
};