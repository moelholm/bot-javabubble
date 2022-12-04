import axios from "axios";

function accountInputHasSafeName(account: AccountInput): boolean {
  const nameRegEx = /^[\p{Letter}\s\-\d\.\(\)']+$/u;
  return !!(account.name || "").match(nameRegEx);
}

function accountInputHasSafeFediverseHandle(account: AccountInput): boolean {
  const fediverseHandleRegEx = /^@[\w\d']+@[\w\.]+$/u;
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
      "Discarding one or more accounts input because it contains characters that are not allowlisted",
      JSON.stringify(unsafeAccountsInput)
    );
  }
  return accounts.filter(accountInputSafe);
}

export type AccountInput = {
  fediverse: string;
  name: string;
};

export async function fetchAccounts(): Promise<AccountInput[]> {
  if (!process.env.FOLLOWING_FEED) {
    throw Error('Could not find environment variable [FOLLOWING_FEED]');
  }

  const allAccounts = (
    await axios.get(process.env.FOLLOWING_FEED, {
      maxContentLength: parseInt(process.env.FOLLOWING_FEED_MAX_CONTENT_LENGTH_BYTES || '5000000'),
    })
  ).data as AccountInput[];

  const fediverseAccounts = allAccounts.filter(({ fediverse }) => fediverse);

  const fediverseAccountsSafeInput =
    retainSafeInputFediverseAccounts(fediverseAccounts)
    .map(a => ({ ...a, fediverse: a.fediverse.toLowerCase() }));

  console.log(
    `Data fetched. allAccounts: [${allAccounts.length}]` +
      `, fediverseAccounts: [${fediverseAccounts.length}]` +
      `, fediverseAccountsSafeInput: [${fediverseAccountsSafeInput.length}]`
  );

  return fediverseAccountsSafeInput;
}
