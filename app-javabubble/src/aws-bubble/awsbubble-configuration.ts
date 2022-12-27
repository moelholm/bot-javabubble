import { getAccountsSortedByLastAnnouncedDateTime } from "../account-repository";
import { BubbleConfiguration } from "../bubble-configuration-registry";
import { fetchAccounts } from "./awsbubble-gateway";
import {
  newAccountsMessage,
  oldAccountsMessage,
} from "./awsbubble-toot-factory";

export const AwsBubbleSourceConfiguration: BubbleConfiguration = {
  fetchAccountsFunction: fetchAccounts,
  newAccountsMessageFunction: newAccountsMessage,
  oldAccountsMessageFunction: oldAccountsMessage,
  getAccountsFromDatabase: () =>
    getAccountsSortedByLastAnnouncedDateTime(5, process.env.ITEM_SOURCE || ""),
};
