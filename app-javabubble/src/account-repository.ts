import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const dynamoDbClient = new DynamoDB({ endpoint: process.env.DDB_ENDPOINT });
const documentClient = DynamoDBDocumentClient.from(dynamoDbClient);

export type AccountEntity = {
  fediverse: string;
  name: string;
  createdDateTime: string;
};

export async function insertAccount(account: AccountEntity) {
  return documentClient.send(
    new PutCommand({
      TableName: process.env.DDB_TABLE,
      Item: {
        FediverseHandle: account.fediverse,
        FullName: account.name,
        CreatedDateTime: account.createdDateTime,
      },
    })
  );
}

export async function getAccountByFediverseHandle(fediverseHandle: string) {
  return (
    await documentClient.send(
      new QueryCommand({
        TableName: process.env.DDB_TABLE,
        ExpressionAttributeValues: {
          ":s": fediverseHandle,
        },
        KeyConditionExpression: "FediverseHandle = :s",
      })
    )
  )?.Items?.[0];
}

export async function hasAccountWithFediverseHandle(fediverseHandle: string) {
  return !!(await getAccountByFediverseHandle(fediverseHandle));
}
