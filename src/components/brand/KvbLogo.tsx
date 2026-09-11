import { cn } from "@/lib/utils";

/**
 * KVB's wordmark, the path from their official logo (static.kvbplus.com/home/images/logo.svg).
 * KVB prints it navy (#0E1F3D) on white; on this near-black site navy would vanish, so the
 * same shape takes the current text colour instead.
 */
export function KvbLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 54 24" role="img" aria-label="KVB" fill="currentColor" className={className}>
      <path d="M47.625 3.02734C50.656 3.02757 53.124 5.49527 53.124 8.52637C53.124 9.78705 52.7216 10.9675 51.917 11.96L51.8896 12.0137L51.917 12.0674C52.6948 13.0599 53.124 14.2403 53.124 15.501C53.124 18.532 50.656 20.9998 47.625 21H31.583L33.0049 16.6816H47.625C48.2686 16.6814 48.8046 16.1446 48.8047 15.501C48.8047 14.8573 48.2686 14.3205 47.625 14.3203H33.7832L35.2852 9.70703H47.5977C48.2414 9.70703 48.7783 9.17016 48.7783 8.52637C48.7783 7.88257 48.2415 7.3457 47.5977 7.3457H36.0635L37.4844 3.02734H47.625ZM5.60645 3V9.89355L11.9102 3H18.8047L10.5957 11.96L10.5693 11.9863L18.8047 20.9727H11.9102L5.60645 14.1055V20.9727H0V3H5.60645ZM28.0645 20.9727H23.29L16.9326 6.94336L20.5 3.05371L25.6768 13.8906L30.8809 3H36.1924L28.0645 20.9727Z" />
    </svg>
  );
}

/** "Introducing Broker partner of KVB", with KVB's wordmark standing in for the name. */
export function KvbPartner({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-white/55", className)}>
      Introducing Broker partner of
      <KvbLogo className="h-5 w-auto text-white" />
    </p>
  );
}
