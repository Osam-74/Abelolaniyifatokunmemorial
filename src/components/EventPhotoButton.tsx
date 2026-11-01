'use client';

import ContributePhotoButton from './ContributePhotoButton';

/** "Share your photographs" for one event. Photographs wait for the family's approval before they appear. */
export default function EventPhotoButton({ eventId, eventTitle }: { eventId: number; eventTitle: string }) {
  return (
    <div className="w-full sm:w-auto" aria-label={`Share a photograph from ${eventTitle}`}>
      <ContributePhotoButton eventId={eventId} label="Share a photograph from the day" className="btn btn-ghost" />
    </div>
  );
}
