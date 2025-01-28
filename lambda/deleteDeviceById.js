const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
const deviceTableName = process.env.TABLE_NAME;
const deviceInfoTableName = process.env.DEVICE_INFO_TABLE;
const userDeviceTableName = process.env.USER_DEVICE_TABLE;

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
                body: JSON.stringify({ message: "Missing required field: id is mandatory." }),
            };
        }

        // Delete the device from the DeviceTable
        const deleteDeviceParams = {
            TableName: deviceTableName,
            Key: { id },
        };

        await dynamo.delete(deleteDeviceParams).promise();
        console.log("Device deleted from DeviceTable");

        // Delete the device information from the DeviceInformationTable
        const deleteDeviceInfoParams = {
            TableName: deviceInfoTableName,
            Key: { deviceId: id },
        };

        console.log("Deleting from DeviceInformationTable with params:", deleteDeviceInfoParams);
        await dynamo.delete(deleteDeviceInfoParams).promise();
        console.log("Device information deleted from DeviceInformationTable");

        // Remove the device ID from the UserDeviceTable
        const scanParams = {
            TableName: userDeviceTableName,
            FilterExpression: 'contains(deviceIds, :deviceId)',
            ExpressionAttributeValues: {
                ':deviceId': id,
            },
        };

        const scanResult = await dynamo.scan(scanParams).promise();
        console.log("Scan result:", scanResult);

        // For each user, remove the device ID from their deviceIds list
        for (const user of scanResult.Items) {
            console.log("Updating user:", user.userId, "to remove device ID:", id);

            // Filter out the deleted device ID from the deviceIds array
            const updatedDeviceIds = user.deviceIds.filter(deviceId => deviceId !== id);

            console.log(updatedDeviceIds);

            const updateParams = {
                TableName: userDeviceTableName,
                Key: { userId: user.userId },
                UpdateExpression: 'SET deviceIds = :updatedDeviceIds',
                ExpressionAttributeValues: {
                    ':updatedDeviceIds': updatedDeviceIds,
                },
            };

            await dynamo.update(updateParams).promise();
            console.log("Device ID removed from user:", user.userId);
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Device and associated data deleted successfully!' }),
        };
    } catch (error) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: 'Failed to delete device and associated data', error: error.message }),
        };
    }
};