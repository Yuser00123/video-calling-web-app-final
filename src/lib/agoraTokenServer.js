export async function getAgoraToken(channelName, uid, role = 'user') {
  try {
    const response = await fetch('/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelName, uid, role }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch token');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Agora token:', error);
    throw error;
  }
}