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