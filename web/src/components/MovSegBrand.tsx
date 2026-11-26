import Image from "next/image";
import Link from "next/link";

export function MovSegBrand({ className }: { className?: string }) {
  return (
    <Link href="/" className={`movseg-brand ${className ?? ""}`} aria-label="MovSeg, início">
      <Image src="/movseg-logo.png" alt="" width={344} height={340} />
    </Link>
  );
}
