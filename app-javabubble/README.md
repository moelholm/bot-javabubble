# app-javabubble

Source code for the "Java Bubble" Mastodon bot.

## Local development

Development in 'local development' mode is safe:
- database actions happens on your local environment only
- the toot functionality will by default NOT send anything (also: you'll need a proper access_token for it to ever succeed)

That being said: Follow the next 2 steps to be up and running...

### 1 of 2: Launch dynamodb and initialize it for the app

    npm run tool:dynamodb-local
    npm run tool:dynamodb-init

### 2 of 2: Run app

    npm run start:dev

### Bonus: Browse/edit the database

Browse and/or hack in the (local) db (requires [dynamodb-admin])

    npm run tool:dynamodb-admin

## Create a release

In lack of a proper CI/CD pipeline (for now):

    npm run build:lambda

This results in a zip file - which can then be deployed with CDK using the IaC 👍🏻

## Reference
- [mastodon api doc](https://docs.joinmastodon.org/methods/statuses/)
- [dynamodb-admin](https://github.com/aaronshaf/dynamodb-admin)

## Todo

- Organize modules
- Repurpose account-service
- Make local launch less clunky