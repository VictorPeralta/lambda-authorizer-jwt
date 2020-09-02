const jwt = require('jsonwebtoken');
var aws = require('aws-sdk');


exports.handler = async (event, context) => {
    try {
        const {email} = JSON.parse(event.body);
        console.log(email)

        const user = getUserByEmail(email);
        const token = createPasswordResetToken(user);
        await sendResetPasswordToken(user.email, token);

        return {
            statusCode: 200,
            body: "OK"
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
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

function createPasswordResetToken(user){
    const payload = {
        sub: user.email,
        iss: "lambda-auth",
        aud: "lambda-auth",
        verificationToken: user.verificationToken
    };

    return jwt.sign(payload, process.env.PASSWORD_JWT_SECRET, { expiresIn: "2h" });
}

async function sendResetPasswordToken(destinationEmail, token){
    var email = {
        Destination: {
            ToAddresses: [destinationEmail]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: `<h1>Forgot Password</h1>. <br>Hello, we received a request to reset your password. 
                    To reset your password click <a href='${process.env.BASE_URL + 'resetPassword/' + token}'>here</a>.`
                }
            },
            Subject: {
                Charset: 'UTF-8',
                Data: 'Account activation'
            }
        },
        Source: process.env.SENDER_EMAIL, /* required */
        ReplyToAddresses: [
            process.env.SENDER_EMAIL,
            /* more items */
        ],
    };

    aws.config.update({region: 'us-west-2'});
    await new aws.SES({apiVersion: '2010-12-01'}).sendEmail(email).promise();
}