"use client";

import {
  createSocietyAction,
  deleteSocietyAction,
  updateSocietyStatusAction,
} from "../actions";

type Society = {
  id: string;
  name: string;
  description: string | null;
  status: string;
};

export function SocietiesSection(props: { societies: Society[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Societies</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage societies that own teams.
          </p>
        </div>

        <form action={createSocietyAction} className="grid w-full gap-2 sm:grid-cols-[1.2fr_1fr_auto] lg:max-w-[570px]">
          <input
            type="text"
            name="name"
            placeholder="Society name"
            className="h-10 rounded-md border border-base-300 bg-base-100 px-3 text-sm"
            required
          />
          <input
            type="text"
            name="description"
            placeholder="Description (optional)"
            className="h-10 rounded-md border border-base-300 bg-base-100 px-3 text-sm"
          />
          <button
            type="submit"
            className="h-10 rounded-md bg-neutral px-5 text-sm font-semibold text-neutral-content"
          >
            Add Society
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-md border border-base-300 bg-base-100">
        <table className="min-w-full text-left">
          <thead className="border-b border-base-300 bg-base-200/70 text-sm">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Description</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {props.societies.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-8 text-center text-base text-muted-foreground"
                >
                  No societies yet. Create your first society using the form
                  above.
                </td>
              </tr>
            ) : (
              props.societies.map((society) => (
                <tr key={society.id} className="border-t border-base-300 text-sm">
                  <td className="px-4 py-3">{society.name}</td>
                  <td className="px-4 py-3">
                    {society.description ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateSocietyStatusAction}>
                      <input type="hidden" name="societyId" value={society.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={society.status === "active" ? "inactive" : "active"}
                      />
                      <button
                        type="submit"
                        className={
                          society.status === "active"
                            ? "inline-flex rounded-full bg-success/20 px-3 py-1 text-sm font-semibold text-success"
                            : "inline-flex rounded-full bg-warning/20 px-3 py-1 text-sm font-semibold text-warning"
                        }
                      >
                        {society.status === "active" ? "Active" : "Inactive"}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <form action={deleteSocietyAction}>
                      <input type="hidden" name="societyId" value={society.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-error/50 px-3 py-1 text-sm font-medium text-error"
                      >
                        Delete
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

