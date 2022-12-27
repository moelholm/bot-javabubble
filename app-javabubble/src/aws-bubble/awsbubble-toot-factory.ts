import { AccountEntity } from "../account-repository";
import { AccountInput } from "../model";

export function oldAccountsMessage(fediverseAccounts: AccountEntity[]): string {
  const accountsString = fediverseAccounts
    .map((a) => `\n👋🏼 ${a.name} - ${a.fediverse}`)
    .join("");
  return (
    `Awesome #aws savvy accounts to follow:` +
    `\n${accountsString}` +
    `\n\nMore updates like this? Follow me or #AwsBubbleAccountsRefresher` +
    `\n\nSource: #awsbubble (github.com/gunnargrosch/mastodon-lists)` +
    `\nBotdev: ${process.env.MASTODON_BOT_OWNER}`
  );
}

export function newAccountsMessage(fediverseAccounts: AccountInput[]): string {
  const accountsString = fediverseAccounts
    .map((a) => `\n👋🏼 ${a.name} - ${a.fediverse}`)
    .join("");
  return (
    `Added to github.com/gunnargrosch/mastodon-lists:` +
    `\n${accountsString}` +
    `\n\nFollow ${
      fediverseAccounts.length > 1 ? "these accounts" : "this account"
    } if you are interested in #aws subjects.` +
    ` More updates like this? Follow me or #AwsBubbleNewAccountsAdded` +
    `\n\nSource: #awsbubble (github.com/gunnargrosch/mastodon-lists)` +
    `\nBotdev: ${process.env.MASTODON_BOT_OWNER}`
  );
}
