"""Compare opaque booking inventory and slot sets before transferring new traffic."""
from collections import Counter

from engine import CalendarUnavailable


def legacy_intervals(expected, matched, rules):
    """Both inputs contain only (event kind, UTC start second), including duplicates.

    expected is the active Calendly inventory, matched the independently reconciled
    calendar blocks. A mismatch stops replacement of the entire interval snapshot.
    """
    expected = tuple(expected)
    if Counter(expected) != Counter(matched):
        raise CalendarUnavailable('Existing appointment inventory differs.')
    occupied = []
    for kind, start in expected:
        rule = rules[kind]
        occupied.append((start - rule.before * 60, start + (rule.minutes + rule.after) * 60))
    return occupied


def replace_legacy_snapshot(engine, expected, matched):
    occupied = legacy_intervals(expected, matched, engine.rules)
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
