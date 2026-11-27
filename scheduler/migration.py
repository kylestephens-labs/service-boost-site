"""Compare opaque booking inventory and slot sets before transferring new traffic."""
from collections import Counter

from engine import CalendarUnavailable


def legacy_intervals(expected, matched, verified_blocks):
    """Reconcile (event kind, UTC start, UTC end) without attendee information.

    verified_blocks maps each historic event to independently evidenced occupancy
    bounds, including its actual before/after buffers or a verified transition
    hold. Unknown bounds block handoff. Current event rules are never applied.
    """
    expected = tuple(expected)
    if Counter(expected) != Counter(matched) or set(expected) != set(verified_blocks):
        raise CalendarUnavailable('Legacy inventory or buffer evidence is incomplete.')
    occupied = []
    for event in expected:
        kind, start, end = event
        bounds = verified_blocks[event]
        if (kind not in ('local', 'remote') or not isinstance(bounds, (list, tuple))
                or len(bounds) != 2 or not all(type(t) is int for t in (*bounds, start, end))
                or not bounds[0] <= start < end <= bounds[1]):
            raise CalendarUnavailable('Unverified legacy busy interval.')
        occupied.append(bounds)
    return occupied


def replace_legacy_snapshot(engine, expected, matched, verified_blocks):
    occupied = legacy_intervals(expected, matched, verified_blocks)
    with engine.transaction(True) as db:
        db.execute('DELETE FROM legacy_busy')
        db.executemany('INSERT INTO legacy_busy VALUES (?,?)', occupied)


def compare_slots(engine, reference):
    """Compare explicit (service ID, Pacific date) samples, including closed days."""
    differences = {}
    if not reference:
        raise ValueError('At least one reference day is required.')
    with engine.transaction() as db:
        for (service, day), expected in reference.items():
            actual = set(engine.slots(db, service, day))
            expected = set(expected)
            if expected != actual:
                differences[service, day] = {'missing': sorted(expected - actual),
                                             'extra': sorted(actual - expected)}
    return differences
