import type { ReactNode } from 'react'
import { buttonVariants } from '../ui/Button'

type SettingRowProps = {
  /** Small leading visual (icon chip or avatar). Decorative. */
  icon: ReactNode
  title: string
  /** Current value shown when collapsed (e.g. the username or email). */
  currentValue?: ReactNode
  /** Optional helper text under the value (not truncated). */
  description?: ReactNode
  editing: boolean
  /** Toggles between the collapsed view and the edit form. */
  onToggle: () => void
  /** Label for the open action when collapsed (default "Edit"). */
  editLabel?: string
  /** A custom trailing control that replaces the Edit/Cancel toggle. */
  action?: ReactNode
  /** id of the editable region, wired to the toggle's aria-controls. */
  controlsId: string
  disabled?: boolean
  /** Persistent feedback (success/error) shown under the row in both states. */
  feedback?: ReactNode
  /** The edit form, rendered only while `editing`. */
  children?: ReactNode
}

/**
 * One row of the Account settings list: a leading icon, a title + current value,
 * and an Edit/Cancel toggle that reveals an inline form. Accessible by default —
 * the toggle exposes `aria-expanded` + `aria-controls` for the form region.
 */
export function SettingRow({
  icon,
  title,
  currentValue,
  description,
  editing,
  onToggle,
  editLabel = 'Edit',
  action,
  controlsId,
  disabled = false,
  feedback,
  children,
}: SettingRowProps) {
  return (
    <div className="py-5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0" aria-hidden>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              {currentValue != null && !editing && (
                <p className="mt-0.5 truncate text-sm text-white/55">{currentValue}</p>
              )}
              {description != null && !editing && (
                <p className="mt-0.5 text-xs text-white/45">{description}</p>
              )}
            </div>
            {action ?? (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded={editing}
                aria-controls={controlsId}
                disabled={disabled}
                className={buttonVariants({
                  variant: 'glass',
                  size: 'sm',
                  className: 'shrink-0',
                })}
              >
                {editing ? 'Cancel' : editLabel}
              </button>
            )}
          </div>

          {editing && (
            <div id={controlsId} className="mt-4">
              {children}
            </div>
          )}

          {feedback && <div className="mt-3">{feedback}</div>}
        </div>
      </div>
    </div>
  )
}
