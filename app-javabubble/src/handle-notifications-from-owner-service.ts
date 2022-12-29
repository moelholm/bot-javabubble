import {
  dismissNotification,
  readNotifications,
  sendToot,
} from "./mastodon-gateway";
import { getParameters } from "./ssm-gateway";

async function handleNotification(notification: string) {
  console.log(`Handling notification: [${notification}]`);
  const [command, ...args] = notification.split(" ");
  console.log(`Resolved to command [${command}] and arguments ${JSON.stringify(args)}`);

  if (command === "echo") {
    return `Echoing: command [${command}], arguments ${JSON.stringify(args)}`;
  }

  return `Available commands: [echo]`;
}

export async function handleNotificationsFromOwner() {
  console.log("Bot woke up");

  // Load configuration from SSM parameter store
  process.env = { ...process.env, ...(await getParameters()) };

  // Read notifications from owner
  const notifications = await readNotifications();
  for (const notification of notifications) {
    // Handle the notification
    const response = await handleNotification(notification.status.contentText);

    // Dismiss the notification (remove it from the owner's timeline)
    await dismissNotification(notification);

    // Reply with a private message to the owner
    await sendToot({
      visibility: "private",
      status: `${process.env.MASTODON_BOT_OWNER} ${response}`,
    });
  }

  console.log("Bot going to sleep");
}
