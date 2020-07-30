const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
var aws = require('aws-sdk');
var docClient = new aws.DynamoDB.DocumentClient();


exports.handler = async (event, context) => {
    try {
        console.log(event);
        const user = JSON.parse(event.body);
        console.log(user);
        const token = await registerUserGetToken(user);

        return {
            statusCode: 200,
            body: JSON.stringify(token) //JWT is sent to API caller
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: error.message
        };
    }
}

const registerUserGetToken = async (user) => {
    try {
        user.verificationToken = createEmailVerificationToken(user)
        await addUserToDB(user);  
        await sendRegistrationEmail(user);
        return signToken(user);
        
    } catch (error) {
        throw error;
    }   
}

function createEmailVerificationToken(user){
    const payload = {
        sub: user.email,
        iss: "test-app",
        
    }

    //A JWT is created with the payload content
    return jwt.sign(payload, process.env.EMAIL_JWT_SECRET)
}

const addUserToDB = async (user) => {
    const params = {
        TableName: process.env.TABLE_NAME,
        Item: {
            "Email": user.email,
            "Password": await bcrypt.hash(user.password, 8),
            "Confirmed": 0
        }
    };
    await docClient.put(params).promise();
}

const sendRegistrationEmail = async (user, verificationToken) => {
    var email = {
        Destination: {
            ToAddresses: [user.email]
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: `<h1>Welcome</h1>. <br>Hello ${user.email}, please confirm your address by clicking 
                    <a href='${process.env.BASE_URL + 'confirmEmail/' + user.verificationToken}'>here</a>`
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

const signToken = (user) => {
    const payload = {
        sub: user.email,
        iss: "test-app"
    }

    //A JWT is created with the payload content
    return jwt.sign(payload, process.env.USER_JWT_SECRET)
}
