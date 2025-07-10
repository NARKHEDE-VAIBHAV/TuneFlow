import { Music2 } from "lucide-react";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Music2 className="h-6 w-6 text-primary" />
      <h1 className="font-headline text-xl font-bold text-primary">TuneFlow</h1>
    </Link>
  );
}
