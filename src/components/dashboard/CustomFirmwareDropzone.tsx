import React, { useState, useRef } from 'react';
import { UploadCloud, FileCode2, Trash2, Hash, Layers, Plus, Check } from 'lucide-react';
import { FirmwareImageItem } from '../../types/firmware';
import { formatBytes, formatHexAddress, parseHexOrDec } from '../../utils/formatters';
import { calculateSHA256 } from '../../flasher/checksum';
import { BoardFamily } from '../../types/hardware';

interface CustomFirmwareDropzoneProps {
  boardFamily: BoardFamily;
  images: FirmwareImageItem[];
  onImagesChange: (images: FirmwareImageItem[]) => void;
  onClear: () => void;
}

export const CustomFirmwareDropzone: React.FC<CustomFirmwareDropzoneProps> = ({
  boardFamily,
  images,
  onImagesChange,
  onClear,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultOffset = boardFamily === 'ESP32' ? 0x10000 : 0x0000;

  const processFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newItems: FirmwareImageItem[] = [...images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      
      if (ext !== 'bin' && ext !== 'hex') {
        alert(`Unsupported file "${file.name}". Please provide a .bin or .hex firmware file.`);
        continue;
      }

      const buffer = await file.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const sha256 = await calculateSHA256(uint8);

      // Determine smart default address based on name
      let addr = defaultOffset;
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('bootloader')) {
        addr = 0x1000;
      } else if (lowerName.includes('partition') || lowerName.includes('pt')) {
        addr = 0x8000;
      } else if (lowerName.includes('ota') || lowerName.includes('app')) {
        addr = 0x10000;
      }

      newItems.push({
        id: 'cust_' + Date.now() + '_' + i,
        name: file.name,
        data: uint8,
        address: addr,
        addressHex: formatHexAddress(addr),
        size: uint8.length,
        sha256: sha256,
        isCustom: true,
      });
    }

    onImagesChange(newItems);
    setIsProcessing(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
  };

  const handleAddressChange = (index: number, newHex: string) => {
    const updated = [...images];
    try {
      const val = parseHexOrDec(newHex);
      if (!isNaN(val)) {
        updated[index].address = val;
        updated[index].addressHex = newHex;
        onImagesChange(updated);
      }
    } catch {}
  };

  const handleRemoveImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    if (updated.length === 0) {
      onClear();
    } else {
      onImagesChange(updated);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 scale-[0.99]'
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500/80 bg-white dark:bg-slate-800/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".bin,.hex"
          multiple={boardFamily === 'ESP32'}
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/50 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {isProcessing ? 'Processing firmware files...' : 'Drag & drop firmware file here'}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              or <span className="text-blue-600 dark:text-blue-400 font-semibold underline">click to browse</span> from your computer
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono">
              .bin (ESP32/ESP8266)
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono">
              .hex (Arduino AVR)
            </span>
          </div>

          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            🔒 Firmware stays on your device. Never uploaded to any server.
          </p>
        </div>
      </div>

      {/* Selected Firmware File(s) List */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            <span>Configured Firmware Images ({images.length})</span>
            <button
              onClick={onClear}
              className="text-red-500 hover:text-red-600 text-xs flex items-center gap-1 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove All
            </button>
          </div>

          <div className="space-y-2">
            {images.map((img, idx) => (
              <div
                key={img.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-subtle"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-100/70 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileCode2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {img.name}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{formatBytes(img.size)}</span>
                      {img.sha256 && (
                        <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[180px]" title={img.sha256}>
                          SHA: {img.sha256.slice(0, 12)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address Configuration */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Offset:
                    </span>
                    <input
                      type="text"
                      value={img.addressHex}
                      onChange={(e) => handleAddressChange(idx, e.target.value)}
                      className="w-20 font-mono text-xs bg-transparent border-0 text-blue-600 dark:text-blue-400 focus:outline-none font-bold"
                      placeholder="0x10000"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
