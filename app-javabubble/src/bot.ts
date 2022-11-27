import * as dotenv from "dotenv";
dotenv.config();

import { AccountInput } from "./javabubble-gateway";
import { toot } from "./mastodon-gateway";
import { insertAccount } from "./account-repository";
import { fetchNewFediverseAccounts } from "./account-service";
import { getParameters } from "./ssm-gateway";

function createTootMessageText(newFediverseAccounts: AccountInput[]) {
  const accountsString = newFediverseAccounts
    .map((a) => `\n👋🏼 ${a.name} - ${a.fediverse}`)
    .join('');

  return (
    `Added to javabubble.org:` +
    `\n${accountsString}` +
    `\n\nFollow ${newFediverseAccounts.length > 1 ? 'these accounts': 'this account'} if you are interested in #java and/or #jvm subjects.` +
    ` More updates like this? Follow me or #JavaBubbleOrgNewAccountsAdded` +
    `\n\nSource: #javabubble (javabubble.org)` +
    `\nBotdev: ${process.env.MASTODON_BOT_OWNER}`
  );
}

export async function wakeUp() {
  console.log("Bot woke up");

  // Load configuration from SSM parameter store
  process.env = { ...process.env, ...(await getParameters()) };

  // Fetch latest list of *new* fediverse people from javabubble.org
  const newFediverseAccounts = await fetchNewFediverseAccounts();

  if (newFediverseAccounts.length > 0) {
    console.log(`Posting update since new accounts was detected`);

    // Store the new accounts
    const createdDateTime = new Date().toISOString();
    for (const account of newFediverseAccounts) {
      console.log(`Storing ${account.name} - ${account.fediverse}`);
      await insertAccount({ ...account, createdDateTime });
    }

    // Announce new fediverse accounts, in batches if necessary
    const chunkSize = 5;
    for (let i = 0; i < newFediverseAccounts.length; i += chunkSize) {
      const chunk = newFediverseAccounts.slice(i, i + chunkSize);

      const message = createTootMessageText(chunk);
      await toot({
        visibility: "public",
        status: message,
      });
    }
  }

  console.log("Bot going to sleep");
}
