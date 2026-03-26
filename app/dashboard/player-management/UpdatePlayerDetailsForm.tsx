"use client";

import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { CheckCircle2, CircleAlert, Save, Trash2 } from "lucide-react";
import { deletePlayer, updatePlayerDetails } from "./actions";

export type UpdatePlayerDetailsRow = {
  id: string;
  team_name: string | null;
  position: string | null;
  jersey_no: number | null;
  contact_no: string | null;
  label: string;
};

type Props = {
  players: UpdatePlayerDetailsRow[];
};

const TEXT_MAX = 200;

const field =
  "input input-bordered input-md w-full rounded-lg border-slate-200 bg-base-100 text-sm transition-[border-color,box-shadow] placeholder:text-base-content/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 disabled:cursor-not-allowed disabled:bg-base-200/40 disabled:opacity-60 dark:border-slate-600";

const selectField =
  "select select-bordered select-md w-full rounded-lg border-slate-200 bg-base-100 text-sm transition-[border-color,box-shadow] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 dark:border-slate-600";

function rowToFields(p: UpdatePlayerDetailsRow) {
  return {
    teamName: p.team_name ?? "",
    position: p.position ?? "",
    jersey: p.jersey_no != null ? String(p.jersey_no) : "",
    contact: p.contact_no ?? "",
  };
}

export function UpdatePlayerDetailsForm({ players }: Props) {
  const [playerId, setPlayerId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [position, setPosition] = useState("");
  const [jersey, setJersey] = useState("");
  const [contact, setContact] = useState("");
  const [isSavePending, startSaveTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const lastSyncedSig = useRef<string | null>(null);

  const applySelection = useCallback(
    (id: string) => {
      setFeedback(null);
      setPlayerId(id);
      if (!id) {
        lastSyncedSig.current = null;
        setTeamName("");
        setPosition("");
        setJersey("");
        setContact("");
        return;
      }
      const p = players.find((x) => x.id === id);
      if (!p) {
        lastSyncedSig.current = null;
        setTeamName("");
        setPosition("");
        setJersey("");
        setContact("");
        return;
      }
      const f = rowToFields(p);
      setTeamName(f.teamName);
      setPosition(f.position);
      setJersey(f.jersey);
      setContact(f.contact);
      lastSyncedSig.current = [
        id,
        p.team_name ?? "",
        p.position ?? "",
        p.jersey_no ?? "",
        p.contact_no ?? "",
      ].join("|");
    },
    [players],
  );

  useEffect(() => {
    if (!playerId) {
      lastSyncedSig.current = null;
      return;
    }
    const p = players.find((x) => x.id === playerId);
    if (!p) {
      lastSyncedSig.current = null;
      setPlayerId("");
      setTeamName("");
      setPosition("");
      setJersey("");
      setContact("");
      return;
    }
    const sig = [
      p.id,
      p.team_name ?? "",
      p.position ?? "",
      p.jersey_no ?? "",
      p.contact_no ?? "",
    ].join("|");
    if (lastSyncedSig.current === sig) return;
    lastSyncedSig.current = sig;
    const f = rowToFields(p);
    setTeamName(f.teamName);
    setPosition(f.position);
    setJersey(f.jersey);
    setContact(f.contact);
  }, [players, playerId]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setFeedback(null);
    startSaveTransition(() => {
      void (async () => {
        const result = await updatePlayerDetails(new FormData(form));
        if (result.ok) {
          lastSyncedSig.current = null;
          setPlayerId("");
          setTeamName("");
          setPosition("");
          setJersey("");
          setContact("");
          setFeedback({ ok: true, message: "Changes saved successfully." });
        } else {
          setFeedback({ ok: false, message: result.message });
        }
      })();
    });
  }

  function handleDelete() {
    if (!playerId) return;
    const row = players.find((x) => x.id === playerId);
    const label = row?.label ?? "this player";
    if (
      !window.confirm(
        `Remove player profile for "${label}"?\n\nEvent registrations for this profile will be removed automatically. This cannot be undone.`,
      )
    ) {
      return;
    }
    setFeedback(null);
    startDeleteTransition(() => {
      void (async () => {
        const result = await deletePlayer(playerId);
        if (result.ok) {
          lastSyncedSig.current = null;
          setPlayerId("");
          setTeamName("");
          setPosition("");
          setJersey("");
          setContact("");
          setFeedback({
            ok: true,
            message: "Player profile removed.",
          });
        } else {
          setFeedback({ ok: false, message: result.message });
        }
      })();
    });
  }

  const disabledFields = !playerId;
  const actionPending = isSavePending || isDeletePending;

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-200/90 bg-base-100 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700/80 dark:ring-slate-700/50"
    >
      <div
        className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500"
        aria-hidden
      />

      <div className="space-y-6 p-5 sm:p-7">
        {feedback != null && (
          <div
            role="alert"
            className={
              feedback.ok
                ? "flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
                : "flex gap-3 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
            }
          >
            {feedback.ok ? (
              <CheckCircle2
                className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
            ) : (
              <CircleAlert
                className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400"
                aria-hidden
              />
            )}
            <span className="leading-relaxed">{feedback.message}</span>
          </div>
        )}

        <header className="space-y-2 border-b border-slate-200/80 pb-5 dark:border-slate-700/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Profile update
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
            Update player details
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-base-content/65">
            Select a player to load saved team and contact details. Contact:
            7–15 digits, or leave empty to clear. Jersey: whole number ≥ 0, or
            empty to clear. You can remove the profile with{" "}
            <strong className="font-semibold text-base-content/80">
              Delete player
            </strong>{" "}
            when a player is selected.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 dark:border-slate-700/60 dark:bg-base-200/30">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-200/70 pb-3 dark:border-slate-600/60">
            <span className="h-8 w-1 shrink-0 rounded-full bg-blue-600 dark:bg-blue-500" />
            <div>
              <h3 className="text-sm font-semibold text-base-content">
                Team & contact
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-base-content/55">
                Choose who to edit, then update any field below.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="form-control sm:col-span-2 lg:col-span-2">
              <label
                htmlFor="player_id_update"
                className="label cursor-pointer px-0 pb-1 pt-0"
              >
                <span className="label-text text-sm font-medium text-base-content">
                  Player
                  <span
                    className="ml-0.5 text-red-500 dark:text-red-400"
                    title="Required"
                  >
                    *
                  </span>
                </span>
              </label>
              <select
                id="player_id_update"
                name="player_id"
                required
                className={selectField}
                value={playerId}
                onChange={(e) => applySelection(e.target.value)}
              >
                <option value="">Select a player</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label
                htmlFor="team_name_update"
                className="label cursor-pointer px-0 pb-1 pt-0"
              >
                <span className="label-text text-sm font-medium text-base-content">
                  Team name
                </span>
              </label>
              <input
                id="team_name_update"
                name="team_name"
                type="text"
                maxLength={TEXT_MAX}
                disabled={disabledFields}
                title={`Optional. Max ${TEXT_MAX} characters.`}
                className={field}
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="form-control">
              <label
                htmlFor="position_update"
                className="label cursor-pointer px-0 pb-1 pt-0"
              >
                <span className="label-text text-sm font-medium text-base-content">
                  Position
                </span>
              </label>
              <input
                id="position_update"
                name="position"
                type="text"
                maxLength={TEXT_MAX}
                disabled={disabledFields}
                title={`Optional. Max ${TEXT_MAX} characters.`}
                className={field}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="form-control">
              <label
                htmlFor="jersey_no_update"
                className="label cursor-pointer px-0 pb-1 pt-0"
              >
                <span className="label-text text-sm font-medium text-base-content">
                  Jersey number
                </span>
              </label>
              <input
                id="jersey_no_update"
                name="jersey_no"
                type="number"
                min={0}
                step={1}
                disabled={disabledFields}
                title="Whole number ≥ 0, or leave empty to clear."
                className={`${field} font-mono tabular-nums`}
                value={jersey}
                onChange={(e) => setJersey(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="form-control">
              <label
                htmlFor="contact_no_update"
                className="label cursor-pointer px-0 pb-1 pt-0"
              >
                <span className="label-text text-sm font-medium text-base-content">
                  Contact number
                </span>
              </label>
              <input
                id="contact_no_update"
                name="contact_no"
                type="text"
                inputMode="numeric"
                disabled={disabledFields}
                pattern="^(|[0-9]{7,15})$"
                maxLength={15}
                title="7–15 digits only, or leave empty to clear."
                className={`${field} font-mono tabular-nums`}
                value={contact}
                onChange={(e) =>
                  setContact(e.target.value.replace(/\D/g, "").slice(0, 15))
                }
                placeholder="7–15 digits or clear"
              />
            </div>
          </div>
        </section>

        <footer className="space-y-4 border-t border-slate-200/80 pt-6 dark:border-slate-700/80">
          <p className="text-xs leading-relaxed text-base-content/50">
            Updates are validated on the server. Fix any error message and
            submit again — your edits stay in the form until a successful save.
          </p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={!playerId || actionPending}
              className="inline-flex min-h-11 min-w-[11rem] shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-800 shadow-sm transition-[background-color,border-color,transform] hover:border-red-300 hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none dark:border-red-900/60 dark:bg-red-950/35 dark:text-red-100 dark:hover:border-red-800 dark:hover:bg-red-950/55 dark:focus-visible:outline-red-500 dark:disabled:border-slate-700 dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
            >
              {isDeletePending ? (
                <>
                  <span className="loading loading-spinner loading-sm text-red-700 dark:text-red-200" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="size-4 shrink-0 opacity-95" aria-hidden />
                  Delete player
                </>
              )}
            </button>
            <button
              type="submit"
              disabled={isSavePending || !playerId || isDeletePending}
              className="inline-flex min-h-11 min-w-[11rem] shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-[background-color,box-shadow,transform] hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus-visible:outline-blue-400 dark:disabled:bg-slate-600"
            >
              {isSavePending ? (
                <>
                  <span className="loading loading-spinner loading-sm text-white" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="size-4 shrink-0 opacity-95" aria-hidden />
                  Save changes
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </form>
  );
}
