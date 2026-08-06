export function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-6 bg-white" style={{ border: '1px solid rgba(43,38,32,.08)' }}>
      <p className="text-xs tracking-[.15em] uppercase opacity-50 mb-2">{label}</p>
      <p className="serif text-3xl" style={accent ? { color: 'var(--gold-deep)' } : undefined}>{value}</p>
    </div>
  );
}
