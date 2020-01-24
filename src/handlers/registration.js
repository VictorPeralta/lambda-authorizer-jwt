const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
var aws = require('aws-sdk');
var docClient = new aws.DynamoDB.DocumentClient();


exports.register = async (event, context) => {
    try {
        const user = JSON.parse(event.body);

        const params = {
            TableName: "LambdaAuthUserTable",
            Item: {
                "Email": user.email,
                "Password": await bcrypt.hash(user.password, 8)
            }
        };

        await docClient.put(params).promise();

        var email = {
            Destination: {
                ToAddresses: [user.email]
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: `<h1>Welcome to lifeboard</h1>. <br>Hello ${user.email}, please confirm your address by clicking <a href='#'>here</a>`
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Account activation'
                }
            },
            Source: 'peralta.r.victor@gmail.com', /* required */
            ReplyToAddresses: [
                'peralta.r.victor@gmail.com',
                /* more items */
            ],
        };

        aws.config.update({region: 'us-west-2'});
        var sendPromise = await new aws.SES({apiVersion: '2010-12-01'}).sendEmail(email).promise();
        console.log(sendPromise.MessageId)

        const payload = {
            sub: user.email,
            iss: "test-app"
        }

        //A JWT is created with the payload content
        const token = jwt.sign(payload, "secret")

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