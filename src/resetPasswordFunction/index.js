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
            throw HttpException("Password and Confirm Password don't match", 400);
        }

        const decodedJWT = jwt.verify(token, process.env.PASSWORD_JWT_SECRET);

        const user = getUserByEmail(decodedJWT.sub);
        console.log(user);
        console.log("Security Token", decodedJWT.securityToken);

        if (decodedJWT.securityToken === user.securityToken) {
            updateUserPasswordAndToken(user, newPassword);
        } else {
            throw HttpException("This link has already been used or is expired. Please request a new one.", 410);
        }

        return {
            statusCode: 200,
            body: "OK"
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: error.statusCode || 500,
            body: error.message
        };

    }

};

async function getUserByEmail(email){
    const data = await docClient.get({
        TableName: process.env.TABLE_NAME,
        Key: { Email: email }
    }).promise();

    return data.Item;
}

async function updateUserPasswordAndToken(user, newPassword){
    user.password = await bcrypt.hash(newPassword, 8);
    user.verificationToken = crypto.randomBytes(16).toString('hex');
    saveUserToDb(user)
}

async function saveUserToDb(user){
    try {
        const params = {
            TableName: process.env.TABLE_NAME,
            Item: {
                "Email": user.email,
                "Password": await bcrypt.hash(user.password, 8),
                "Confirmed": 0,
                "VerificationToken": user.verificationToken
            },
            ConditionExpression: 'attribute_not_exists(Email)' //Only put user if the email does not exist in the table already
        };
        await docClient.put(params).promise();
    } catch (err) {
        if (err.message === "The conditional request failed") { //This is returned by dynamoDB if the condition is not met
            throw new HttpException("This email has already been registered", 409);
        }
        throw err;
    }
};