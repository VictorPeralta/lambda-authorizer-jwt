const jwt = require('jsonwebtoken');

exports.authorize = async (event, context) => {
    //JWT is stored in event.authorizationToken for lambda authorizers. API caller has JWT in Authorization Token
    try {
        const decodedJWT = jwt.verify(event.authorizationToken, "secret");

        const policyDocument = {
            Version: '2012-10-17', //Always use this version, specified by AWS
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: 'Allow', // Allow | Deny
                Resource: event.methodArn //ARN of resource
            }]
        };

        //Return user (token subject) as a variable, can access in lambda as event.requestContext.user
        context.userEmail = decodedJWT.sub;

        return {
            principalId: decodedJWT.sub,
            policyDocument,
            context
        };
        
    } catch (error) {
        //If no token is found or any other error is received, return unauthorized response
        throw new Error("Unauthorized");   
    }
};