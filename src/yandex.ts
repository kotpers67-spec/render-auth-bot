export async function getYandexUserData(code: string, clientId: string, clientSecret: string) {
  const tokenRes = await fetch('https://oauth.yandex.ru/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Yandex token exchange failed: ${errText}`);
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch('https://login.yandex.ru/info?format=json', {
    headers: { Authorization: `OAuth ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    throw new Error('Failed to fetch Yandex user profile');
  }

  return await userRes.json();
}
