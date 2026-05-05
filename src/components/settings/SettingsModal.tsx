import { useState } from 'react';
import { Modal } from '../Modal';
import { GeneralTab } from './GeneralTab';
import { AppearanceTab } from './AppearanceTab';
import { TagsTab } from './TagsTab';
import { ThemeEditorTab } from './ThemeEditorTab';
import { ShortcutsTab } from './ShortcutsTab';
import { AboutTab } from './AboutTab';
import { useSettingsStore } from '../../store/settings';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type TabId = 'general' | 'appearance' | 'tags' | 'theme-editor' | 'shortcuts' | 'about';

interface TabDef {
  id: TabId;
  label: string;
  enabled?: () => boolean;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const [active, setActive] = useState<TabId>('general');
  const themePreset = useSettingsStore((s) => s.themePreset);

  const tabs: TabDef[] = [
    { id: 'general', label: 'General' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'tags', label: 'Tags' },
    { id: 'theme-editor', label: 'Theme Editor', enabled: () => themePreset === 'custom' },
    { id: 'shortcuts', label: 'Shortcuts' },
    { id: 'about', label: 'About' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Settings" width={720} closeOnScrimClick={false}>
      <div className="flex" style={{ minHeight: 480 }}>
        <nav
          className="flex flex-shrink-0 flex-col gap-0.5 border-r border-edge pr-3"
          style={{ width: 160 }}
          aria-label="Settings sections"
        >
          {tabs.map((tab) => {
            const enabled = tab.enabled ? tab.enabled() : true;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => enabled && setActive(tab.id)}
                disabled={!enabled}
                className={`text-left rounded-control px-3 py-1.5 font-ui text-[13px] font-medium transition-colors duration-fast ease-out ${
                  isActive
                    ? 'bg-sidebarActive text-text-primary'
                    : enabled
                      ? 'cursor-pointer text-text-secondary hover:bg-sidebarHover hover:text-text-primary'
                      : 'cursor-not-allowed text-text-muted'
                }`}
                title={!enabled ? 'Available when theme preset is Custom' : undefined}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto pl-5" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {active === 'general' && <GeneralTab />}
          {active === 'appearance' && <AppearanceTab />}
          {active === 'tags' && <TagsTab />}
          {active === 'theme-editor' && <ThemeEditorTab />}
          {active === 'shortcuts' && <ShortcutsTab />}
          {active === 'about' && <AboutTab />}
        </div>
      </div>
    </Modal>
  );
}
