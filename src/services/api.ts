import { AppState } from '../types';

const STORAGE_KEY = 'tyssa_lab_data';

// Simulate network latency for future backend readiness
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  async fetchState(): Promise<AppState | null> {
    await delay(500); // Simulated network request
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing state from storage', e);
        return null;
      }
    }
    return null;
  },

  async saveState(state: AppState): Promise<void> {
    await delay(300); // Simulated network request
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
};
