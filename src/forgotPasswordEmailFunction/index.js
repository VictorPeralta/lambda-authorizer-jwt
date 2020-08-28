const jwt = require('jsonwebtoken');
var aws = require('aws-sdk');


exports.handler = async (event, context) => {
    try {
        const {email} = JSON.parse(event.body);
        console.log(email)
        const token = await createPasswordResetToken(email);
        await sendResetPasswordToken(email, token);

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

//Todo: include hash substring to compare if password has changed already
//Todo: Add expiration
function createPasswordResetToken(email){
    const payload = {
        sub: email,
        iss: "test-app",
    };

    //A JWT is created with the payload content
    return jwt.sign(payload, process.env.PASSWORD_JWT_SECRET);
}

async function sendResetPasswordToken(email, token){
    var email = {
        Destination: {
            ToAddresses: [email]
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