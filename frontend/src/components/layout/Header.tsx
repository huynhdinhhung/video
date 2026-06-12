import Link from "next/link";
import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Film className="h-5 w-5 text-violet-500" />
          VideoTranslate
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/jobs">Jobs</Link>
          </Button>
          <Button asChild>
            <Link href="/upload">Upload video</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
