const jwt = require('jsonwebtoken');
var aws = require('aws-sdk');
var docClient = new aws.DynamoDB.DocumentClient();


exports.handler = async (event) => {
    try {
        const token = event.pathParameters.validationToken;
        const decodedJWT = jwt.verify(token, process.env.EMAIL_JWT_SECRET);
        const sub = decodedJWT.sub;
        const data = await docClient.get({
            TableName: process.env.TABLE_NAME,
            Key: { Email: sub }
        }).promise();

        const user = data.Item;

        console.log(user);
        console.log("Confirmed", user.Confirmed);

        if (user.Confirmed == 0 && user.verificationToken == decodedJWT.verificationToken) {
            user.Confirmed = 1;

            await docClient.put({
                TableName: process.env.TABLE_NAME,
                Item: user
            }).promise();

            return {
                statusCode: 200,
                body: createSignInToken(user) //JWT is sent to API caller
            };
        } else {
            return {
                statusCode: 422,
                body: "This link has already been used or is expired."
            }
        }
    } catch (error) {
        console.error(error);
        return {
            statusCode: error.statusCode ||  500,
            body: error.message || "Something went wrong"
        };
    }
}

const createSignInToken = (user) => {
    const payload = {
        sub: user.email,
        iss: "lambda-auth",
        aud: "lambda-auth"
    };

    //A JWT is created with the payload content
    return jwt.sign(payload, process.env.USER_JWT_SECRET, { expiresIn: "1d" })
}