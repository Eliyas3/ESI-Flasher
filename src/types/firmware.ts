import { BoardFamily } from './hardware';

export interface FirmwareImageItem {
  id: string;
  name: string;
  data: Uint8Array;
  address: number;
  addressHex: string;
  size: number;
  sha256?: string;
  isCustom?: boolean;
}

export interface FirmwareManifestImage {
  path: string;
  address: string;
  description?: string;
}

export interface FirmwareManifest {
  name: string;
  version: string;
  board: BoardFamily;
  chip: string;
  description: string;
  category?: string;
  releaseNotes?: string;
  images: FirmwareManifestImage[];
}

export interface PinConnection {
  componentPin: string;
  boardPin: string;
  wireColor: 'red' | 'black' | 'yellow' | 'green' | 'blue' | 'orange' | 'purple' | 'white';
  signalType: 'Power 5V' | 'Power 3.3V' | 'Ground' | 'Digital Input' | 'Digital Output' | 'Analog' | 'PWM';
  description?: string;
}

export interface ProjectWiringGuide {
  title: string;
  summary: string;
  componentsNeeded: string[];
  connections: PinConnection[];
  baudRate?: number;
  operationTips?: string[];
}

export interface PublishedFirmware {
  id: string;
  name: string;
  board: BoardFamily;
  chip: string;
  version: string;
  description: string;
  category: 'Sensors' | 'IoT' | 'Robotics' | 'Wireless' | 'Utilities' | 'Demos';
  updatedDate: string;
  sizeStr: string;
  isFavorite?: boolean;
  downloads?: number;
  releaseNotes?: string;
  wiringGuide?: ProjectWiringGuide;
  images: {
    name: string;
    address: number;
    sizeBytes: number;
    binaryData?: Uint8Array;
    url?: string;
  }[];
}

