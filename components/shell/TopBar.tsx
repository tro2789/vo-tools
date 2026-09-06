'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MessageCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const TABS = [
  { label: 'Analysis', href: '/script-analysis' },
  { label: 'Teleprompter', href: '/teleprompter' },
  { label: 'Convert', href: '/telephony-converter' },
  { label: 'ACX', href: '/acx-check' },
] as const;

const DISCORD_URL = 'https://discord.gg/gYg69PbHfR';
const SUPPORT_URL = 'https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02';

export function TopBar() {
  const pathname = usePathname();

  if (pathname === '/remote') {
    return null;
  }

  if (pathname === '/') {
    return (
      <header className="flex h-12 items-center justify-between gap-4 border-b border-line bg-panel px-5">
        <Link href="/" className="text-[13px] font-bold tracking-[0.16em] text-ink">
          VO TOOLS
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle variant="light" />
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[28px] items-center gap-[6px] border border-line-strong px-[10px] text-[12px] font-medium text-body"
          >
            <MessageCircle width={13} height={13} aria-hidden="true" />
            <span className="hidden sm:inline">Discord</span>
          </a>
          <a
            href={SUPPORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[28px] items-center gap-[6px] bg-button px-3 text-[12px] font-medium text-panel"
          >
            <Heart width={13} height={13} className="fill-current" aria-hidden="true" />
            <span className="hidden sm:inline">Support</span>
          </a>
        </div>
      </header>
    );
  }

  return (
    <header className="flex h-11 items-center justify-between gap-3 bg-bar px-4">
      <div className="flex min-w-0 items-center gap-4 md:gap-6">
        <Link
          href="/"
          className="shrink-0 text-[12px] font-bold tracking-[0.16em] text-white"
        >
          VO TOOLS
        </Link>
        <nav
          aria-label="Tools"
          className="scrollbar-hide flex min-w-0 items-center gap-1 overflow-x-auto"
        >
          {TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-11 shrink-0 items-center px-3 text-[12px] whitespace-nowrap ${
                  active ? 'bg-page font-medium text-ink' : 'text-bar-text'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle variant="bar" />
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Discord"
          className="flex h-[26px] items-center gap-[6px] border border-bar-line px-[10px] text-[12px] text-bar-bright"
        >
          <MessageCircle width={13} height={13} aria-hidden="true" />
          <span className="hidden md:inline">Discord</span>
        </a>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Support"
          className="flex h-[26px] items-center gap-[6px] bg-white px-[10px] text-[12px] font-medium text-stage"
        >
          <Heart width={13} height={13} className="fill-current" aria-hidden="true" />
          <span className="hidden md:inline">Support</span>
        </a>
      </div>
    </header>
  );
}
