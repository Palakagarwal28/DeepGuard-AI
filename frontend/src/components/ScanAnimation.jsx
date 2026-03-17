export default function ScanAnimation() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl z-20 pointer-events-none">
      <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(127,90,240,1)] animate-scan" />
    </div>
  );
}
