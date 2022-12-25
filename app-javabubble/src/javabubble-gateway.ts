import axios from "axios";
import { AccountInput } from "./model";

export async function fetchAccounts(): Promise<AccountInput[]> {
  if (!process.env.FOLLOWING_FEED) {
    throw Error("Could not find environment variable [FOLLOWING_FEED]");
  }

  const allAccounts = (
    await axios.get(process.env.FOLLOWING_FEED, {
      maxContentLength: parseInt(
        process.env.FOLLOWING_FEED_MAX_CONTENT_LENGTH_BYTES || "5000000"
      ),
    })
  ).data as AccountInput[];

  return allAccounts;
}
