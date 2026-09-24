'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import AdminIcon from './AdminIcon';
import SignOutButton from './SignOutButton';
import '../../app/admin/admin-shell.css';

export type AdminNavItem = { href: string; label: string; icon: string; badge?: number };
export type AdminNavSection = { label: string; items: AdminNavItem[] };

/**
 * The admin's header + sidebar, restructured to match EduCBT's PortalShell:
 * a fixed, always-visible sidebar on desktop; a topbar carrying the page
 * title and actions; and on mobile a real native <dialog> drawer opened by
 * a hamburger in that topbar, instead of the nav just being hidden/shown
 * inline above the content.
 */
export default function AdminShell({
  base,
  email,
  sections,
  loginHref,
  children,
}: {
  base: string;
  email: string;
  sections: AdminNavSection[];
  loginHref: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const burger = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (open) drawer.current?.showModal();
    else drawer.current?.close();
    const previous = document.body.style.overflow;
    if (open) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 901px)');
    const change = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);

  const allItems = sections.flatMap((s) => s.items);
  const activeHref = allItems
    .map((i) => i.href)
    .filter((href) => pathname === href || (href !== base && pathname.startsWith(href + '/')))
    .sort((a, b) => b.length - a.length)[0];
  const title = allItems.find((i) => i.href === activeHref)?.label ?? 'Overview';

  const navigation = () => (
    <>
      <div className="as-brand">
        <span className="as-brand-mark">
          <AdminIcon name="grid" />
        </span>
        <div>
          <strong>Memorial admin</strong>
          <span>Content dashboard</span>
        </div>
      </div>
      <div className="as-account">
        <strong>Signed in</strong>
        <span>{email}</span>
      </div>
      <div className="as-scroll">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="as-label">{section.label}</p>
            <nav aria-label={`${section.label} navigation`}>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={item.href === activeHref ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  <span>
                    <AdminIcon name={item.icon} />
                    {item.label}
                  </span>
                  {!!item.badge && <span className="as-badge">{item.badge}</span>}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </div>
      <div className="as-footer">
        <Link href="/" target="_blank" onClick={() => setOpen(false)}>
          View the website ↗
        </Link>
      </div>
    </>
  );

  return (
    <div className="admin-shell">
      <a className="as-skip" href="#admin-main">
        Skip to content
      </a>
      <aside className="as-sidebar" aria-label="Admin sidebar">
        {navigation()}
      </aside>
      <dialog
        ref={drawer}
        className="as-drawer"
        aria-label="Admin navigation"
        onCancel={() => setOpen(false)}
        onClose={() => {
          setOpen(false);
          burger.current?.focus();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false);
        }}
      >
        <div className="as-drawer-inner">
          <button className="as-close" type="button" onClick={() => setOpen(false)}>
            Close menu ×
          </button>
          {navigation()}
        </div>
      </dialog>
      <div className="as-workspace">
        <header className="as-topbar">
          <button
            ref={burger}
            className="as-burger"
            type="button"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <AdminIcon name="menu" />
          </button>
          <strong>{title}</strong>
          <div className="as-topbar-actions">
            <Link href="/" target="_blank">
              View the website ↗
            </Link>
            <SignOutButton loginHref={loginHref} />
          </div>
        </header>
        <main id="admin-main" className="admin-shell__body" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
