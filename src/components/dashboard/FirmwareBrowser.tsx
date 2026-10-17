import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Star, 
  Sparkles, 
  Cpu, 
  ArrowUpRight, 
  Upload, 
  Filter, 
  Download, 
  Calendar, 
  HardDrive,
  Check
} from 'lucide-react';
import { PublishedFirmware, FirmwareImageItem } from '../../types/firmware';
import { BoardFamily } from '../../types/hardware';
import { INITIAL_PUBLISHED_FIRMWARES } from '../../utils/sampleFirmwares';
import { CustomFirmwareDropzone } from './CustomFirmwareDropzone';

interface FirmwareBrowserProps {
  boardFamily: BoardFamily;
  onSelectPublished: (fw: PublishedFirmware) => void;
  selectedFirmwareId?: string;
  customImages: FirmwareImageItem[];
  onCustomImagesChange: (images: FirmwareImageItem[]) => void;
  onClearCustomImages: () => void;
}

export const FirmwareBrowser: React.FC<FirmwareBrowserProps> = ({
  boardFamily,
  onSelectPublished,
  selectedFirmwareId,
  customImages,
  onCustomImagesChange,
  onClearCustomImages,
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'custom'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFamily, setFilterFamily] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular');
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['fw-esp32-wifi-scanner', 'fw-arduino-uno-blink']));

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredFirmwares = useMemo(() => {
    return INITIAL_PUBLISHED_FIRMWARES.filter(fw => {
      // Family filter
      if (filterFamily === 'favorites' && !favorites.has(fw.id)) return false;
      if (filterFamily === 'ESP32' && fw.board !== 'ESP32') return false;
      if (filterFamily === 'ESP8266' && fw.board !== 'ESP8266') return false;
      if (filterFamily === 'Arduino' && fw.board !== 'Arduino') return false;

      // Category filter
      if (filterCategory !== 'all' && fw.category !== filterCategory) return false;

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = fw.name.toLowerCase().includes(q);
        const matchesDesc = fw.description.toLowerCase().includes(q);
        const matchesChip = fw.chip.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesChip) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'popular') {
        return (b.downloads || 0) - (a.downloads || 0);
      } else {
        return new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime();
      }
    });
  }, [filterFamily, filterCategory, searchQuery, sortBy, favorites]);

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-card overflow-hidden">
      
      {/* Header with Mode Switcher */}
      <div className="border-b border-slate-200 dark:border-slate-700/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Firmware & Projects</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              ({INITIAL_PUBLISHED_FIRMWARES.length} official builds)
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select a verified open-source firmware or drop your custom binary
          </p>
        </div>

        {/* Mode Switch Pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'library'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Verified Builds
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'custom'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Flash Your Own</span>
            {customImages.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'custom' ? (
        <div className="p-4 sm:p-6">
          <CustomFirmwareDropzone
            boardFamily={boardFamily}
            images={customImages}
            onImagesChange={onCustomImagesChange}
            onClear={onClearCustomImages}
          />
        </div>
      ) : (
        <div className="p-4 sm:p-6 space-y-4">
          
          {/* Search & Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects, categories, or chips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'favorites', label: '★ Favorites' },
                { id: 'ESP32', label: 'ESP32' },
                { id: 'ESP8266', label: 'ESP8266' },
                { id: 'Arduino', label: 'Arduino' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterFamily(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    filterFamily === f.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

          </div>

          {/* Cards Grid */}
          {filteredFirmwares.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              <HardDrive className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No firmware projects match your search
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Drop your own .bin or .hex into the "Flash Your Own" tab above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredFirmwares.map((fw) => {
                const isSelected = selectedFirmwareId === fw.id;
                const isFav = favorites.has(fw.id);

                return (
                  <div
                    key={fw.id}
                    onClick={() => onSelectPublished(fw)}
                    className={`relative group rounded-xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-md ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-subtle'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            fw.board === 'ESP32'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : fw.board === 'ESP8266'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}>
                            {fw.board}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                            {fw.version}
                          </span>
                        </div>

                        {/* Favorite star */}
                        <button
                          onClick={(e) => toggleFavorite(fw.id, e)}
                          className="text-slate-400 hover:text-amber-400 p-1 transition-colors"
                          title="Save to favorites"
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </div>

                      {/* Title & Desc */}
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {fw.name}
                      </h4>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {fw.description}
                      </p>
                    </div>

                    {/* Footer Info & Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[11px]">{fw.sizeStr}</span>
                        <span>•</span>
                        <span className="text-[11px]">{fw.updatedDate}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPublished(fw);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Selected</span>
                          </>
                        ) : (
                          <>
                            <span>Select</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
