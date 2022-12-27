import { AccountInput } from "./model";
import { fetchAccounts as javaBubbleFetchAccounts } from "./java-bubble/javabubble-gateway";
import {
  newAccountsMessage as javaBubbleNewAccountsMessage,
  oldAccountsMessage as javaBubbleOldAccountsMessage,
} from "./java-bubble/javabubble-toot-factory";
import {
  AccountEntity,
  getAccountsSortedByLastAnnouncedDateTime,
} from "./account-repository";

const bubbleSourceConfigurationRegistry: Record<
  string,
  BubbleSourceConfiguration
> = {
  "javabubble.org": {
    fetchAccountsFunction: javaBubbleFetchAccounts,
    newAccountsMessageFunction: javaBubbleNewAccountsMessage,
    oldAccountsMessageFunction: javaBubbleOldAccountsMessage,
    getAccountsFromDatabase: () =>
      getAccountsSortedByLastAnnouncedDateTime(
        5,
        process.env.ITEM_SOURCE || ""
      ),
  },
};

export type BubbleSourceConfiguration = {
  fetchAccountsFunction: () => Promise<AccountInput[]>;
  newAccountsMessageFunction: (fediverseAccounts: AccountInput[]) => string;
  oldAccountsMessageFunction: (fediverseAccounts: AccountEntity[]) => string;
  getAccountsFromDatabase: () => Promise<AccountEntity[]>;
};

export const getBubbleSourceConfiguration = (): BubbleSourceConfiguration => {
  console.log(
    `Loading bubble source configuration for: [${process.env.ITEM_SOURCE}]`
  );

  if (!process.env.ITEM_SOURCE) {
    throw Error("Could not find environment variable [ITEM_SOURCE]");
  }

  const result = bubbleSourceConfigurationRegistry[process.env.ITEM_SOURCE];
  if (!result) {
    throw Error(
      `Could not find configuration for [${process.env.ITEM_SOURCE}]`
    );
  }

  return result;
};
