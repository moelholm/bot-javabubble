import { AccountInput } from "./javabubble-gateway";
import { sendToot } from "./mastodon-gateway";
import { AccountEntity, insertAccount } from "./account-repository";
import { fetchNewFediverseAccounts, generateBatches } from "./account-service";
import { getParameters } from "./ssm-gateway";

function createTootMessageText(newFediverseAccounts: AccountInput[]) {
  const accountsString = newFediverseAccounts
    .map((a) => `\n👋🏼 ${a.name} - ${a.fediverse}`)
    .join("");

  return (
    `Added to javabubble.org:` +
    `\n${accountsString}` +
    `\n\nFollow ${
      newFediverseAccounts.length > 1 ? "these accounts" : "this account"
    } if you are interested in #java and/or #jvm subjects.` +
    ` More updates like this? Follow me or #JavaBubbleOrgNewAccountsAdded` +
    `\n\nSource: #javabubble (javabubble.org)` +
    `\nBotdev: ${process.env.MASTODON_BOT_OWNER}`
  );
}

export async function announceNewAccounts() {
  console.log("Bot woke up");

  // Load configuration from SSM parameter store
  process.env = { ...process.env, ...(await getParameters()) };

  // Fetch latest list of *new* fediverse people from javabubble.org
  const newFediverseAccounts = await fetchNewFediverseAccounts();

  if (newFediverseAccounts.length > 0) {
    console.log(`Posting update since new accounts was detected`);

    // Convert the input to entities
    const now = new Date();
    const newFediverseAccountEntities = newFediverseAccounts.map(
      (account) =>
        ({
          ...account,
          createdDateTime: now.toISOString(),
          createdDateTimeEpoch: now.getTime(),
          lastAnnouncedDateTime: now.toISOString(),
          lastAnnouncedDateTimeEpoch: now.getTime(),
          itemSource: process.env.ITEM_SOURCE || '',
          timesAnnounced: 0,
        } as AccountEntity)
    );

    // Announce new fediverse accounts in batches
    const batches: AccountEntity[][] = generateBatches(
      newFediverseAccountEntities,
      createTootMessageText
    );

    console.log(`Processing [${batches.length}] batches`);
    for (let i = 0; i < batches.length; i++) {
      // Log progress
      console.log(
        `Batch [${i + 1} of ${batches.length}], accounts [${batches[i].length}]`
      );
      // Store the new accounts
      for (const account of batches[i]) {
        await insertAccount(account);
      }
      // Send toot
      await sendToot({
        visibility: "public",
        status: createTootMessageText(batches[i]),
      });
    }
  }

  console.log("Bot going to sleep");
}
