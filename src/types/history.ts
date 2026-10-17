export interface FlashHistoryItem {
  id: string;
  timestamp: number;
  dateStr: string;
  board: string;
  chip: string;
  firmwareName: string;
  version: string;
  result: 'success' | 'error';
  durationSec: number;
  sizeBytes: number;
  details?: string;
}
