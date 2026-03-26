/** PostgREST returns many-to-one embeds as an object; some clients/types use an array. */
export function asSingle<T>(rel: T | T[] | null | undefined): T | undefined {
  if (rel == null) return undefined;
  return Array.isArray(rel) ? rel[0] : rel;
}
