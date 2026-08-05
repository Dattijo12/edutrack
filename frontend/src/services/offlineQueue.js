import resultService from './resultService';

const QUEUE_KEY = 'edutrack_offline_score_queue';

export const offlineQueue = {
  getQueue() {
    try {
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  enqueue(scorePayload) {
    const queue = this.getQueue();
    queue.push({
      ...scorePayload,
      queuedAt: new Date().toISOString(),
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
  },

  async syncQueue() {
    const queue = this.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;
    const remaining = [];

    for (const item of queue) {
      try {
        await resultService.createResult(item);
        synced++;
      } catch (err) {
        console.error('Failed to sync item:', item, err);
        failed++;
        remaining.push(item);
      }
    }

    if (remaining.length > 0) {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    } else {
      this.clearQueue();
    }

    return { synced, failed };
  }
};

// Add auto sync when browser comes online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Online detected. Auto-syncing offline score queue...');
    offlineQueue.syncQueue();
  });
}
