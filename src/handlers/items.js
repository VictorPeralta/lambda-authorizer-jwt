
exports.getItem = async (event) => {
    console.log(event)
    try {
        console.log(event.requestContext)
        const body = {
            id: 42,
            name: "Banana",
            color: "Yellow",
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
