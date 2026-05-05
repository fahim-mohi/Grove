import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { ColorPicker, SWATCHES } from './ColorPicker';
import { useWorkspaceStore } from '../store/workspace';

interface NewSessionDialogProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_NAME_PREFIX = 'session';

export function NewSessionDialog({ open, onClose }: NewSessionDialogProps) {
  const addSession = useWorkspaceStore((s) => s.addSession);
  const sessionCount = useWorkspaceStore((s) => s.sessionOrder.length);

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(SWATCHES[1] ?? '#F97316'); // orange default
  const [cwd, setCwd] = useState<string>('');
  const [command, setCommand] = useState<string>('');

  // Reset form when dialog opens. Suggest a default name based on session count.
  useEffect(() => {
    if (!open) return;
    setName(`${DEFAULT_NAME_PREFIX}-${sessionCount + 1}`);
    setCwd('');
    setCommand('');
  }, [open, sessionCount]);

  const valid = name.trim().length > 0;

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (!valid) return;
    addSession({
      name: name.trim(),
      color,
      cwd: cwd.trim() || undefined,
      command: command.trim() || undefined,
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
            className="cursor-pointer rounded-control border border-edge bg-modal px-3.5 py-1.5 font-ui text-[13px] font-medium text-text-primary transition-colors duration-fast ease-out hover:bg-sidebarHover"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="new-session-form"
            disabled={!valid}
            className="cursor-pointer rounded-control bg-accent px-3.5 py-1.5 font-ui text-[13px] font-semibold text-text-onAccent transition-colors duration-fast ease-out hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create
          </button>
        </>
      }
    >
      <form id="new-session-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Name" htmlFor="ns-name">
          <input
            id="ns-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            spellCheck={false}
            required
            className="w-full rounded-control border border-edge bg-input px-3 py-2 font-ui text-[13px] text-text-primary outline-none focus-visible:border-accent"
          />
        </Field>

        <Field label="Color">
          <ColorPicker value={color} onChange={setColor} dismissable={false} />
        </Field>

        <Field
          label="Working directory"
          hint="optional — defaults to your home directory"
          htmlFor="ns-cwd"
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
              className="flex-1 rounded-control border border-edge bg-input px-3 py-2 font-terminal text-xs text-text-primary outline-none placeholder:text-text-muted focus-visible:border-accent"
            />
            <button
              type="button"
              onClick={() => void handleChooseDir()}
              className="cursor-pointer rounded-control border border-edge bg-modal px-3 py-2 font-ui text-[12px] font-medium text-text-primary transition-colors duration-fast ease-out hover:bg-sidebarHover"
            >
              Choose…
            </button>
          </div>
        </Field>

        <Field
          label="Command"
          hint="optional — overrides the default `claude` binary for this session"
          htmlFor="ns-cmd"
        >
          <input
            id="ns-cmd"
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="claude"
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            className="w-full rounded-control border border-edge bg-input px-3 py-2 font-terminal text-xs text-text-primary outline-none placeholder:text-text-muted focus-visible:border-accent"
          />
        </Field>
      </form>
    </Modal>
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
