import { fetchAccounts, AccountInput } from "./javabubble-gateway";
import {
  AccountEntity,
  hasAccountWithFediverseHandle,
} from "./account-repository";

const MAX_TOOT_LENGTH = 500;

async function retainNewFediverseAccounts(accounts: AccountInput[]) {
  const newFediverseAccounts: AccountInput[] = [];
  for (const account of accounts) {
    const exists = await hasAccountWithFediverseHandle(account.fediverse);
    if (!exists) {
      newFediverseAccounts.push(account);
    }
  }
  return newFediverseAccounts;
}

export async function fetchNewFediverseAccounts() {
  const allAccounts = await fetchAccounts();
  const newFediverseAccounts = await retainNewFediverseAccounts(allAccounts);
  console.log(
    `New accounts in the fediverse: [${newFediverseAccounts.length}]`
  );
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
