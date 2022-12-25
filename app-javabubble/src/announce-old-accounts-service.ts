import { sendToot } from "./mastodon-gateway";
import {
  AccountEntity,
  getAccountsSortedByLastAnnouncedDateTime,
  updateAccountAnnouncementStatistics,
} from "./account-repository";
import { getParameters } from "./ssm-gateway";
import { generateBatches } from "./account-service";

function createTootMessageText(fediverseAccounts: AccountEntity[]) {
  const accountsString = fediverseAccounts
    .map((a) => `\n👋🏼 ${a.name} - ${a.fediverse}`)
    .join("");
  return (
    `Awesome #java / #jvm savvy accounts to follow:` +
    `\n${accountsString}` +
    `\n\nMore updates like this? Follow me or #JavaBubbleOrgAccountsRefresher` +
    `\n\nSource: #javabubble (javabubble.org)` +
    `\nBotdev: ${process.env.MASTODON_BOT_OWNER}`
  );
}

export async function announceOldAccounts() {
  console.log("Bot woke up");

  // Load configuration from SSM parameter store
  process.env = { ...process.env, ...(await getParameters()) };

  // Fetch some accounts that haven't been announced for a while
  const fediverseAccounts = await getAccountsSortedByLastAnnouncedDateTime(5, process.env.ITEM_SOURCE || '');

  // Split them into batches and send out toots with them
  const batches: AccountEntity[][] = generateBatches(
    fediverseAccounts,
    createTootMessageText
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
      status: createTootMessageText(batches[i]),
    });
  }

  console.log("Bot going to sleep");
}
