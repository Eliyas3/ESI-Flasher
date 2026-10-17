import { useState, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  BoardFamily, 
  ConnectionState, 
  DeviceInfo, 
  FlashProgress, 
  FlashSettings, 
  FlashState, 
  TargetChip,
  ArduinoBoard
} from '../types/hardware';
import { FirmwareImageItem, PublishedFirmware } from '../types/firmware';
import { Flasher, FlasherLogger } from '../hardware/FlasherInterface';
import { ESP32Flasher } from '../hardware/ESP32Flasher';
import { ESP8266Flasher } from '../hardware/ESP8266Flasher';
import { ArduinoAVRFlasher } from '../hardware/ArduinoAVRFlasher';
import { DemoFlasher } from '../hardware/DemoFlasher';
import { terminalStore } from './useTerminalStore';
import { saveHistoryItem } from '../utils/storage';

export function useFlasherStore() {
  const [boardFamily, setBoardFamily] = useState<BoardFamily>('ESP32');
  const [selectedChip, setSelectedChip] = useState<TargetChip>('ESP32');
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [flashState, setFlashState] = useState<FlashState>('idle');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  
  const [selectedImages, setSelectedImages] = useState<FirmwareImageItem[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<{
    id?: string;
    name: string;
    version: string;
    source: 'library' | 'custom';
  } | null>(null);

  const [flashProgress, setFlashProgress] = useState<FlashProgress | null>(null);
  const [flashSettings, setFlashSettings] = useState<FlashSettings>({
    eraseAll: false,
    baudRate: 921600, // fast baud rate for ESP32
    flashMode: 'keep',
    flashFreq: 'keep',
    flashSize: 'detect',
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [techDetails, setTechDetails] = useState<string | null>(null);
  const [showBootloaderHelp, setShowBootloaderHelp] = useState<boolean>(false);
  const [showTechModal, setShowTechModal] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  const activeFlasherRef = useRef<Flasher | null>(null);

  // Terminal logger adapter
  const logger: FlasherLogger = {
    log: (msg: string) => terminalStore.addLog('info', msg),
    info: (msg: string) => terminalStore.addLog('info', msg),
    success: (msg: string) => terminalStore.addLog('success', msg),
    warn: (msg: string) => terminalStore.addLog('warn', msg),
    error: (msg: string) => terminalStore.addLog('error', msg),
    debug: (msg: string) => terminalStore.addLog('debug', msg),
  };

  const createFlasher = useCallback((): Flasher => {
    if (isDemoMode) {
      return new DemoFlasher(logger);
    }
    if (boardFamily === 'ESP32') {
      return new ESP32Flasher(logger);
    } else if (boardFamily === 'ESP8266') {
      return new ESP8266Flasher(logger);
    } else {
      return new ArduinoAVRFlasher(logger, selectedChip as ArduinoBoard);
    }
  }, [isDemoMode, boardFamily, selectedChip]);

  const handleBoardFamilyChange = useCallback((family: BoardFamily) => {
    setBoardFamily(family);
    if (family === 'ESP32') {
      setSelectedChip('ESP32');
      setFlashSettings(prev => ({ ...prev, baudRate: 921600 }));
    } else if (family === 'ESP8266') {
      setSelectedChip('ESP8266');
      setFlashSettings(prev => ({ ...prev, baudRate: 460800 }));
    } else if (family === 'Arduino') {
      setSelectedChip('Arduino Uno (ATmega328P)');
      setFlashSettings(prev => ({ ...prev, baudRate: 115200 }));
    }
  }, []);

  const handleConnect = useCallback(async () => {
    setErrorMessage(null);
    setTechDetails(null);
    setConnectionState('connecting');

    try {
      const flasher = createFlasher();
      activeFlasherRef.current = flasher;

      const baudToUse = boardFamily === 'Arduino' && selectedChip === 'Arduino Nano (Old Bootloader)' 
        ? 57600 
        : 115200;

      const info = await flasher.connect(baudToUse);
      setDeviceInfo(info);
      setConnectionState('connected');
      terminalStore.addLog('success', `● Connected to ${info.chip} via ${info.adapter}`);
    } catch (err: any) {
      setConnectionState('error');
      activeFlasherRef.current = null;
      setDeviceInfo(null);

      const msg = err.message || String(err);
      setErrorMessage(msg);
      setTechDetails(err.stack || JSON.stringify(err, Object.getOwnPropertyNames(err), 2));

      // Trigger bootloader helper if connection or sync failed
      if (
        msg.toLowerCase().includes('sync') || 
        msg.toLowerCase().includes('timeout') ||
        msg.toLowerCase().includes('bootloader')
      ) {
        setShowBootloaderHelp(true);
      }
    }
  }, [createFlasher, boardFamily, selectedChip]);

  const handleDisconnect = useCallback(async () => {
    if (activeFlasherRef.current) {
      try {
        await activeFlasherRef.current.disconnect();
      } catch (e) {
        console.warn('Disconnect error:', e);
      }
    }
    activeFlasherRef.current = null;
    setDeviceInfo(null);
    setConnectionState('disconnected');
    setFlashState('idle');
    setFlashProgress(null);
  }, []);

  const selectPublishedFirmware = useCallback((fw: PublishedFirmware) => {
    // Automatically match board family & chip to selected firmware
    if (fw.board) {
      setBoardFamily(fw.board);
      if (fw.chip) {
        setSelectedChip(fw.chip as TargetChip);
      }
    }

    const images: FirmwareImageItem[] = fw.images.map((img, idx) => ({
      id: `${fw.id}-${idx}`,
      name: img.name,
      data: img.binaryData || new Uint8Array(0),
      address: img.address,
      addressHex: '0x' + img.address.toString(16).toUpperCase(),
      size: img.sizeBytes,
      isCustom: false,
    }));

    setSelectedImages(images);
    setSelectedMeta({
      id: fw.id,
      name: fw.name,
      version: fw.version,
      source: 'library',
    });

    terminalStore.addLog('info', `Firmware selected: ${fw.name} (${fw.version}) for ${fw.board}`);
  }, [setBoardFamily, setSelectedChip]);

  const setCustomImages = useCallback((images: FirmwareImageItem[], name = 'Custom Firmware') => {
    setSelectedImages(images);
    setSelectedMeta({
      name,
      version: 'User Build',
      source: 'custom',
    });
    terminalStore.addLog('info', `Custom firmware loaded: ${images.map(i => i.name).join(', ')}`);
  }, []);

  const clearSelectedFirmware = useCallback(() => {
    setSelectedImages([]);
    setSelectedMeta(null);
    setFlashState('idle');
    setFlashProgress(null);
  }, []);

  const handleFlash = useCallback(async () => {
    if (selectedImages.length === 0) {
      setErrorMessage('Select a firmware file before flashing.');
      return;
    }

    if (!activeFlasherRef.current || !activeFlasherRef.current.isConnected()) {
      setErrorMessage('No board connected. Please connect your board before flashing.');
      return;
    }

    setErrorMessage(null);
    setTechDetails(null);
    setFlashState('preparing');
    terminalStore.setActiveTab('console');

    const startTime = Date.now();
    const firmwareTitle = selectedMeta?.name || 'Custom Firmware';
    const firmwareVersion = selectedMeta?.version || '1.0';

    try {
      await activeFlasherRef.current.flash(
        selectedImages,
        flashSettings,
        (progress) => {
          setFlashProgress(progress);
          setFlashState('writing');
        }
      );

      setFlashState('success');
      const durationSec = Math.round((Date.now() - startTime) / 10) / 100;
      
      // Save history to IndexedDB
      await saveHistoryItem({
        id: 'hist_' + Date.now(),
        timestamp: Date.now(),
        dateStr: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        board: boardFamily,
        chip: deviceInfo?.chip || selectedChip,
        firmwareName: firmwareTitle,
        version: firmwareVersion,
        result: 'success',
        durationSec: durationSec,
        sizeBytes: selectedImages.reduce((acc, i) => acc + i.data.length, 0),
      });

      // Celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#38bdf8', '#10b981', '#6366f1'],
        });
      } catch {}

      terminalStore.addLog('success', `✓ Flash completed successfully in ${durationSec}s!`);
    } catch (err: any) {
      setFlashState('error');
      const msg = err.message || String(err);
      setErrorMessage(msg);
      setTechDetails(err.stack || JSON.stringify(err, null, 2));

      // Record failed flash in history
      await saveHistoryItem({
        id: 'hist_' + Date.now(),
        timestamp: Date.now(),
        dateStr: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        board: boardFamily,
        chip: deviceInfo?.chip || selectedChip,
        firmwareName: firmwareTitle,
        version: firmwareVersion,
        result: 'error',
        durationSec: Math.round((Date.now() - startTime) / 10) / 100,
        sizeBytes: selectedImages.reduce((acc, i) => acc + i.data.length, 0),
        details: msg,
      });

      terminalStore.addLog('error', `✕ Flash failed: ${msg}`);
    }
  }, [selectedImages, selectedMeta, flashSettings, boardFamily, deviceInfo, selectedChip]);

  const handleEraseOnly = useCallback(async () => {
    if (!activeFlasherRef.current || !activeFlasherRef.current.isConnected()) {
      setErrorMessage('No board connected.');
      return;
    }
    try {
      setFlashState('erasing');
      await activeFlasherRef.current.erase();
      setFlashState('idle');
      terminalStore.addLog('success', '✓ Flash erased.');
    } catch (err: any) {
      setFlashState('error');
      setErrorMessage(err.message || String(err));
    }
  }, []);

  const handleResetDevice = useCallback(async () => {
    if (!activeFlasherRef.current || !activeFlasherRef.current.isConnected()) return;
    try {
      await activeFlasherRef.current.reset();
      terminalStore.addLog('info', 'Board reset triggered.');
    } catch (e: any) {
      terminalStore.addLog('warn', `Reset error: ${e.message}`);
    }
  }, []);

  return {
    boardFamily,
    setBoardFamily: handleBoardFamilyChange,
    selectedChip,
    setSelectedChip,
    connectionState,
    flashState,
    deviceInfo,
    selectedImages,
    selectedMeta,
    flashProgress,
    flashSettings,
    setFlashSettings,
    isDemoMode,
    setIsDemoMode,
    errorMessage,
    techDetails,
    showBootloaderHelp,
    setShowBootloaderHelp,
    showTechModal,
    setShowTechModal,
    isAdminOpen,
    setIsAdminOpen,
    activeFlasher: activeFlasherRef.current,

    // Actions
    handleConnect,
    handleDisconnect,
    selectPublishedFirmware,
    setCustomImages,
    clearSelectedFirmware,
    handleFlash,
    handleEraseOnly,
    handleResetDevice,
  };
}
