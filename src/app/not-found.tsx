import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink px-5 text-center text-mist">
      <div>
        <p className="eyebrow text-soft/70">Page not found</p>
        <h1 className="mt-4 font-display text-4xl">This page is not part of the memorial</h1>
        <p className="mx-auto mt-4 max-w-md text-mist/65">
          The link may be old, or the page may have been renamed.
        </p>
        <Link href="/" className="btn bg-mist text-ink hover:bg-soft mt-8">
          Return to the memorial
        </Link>
      </div>
    </div>
  );
}
