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

    const fn = new lambda.Function(this, "javabubblebotfunction", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "build/lambda.handler",
      timeout: cdk.Duration.seconds(45),
      code: lambda.Code.fromAsset("../app-javabubble/lambda-function.zip"),
      environment: {
        SSM_PATH: '/APPLICATION/BOT-JAVABUBBLE',
        DDB_TABLE: table.tableName,
      },
    });
    
    table.grantReadWriteData(fn);
    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ssm:GetParametersByPath'],
      resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/APPLICATION/BOT-JAVABUBBLE`],
    }));

    const rule = new events.Rule(this, 'javabubblebotrule', {
      schedule: events.Schedule.cron({minute: "0", hour: "*/2"}),
      targets: [new targets.LambdaFunction(fn)],
    });
  }
}
