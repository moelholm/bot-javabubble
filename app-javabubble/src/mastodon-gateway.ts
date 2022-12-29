import axios from "axios";

export type Toot = {
  visibility: "public" | "unlisted" | "private" | "direct";
  status: string;
};

export type Notification = {
  id: string;
  type:
    | "mention"
    | "reblog"
    | "favourite"
    | "follow"
    | "poll"
    | "follow_request";
  created_at: string;
  account: {
    id: string;
    username: string;
    acct: string;
    display_name: string;
  };
  status: {
    id: string;
    created_at: string;
    visibility: "public" | "unlisted" | "private" | "direct";
    content: string;
    contentText: string; // Self-invented property (not part of the Mastodon API)
  };
};

export async function getAccountDisplayName(fediverseAccountName: string) {
  const [_, username, hostname] = fediverseAccountName.split("@");
  try {
    const htmlResponse = (await axios.get(`https://${hostname}/@${username}`))
      .data;
    const htmlTitle = htmlResponse.match(/<title>(.*?) [\(\|].*?<\/title>/)[1];
    const displayName = htmlTitle
      .replace(/\&quot\;/g, "\"") // preserve quotes (people seem to fancy that)
      .replace(/\&.*?\;/, "") // remove all other html entities
      .replace(/:.*:/, "") // remove markdown emojis (greedy is intentional)
      .replace(/[^\p{Letter}\s\-\d\.\(\)'"]/gu, "") // remove non-letters
      .trim();
    return displayName;
  } catch (error) {
    console.error(error);
    return "jane/john doe";
  }
}

export async function dismissNotification(notification: Notification) {
  await axios.post(
    `https://${process.env.MASTODON_HOST}/api/v1/notifications/${notification.id}/dismiss`,
    {},
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MASTODON_API_KEY}`,
      },
    }
  );
}

export async function readNotifications(limit = 10) {
  // TODO Server side filtering...
  const response = (
    await axios.get(
      `https://${process.env.MASTODON_HOST}/api/v1/notifications?types=mention&limit=${limit}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MASTODON_API_KEY}`,
        },
      }
    )
  ).data as Notification[];
  // ... to replace this client side filtering below
  const accountOwner = process.env.MASTODON_BOT_OWNER?.startsWith("@")
    ? process.env.MASTODON_BOT_OWNER?.substring(1)
    : process.env.MASTODON_BOT_OWNER;
  return response
    .filter((notification) => notification.account.acct === accountOwner)
    .filter((notification) => notification.type === "mention")
    .map((notification) => {
      const message = notification.status.content.match(/.*>\s+(.*)<.*>$/);
      notification.status.contentText = message ? message[1] : "";
      return notification;
    });
}

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
