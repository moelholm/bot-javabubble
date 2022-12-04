import axios from "axios";

export type Toot = {
  visibility: "public" | "unlisted" | "private" | "direct";
  status: string;
};

export async function sendToot(toot: Toot) {
  if (process.env.MASTODON_SEND_MODE?.toLowerCase() !== "enabled") {
    console.log(
      `Mastodon send mode is disabled. Ignoring sending toot: ${JSON.stringify(
        toot
      )}`
    );
    return null;
  }

  console.log(`Sending toot: ${JSON.stringify(toot)}`);
  return axios.post(
    `https://${process.env.MASTODON_HOST}/api/v1/statuses`,
    toot,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MASTODON_API_KEY}`,
      },
    }
  );
}
