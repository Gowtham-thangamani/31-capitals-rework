import { cookies } from "next/headers";
import { isDbConfigured } from "@/lib/db";
import { ADMIN_COOKIE_NAME, adminPasswordConfigured, isAdminSessionValid } from "@/lib/verification";
import { LoginForm } from "@/app/admin/login-form";
import { LeadsTable } from "@/app/admin/leads-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads | 31 Capitals", robots: { index: false, follow: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#060606] px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-7xl">{children}</div>
    </main>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-orange-400/30 bg-orange-500/10 p-6">
      <p className="font-semibold text-orange-100">{title}</p>
      <p className="mt-2 text-sm leading-6 text-white/60">{body}</p>
    </div>
  );
}

export default async function AdminPage() {
  if (!adminPasswordConfigured()) {
    return (
      <Shell>
        <Notice
          title="Admin password not set"
          body="Set ADMIN_PASSWORD in your environment to enable this page. Until it is set the panel stays closed, so lead data is never exposed."
        />
      </Shell>
    );
  }

  if (!isAdminSessionValid((await cookies()).get(ADMIN_COOKIE_NAME)?.value)) {
    return (
      <Shell>
        <LoginForm />
      </Shell>
    );
  }

  if (!isDbConfigured()) {
    return (
      <Shell>
        <Notice
          title="Database not connected"
          body="Set DATABASE_URL to a Postgres connection string to start recording leads. The registration form still works without it, but submissions are not being stored."
        />
      </Shell>
    );
  }

  // Rows are fetched client-side from /api/admin/leads so the table can filter,
  // paginate and refresh without a full page reload. That endpoint checks the
  // same session cookie, so lead data still never reaches an unauthenticated client.
  return (
    <Shell>
      <LeadsTable />
    </Shell>
  );
}
