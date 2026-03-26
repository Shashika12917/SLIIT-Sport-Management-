"use client";

import {
  type FormEvent,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { CheckCircle2, CircleAlert, UserPlus } from "lucide-react";
import { createPlayerProfileAction, type CreatePlayerActionState } from "./actions";
import {
  INITIAL_CREATE_PLAYER_VALUES,
  type CreatePlayerFormValues,
} from "./create-player-form-values";
import { CreatePlayerFormFields } from "./CreatePlayerFormFields";

export function CreatePlayerForm() {
  const [values, setValues] = useState<CreatePlayerFormValues>(
    INITIAL_CREATE_PLAYER_VALUES,
  );
  const [state, formAction] = useActionState(
    createPlayerProfileAction,
    null as CreatePlayerActionState,
  );
  const [isPending, startTransition] = useTransition();
  const lastHandledSuccess = useRef<CreatePlayerActionState>(null);

  useEffect(() => {
    if (state?.ok !== true) {
      return;
    }
    if (lastHandledSuccess.current === state) {
      return;
    }
    lastHandledSuccess.current = state;
    setValues(INITIAL_CREATE_PLAYER_VALUES);
  }, [state]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) {
      return;
    }
    startTransition(() => {
      formAction(new FormData(form));
    });
  }

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
        {state != null && (
          <div
            role="alert"
            className={
              state.ok
                ? "flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100"
                : "flex gap-3 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100"
            }
          >
            {state.ok ? (
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
            <span className="leading-relaxed">{state.message}</span>
          </div>
        )}

        <header className="space-y-2 border-b border-slate-200/80 pb-5 dark:border-slate-700/80">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Player registration
          </p>
          <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
            New player profile
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-base-content/65">
            Complete the fields below. Student ID is{" "}
            <strong className="font-medium text-base-content">IT</strong> plus
            eight digits. Required items are marked with{" "}
            <span className="font-medium text-red-500 dark:text-red-400">*</span>
            .
          </p>
        </header>

        <CreatePlayerFormFields values={values} setValues={setValues} />

        <footer className="flex flex-col gap-4 border-t border-slate-200/80 pt-6 dark:border-slate-700/80 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-base-content/50">
            Submissions are checked on the server. If something is wrong, fix it
            and try again — your entries stay in the form.
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-11 min-w-[11rem] shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-[background-color,box-shadow,transform] hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none dark:bg-blue-500 dark:hover:bg-blue-400 dark:focus-visible:outline-blue-400 dark:disabled:bg-slate-600"
          >
            {isPending ? (
              <>
                <span className="loading loading-spinner loading-sm text-white" />
                Creating…
              </>
            ) : (
              <>
                <UserPlus className="size-4 shrink-0 opacity-95" aria-hidden />
                Create player
              </>
            )}
          </button>
        </footer>
      </div>
    </form>
  );
}
