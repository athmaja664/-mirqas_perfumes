export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FCF8F0]/80 backdrop-blur-sm pointer-events-none"
      role="status"
      aria-label="Loading"
    >
      <div className="mirqas-spinner" />
    </div>
  );
}
