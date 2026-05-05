import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { ColorPicker, SWATCHES } from './ColorPicker';
import { TagPickerInline } from './TagPickerInline';
import { useWorkspaceStore } from '../store/workspace';
import { useSettingsStore } from '../store/settings';
import { toTmuxName } from '../lib/tmux-naming';

interface NewSessionDialogProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_NAME_PREFIX = 'session';

export function NewSessionDialog({ open, onClose }: NewSessionDialogProps) {
  const addSession = useWorkspaceStore((s) => s.addSession);
  const sessionCount = useWorkspaceStore((s) => s.sessionOrder.length);
  const tmuxAvailable = useWorkspaceStore((s) => s.tmuxAvailable);
  const preferTmux = useSettingsStore((s) => s.preferTmux);

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(SWATCHES[1] ?? '#F97316'); // orange default
  const [cwd, setCwd] = useState<string>('');
  const [command, setCommand] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  // Reset form when dialog opens. Suggest a default name based on session count.
  useEffect(() => {
    if (!open) return;
    setName(`${DEFAULT_NAME_PREFIX}-${sessionCount + 1}`);
    setCwd('');
    setCommand('');
    setSelectedTagIds([]);
  }, [open, sessionCount]);

  function toggleTag(id: string): void {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  const valid = name.trim().length > 0;

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (!valid) return;
    const useTmux = tmuxAvailable && preferTmux;
    addSession({
      name: name.trim(),
      color,
      tags: selectedTagIds,
      cwd: cwd.trim() || undefined,
      command: command.trim() || undefined,
      kind: useTmux ? 'tmux' : 'local',
      tmuxName: useTmux ? toTmuxName(name.trim()) : undefined,
    });
    onClose();
  }

  async function handleChooseDir(): Promise<void> {
    const result = await window.grove.dialog.chooseDirectory({
      title: 'Choose working directory',
      defaultPath: cwd || undefined,
    });
    if (result) setCwd(result);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Session"
      width={460}
      closeOnScrimClick={false}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-control border border-edge bg-modal px-3.5 py-1.5 font-ui text-[13px] font-medium text-text-secondary transition-colors duration-base ease-out hover:bg-sidebarHover hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-session-form"
            disabled={!valid}
            className="flex cursor-pointer items-center gap-1.5 rounded-control bg-accent px-3.5 py-1.5 font-ui text-[13px] font-semibold text-text-onAccent transition-colors duration-base ease-out hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PlusIcon />
            Launch Session
          </button>
        </>
      }
    >
      <p className="-mt-1 mb-4 font-ui text-[12px] text-text-muted">
        Launch a Claude Code session in the workspace
      </p>
      <form id="new-session-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Session name" htmlFor="ns-name">
          <input
            id="ns-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            spellCheck={false}
            required
            className="w-full rounded-control border border-edge bg-input px-3 py-2 font-ui text-[13px] text-text-primary outline-none transition-colors duration-base ease-out focus-visible:border-accent"
          />
        </Field>

        <Field label="Command" htmlFor="ns-cmd" hint="defaults to claude when blank">
          <input
            id="ns-cmd"
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="claude"
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            className="w-full rounded-control border border-edge bg-input px-3 py-2 font-terminal text-xs text-text-primary outline-none transition-colors duration-base ease-out placeholder:text-text-muted focus-visible:border-accent"
          />
        </Field>

        <Field
          label="Working directory"
          htmlFor="ns-cwd"
          hint="optional — defaults to your home directory"
        >
          <div className="flex items-center gap-2">
            <input
              id="ns-cwd"
              type="text"
              value={cwd}
              onChange={(e) => setCwd(e.target.value)}
              placeholder="~/projects/grove"
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              className="flex-1 rounded-control border border-edge bg-input px-3 py-2 font-terminal text-xs text-text-primary outline-none transition-colors duration-base ease-out placeholder:text-text-muted focus-visible:border-accent"
            />
            <button
              type="button"
              onClick={() => void handleChooseDir()}
              className="cursor-pointer rounded-control border border-edge bg-modal px-3 py-2 font-ui text-[12px] font-medium text-text-primary transition-colors duration-base ease-out hover:bg-sidebarHover"
            >
              Choose…
            </button>
          </div>
        </Field>

        <Field label="Color">
          <ColorPicker value={color} onChange={setColor} dismissable={false} />
        </Field>

        <Field label="Tags" hint="optional — group related sessions">
          <TagPickerInline selectedIds={selectedTagIds} onToggle={toggleTag} />
        </Field>
      </form>
    </Modal>
  );
}

function PlusIcon() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-ui text-[12px] font-medium text-text-secondary">
        {label}
      </label>
      {children}
      {hint && <span className="font-ui text-[11px] text-text-muted">{hint}</span>}
    </div>
  );
}
