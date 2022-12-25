import { DynamoDB } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const dynamoDbClient = new DynamoDB({ endpoint: process.env.DDB_ENDPOINT });
const documentClient = DynamoDBDocumentClient.from(dynamoDbClient);

export type AccountEntity = {
  fediverse: string;
  name: string;
  createdDateTime: string;
  createdDateTimeEpoch: number;

  lastAnnouncedDateTime: string;
  lastAnnouncedDateTimeEpoch: number;
  timesAnnounced: number;

  itemSource: string;
};

export async function insertAccount(account: AccountEntity) {
  console.log(`Adding ${account.name} - ${account.fediverse}`);
  return documentClient.send(
    new PutCommand({
      TableName: process.env.DDB_TABLE,
      Item: {
        FediverseHandle: account.fediverse,
        FullName: account.name,
        CreatedDateTime: account.createdDateTime,
        CreatedDateTimeEpoch: account.createdDateTimeEpoch,
        
        LastAnnouncedDateTime: account.lastAnnouncedDateTime,
        LastAnnouncedDateTimeEpoch: account.lastAnnouncedDateTimeEpoch,
        TimesAnnounced: account.timesAnnounced,

        ItemSource: account.itemSource,
      },
    })
  );
}

export async function updateAccountAnnouncementStatistics(fediverseHandle: string) {
  console.log(`Updating [${fediverseHandle}]`);  
  const now = new Date();
  return documentClient.send(
    new UpdateCommand({
      TableName: process.env.DDB_TABLE,
      Key: {
        FediverseHandle: fediverseHandle,
      },
      UpdateExpression: 'ADD TimesAnnounced :timesAnnouncedAdd SET LastAnnouncedDateTimeEpoch = :lastAnnouncedDateTimeEpoch, LastAnnouncedDateTime = :lastAnnouncedDateTime',

      ExpressionAttributeValues: {
        ':timesAnnouncedAdd': 1,
        ':lastAnnouncedDateTime': now.toISOString(),
        ':lastAnnouncedDateTimeEpoch': now.getTime(),
      }
    })
  );
}

export async function getAccountsSortedByLastAnnouncedDateTime(howMany: number, itemSource: string, scanIndexForward = true) {
  const fediverseHandles = await (
    await documentClient.send(
      new QueryCommand({
        TableName: process.env.DDB_TABLE,
        IndexName: process.env.DDB_LAST_ANNOUNCED_INDEX,
        Limit: howMany,
        ExpressionAttributeNames: {
          "#FediverseHandle": 'FediverseHandle',
        },        
        ExpressionAttributeValues: {
          ":s": itemSource,
        },
        KeyConditionExpression: "ItemSource = :s",
        ScanIndexForward: scanIndexForward,
        ProjectionExpression: "#FediverseHandle"
      })
    )
  )?.Items?.map(({ FediverseHandle }) => FediverseHandle) || [];

  const result = [];
  for (const fediverseHandle of fediverseHandles) {
    const account = await getAccountByFediverseHandle(fediverseHandle);
    if (account == null) {
      throw Error('illegal state')
    }
    result.push(account);
  }
  return result;
}

export async function getAccountByFediverseHandle(fediverseHandle: string) {
  const record = (
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

  return record ? {
    fediverse: record.FediverseHandle,
    name: record.FullName,
    createdDateTime: record.CreatedDateTime,
    createdDateTimeEpoch: record.CreatedDateTimeEpoch,
    lastAnnouncedDateTime: record.LastAnnouncedDateTime,
    lastAnnouncedDateTimeEpoch: record.LastAnnouncedDateTimeEpoch,
    timesAnnounced: record.TimesAnnounced,
    itemSource: record.ItemSource,
  } as AccountEntity : null;
}

export async function hasAccountWithFediverseHandle(fediverseHandle: string) {
  return !!(await getAccountByFediverseHandle(fediverseHandle));
}
