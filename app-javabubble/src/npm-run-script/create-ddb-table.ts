//
//
// Used for LOCAL DynamoDB development only (the real table definition is in AWS CDK IaC)
//
//
import * as dotenv from "dotenv";
dotenv.config();

import { DynamoDB } from "@aws-sdk/client-dynamodb";

const dynamoDbClient = new DynamoDB({ endpoint: process.env.DDB_ENDPOINT });

async function createTable() {
  const data = await dynamoDbClient.createTable({
    TableName: process.env.DDB_TABLE,
    KeySchema: [{ AttributeName: "FediverseHandle", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "FediverseHandle", AttributeType: "S" }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  });
  console.log("Successfully created table: ", data);
}

async function createIndex() {
  const data = await dynamoDbClient.updateTable({
    TableName: process.env.DDB_TABLE,
    AttributeDefinitions: [
      { AttributeName: 'ItemSource', AttributeType: 'S' },
      { AttributeName: 'LastAnnouncedDateTimeEpoch', AttributeType: 'N' }
    ],
    GlobalSecondaryIndexUpdates: [
      {
        Create: {
          IndexName: process.env.DDB_LAST_ANNOUNCED_INDEX,
          KeySchema: [
            { AttributeName: 'ItemSource', KeyType: 'HASH' },
            { AttributeName: 'LastAnnouncedDateTimeEpoch', KeyType: 'RANGE' }
          ],
          Projection: {
            ProjectionType: 'INCLUDE',
            NonKeyAttributes: [
              'FediverseHandle',
              'LastAnnouncedDateTime',
            ]
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      }
    ]
  });
  console.log("Successfully created index: ", data);
}

async function main() {
  await createTable();
  await createIndex();
}

main();