import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { BillingMode } from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";

export class IacAwsbubbleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    //
    // DynamoDB table and Global Secondary Index (GSI)
    //
    const table = new dynamodb.Table(this, "awsbubbletable", {
      partitionKey: {
        name: "FediverseHandle",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });
    const gsiName = "LastAnnouncedDateTimeEpoch-index";
    table.addGlobalSecondaryIndex({
      indexName: gsiName,
      partitionKey: {
        name: "ItemSource",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "LastAnnouncedDateTimeEpoch",
        type: dynamodb.AttributeType.NUMBER,
      },
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ["FediverseHandle", "LastAnnouncedDateTime"],
    });
    //
    // Function: Wakes up and toots about 'new' accounts
    //
    const announceNewAccountsLambdaFunction = this.createFunction(
      "awsbubblebotfunction",
      "build/announce-new-accounts-service.announceNewAccounts",
      table,
      gsiName
    );
    const newAccountsRule = new events.Rule(this, "awsbubblebotrule", {
      schedule: events.Schedule.cron({ minute: "30", hour: "*/2" }),
      targets: [new targets.LambdaFunction(announceNewAccountsLambdaFunction)],
    });
    //
    // Function: Wakes up and toots about 'old' accounts
    //
    const announceOldAccountsLambdaFunction = this.createFunction(
      "awsbubblebotfunctionold",
      "build/announce-old-accounts-service.announceOldAccounts",
      table,
      gsiName
    );
    const oldAccountsRule = new events.Rule(this, "awsbubblebotruleold", {
      schedule: events.Schedule.cron({ hour: "10", minute: "10" }),
      targets: [new targets.LambdaFunction(announceOldAccountsLambdaFunction)],
    });
    //
    // Function: Owner notification handler
    //
    const handleNotificationsFromOwnerLambdaFunction = this.createFunction(
      "awsbubblebotfunctionhandlenotifications",
      "build/handle-notifications-from-owner-service.handleNotificationsFromOwner",
      table,
      gsiName
    );
  }

  createFunction(
    id: string,
    handler: string,
    table: dynamodb.Table,
    gsiName: string
  ) {
    const lambdaFunction = new lambda.Function(this, id, {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: handler,
      timeout: cdk.Duration.seconds(45),
      code: lambda.Code.fromAsset("../app-javabubble/lambda-function.zip"),
      environment: {
        SSM_PATH: "/APPLICATION/BOT-AWSBUBBLE",
        DDB_TABLE: table.tableName,
        DDB_LAST_ANNOUNCED_INDEX: gsiName,
      },
    });
    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["ssm:GetParametersByPath"],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/APPLICATION/BOT-AWSBUBBLE`,
        ],
      })
    );
    table.grantReadWriteData(lambdaFunction);
    return lambdaFunction;
  }
}
