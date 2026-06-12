export const architectureClient = {
  getServiceStatuses: async (): Promise<Record<string, string>> => {
    const res = await fetch('http://localhost:8085/admin/services/status');
    if (!res.ok) {
      throw new Error('Failed to fetch service statuses');
    }
    return res.json();
  },
  toggleServiceState: async (name: string, action: 'start' | 'stop') => {
    const res = await fetch(`http://localhost:8085/admin/services/${name}/state`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      throw new Error('Failed to toggle service state');
    }
    return res.json();
  },
};
