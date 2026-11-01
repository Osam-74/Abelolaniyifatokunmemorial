// Run with: npx tsx tests/event-state.test.mjs
import assert from 'node:assert/strict';
import { isHeld, todayKey, toDateKey } from '../src/lib/eventState.ts';

// 23:30 UTC on 31 Oct is already 00:30 on 1 Nov in Lagos (UTC+1).
const lateUtc = new Date('2026-10-31T23:30:00Z');
assert.equal(todayKey(lateUtc), '2026-11-01');
// 22:59 UTC on 31 Oct is still 23:59 on 31 Oct in Lagos.
assert.equal(todayKey(new Date('2026-10-31T22:59:00Z')), '2026-10-31');

const now = new Date('2026-11-01T11:00:00Z');
assert.equal(isHeld({ event_date: '2026-10-30' }, now), true,  'yesterday-ish is held');
assert.equal(isHeld({ event_date: '2026-11-01' }, now), false, 'today is NOT yet held');
assert.equal(isHeld({ event_date: '2026-11-02' }, now), false, 'future is upcoming');
assert.equal(isHeld({ event_date: null }, now), false, 'no date = to be confirmed, not held');
// the Lagos midnight edge: an event dated 31 Oct becomes held at 00:30 Lagos on 1 Nov, not before
assert.equal(isHeld({ event_date: '2026-10-31' }, new Date('2026-10-31T22:59:00Z')), false);
assert.equal(isHeld({ event_date: '2026-10-31' }, lateUtc), true);
// manual overrides win over the date
assert.equal(isHeld({ event_date: '2030-01-01', held_state: 'held' }, now), true);
assert.equal(isHeld({ event_date: '2020-01-01', held_state: 'upcoming' }, now), false);
assert.equal(isHeld({ event_date: '2020-01-01', held_state: 'auto' }, now), true);
assert.equal(isHeld({ event_date: null, held_state: 'held' }, now), true);
// pg DATE objects and strings
assert.equal(toDateKey(new Date(2026, 9, 30)), '2026-10-30');
assert.equal(toDateKey('2026-10-30T00:00:00.000Z'), '2026-10-30');
assert.equal(toDateKey(null), null);
assert.equal(toDateKey('garbage'), null);
console.log('event-state: 16 checks passed');
