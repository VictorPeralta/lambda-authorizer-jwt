const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log(event)
    try {
        console.log(event.requestContext)
        const body = {
            userlist: await getUsers(),
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

const getUsers = async () => {
    const params = {
        TableName: process.env.TABLE_NAME
    };
    return await docClient.scan(params).promise();
}

