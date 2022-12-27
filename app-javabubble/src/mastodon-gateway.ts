import axios from "axios";

export type Toot = {
  visibility: "public" | "unlisted" | "private" | "direct";
  status: string;
};

export async function getAccountDisplayName(fediverseAccountName: string) {
  const [_, username, hostname] = fediverseAccountName.split("@");
  try {
    const htmlResponse = (await axios.get(`https://${hostname}/@${username}`)).data;
    const htmlTitle = htmlResponse.match(/<title>(.*?) [\(\|].*?<\/title>/)[1];
    const displayName = htmlTitle
      .replace(/:.*:/, "") // remove markdown emojis
      .replace(/[^\p{Letter}\s\-\d\.\(\)']/ug, "") // remove non-letters
      .trim();
    return displayName;
  } catch (error) {
    console.error(error);
    return "jane/john doe";
  }
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
