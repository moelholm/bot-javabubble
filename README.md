# bot-javabubble

Implementation of the "Java Bubble" Mastodon bot.

## Architecture

The "bot" is implemented as an AWS Lambda function. It wakes up once in a while - as indicated 
by a signal from an Event Bridge Rule - and does the following:

- Downloads the latest and greatest list of Java accounts from javabubble.org
- Stores them in a local DynamoDB table
- Sends out a toot* with the "new" accounts

### Configuration

The lambda function loads it's configuration from AWS SSM parameter path 
`/APPLICATION/BOT-JAVABUBBLE/**`. This is where it expects to find a proper Mastodon API key, 
location of the javabubble source, bot author mastadon handle, and so on.

In local development mode all this info can be supplied as ordinary OS environment variables.

### Development 

The bot is developed as a normal NPM project. The code here is based on TypeScript and when 
run locally it maintains data in a local DynamoDB table. No connectivity to AWS - and also no 
connectivity to any Mastodon server.

The bot infrastructure code (lambda, dynamodb, etc) is developed as a normal AWS CDK project.

### Relase and deployment to production

There's no CI/CD pipeline yet. So releasing and deployment is a bit manual... basically a 
2-step process:

1) Generate a Lambda ZIP file from the [app-javabubble](./app-javabubble) directory
2) Deploy it with CDK from the [iac-javabubble](./iac-javabubble) directory

* or more; there is a limit on the number of characters allowed in a toot.. so a long list of 
new accounts may be split up into multiple distinct toots.
