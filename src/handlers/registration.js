const jwt = require('jsonwebtoken');

exports.register = async (event, context) => {
    try {
        const { user } = JSON.parse(event.body);
        const payload = {
            sub: user,
            iss: "test-app",
            userID: "1234-1234"
        }

        //A JWT is created with the payload content
        const token = jwt.sign(payload, "secret")

        return {
            statusCode: 200,
            body: JSON.stringify(token) //JWT is sent to API caller
        };

    } catch (error) {
        return error;
    }


}