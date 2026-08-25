import { notFound } from 'next/navigation';

/** Reached only when someone tries /admin while a custom ADMIN_PATH is set. */
export default function HiddenAdmin() {
  notFound();
}
