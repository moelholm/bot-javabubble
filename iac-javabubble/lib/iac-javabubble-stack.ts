import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { BillingMode } from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";


export class IacJavabubbleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "javabubbletable", {
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
      nonKeyAttributes: [
        'FediverseHandle',
        'LastAnnouncedDateTime',
      ]
    });

    const announceNewAccountsLambdaFunction = new lambda.Function(this, "javabubblebotfunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "build/lambda.announceNewAccounts",
      timeout: cdk.Duration.seconds(45),
      code: lambda.Code.fromAsset("../app-javabubble/lambda-function.zip"),
      environment: {
        SSM_PATH: '/APPLICATION/BOT-JAVABUBBLE',
        DDB_TABLE: table.tableName,
        DDB_LAST_ANNOUNCED_INDEX: gsiName,
      },
    });
    
    table.grantReadWriteData(announceNewAccountsLambdaFunction);
    announceNewAccountsLambdaFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParametersByPath'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/APPLICATION/BOT-JAVABUBBLE`],
    }));

    const rule = new events.Rule(this, 'javabubblebotrule', {
      schedule: events.Schedule.cron({minute: "0", hour: "*/2"}),
      targets: [new targets.LambdaFunction(announceNewAccountsLambdaFunction)],
    });
  }
}
