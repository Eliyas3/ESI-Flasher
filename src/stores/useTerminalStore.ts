import { useState, useEffect } from 'react';
import { ConsoleLogEntry, LogLevel } from '../types/serial';

// Simple pub-sub store for high-performance terminal logs without unnecessary re-renders
type Listener = () => void;

interface TerminalState {
  logs: ConsoleLogEntry[];
  monitorText: string;
  isMonitorConnected: boolean;
  isMonitorPaused: boolean;
  autoScroll: boolean;
  activeTab: 'console' | 'monitor' | 'history';
  monitorBaud: number;
}

const state: TerminalState = {
  logs: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Eliyas Science Info Flasher v1.0 initialized.',
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      level: 'debug',
      message: 'Web Serial hardware driver layer ready. Ready to connect.',
    },
  ],
  monitorText: '',
  isMonitorConnected: false,
  isMonitorPaused: false,
  autoScroll: true,
  activeTab: 'console',
  monitorBaud: 115200,
};

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

export const terminalStore = {
  getState: () => state,

  addLog: (level: LogLevel, message: string) => {
    const entry: ConsoleLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    };
    state.logs = [...state.logs.slice(-500), entry]; // keep last 500 entries
    notify();
  },

  clearLogs: () => {
    state.logs = [];
    notify();
  },

  appendMonitor: (chunk: string) => {
    if (state.isMonitorPaused) return;
    state.monitorText = (state.monitorText + chunk).slice(-15000); // keep last 15k characters
    notify();
  },

  clearMonitor: () => {
    state.monitorText = '';
    notify();
  },

  setMonitorConnected: (connected: boolean) => {
    state.isMonitorConnected = connected;
    notify();
  },

  setMonitorPaused: (paused: boolean) => {
    state.isMonitorPaused = paused;
    notify();
  },

  setAutoScroll: (autoScroll: boolean) => {
    state.autoScroll = autoScroll;
    notify();
  },

  setActiveTab: (tab: 'console' | 'monitor' | 'history') => {
    state.activeTab = tab;
    notify();
  },

  setMonitorBaud: (baud: number) => {
    state.monitorBaud = baud;
    notify();
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useTerminalStore() {
  const [, setTick] = useState(0);

  useEffect(() => {
    return terminalStore.subscribe(() => {
      setTick(t => t + 1);
    });
  }, []);

  return {
    ...state,
    addLog: terminalStore.addLog,
    clearLogs: terminalStore.clearLogs,
    appendMonitor: terminalStore.appendMonitor,
    clearMonitor: terminalStore.clearMonitor,
    setMonitorConnected: terminalStore.setMonitorConnected,
    setMonitorPaused: terminalStore.setMonitorPaused,
    setAutoScroll: terminalStore.setAutoScroll,
    setActiveTab: terminalStore.setActiveTab,
    setMonitorBaud: terminalStore.setMonitorBaud,
  };
}
