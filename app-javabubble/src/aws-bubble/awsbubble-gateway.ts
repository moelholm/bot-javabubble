import axios from "axios";
import { AccountInput, UNKOWN_USER_NAME } from "../model";

export async function fetchAccounts(): Promise<AccountInput[]> {
  if (!process.env.FOLLOWING_FEEDS) {
    throw Error("Could not find environment variable [FOLLOWING_FEEDS]");
  }

  const feeds = process.env.FOLLOWING_FEEDS.split(",");

  const requestConfig = {
    maxContentLength: parseInt(
      process.env.FOLLOWING_FEED_MAX_CONTENT_LENGTH_BYTES || "5000000"
    ),
  };

  const csvFeedPromises = feeds.map(async (feed) =>
    (await axios.get(feed, requestConfig)).data
      .replaceAll("\r\n", "\n")
      .split("\n")
      .slice(1)
  );

  const allCsvLines = (await Promise.all(csvFeedPromises)).flat(1) as string[];

  const fediverseAccounts = allCsvLines
    .map((line) => line.replace(/\,.*/, "")) // retain first column only
    .filter((line) => line) // remove empty lines
    .filter((val, idx, arr) => arr.indexOf(val) === idx) // unique items only
    .map((fediverse) => ({ fediverse, name: UNKOWN_USER_NAME }));

  return fediverseAccounts;
}
