const jwt = require('jsonwebtoken');

exports.handler = async(event, context) => {
    //JWT is stored in event.authorizationToken for lambda authorizers. API caller has JWT in Authorization Token
        console.log('Token', event.authorizationToken);
        const decodedJWT = decodeToken(event.authorizationToken);
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
};

function decodeToken(bearerToken) {
    const token = getToken(bearerToken);
    try {
        const decodedJWT = jwt.verify(token, process.env.USER_JWT_SECRET);
        console.log("Decoded", decodedJWT);
        return decodedJWT;
    }
    catch (error) {
        //If no token is found or any other error is received, return unauthorized response
        throw new Error("Unauthorized");
    }

}

function getToken(bearerToken) {
    var parts = bearerToken.split(' ');
    if (parts.length === 2) {
        var scheme = parts[0];
        var credentials = parts[1];

        if (/^Bearer$/i.test(scheme)) {
            return credentials;
        }
        else {
            throw new Error("Token not in bearer format")
        }
    }
}
