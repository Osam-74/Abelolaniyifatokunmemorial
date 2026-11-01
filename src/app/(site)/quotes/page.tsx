import { permanentRedirect } from 'next/navigation';

// Old address kept alive so links people already shared still work.
export default function Page() {
  permanentRedirect('/biography#words');
}
