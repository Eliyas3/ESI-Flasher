import { useState, useEffect } from 'react';
import { FlashHistoryItem } from '../types/history';
import { getAllHistory, saveHistoryItem, clearAllHistory } from '../utils/storage';

export function useHistoryStore() {
  const [history, setHistory] = useState<FlashHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshHistory = async () => {
    try {
      const items = await getAllHistory();
      setHistory(items);
    } catch (e) {
      console.warn('Failed to fetch history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  const addHistory = async (item: Omit<FlashHistoryItem, 'id'>) => {
    const newItem: FlashHistoryItem = {
      ...item,
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    };
    await saveHistoryItem(newItem);
    await refreshHistory();
  };

  const clearHistory = async () => {
    await clearAllHistory();
    setHistory([]);
  };

  return {
    history,
    loading,
    addHistory,
    clearHistory,
    refreshHistory,
  };
}
