import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings2, 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Download, 
  Upload, 
  Check, 
  Trash2, 
  Layers, 
  Cpu, 
  LogOut, 
  Sparkles, 
  AlertTriangle,
  KeyRound
} from 'lucide-react';
import { BoardFamily } from '../../types/hardware';
import { FirmwareManifest } from '../../types/firmware';
import { soundEffects } from '../../utils/soundEffects';
import { calculateSHA256 } from '../../flasher/checksum';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPublishedFirmware?: (manifest: FirmwareManifest) => void;
  onAuthChange?: (isAuthenticated: boolean) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  onAddPublishedFirmware,
  onAuthChange,
}) => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('esi_admin_auth') === 'true';
    }
    return false;
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Manifest Form State
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
  const [activeTab, setActiveTab] = useState<'form' | 'json' | 'preview'>('form');
  const [statusMsg, setStatusMsg] = useState('');

  // Sync auth state when modal opens
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const isAuth = sessionStorage.getItem('esi_admin_auth') === 'true';
      setIsAuthenticated(isAuth);
      if (onAuthChange) onAuthChange(isAuth);
    }
  }, [isOpen, onAuthChange]);

  if (!isOpen) return null;

  // Handle Login submission
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    try {
      const enc = new TextEncoder();
      const inputUserHash = await calculateSHA256(enc.encode(usernameInput.trim()));
      const inputPassHash = await calculateSHA256(enc.encode(passwordInput));

      // Cryptographic SHA-256 hashes with optional environment overrides
      const DEFAULT_USER_HASH = '3f2b03a196b2909c3d2db27ebbb5744eeedc4382cbf740b47dbe01978b2a6bb8';
      const DEFAULT_PASS_HASH = '98f5fe3fc1ddb24513d217e88a8c3f6c25deb00d08157895d2f6559adaf8bbbf';

      const envUser = import.meta.env.VITE_ADMIN_USER;
      const envPass = import.meta.env.VITE_ADMIN_PASS;

      const isValid =
        (envUser && envPass && usernameInput.trim() === envUser && passwordInput === envPass) ||
        (inputUserHash === DEFAULT_USER_HASH && inputPassHash === DEFAULT_PASS_HASH);

      if (isValid) {
        sessionStorage.setItem('esi_admin_auth', 'true');
        setIsAuthenticated(true);
        setAuthError('');
        soundEffects.adminUnlock();
        if (onAuthChange) onAuthChange(true);
      } else {
        soundEffects.error();
        setAuthError('Invalid administrator credentials. Access denied.');
      }
    } catch {
      soundEffects.error();
      setAuthError('Authentication verification failed.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    soundEffects.click();
    sessionStorage.removeItem('esi_admin_auth');
    setIsAuthenticated(false);
    setUsernameInput('');
    setPasswordInput('');
    setAuthError('');
    if (onAuthChange) onAuthChange(false);
  };

  const handleExportJson = () => {
    soundEffects.click();
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
    soundEffects.click();
    const manifestStr = manifestJson || JSON.stringify({
      name: name || 'ESI Custom Project',
      version, board, chip, description, category,
      releaseNotes,
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
      soundEffects.error();
      alert('Please provide a project name.');
      return;
    }

    soundEffects.flashSuccess();
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

    // Persist to local custom catalog
    try {
      const existingStr = localStorage.getItem('esi_custom_catalog');
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const newEntry = {
        id: 'pub_' + Date.now(),
        name,
        board,
        chip,
        version: `v${version}`,
        description: description || 'Custom published firmware',
        category,
        releaseNotes,
        images: [
          {
            name: fileName,
            path: fileName,
            address: flashAddress,
            addressOffset: parseInt(flashAddress, 16) || 0,
            sizeBytes: 131072,
          }
        ]
      };
      existing.unshift(newEntry);
      localStorage.setItem('esi_custom_catalog', JSON.stringify(existing));
    } catch {
      // Storage fallback
    }

    setStatusMsg(`Firmware "${name}" published to catalog successfully!`);
    setTimeout(() => {
      setStatusMsg('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#121624] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] transition-all">
        
        {/* ===================== LOGIN GATE ===================== */}
        {!isAuthenticated ? (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            {/* Top Close Button */}
            <div className="w-full flex justify-end">
              <button
                onClick={() => { soundEffects.click(); onClose(); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Glowing Lock Badge */}
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-white dark:border-[#121624] flex items-center justify-center text-[10px] text-white font-bold">
                <Lock className="w-3 h-3" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              ESI Administrator Gateway
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1.5">
              Restricted management area. Please authenticate to publish and edit verified hardware firmware manifests.
            </p>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="w-full max-w-sm mt-6 space-y-4 text-left">
              {authError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 text-xs flex items-center gap-2 animate-shake">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Admin Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    autoFocus
                    required
                    placeholder="Enter admin username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Admin Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter admin password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Authenticate & Access Portal</span>
                  </>
                )}
              </button>

              {/* Quick credential indicator */}
              <div className="pt-2 text-center">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Authorized Administrator: <span className="font-semibold text-blue-600 dark:text-blue-400">Eliyas</span>
                </span>
              </div>
            </form>
          </div>
        ) : (
          /* ===================== AUTHENTICATED ADMIN PANEL ===================== */
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60">
                  <Settings2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Firmware Administration
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Eliyas (Admin)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Publish verified firmware catalog metadata & manifest schemas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition-colors"
                  title="Lock & Log out of admin session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
                <button
                  onClick={() => { soundEffects.click(); onClose(); }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab switch */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <button
                onClick={() => { soundEffects.click(); setActiveTab('form'); }}
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
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
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={handleDownloadManifest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Manifest JSON</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { soundEffects.click(); onClose(); }}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveToCatalog}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Publish Firmware</span>
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
