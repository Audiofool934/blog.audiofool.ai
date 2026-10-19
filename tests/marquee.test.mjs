import assert from "node:assert/strict";
import { test } from "node:test";
import { overflowDistance, scrollTiming } from "../src/scripts/audio/marquee.ts";

test("only text that overflows a visible box scrolls", () => {
    assert.equal(overflowDistance(180, 102), 78);
    assert.equal(overflowDistance(102, 102), 0);
    assert.equal(overflowDistance(103, 102), 1);
    assert.equal(overflowDistance(102.11, 102), 1, "a fraction of a pixel already hides glyphs behind the ellipsis");
    assert.equal(overflowDistance(102.03, 102), 0, "sub-pixel noise does not scroll");
    assert.equal(overflowDistance(0, 0), 0, "a hidden player measures 0");
    assert.equal(overflowDistance(240, 0), 0);
});

test("titles glide at a calm reading pace, hold, and return faster", () => {
    const short = scrollTiming(10);
    assert.equal(short.glide, 800, "tiny overflows still ease instead of jumping");
    assert.equal(short.back, 400);

    const long = scrollTiming(160);
    assert.equal(long.glide, 5000);
    assert.equal(long.hold, 1500);
    assert.equal(long.back, 1000);
    assert.equal(long.total, long.glide + long.hold + long.back);
    const pace = 160 / (long.glide / 1000);
    assert(pace >= 30 && pace <= 40, `average pace ${pace}px/s`);
    assert(long.back < long.glide);
});
