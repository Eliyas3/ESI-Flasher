import React, { useState } from 'react';
import { 
  X, 
  Settings2, 
  Plus, 
  FileJson, 
  Download, 
  Upload, 
  Check, 
  Trash2, 
  Layers, 
  Cpu 
} from 'lucide-react';
import { BoardFamily } from '../../types/hardware';
import { FirmwareManifest } from '../../types/firmware';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPublishedFirmware?: (manifest: FirmwareManifest) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onAddPublishedFirmware,
}) => {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [board, setBoard] = useState<BoardFamily>('ESP32');
  const [chip, setChip] = useState('ESP32');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Sensors' | 'IoT' | 'Robotics' | 'Wireless' | 'Utilities' | 'Demos'>('IoT');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [flashAddress, setFlashAddress] = useState('0x10000');
  const [fileName, setFileName] = useState('firmware.bin');

  const [manifestJson, setManifestJson] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form');
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleExportJson = () => {
    const manifest: FirmwareManifest = {
      name: name || 'ESI Custom Project',
      version: version || '1.0.0',
      board: board,
      chip: chip,
      description: description || 'Custom built firmware manifest',
      category: category,
      releaseNotes: releaseNotes || 'Initial release',
      images: [
        {
          path: fileName || 'firmware.bin',
          address: flashAddress || '0x10000',
        },
      ],
    };

    const str = JSON.stringify(manifest, null, 2);
    setManifestJson(str);
    setActiveTab('json');
  };

  const handleDownloadManifest = () => {
    const manifestStr = manifestJson || JSON.stringify({
      name, version, board, chip, description, category,
      images: [{ path: fileName, address: flashAddress }]
    }, null, 2);

    const blob = new Blob([manifestStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(name || 'firmware').toLowerCase().replace(/\s+/g, '_')}_manifest.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToCatalog = () => {
    if (!name.trim()) {
      alert('Please provide a project name.');
      return;
    }

    const manifest: FirmwareManifest = {
      name,
      version,
      board,
      chip,
      description,
      category,
      releaseNotes,
      images: [
        {
          path: fileName,
          address: flashAddress,
        },
      ],
    };

    if (onAddPublishedFirmware) {
      onAddPublishedFirmware(manifest);
    }

    setStatusMsg('Firmware manifest published to local catalog successfully!');
    setTimeout(() => {
      setStatusMsg('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Firmware Manifest Administration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Publish and configure verified firmware catalog metadata
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-100 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('form')}
            className={`pb-2.5 font-semibold border-b-2 transition-all ${
              activeTab === 'form'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Metadata Form
          </button>
          <button
            onClick={() => { handleExportJson(); setActiveTab('json'); }}
            className={`pb-2.5 font-semibold border-b-2 transition-all ${
              activeTab === 'json'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            JSON Manifest Schema
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {statusMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{statusMsg}</span>
            </div>
          )}

          {activeTab === 'form' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ESP32 Environmental Weather Station"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Board
                </label>
                <select
                  value={board}
                  onChange={(e) => {
                    const b = e.target.value as BoardFamily;
                    setBoard(b);
                    setChip(b);
                    setFlashAddress(b === 'ESP32' ? '0x10000' : '0x0000');
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="ESP32">ESP32</option>
                  <option value="ESP8266">ESP8266</option>
                  <option value="Arduino">Arduino AVR</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Specific Chip / Model
                </label>
                <input
                  type="text"
                  placeholder="e.g. ESP32-S3 or ATmega328P"
                  value={chip}
                  onChange={(e) => setChip(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  placeholder="1.0.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="IoT">IoT</option>
                  <option value="Wireless">Wireless</option>
                  <option value="Sensors">Sensors</option>
                  <option value="Robotics">Robotics</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Demos">Demos</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Binary Filename
                </label>
                <input
                  type="text"
                  placeholder="app.bin or firmware.hex"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  SPI Flash Address Offset
                </label>
                <input
                  type="text"
                  placeholder="0x10000"
                  value={flashAddress}
                  onChange={(e) => setFlashAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe hardware features, sensors connected, pinouts, and functionality..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Release Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Added BLE GATT server and power optimizations"
                  value={releaseNotes}
                  onChange={(e) => setReleaseNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                Edit or inspect standard ESI Manifest JSON. This JSON schema is fully compatible with REST backends, Supabase, and Firebase storage:
              </p>
              <textarea
                rows={12}
                value={manifestJson}
                onChange={(e) => setManifestJson(e.target.value)}
                className="w-full p-4 rounded-xl bg-slate-950 text-cyan-300 font-mono text-xs border border-slate-800 focus:outline-none"
              />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleDownloadManifest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Manifest JSON</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveToCatalog}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Publish Firmware</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
