import { siteConfig } from "@/data/siteConfig";

/**
 * Verified public profiles. Kept as plain links (no icon library) so the
 * markup stays light and every link has a readable accessible name.
 */
export function SocialLinks({ className = "" }: { className?: string }) {
  const links = [
    { href: siteConfig.social.facebook, label: "Facebook" },
    { href: siteConfig.social.x, label: "X (Twitter)" },
  ].filter((link) => link.href);

  if (links.length === 0) return null;

  return (
    <nav aria-label="Social media" className={className}>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/50 underline-offset-4 transition-colors hover:text-primary-foreground hover:underline"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
