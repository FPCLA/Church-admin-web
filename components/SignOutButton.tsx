import { signOut } from "@/app/actions/auth";

export function SignOutButton({ label }: { label: string }) {
  return (
    <form action={signOut}>
      <button
        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        type="submit"
      >
        {label}
      </button>
    </form>
  );
}
