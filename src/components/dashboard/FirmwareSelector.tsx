import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  Search,
  Check,
  Cpu,
  UploadCloud,
  FileCode2,
  Trash2,
  X,
  Copy,
  Info
} from 'lucide-react';
import { PublishedFirmware, FirmwareImageItem, PinConnection } from '../../types/firmware';
import { BoardFamily } from '../../types/hardware';
import { INITIAL_PUBLISHED_FIRMWARES } from '../../utils/sampleFirmwares';
import { formatBytes } from '../../utils/formatters';
import { calculateSHA256 } from '../../flasher/checksum';
import { soundEffects } from '../../utils/soundEffects';

interface FirmwareSelectorProps {
  boardFamily: BoardFamily;
  onSelectPublished: (fw: PublishedFirmware) => void;
  selectedFirmwareId?: string;
  selectedFirmwareName?: string;
  customImages: FirmwareImageItem[];
  onCustomImagesChange: (images: FirmwareImageItem[]) => void;
  onClearCustomImages: () => void;
}

export const FirmwareSelector: React.FC<FirmwareSelectorProps> = ({
  boardFamily,
  onSelectPublished,
  selectedFirmwareId,
  selectedFirmwareName,
  customImages,
  onCustomImagesChange,
  onClearCustomImages,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterFamily, setFilterFamily] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() => {
    let list: PublishedFirmware[] = [...INITIAL_PUBLISHED_FIRMWARES];
    try {
      const savedStr = localStorage.getItem('esi_custom_catalog');
      if (savedStr) {
        const saved = JSON.parse(savedStr);
        if (Array.isArray(saved)) {
          list = [...saved, ...list];
        }
      }
    } catch {
      // fallback
    }

    return list.filter(fw => {
      if (filterFamily !== 'all' && fw.board !== filterFamily) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return fw.name.toLowerCase().includes(q) || (fw.chip && fw.chip.toLowerCase().includes(q));
      }
      return true;
    });
  }, [filterFamily, search, dropdownOpen]);

  const selectedFw = useMemo(() => {
    if (!selectedFirmwareId) return null;
    return filtered.find(f => f.id === selectedFirmwareId) || null;
  }, [filtered, selectedFirmwareId]);

  // File handling
  const processFiles = async (files: FileList | File[]) => {
    setIsProcessing(true);
    const newItems: FirmwareImageItem[] = [...customImages];
    const defaultOffset = boardFamily === 'ESP32' ? 0x10000 : 0x0000;

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
      let addr = defaultOffset;
      const lowerName = file.name.toLowerCase();
      if (lowerName.includes('bootloader')) addr = 0x1000;
      else if (lowerName.includes('partition')) addr = 0x8000;

      newItems.push({
        id: 'cust_' + Date.now() + '_' + i,
        name: file.name,
        data: uint8,
        address: addr,
        addressHex: '0x' + addr.toString(16).toUpperCase(),
        size: uint8.length,
        sha256,
        isCustom: true,
      });
    }

    setIsProcessing(false);
    if (newItems.length > 0) {
      onCustomImagesChange(newItems);
    }
  };

  const hasCustom = customImages.length > 0;
  const hasSelected = !!selectedFirmwareId || hasCustom;

  const chipColor = (board: string) => {
    if (board === 'ESP32') return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
    if (board === 'ESP8266') return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
  };

  const getDotColor = (color: PinConnection['wireColor']) => {
    switch (color) {
      case 'red': return 'bg-red-500';
      case 'black': return 'bg-slate-900 dark:bg-slate-200';
      case 'yellow': return 'bg-amber-400';
      case 'green': return 'bg-emerald-500';
      case 'blue': return 'bg-blue-500';
      case 'orange': return 'bg-orange-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-slate-400';
    }
  };

  const handleCopyWiring = () => {
    if (!selectedFw?.wiringGuide) return;
    soundEffects.click();
    const lines = [
      `=== ${selectedFw.name} Connections ===`,
      `Board: ${selectedFw.chip}`,
      ...selectedFw.wiringGuide.connections.map(c => 
        `• ${c.componentPin} ➔ ${c.boardPin} (${c.wireColor.toUpperCase()} wire) [${c.signalType}] - ${c.description || ''}`
      ),
      selectedFw.wiringGuide.baudRate ? `Serial Baud: ${selectedFw.wiringGuide.baudRate} bps` : ''
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">

      {/* ── Example Projects Dropdown ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Example Projects
          </label>
          {selectedFw?.category && (
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              {selectedFw.category}
            </span>
          )}
        </div>

        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-200 hover:border-blue-400 dark:hover:border-blue-500 transition-colors shadow-sm"
          >
            <span className={hasSelected && !hasCustom ? 'text-blue-600 dark:text-blue-400 font-bold text-xs sm:text-sm truncate' : 'text-slate-500 dark:text-slate-400 text-xs sm:text-sm truncate'}>
              {hasCustom
                ? 'Custom firmware loaded'
                : selectedFirmwareName || 'Select an example project...'}
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ml-2 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 top-full mt-1.5 left-0 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    autoFocus
                  />
                </div>
              </div>

              {/* Filter Chips */}
              <div className="flex gap-1 px-2 pt-2 pb-1">
                {['all', 'ESP32', 'ESP8266', 'Arduino'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFilterFamily(f)}
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                      filterFamily === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {f === 'all' ? 'All' : f}
                  </button>
                ))}
              </div>

              {/* Scrollable List */}
              <div className="overflow-y-auto max-h-64 py-1">
                {filtered.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">No projects found</div>
                ) : (
                  filtered.map(fw => {
                    const isSelected = selectedFirmwareId === fw.id;
                    return (
                      <button
                        key={fw.id}
                        onClick={() => { 
                          soundEffects.select();
                          onSelectPublished(fw); 
                          setDropdownOpen(false); 
                        }}
                        className={`w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                        }`}
                      >
                        <span className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 ${chipColor(fw.board)}`}>
                          {fw.board}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{fw.name}</p>
                            {fw.wiringGuide && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex-shrink-0">
                                Pinout
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{fw.chip} • {fw.sizeStr}</p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── NEAT TABULAR CONNECTIONS TAB (Opens only when user selects that project) ── */}
      {selectedFw?.wiringGuide && !hasCustom && (
        <div className="mt-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs animate-fade-in">
          
          {/* Compact Tab Header */}
          <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-100/60 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                <Cpu className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="truncate">{selectedFw.wiringGuide.title}</span>
              </span>
              <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex-shrink-0">
                {selectedFw.chip}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCopyWiring}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                title="Copy connections to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabular Connections Table */}
          <div className="p-2 sm:p-2.5 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="px-3 py-2">Component Pin</th>
                  <th className="px-3 py-2">Board Pin</th>
                  <th className="px-3 py-2">Wire</th>
                  <th className="px-3 py-2">Signal</th>
                  <th className="px-3 py-2 hidden sm:table-cell">Function / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {selectedFw.wiringGuide.connections.map((conn, idx) => (
                  <tr key={idx} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {conn.componentPin}
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-bold text-xs bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/70">
                        {conn.boardPin}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                        <span className={`w-2 h-2 rounded-full ${getDotColor(conn.wireColor)} flex-shrink-0`} />
                        <span className="capitalize">{conn.wireColor}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                        {conn.signalType}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-[11px] hidden sm:table-cell">
                      {conn.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clean Footnote / Telemetry Info */}
          {selectedFw.wiringGuide.baudRate && (
            <div className="px-3.5 py-2 bg-slate-100/40 dark:bg-slate-800/30 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Serial Telemetry: <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedFw.wiringGuide.baudRate} bps</strong></span>
              </span>
              {selectedFw.wiringGuide.operationTips?.[0] && (
                <span className="text-slate-400 text-[10px] hidden md:inline truncate max-w-sm">
                  {selectedFw.wiringGuide.operationTips[0]}
                </span>
              )}
            </div>
          )}

        </div>
      )}

      {/* ── Divider ── */}
      <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span>or upload your own</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* ── Drag & Drop Zone ── */}
      {hasCustom ? (
        <div className="space-y-2">
          {customImages.map((img, idx) => (
            <div key={img.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <FileCode2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{img.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{formatBytes(img.size)}</p>
              </div>
              <button
                onClick={() => {
                  const updated = customImages.filter((_, i) => i !== idx);
                  updated.length === 0 ? onClearCustomImages() : onCustomImagesChange(updated);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={onClearCustomImages}
            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 font-medium transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Clear custom firmware
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={async (e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length > 0) await processFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-4 sm:p-5 text-center transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50 dark:bg-slate-900/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".bin,.hex"
            multiple={boardFamily === 'ESP32'}
            onChange={async (e) => { if (e.target.files?.length) await processFiles(e.target.files); }}
            className="hidden"
          />
          <UploadCloud className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {isProcessing ? 'Processing...' : 'Drag & drop firmware file here'}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            or <span className="text-blue-600 dark:text-blue-400 font-medium">click to browse</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1.5">Supports .bin .hex — nothing is uploaded anywhere</p>
        </div>
      )}
    </div>
  );
};
