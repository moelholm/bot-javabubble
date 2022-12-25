import {
  AccountEntity,
  hasAccountWithFediverseHandle,
} from "./account-repository";
import { AccountInput } from "./model";

const MAX_TOOT_LENGTH = 500;

export async function retainNewFediverseAccounts(accounts: AccountInput[]) {
  const newFediverseAccounts: AccountInput[] = [];
  for (const account of accounts) {
    const exists = await hasAccountWithFediverseHandle(account.fediverse);
    if (!exists) {
      newFediverseAccounts.push(account);
    }
  }
  return newFediverseAccounts;
}

export function generateBatches(
  fediverseAccounts: AccountEntity[],
  createTootMessageText: (fediverseAccounts: AccountEntity[]) => string
) {
  const exceedsMaxTootLength = (fediverseAccounts: AccountEntity[]) =>
    createTootMessageText(fediverseAccounts).length >= MAX_TOOT_LENGTH;

  const batches: AccountEntity[][] = [];
  let currentBatch: AccountEntity[] = [];

  for (let i = 0; i < fediverseAccounts.length; i++) {
    if (exceedsMaxTootLength([...currentBatch, fediverseAccounts[i]])) {
      batches.push([...currentBatch]);
      currentBatch = [];
    }
    currentBatch.push(fediverseAccounts[i]);
  }

  if (currentBatch.length > 0) {
    batches.push([...currentBatch]);
  }
  console.log(`Generated [${batches.length}] batches`);
  return batches;
}
