const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient();
const crypto = require('crypto');

exports.handler = async (event, context) => {
    try {
        const user = JSON.parse(event.body);
        const token = await registerUserGetToken(user); //Register user and get a JWT to log in
        return {
            statusCode: 200,
            body: JSON.stringify(token) //JWT is sent to API caller
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: error.message
        };
    }
};

const registerUserGetToken = async (user) => {
    user.verificationToken = crypto.randomBytes(16).toString('hex'); //This verification token will be used for password resets and token refresh
    const emailConfirmationToken = createEmailConfirmationToken(user); //The token to confirm a user's email
    await addUserToDB(user);
    await sendRegistrationEmail(user, emailConfirmationToken); //Send welcome email with the confirmation token
    return signinToken(user); //Return the sign in token
};

function createEmailConfirmationToken(user) {
    const payload = {
        sub: user.email,
        iss: "lambda-auth",
        aud: "lambda-auth",
        verificationToken: user.verificationToken
    };

    return jwt.sign(payload, process.env.EMAIL_JWT_SECRET, { expiresIn: "7d" }); //The confirm email token will expire in 7 days
}

const addUserToDB = async (user) => {
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
        if (err.message === "The conditional request failed") { //This is returned by dynamoDB if the ciondition is not met
            throw new Error("This email has already been registered");
        }
        throw err;
    }
};

const sendRegistrationEmail = async (user, confirmationToken) => {
    var email = {
        Destination: {
            ToAddresses: [user.email]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: `<h1>Welcome</h1>. <br>Hello, please confirm your address by clicking 
                    <a href='${process.env.BASE_URL + 'confirmEmail/' + confirmationToken}'>here</a>.`
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: 'Confirm your email - Lambda Auth'
            }
        },
        Source: process.env.SENDER_EMAIL, /* required */
        ReplyToAddresses: [
            process.env.SENDER_EMAIL,
            /* more items */
        ],
    };

    aws.config.update({ region: 'us-west-2' });
    await new aws.SES({ apiVersion: '2010-12-01' }).sendEmail(email).promise();
}

const signinToken = (user) => {
    const payload = {
        sub: user.email,
        iss: "lambda-auth",
        aud: "lambda-auth"
    };

    //A JWT is created with the payload content
    return jwt.sign(payload, process.env.USER_JWT_SECRET, { expiresIn: "1d" })
}
