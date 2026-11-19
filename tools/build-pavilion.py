"""Rebuild only the lotus pavilion (4 columns) with Blender.

Run: blender --background --factory-startup --python tools/build-pavilion.py
Reuses the Model helper of build-sacred-assets.py without regenerating the scan-based statues.
"""
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
source = (HERE / 'build-sacred-assets.py').read_text(encoding='utf-8')
head = source.split('\ndef lotus(', 1)[0]
exec(compile(head, 'build-sacred-assets-head', 'exec'))


def pavilion():
    m = Model('dinh-sen-blender')
    m.box('stone', 0, .06, 0, 5.2, .12, 5.2)
    m.box('wood', 0, .145, 0, 4.6, .055, 4.6)
    for x, z, w, d in [(0, -2.3, 4.6, .14), (2.3, 0, .14, 4.6)]:
        m.box('wood', x, .48, z, w, .5, d)
    for x in [-1.9, 1.9]:
        for z in [-1.9, 1.9]:
            m.box('stone', x, .26, z, .42, .16, .42)
            m.branch('wood', (x, .32, z), (x, 2.94, z), .18, .16, 10)
            m.box('gold', x, 2.95, z, .55, .15, .55)
    for z in [-1.9, 1.9]:
        m.box('wood', 0, 2.92, z, 4.35, .28, .3)
    for x in [-1.9, 1.9]:
        m.box('wood', x, 2.92, 0, .3, .28, 4.35)
    for side in [-1, 1]:
        for x in [-1.15, 0, 1.15]:
            m.branch('wood', (x, 2.87, side * 1.9), (x, 3.42, side * .85), .09, .065, 7)
    m.hip(6.4, 6, 3.08, 1.6, .55)
    m.branch('gold', (0, 4.68, 0), (0, 5.12, 0), .11, .02, 9)
    return m.export(9000)


report = [pavilion()]
print('PAVILION_AUDIT', json.dumps(report))
