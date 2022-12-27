import { AccountEntity } from "../account-repository";
import { AccountInput } from "../model";

export function oldAccountsMessage(fediverseAccounts: AccountEntity[]): string {
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

export function newAccountsMessage(fediverseAccounts: AccountInput[]): string {
  const accountsString = fediverseAccounts
    .map((a) => `\n👋🏼 ${a.name} - ${a.fediverse}`)
    .join("");

  return (
    `Added to javabubble.org:` +
    `\n${accountsString}` +
    `\n\nFollow ${
      fediverseAccounts.length > 1 ? "these accounts" : "this account"
    } if you are interested in #java and/or #jvm subjects.` +
    ` More updates like this? Follow me or #JavaBubbleOrgNewAccountsAdded` +
    `\n\nSource: #javabubble (javabubble.org)` +
    `\nBotdev: ${process.env.MASTODON_BOT_OWNER}`
  );
}
