"""Verify Core font coverage, geometry and shaping. Requires fonttools[woff] + uharfbuzz."""
from pathlib import Path
from io import BytesIO
from math import isclose
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen
import uharfbuzz as hb

folder = Path(__file__).resolve().parents[2] / 'public/fonts/inter'
weights = [100, 300, 400, 500, 600, 700, 900]


def equal(a, b):
    if isinstance(a, (float, int)) and isinstance(b, (float, int)):
        return isclose(a, b, abs_tol=0.01)
    if isinstance(a, (tuple, list)) and isinstance(b, (tuple, list)):
        return len(a) == len(b) and all(equal(x, y) for x, y in zip(a, b))
    return a == b


def shape(font, text, weight, language, features):
    stream = BytesIO()
    font.flavor = None
    font.save(stream)
    face = hb.Face(stream.getvalue())
    shaped = hb.Font(face)
    shaped.set_variations({'wght': weight})
    buffer = hb.Buffer()
    buffer.add_str(text)
    buffer.guess_segment_properties()
    buffer.language = language
    hb.shape(shaped, buffer, features)
    glyphs = font.getGlyphSet(location={'wght': weight})
    result = []
    for info, pos in zip(buffer.glyph_infos, buffer.glyph_positions):
        glyph = glyphs[font.getGlyphName(info.codepoint)]
        pen = DecomposingRecordingPen(glyphs)
        glyph.draw(pen)
        # Subsetting renumbers unnamed alternate glyphs; compare their geometry,
        # not generated glyph IDs/names.
        result.append((info.cluster, pos.x_advance, pos.y_advance, pos.x_offset,
                       pos.y_offset, glyph.width, pen.value))
    return result


checks = 0
for subset in ['Latin', 'Cyrillic', 'Extras']:
    original = TTFont(folder / f'Inter{subset}.woff2')
    optimized = TTFont(folder / f'Inter{subset}Core.woff2')
    old_map, new_map = original.getBestCmap(), optimized.getBestCmap()
    assert set(old_map) == set(new_map), f'{subset}: lost or added encoded characters'
    assert original['head'].unitsPerEm == optimized['head'].unitsPerEm
    for table, fields in [('hhea', ['ascent', 'descent', 'lineGap']),
                          ('OS/2', ['sTypoAscender', 'sTypoDescender', 'sTypoLineGap', 'usWinAscent', 'usWinDescent'])]:
        assert all(getattr(original[table], field) == getattr(optimized[table], field) for field in fields), (subset, table, 'line metrics')
    assert [(a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in original['fvar'].axes] == [
        (a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in optimized['fvar'].axes]
    for weight in weights:
        old_glyphs = original.getGlyphSet(location={'wght': weight})
        new_glyphs = optimized.getGlyphSet(location={'wght': weight})
        for point in old_map:
            old_glyph, new_glyph = old_glyphs[old_map[point]], new_glyphs[new_map[point]]
            assert equal(old_glyph.width, new_glyph.width), (subset, weight, hex(point), 'advance')
            old_pen, new_pen = DecomposingRecordingPen(old_glyphs), DecomposingRecordingPen(new_glyphs)
            old_glyph.draw(old_pen)
            new_glyph.draw(new_pen)
            assert equal(old_pen.value, new_pen.value), (subset, weight, hex(point), 'outline')
            checks += 1
        samples = [
            ('ro', 'SPORTO AVATAR To Wa fi fl 0123456789 ĂăÂâÎîȘșȚțŞşŢţ A\u0306 S\u0326 T\u0326 €₽°×–—'),
            ('ru', 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ абвгдеёжзийклмнопрстуфхцчшщъыьэюя'),
            ('ro', '1/2 ½ ¼ ¾ 17–47 100,50 999.00 ←→±×'),
        ]
        for language, sample in samples:
            text = ''.join(c for c in sample if ord(c) in old_map)
            if not text:
                continue
            for features in [{}, {'tnum': True}]:
                assert equal(shape(original, text, weight, language, features), shape(
                    optimized, text, weight, language, features)), (subset, weight, language, features)
                checks += 1
    print(f'{subset}: encoded characters, outlines, widths and default/tabular shaping preserved.')
print(f'PASS: {checks} font checks across seven weights; RO/RU, combining accents and symbols preserved.')
