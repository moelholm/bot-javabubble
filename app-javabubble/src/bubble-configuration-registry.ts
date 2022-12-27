import { AccountInput } from "./model";
import { AwsBubbleSourceConfiguration } from "./aws-bubble/awsbubble-configuration";
import { JavaBubbleSourceConfiguration } from "./java-bubble/javabubble-configuration";
import { AccountEntity } from "./account-repository";

const bubbleConfigurationRegistry: Record<string, BubbleConfiguration> = {
  "javabubble.org": JavaBubbleSourceConfiguration,
  "github.com/gunnargrosch": AwsBubbleSourceConfiguration,
};

export type BubbleConfiguration = {
  fetchAccountsFunction: () => Promise<AccountInput[]>;
  newAccountsMessageFunction: (fediverseAccounts: AccountInput[]) => string;
  oldAccountsMessageFunction: (fediverseAccounts: AccountEntity[]) => string;
  getAccountsFromDatabase: () => Promise<AccountEntity[]>;
};

export const getBubbleConfiguration = (): BubbleConfiguration => {
  console.log(
    `Loading bubble source configuration for: [${process.env.ITEM_SOURCE}]`
  );

  if (!process.env.ITEM_SOURCE) {
    throw Error("Could not find environment variable [ITEM_SOURCE]");
  }

  const result = bubbleConfigurationRegistry[process.env.ITEM_SOURCE];
  if (!result) {
    throw Error(
      `Could not find configuration for [${process.env.ITEM_SOURCE}]`
    );
  }

  return result;
};
