import { redirect } from 'next/navigation';

// The memorial opens on his life story.
export default function Home() {
  redirect('/biography');
}
