const LINKS_LEFT = [
  { label: 'VOTRAINER', href: 'https://votrainer.com' },
  { label: "TREVOR O'HARE", href: 'https://trevorohare.com' },
  { label: 'REALVOTALENT', href: 'https://realvotalent.com' },
];

const LINKS_RIGHT = [
  { label: 'DISCORD', href: 'https://discord.gg/gYg69PbHfR' },
  { label: 'SOURCE', href: 'https://github.com/tro2789/vo-tools' },
  { label: 'SUPPORT', href: 'https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02' },
];

export function Footer() {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 bg-panel px-5 py-[14px] text-[11px] text-muted">
      <div className="flex flex-wrap gap-4">
        {LINKS_LEFT.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-ink"
          >
            {link.label}
          </a>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {LINKS_RIGHT.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted transition-colors hover:text-ink"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
