const jwt = require('jsonwebtoken');
var aws = require('aws-sdk');
var docClient = new aws.DynamoDB.DocumentClient();


exports.handler = async (event) => {
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
    
    if(user.Confirmed == 0){
        user.Confirmed = 1;

        await docClient.put({
            TableName: process.env.TABLE_NAME,
            Item: user
        }).promise();
    }else{
        return{
            statusCode: 200,
            body: "Email has already been confirmed."
        }
    }


    return {
        statusCode: 200,
        body: JSON.stringify(user) //JWT is sent to API caller
    };}