import { getAccountsSortedByLastAnnouncedDateTime } from "../account-repository";
import { BubbleConfiguration } from "../bubble-configuration-registry";
import { fetchAccounts } from "./javabubble-gateway";
import {
  newAccountsMessage,
  oldAccountsMessage,
} from "./javabubble-toot-factory";

export const JavaBubbleSourceConfiguration: BubbleConfiguration = {
  fetchAccountsFunction: fetchAccounts,
  newAccountsMessageFunction: newAccountsMessage,
  oldAccountsMessageFunction: oldAccountsMessage,
  getAccountsFromDatabase: () =>
    getAccountsSortedByLastAnnouncedDateTime(5, process.env.ITEM_SOURCE || ""),
};
