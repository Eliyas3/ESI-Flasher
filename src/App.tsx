import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Hero } from './components/layout/Hero';
import { WorkflowSteps } from './components/layout/WorkflowSteps';
import { BrowserCompatibilityAlert } from './components/layout/BrowserCompatibilityAlert';
import { FirmwareBrowser } from './components/dashboard/FirmwareBrowser';
import { FlashTargetCard } from './components/dashboard/FlashTargetCard';
import { DeviceInfoCard } from './components/dashboard/DeviceInfoCard';
import { FlashSettingsCard } from './components/dashboard/FlashSettingsCard';
import { FlashProgressCard } from './components/dashboard/FlashProgressCard';
import { TerminalConsole } from './components/console/TerminalConsole';
import { BootloaderHelpModal } from './components/modals/BootloaderHelpModal';
import { TechDetailsModal } from './components/modals/TechDetailsModal';
import { AdminModal } from './components/admin/AdminModal';
import { useFlasherStore } from './stores/useFlasherStore';
import { useTerminalStore } from './stores/useTerminalStore';
import { EsiLogo } from './components/common/EsiLogo';
import { ShieldCheck, Cpu, Code2, Globe } from 'lucide-react';

export const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('esi_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  const {
    boardFamily,
    setBoardFamily,
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
    activeFlasher,
    handleConnect,
    handleDisconnect,
    selectPublishedFirmware,
    setCustomImages,
    clearSelectedFirmware,
    handleFlash,
    handleEraseOnly,
    handleResetDevice,
  } = useFlasherStore();

  const { setActiveTab } = useTerminalStore();

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('esi_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('esi_theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b101b] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Sticky Header */}
      <Header
        connectionState={connectionState}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenHelp={() => setShowBootloaderHelp(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Hero Section */}
        <Hero />

        {/* Browser Web Serial Support Check */}
        <BrowserCompatibilityAlert />

        {/* 3-Step Interactive Workflow */}
        <WorkflowSteps
          connectionState={connectionState}
          boardName={boardFamily}
          hasFirmware={selectedImages.length > 0}
          firmwareName={selectedMeta?.name}
          flashState={flashState}
        />

        {/* 2-Column Responsive Dashboard (70% Left / 30% Right on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= LEFT COLUMN (70% on Desktop: 8 cols) ================= */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* Firmware Browser & Custom Dropzone */}
            <FirmwareBrowser
              boardFamily={boardFamily}
              onSelectPublished={selectPublishedFirmware}
              selectedFirmwareId={selectedMeta?.id}
              customImages={selectedImages}
              onCustomImagesChange={(imgs) => setCustomImages(imgs, imgs[0]?.name || 'Custom Firmware')}
              onClearCustomImages={clearSelectedFirmware}
            />

            {/* Dark Engineering Terminal Console & Serial Monitor */}
            <TerminalConsole
              connectionState={connectionState}
              flashState={flashState}
              activePort={activeFlasher?.getSerialPort()}
            />

          </div>

          {/* ================= RIGHT COLUMN (30% on Desktop: 4 cols) ================= */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            
            {/* Flashing Progress Card (Shown during flash or on completion/error) */}
            <FlashProgressCard
              flashState={flashState}
              progress={flashProgress}
              boardName={deviceInfo?.chip || selectedChip}
              onResetDevice={handleResetDevice}
              onOpenSerialMonitor={() => setActiveTab('monitor')}
              errorMessage={errorMessage}
              onShowTechDetails={techDetails ? () => setShowTechModal(true) : undefined}
            />

            {/* Flash Target Selection & Connect / Flash Now Actions */}
            <FlashTargetCard
              boardFamily={boardFamily}
              onBoardFamilyChange={setBoardFamily}
              selectedChip={selectedChip}
              onChipChange={setSelectedChip}
              connectionState={connectionState}
              flashState={flashState}
              hasFirmware={selectedImages.length > 0}
              isDemoMode={isDemoMode}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onFlash={handleFlash}
              onOpenBootloaderHelp={() => setShowBootloaderHelp(true)}
            />

            {/* Live Detected Device Hardware Specifications */}
            <DeviceInfoCard
              deviceInfo={deviceInfo}
              isConnected={connectionState === 'connected'}
            />

            {/* Platform Flash Settings */}
            <FlashSettingsCard
              boardFamily={boardFamily}
              settings={flashSettings}
              onSettingsChange={setFlashSettings}
              disabled={flashState === 'writing' || flashState === 'preparing' || flashState === 'erasing'}
            />

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/50 backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <EsiLogo size="sm" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              ESI Flasher
            </span>
            <span>•</span>
            <span>Eliyas Science Info</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>100% Client-Side In-Memory Flashing</span>
            </span>
            <span>•</span>
            <span>Web Serial API</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BootloaderHelpModal
        isOpen={showBootloaderHelp}
        onClose={() => setShowBootloaderHelp(false)}
        boardFamily={boardFamily}
      />

      <TechDetailsModal
        isOpen={showTechModal}
        onClose={() => setShowTechModal(false)}
        details={techDetails}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

    </div>
  );
};

export default App;
