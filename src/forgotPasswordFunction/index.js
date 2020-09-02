const jwt = require('jsonwebtoken');
var aws = require('aws-sdk');
var docClient = new aws.DynamoDB.DocumentClient();

function HttpException(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

HttpException.prototype = Object.create(Error.prototype);


exports.handler = async (event, context) => {
    const token = event.pathParameters.token;
    try {
        const { newPassword, confirmPassword } = JSON.parse(event.body);

        if (newPassword !== confirmPassword) {
            throw HttpException("Password and Confirm Password don't match", 422);
        }

        const decodedJWT = jwt.verify(token, process.env.PASSWORD_JWT_SECRET);
        const sub = decodedJWT.sub;
        const data = await docClient.get({
            TableName: process.env.TABLE_NAME,
            Key: { Email: sub }
        }).promise();

        const user = data.Item;
        console.log(user);
        console.log("Security Token", user.securityToken);

        if (decodedJWT.securityToken === user.securityToken) {
            user.password = newPassword;
            await docClient.put({
                TableName: process.env.TABLE_NAME,
                Item: user
            }).promise();


        } else {
            throw new Error("This link has expired. Please request a new one.");
        }

        return {
            statusCode: 200,
            body: "OK" //JWT is sent to API caller
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: error.statusCode || 500,
            body: error.message || "Something went wrong"
        };
    }

};

//Todo: include hash substring to compare if password has changed already
function createPasswordResetToken(user) {


}