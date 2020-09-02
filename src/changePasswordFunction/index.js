const bcrypt = require('bcryptjs');
const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient();
const crypto = require('crypto');

function HttpException(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }
  
HttpException.prototype = Object.create(Error.prototype);

exports.handler = async (event) => {
    console.log(event)
    try {
        console.log(event.requestContext)
        
        const {oldPassword, newPassword, repeatNewPassword} = JSON.parse(event.body);
        
        if (newPassword !== repeatNewPassword) {
            throw HttpException("Password and Confirm Password don't match", 400);
        }
        
        const user = await getUserByEmail(event.requestContext.authorizer.userEmail);
        console.log("USER", user)
        if (await bcrypt.compare(oldPassword, user.Password)) {
            throw HttpException("Old password incorrect.", 400);
        }else{
            updateUserPasswordAndToken(user, newPassword);
        }

        const body = {
            user: event.requestContext.authorizer.userEmail, //User comes from authorizer
        };

        return {
            statusCode: 200,
            body: JSON.stringify(body),
            headers: {}
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: error.message
        };
    }
}

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