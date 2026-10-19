// Scroll-once player titles. A title that overflows its box glides to its end
// once per track, holds, returns, and then rests with an ellipsis. Only the
// visible player moves, the title runs before the artist, and a tap replays.
const START_DELAY = 1500;
const HOLD = 1500;
// Constant reading pace in px per second.
const SPEED = 32;
// Width of each mask fade on [data-scrolling] in AudioPlayer.astro.
const FADE = 12;

export function overflowDistance(textWidth: number, boxWidth: number) {
    // Hidden boxes measure 0. The ellipsis already hides whole glyphs at a
    // fraction of a pixel of overflow, so any real overflow scrolls.
    var distance = textWidth - boxWidth;
    return boxWidth > 0 && distance > 0.05 ? Math.ceil(distance) : 0;
}

export function scrollTiming(distance: number) {
    var glide = Math.max(800, Math.round((distance / SPEED) * 1000));
    var back = Math.min(1000, Math.max(400, Math.round(glide / 3)));
    return { glide, hold: HOLD, back, total: glide + HOLD + back };
}

interface MarqueeGroup {
    items: HTMLElement[];
    run: number;
    busy: boolean;
    timer?: number;
    current?: HTMLElement;
    width?: number;
    animations: Animation[];
}

// Keyed by each player's track info box; the player persists across routes.
var groups = new Map<Element, MarqueeGroup>();
var scrolled = new WeakSet<HTMLElement>();
var reducedMotion: MediaQueryList | undefined;
var observer: ResizeObserver | undefined;

function prefersReducedMotion() {
    if (!reducedMotion) {
        reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
        // Turning the setting on stops any glide that is waiting or running.
        reducedMotion.addEventListener("change", function (event) {
            if (event.matches) groups.forEach(stop);
        });
    }
    return reducedMotion.matches;
}

function measure(el: HTMLElement) {
    // scrollWidth and clientWidth round to whole pixels; a Range over the text
    // and the box rect keep the fraction the ellipsis is drawn from.
    var range = document.createRange();
    range.selectNodeContents(el.firstElementChild ?? el);
    return overflowDistance(range.getBoundingClientRect().width, el.getBoundingClientRect().width);
}

// The text glides at a constant pace, holds, and eases back. Each mask layer
// fades in over the first 12px of hidden text on its side and out over the last.
function glideFrames(distance: number, hold: number, back: number) {
    // Share of each phase spent revealing a fade; capped so offsets stay ordered
    // for overflows shorter than two fades.
    var edge = Math.min(0.4, FADE / distance);
    var returnSpan = 1 - back;
    // left: px of the left fade shown; right: px of the right fade withdrawn.
    var mask = function (left: number, right: number) {
        return { maskPosition: left - FADE + "px 0, " + (right - FADE) + "px 0" };
    };
    return {
        text: [
            { transform: "translateX(0)" },
            { transform: "translateX(" + -distance + "px)", offset: hold },
            { transform: "translateX(" + -distance + "px)", offset: back, easing: "ease-in-out" },
            { transform: "translateX(0)" },
        ],
        mask: [
            mask(0, 0),
            { ...mask(FADE, 0), offset: hold * edge },
            { ...mask(FADE, 0), offset: hold * (1 - edge) },
            { ...mask(FADE, FADE), offset: hold },
            { ...mask(FADE, FADE), offset: back },
            { ...mask(FADE, 0), offset: back + returnSpan * edge },
            { ...mask(0, 0), offset: 1 - returnSpan * edge * 0.5 },
            mask(0, 0),
        ] as Keyframe[],
    };
}

function stop(group: MarqueeGroup) {
    group.run++;
    group.busy = false;
    window.clearTimeout(group.timer);
    group.animations.forEach(function (animation) {
        animation.cancel();
    });
    group.animations = [];
    group.current?.removeAttribute("data-scrolling");
    group.current = undefined;
}

async function glide(group: MarqueeGroup, el: HTMLElement, distance: number) {
    var text = el.firstElementChild as HTMLElement;
    var timing = scrollTiming(distance);
    var hold = timing.glide / timing.total;
    var back = (timing.glide + timing.hold) / timing.total;
    el.setAttribute("data-scrolling", "");
    group.current = el;
    group.width = el.clientWidth;
    var keyframes = glideFrames(distance, hold, back);
    group.animations = [text.animate(keyframes.text, timing.total), el.animate(keyframes.mask, timing.total)];
    try {
        await group.animations[0].finished;
    } catch {
        return false;
    }
    el.removeAttribute("data-scrolling");
    group.current = undefined;
    group.animations = [];
    return true;
}

async function play(group: MarqueeGroup, items: HTMLElement[], delay: number) {
    stop(group);
    if (prefersReducedMotion()) return;
    var run = group.run;
    group.busy = true;
    for (const el of items) {
        if (!measure(el)) continue;
        if (delay) {
            await new Promise(function (resolve) {
                group.timer = window.setTimeout(resolve, delay);
            });
            if (run !== group.run) return;
        }
        if (prefersReducedMotion()) return;
        var distance = measure(el);
        if (!distance) continue;
        if (!(await glide(group, el, distance))) return;
        scrolled.add(el);
    }
    group.busy = false;
}

function pending(group: MarqueeGroup) {
    return group.items.filter(function (item) {
        return !scrolled.has(item);
    });
}

function onResize(entries: ResizeObserverEntry[]) {
    // Resizing never starts motion; it only stops a glide whose distance is stale.
    entries.forEach(function (entry) {
        var el = entry.target as HTMLElement;
        var group = el.parentElement && groups.get(el.parentElement);
        if (group && group.current === el && el.clientWidth !== group.width) {
            stop(group);
        }
    });
}

function groupFor(box: HTMLElement) {
    var group = groups.get(box);
    if (group) return group;
    var created: MarqueeGroup = {
        items: Array.from(box.querySelectorAll<HTMLElement>("[data-marquee]")),
        run: 0,
        busy: false,
        animations: [],
    };
    groups.set(box, created);
    observer ??= new ResizeObserver(onResize);
    created.items.forEach(function (item) {
        observer?.observe(item);
        // The text is not a control; a tap or click is only a replay shortcut.
        item.addEventListener("click", function () {
            if (created.current !== item && measure(item)) play(created, [item], 0);
        });
    });
    return created;
}

// Writes into the inner span, so the outer element's textContent stays the text.
export function setMarqueeText(el: HTMLElement | null, value: string) {
    var text = el?.firstElementChild;
    if (!el || !el.parentElement || !text || text.textContent === value) return;
    var group = groupFor(el.parentElement);
    text.textContent = value;
    // A new title is a new track, so its artist line scrolls again too.
    (el === group.items[0] ? group.items : [el]).forEach(function (item) {
        scrolled.delete(item);
    });
    play(group, pending(group), START_DELAY);
}

// Playback start catches titles that never scrolled, such as a player that
// was hidden or too wide when its track changed.
export function scrollPendingTitles() {
    groups.forEach(function (group) {
        if (!group.busy) play(group, pending(group), START_DELAY);
    });
}
