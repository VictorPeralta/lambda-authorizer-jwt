# Lambda authorizers with JWT

A small project to test Lambda authorizers with JWTs, user registration and access to an API endpoint with authorization.

## App flow
### User Registration

```
1.Client Request <--> 2.API Gateway <--> 3.Register lambda
```
1. Client posts to API with new user details.
2. API Gateway passes request to lambda.
3. Register lambda returns JWT to client through API Gateway.


### Endpoint with authorization

```
1.Client Request --> 2.API Gateway <--> 3.Lambda authorizer
                          ^
                          |
                          v
                  4. Lambda Function

```

1. Client calls API endpoint, includes JWT in Authorization token.
2. API Gateway passes Authorization token on to Lambda Authorizer function
3. Authorizer function validates the token and if valid, adds information about the user to the context object and returns a policy allowing access to the lambda function to API Gateway.
3. API Gateway analyses the policy, grants or denies access to the lambda function, and passes on the request.
4. Lambda function is executed and returns results to client through API Gateway.




## Deploy to AWS 

To deploy to AWS, run the following commands. Replace BUCKET_NAME for an existing S3 bucket and STACK_NAME for the stack name.

```
> sam build

> sam package --template-file .\template.yml --s3-bucket BUCKET_NAME
\ --output-template-file packaged.yaml

>  sam deploy --template-file .\packaged.yaml --stack-name STACK_NAME
\ --capabilities CAPABILITY_IAM
```

## To-do
- Add DynamoDB user store
  - Add DynamoDB to template.yml
  - RegisterFunction: Add users to DB
- Configure CICD
  - Set up CodePipeline
  - Set up CodeBuild
    - Set build stages in buildspec.yml
- Add tests
- Add email notifications on user sign up


## Resources
[Introducing custom authorizers in Amazon API Gateway
](https://aws.amazon.com/blogs/compute/introducing-custom-authorizers-in-amazon-api-gateway/)