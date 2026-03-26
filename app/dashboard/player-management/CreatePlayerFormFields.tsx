"use client";

import type { ReactNode } from "react";
import { FACULTY_OPTIONS } from "./create-player-validation";
import type { CreatePlayerFormValues } from "./create-player-form-values";
import { StudentIdInput } from "./StudentIdInput";

type Props = {
  values: CreatePlayerFormValues;
  setValues: React.Dispatch<React.SetStateAction<CreatePlayerFormValues>>;
};

const field =
  "input input-bordered input-md w-full rounded-lg border-slate-200 bg-base-100 text-sm transition-[border-color,box-shadow] placeholder:text-base-content/40 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 dark:border-slate-600";

const selectField =
  "select select-bordered select-md w-full rounded-lg border-slate-200 bg-base-100 text-sm transition-[border-color,box-shadow] focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15 dark:border-slate-600";

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="label cursor-pointer px-0 pb-1 pt-0">
      <span className="label-text text-sm font-medium text-base-content">
        {children}
        {required ? (
          <span className="ml-0.5 text-red-500 dark:text-red-400" title="Required">
            *
          </span>
        ) : null}
      </span>
    </label>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 dark:border-slate-700/60 dark:bg-base-200/30">
      <div className="mb-4 flex items-center gap-2 border-b border-slate-200/70 pb-3 dark:border-slate-600/60">
        <span className="h-8 w-1 shrink-0 rounded-full bg-blue-600 dark:bg-blue-500" />
        <div>
          <h3 className="text-sm font-semibold text-base-content">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-base-content/55">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** Controlled fields so server-action + RSC refresh cannot wipe values on validation errors. */
export function CreatePlayerFormFields({ values, setValues }: Props) {
  const patch = (partial: Partial<CreatePlayerFormValues>) => {
    setValues((v) => ({ ...v, ...partial }));
  };

  return (
    <div className="flex flex-col gap-5">
      <Section
        title="Student & contact"
        description="Identification and how we reach this person."
      >
        <div className="form-control sm:col-span-1">
          <FieldLabel htmlFor="student_id" required>
            Student ID
          </FieldLabel>
          <StudentIdInput
            digits={values.studentDigits}
            onDigitsChange={(studentDigits) => patch({ studentDigits })}
          />
        </div>

        <div className="form-control sm:col-span-1">
          <FieldLabel htmlFor="full_name" required>
            Full name
          </FieldLabel>
          <input
            id="full_name"
            name="full_name"
            required
            type="text"
            minLength={1}
            autoComplete="name"
            title="Full name cannot be empty."
            className={field}
            value={values.fullName}
            onChange={(e) => patch({ fullName: e.target.value })}
            placeholder="Registered name"
          />
        </div>

        <div className="form-control sm:col-span-1">
          <FieldLabel htmlFor="email" required>
            Email
          </FieldLabel>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            title="Enter a valid email address."
            className={field}
            value={values.email}
            onChange={(e) => patch({ email: e.target.value })}
            placeholder="name@university.edu"
          />
        </div>

        <div className="form-control sm:col-span-1">
          <FieldLabel htmlFor="contact_no" required>
            Contact number
          </FieldLabel>
          <input
            id="contact_no"
            name="contact_no"
            type="text"
            inputMode="numeric"
            required
            pattern="[0-9]{7,15}"
            title="7–15 digits, numbers only (no spaces)."
            className={`${field} font-mono tabular-nums`}
            value={values.contact}
            onChange={(e) => patch({ contact: e.target.value })}
            placeholder="7–15 digits"
          />
        </div>
      </Section>

      <Section title="Academic" description="Faculty and cohort.">
        <div className="form-control sm:col-span-1">
          <FieldLabel htmlFor="faculty" required>
            Faculty
          </FieldLabel>
          <select
            id="faculty"
            name="faculty"
            required
            className={selectField}
            title="Select a faculty."
            value={values.faculty}
            onChange={(e) => patch({ faculty: e.target.value })}
          >
            {FACULTY_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control sm:col-span-1">
          <FieldLabel htmlFor="batch" required>
            Batch
          </FieldLabel>
          <input
            id="batch"
            name="batch"
            type="text"
            required
            minLength={1}
            title="Batch cannot be empty."
            className={field}
            value={values.batch}
            onChange={(e) => patch({ batch: e.target.value })}
            placeholder="e.g. 2024"
          />
        </div>
      </Section>

      <Section
        title="Sport & team"
        description="Sport name is required (letters/words — not numbers only). Other fields are optional."
      >
        <div className="form-control sm:col-span-1">
          <FieldLabel htmlFor="sport" required>
            Sport
          </FieldLabel>
          <input
            id="sport"
            name="sport"
            type="text"
            required
            minLength={1}
            pattern="^(?!\d+$).+$"
            title="Enter a sport name (e.g. Football). Numbers-only values are not allowed."
            className={field}
            value={values.sport}
            onChange={(e) => patch({ sport: e.target.value })}
            placeholder="e.g. Football, Cricket"
          />
        </div>

        <div className="form-control sm:col-span-1">
          <FieldLabel htmlFor="team_name">Team name</FieldLabel>
          <input
            id="team_name"
            name="team_name"
            type="text"
            className={field}
            value={values.teamName}
            onChange={(e) => patch({ teamName: e.target.value })}
            placeholder="Optional"
          />
        </div>

        <div className="form-control sm:col-span-1">
          <FieldLabel htmlFor="position">Position</FieldLabel>
          <input
            id="position"
            name="position"
            type="text"
            className={field}
            value={values.position}
            onChange={(e) => patch({ position: e.target.value })}
            placeholder="Optional"
          />
        </div>

        <div className="form-control sm:col-span-1">
          <FieldLabel htmlFor="jersey_no">Jersey number</FieldLabel>
          <input
            id="jersey_no"
            name="jersey_no"
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            title="Optional. If set, must be a whole number (0 or greater)."
            className={`${field} font-mono tabular-nums`}
            value={values.jersey}
            onChange={(e) => patch({ jersey: e.target.value })}
            placeholder="Optional"
          />
        </div>
      </Section>
    </div>
  );
}
