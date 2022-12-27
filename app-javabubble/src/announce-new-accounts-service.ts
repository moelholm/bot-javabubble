import { sendToot } from "./mastodon-gateway";
import { AccountEntity, insertAccount } from "./account-repository";
import {
  generateBatches,
  retainNewFediverseAccounts,
  sanitizeAccounts,
} from "./account-service";
import { getParameters } from "./ssm-gateway";
import { getBubbleSourceConfiguration } from "./bubblesource-configuration-registry";

export async function announceNewAccounts() {
  console.log("Bot woke up");

  // Load configuration from SSM parameter store
  process.env = { ...process.env, ...(await getParameters()) };

  // Load bubble source configuration
  const { fetchAccountsFunction, newAccountsMessageFunction } =
    getBubbleSourceConfiguration();

  // Fetch latest list of *new* fediverse people
  const allAccounts = await fetchAccountsFunction();
  const allSanitizedAccounts = await sanitizeAccounts(allAccounts);
  const newFediverseAccounts = await retainNewFediverseAccounts(
    allSanitizedAccounts
  );
  console.log(
    `New accounts in the fediverse: [${newFediverseAccounts.length}]`
  );

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
          itemSource: process.env.ITEM_SOURCE || "",
          timesAnnounced: 0,
        } as AccountEntity)
    );

    // Announce new fediverse accounts in batches
    const batches: AccountEntity[][] = generateBatches(
      newFediverseAccountEntities,
      newAccountsMessageFunction
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
        status: newAccountsMessageFunction(batches[i]),
      });
    }
  }

  console.log("Bot going to sleep");
}
