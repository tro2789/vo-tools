'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Menu, MessageCircle, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const TABS = [
  { label: 'Analysis', href: '/' },
  { label: 'Teleprompter', href: '/teleprompter' },
  { label: 'Convert', href: '/telephony-converter' },
  { label: 'ACX', href: '/acx-check' },
] as const;

const DISCORD_URL = 'https://discord.gg/gYg69PbHfR';
const SUPPORT_URL = 'https://buy.stripe.com/cNi9ATc9WgzM906g7Zbwk02';

function isTabActive(href: (typeof TABS)[number]['href'], pathname: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function TopBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Close on route change (adjusting state during render, not in an effect).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Close on Escape and on click outside the header.
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  if (pathname === '/remote') {
    return null;
  }

  const currentTab = TABS.find((tab) => isTabActive(tab.href, pathname));

  return (
    <header ref={headerRef} className="relative flex h-11 items-center justify-between gap-3 bg-bar px-4">
      <div className="flex min-w-0 items-center gap-3 md:gap-6">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="mobile-nav-panel"
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center border border-bar-line text-bar-text md:hidden"
        >
          {open ? (
            <X width={14} height={14} aria-hidden="true" />
          ) : (
            <Menu width={14} height={14} aria-hidden="true" />
          )}
        </button>
        <Link
          href="/"
          className="shrink-0 text-[12px] font-bold tracking-[0.16em] text-white"
        >
          VO TOOLS
        </Link>
        {currentTab ? (
          <span className="truncate text-[12px] font-medium text-page md:hidden">
            {currentTab.label}
          </span>
        ) : null}
        <nav
          aria-label="Tools"
          className="scrollbar-hide hidden min-w-0 items-center gap-1 overflow-x-auto md:flex"
        >
          {TABS.map((tab) => {
            const active = isTabActive(tab.href, pathname);
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
      {open ? (
        <div
          id="mobile-nav-panel"
          className="absolute top-11 right-0 left-0 z-50 border-t border-bar-line bg-bar md:hidden"
        >
          {TABS.map((tab) => {
            const active = isTabActive(tab.href, pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={`flex h-11 items-center pl-4 text-[12px] ${
                  active ? 'bg-page font-medium text-ink' : 'text-bar-text'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </header>
  );
}
