import { fetchAccounts, AccountInput } from "./javabubble-gateway";
import { hasAccountWithFediverseHandle } from "./account-repository";

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
  // Fetch latest and greates list of fediverse accounts from javabubble.org
  const allAccounts = await fetchAccounts();
  // Not all of them are in fediverse, so retain only those that are
  const newFediverseAccounts = await retainNewFediverseAccounts(allAccounts);
  console.log(`New accounts in the fediverse: [${newFediverseAccounts.length}]`);
  // Success!
  return newFediverseAccounts;
}
