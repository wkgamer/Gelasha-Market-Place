export async function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  const validTokens = tokens.filter(
    (t) => t && t.startsWith("ExponentPushToken[")
  );
  if (validTokens.length === 0) return;

  const messages = validTokens.map((to) => ({
    to,
    sound: "default" as const,
    title,
    body,
    data: data ?? {},
  }));

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error("Failed to send push notifications:", err);
  }
}
