export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen px-8">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="font-heading text-5xl font-bold text-[#EDE8E1] leading-none tracking-tight">
          Sugar &amp; Leather
        </h1>
        <p className="font-heading text-2xl text-[#C5B8D4] font-normal leading-none">
          Vendor Portal
        </p>
        <p className="font-body text-sm text-[#A8A5AE] leading-relaxed max-w-sm mx-auto">
          Internal affiliate and vendor management. Sign in to access your partner dashboard or admin controls.
        </p>
        <div className="flex gap-4 justify-center pt-2">
          <a
            href="/login"
            className="inline-flex h-10 items-center px-6 rounded-sm bg-[#C5B8D4] text-[#0E0C0F] font-body text-sm font-medium transition-opacity hover:opacity-90"
          >
            Sign in
          </a>
          <a
            href="/apply"
            className="inline-flex h-10 items-center px-6 rounded-sm border border-[rgba(237,232,225,0.12)] text-[#EDE8E1] font-body text-sm transition-colors hover:border-[#C5B8D4] hover:text-[#C5B8D4]"
          >
            Apply as partner
          </a>
        </div>
      </div>
    </main>
  );
}
