/**
 * Sends a notification to a Slack channel using a webhook URL
 * @param message The message to send to Slack
 * @param webhookUrl The Slack webhook URL (should be stored in environment variables)
 * @returns Promise<boolean> Whether the message was sent successfully
 */
export async function sendSlackNotification(
  message: string,
  webhookUrl: string = process.env.SLACK_WEBHOOK_URL || ""
): Promise<boolean> {
  if (!webhookUrl) {
    console.error("Slack webhook URL is not configured");
    return false;
  }

  try {
    // Use node-fetch in server environment, window.fetch in client environment
    const fetchFn =
      typeof window === "undefined"
        ? (await import("node-fetch")).default
        : window.fetch;

    const response = await fetchFn(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: message,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to send Slack notification: ${response.statusText}`
      );
    }

    return true;
  } catch (error) {
    console.error("Error sending Slack notification:", error);
    return false;
  }
}
