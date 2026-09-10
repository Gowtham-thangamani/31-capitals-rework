import { cookies } from "next/headers";
import { isDbConfigured } from "@/lib/db";
import { ADMIN_COOKIE_NAME, adminPasswordConfigured, isAdminSessionValid } from "@/lib/verification";
import { LoginForm } from "@/app/admin/login-form";
import { LeadsTable } from "@/app/admin/leads-table";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads | 31 Capitals", robots: { index: false, follow: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="admin-scope relative min-h-screen overflow-hidden">
      {/* A single warm bloom, echoing the site without competing with the data */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{ background: "radial-gradient(ellipse 70% 100% at 50% 0%, var(--a-bloom), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-8">{children}</div>
    </main>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="mx-auto max-w-lg rounded-[1.5rem] p-7"
      style={{ border: "1px solid var(--a-border-strong)", background: "var(--a-accent-soft)" }}
    >
      <p className="font-display text-lg" style={{ color: "var(--a-accent)" }}>{title}</p>
      <p className="mt-2 text-sm leading-6" style={{ color: "var(--a-muted)" }}>{body}</p>
    </div>
  );
}

export default async function AdminPage() {
  if (!adminPasswordConfigured()) {
    return (
      <Shell>
        <Notice
          title="Admin password not set"
          body="Set ADMIN_PASSWORD in your environment to open this page. Until it is set the panel stays closed, so lead data is never exposed."
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
  // paginate and refresh without a reload. That endpoint checks the same session
  // cookie, so lead data still never reaches an unauthenticated client.
  return (
    <Shell>
      <LeadsTable />
    </Shell>
  );
}
