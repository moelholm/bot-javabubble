import {
  AccountEntity,
  hasAccountWithFediverseHandle,
} from "./account-repository";
import { AccountInput } from "./model";

const MAX_TOOT_LENGTH = 500;

function accountInputHasSafeName(account: AccountInput): boolean {
  const nameRegEx = /^[\p{Letter}\s\-\d\.\(\)']+$/u;
  return !!(account.name || "").match(nameRegEx);
}

function accountInputHasSafeFediverseHandle(account: AccountInput): boolean {
  const fediverseHandleRegEx = /^@?[\w\d']+@[\w\.]+$/u;
  return !!(account.fediverse || "").match(fediverseHandleRegEx);
}

function accountInputSafe(account: AccountInput): boolean {
  return (
    accountInputHasSafeName(account) && accountInputHasSafeFediverseHandle(account)
  );
}
function accountInputUnsafe(account: AccountInput): boolean {
  return !accountInputSafe(account);
}

function retainSafeInputFediverseAccounts(accounts: AccountInput[]) {
  const unsafeAccountsInput = accounts.filter(accountInputUnsafe);
  if (unsafeAccountsInput.length > 0) {
    console.error(
      "Discarding one or more accounts because they don't meet the allowlisting rules",
      JSON.stringify(unsafeAccountsInput)
    );
  }
  return accounts.filter(accountInputSafe);
}

function mapToAccountInputWithNormalizedFediverseAccountName(account: AccountInput): AccountInput {
  const fediverse = account.fediverse.toLowerCase();
  return {
    ...account,
    fediverse : fediverse.startsWith('@') ? fediverse : `@${fediverse}`,
  };
}

export async function sanitizeAccounts(allAccounts: AccountInput[]): Promise<AccountInput[]> {
  const fediverseAccounts = allAccounts.filter(({ fediverse }) => fediverse);

  const fediverseAccountsSafeInput =
    retainSafeInputFediverseAccounts(fediverseAccounts)
    .map(mapToAccountInputWithNormalizedFediverseAccountName);

  console.log(
    `Data fetched. allAccounts: [${allAccounts.length}]` +
      `, fediverseAccounts: [${fediverseAccounts.length}]` +
      `, fediverseAccountsSafeInput: [${fediverseAccountsSafeInput.length}]`
  );

  return fediverseAccountsSafeInput;
}

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

