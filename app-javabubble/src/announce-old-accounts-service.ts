import { sendToot } from "./mastodon-gateway";
import {
  AccountEntity,
  updateAccountAnnouncementStatistics,
} from "./account-repository";
import { getParameters } from "./ssm-gateway";
import { generateBatches } from "./account-service";
import { getBubbleConfiguration } from "./bubble-configuration-registry";

export async function announceOldAccounts() {
  console.log("Bot woke up");

  // Load configuration from SSM parameter store
  process.env = { ...process.env, ...(await getParameters()) };

  // Load bubble source configuration
  const { oldAccountsMessageFunction, getAccountsFromDatabase } =
    getBubbleConfiguration();

  // Fetch some accounts that haven't been announced for a while
  const fediverseAccounts = await getAccountsFromDatabase();

  // Split them into batches and send out toots with them
  const batches: AccountEntity[][] = generateBatches(
    fediverseAccounts,
    oldAccountsMessageFunction
  );

  console.log(`Processing [${batches.length}] batches`);
  for (let i = 0; i < batches.length; i++) {
    // Log progress
    console.log(
      `Batch [${i + 1} of ${batches.length}], accounts [${batches[i].length}]`
    );
    // Update statistics in db first (avoid a potential forever-send-same-toot problem)
    for (let fediverseAccount of batches[i]) {
      await updateAccountAnnouncementStatistics(fediverseAccount.fediverse);
    }
    // Send the toot
    await sendToot({
      visibility: "public",
      status: oldAccountsMessageFunction(batches[i]),
    });
  }

  console.log("Bot going to sleep");
}
