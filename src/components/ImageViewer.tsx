import type { Component } from 'solid-js';
import { createSignal, createEffect, onCleanup, Show, For } from 'solid-js';
import { Portal } from 'solid-js/web';

interface Props {
  images: string[];
  index: number;
  open: boolean;
  onClose: () => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 5;
const TAP_GAP = 300;
const TAP_DIST = 30;

const d = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(b.x - a.x, b.y - a.y);

const ImageViewer: Component<Props> = (props) => {
  const [current, setCurrent] = createSignal(0);
  const [dragX, setDragX] = createSignal(0);
  const [dragging, setDragging] = createSignal(false);
  const [scale, setScale] = createSignal(1);
  const [offset, setOffset] = createSignal({ x: 0, y: 0 });
  const [tween, setTween] = createSignal(false);

  let containerRef: HTMLDivElement | undefined;
  const imgRefs: (HTMLImageElement | undefined)[] = [];
  const pointers = new Map<number, { x: number; y: number }>();
  let containerW = 0;
  let pinchStartDist = 0, pinchStartScale = 1;
  let pinchStartOff = { x: 0, y: 0 };
  let pinchMidX = 0, pinchMidY = 0;
  let panStartOff = { x: 0, y: 0 };
  let panStartX = 0, panStartY = 0;
  let lastTapT = 0, lastTapX = 0, lastTapY = 0;
  let moved = false;

  createEffect(() => {
    if (props.open) {
      setCurrent(props.index);
      setDragX(0);
      setScale(1);
      setOffset({ x: 0, y: 0 });
      setTween(false);
      pointers.clear();
      moved = false;
    }
  });

  createEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose();
      else if (e.key === 'ArrowLeft' && scale() === 1) setCurrent((c) => Math.max(0, c - 1));
      else if (e.key === 'ArrowRight' && scale() === 1)
        setCurrent((c) => Math.min(props.images.length - 1, c + 1));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    onCleanup(() => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    });
  });

  createEffect(() => {
    current();
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setTween(false);
    pointers.clear();
    moved = false;
  });

  const focal = (cx: number, cy: number) => {
    if (!containerRef) return { x: 0, y: 0 };
    const r = containerRef.getBoundingClientRect();
    return { x: cx - r.left - r.width / 2, y: cy - r.top - r.height / 2 };
  };

  const clampOff = (s: number, ox: number, oy: number) => {
    if (!containerRef || s <= 1) return { x: 0, y: 0 };
    const imgEl = imgRefs[current()];
    if (!imgEl) return { x: 0, y: 0 };
    const cr = containerRef.getBoundingClientRect();
    const ir = imgEl.getBoundingClientRect();
    const sw = ir.width * s;
    const sh = ir.height * s;
    const mx = Math.max(0, (sw - cr.width) / 2);
    const my = Math.max(0, (sh - cr.height) / 2);
    return { x: Math.max(-mx, Math.min(mx, ox)), y: Math.max(-my, Math.min(my, oy)) };
  };

  const onPDown = (e: PointerEvent) => {
    e.preventDefault();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1) {
      setTween(false);
      const el = e.currentTarget as HTMLDivElement;
      containerW = el.clientWidth;
      moved = false;
      panStartOff = offset();
      panStartX = e.clientX;
      panStartY = e.clientY;
      if (scale() <= 1) setDragging(true);
      el.setPointerCapture(e.pointerId);
    } else if (pointers.size === 2) {
      setDragging(false);
      const pts = [...pointers.values()];
      pinchStartDist = d(pts[0], pts[1]);
      pinchStartScale = scale();
      pinchStartOff = offset();
      pinchMidX = (pts[0].x + pts[1].x) / 2;
      pinchMidY = (pts[0].y + pts[1].y) / 2;
    }
  };

  const onPMove = (e: PointerEvent) => {
    e.preventDefault();
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size >= 2) {
      const pts = [...pointers.values()];
      const curD = d(pts[0], pts[1]);
      const ns = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStartScale * (curD / pinchStartDist)));
      const f = focal(pinchMidX, pinchMidY);
      const ratio = ns / pinchStartScale;
      setScale(ns);
      setOffset({ x: f.x - (f.x - pinchStartOff.x) * ratio, y: f.y - (f.y - pinchStartOff.y) * ratio });
      moved = true;
    } else if (pointers.size === 1) {
      const dx = e.clientX - panStartX;
      const dy = e.clientY - panStartY;
      if (scale() > 1) {
        const c = clampOff(scale(), panStartOff.x + dx, panStartOff.y + dy);
        setOffset(c);
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      } else {
        setDragX(dx);
        if (Math.abs(dx) > 3) moved = true;
      }
    }
  };

  const onPUp = (e: PointerEvent) => {
    e.preventDefault();

    if (pointers.size === 1 && !moved) {
      const now = Date.now();
      if (
        now - lastTapT < TAP_GAP &&
        Math.abs(e.clientX - lastTapX) < TAP_DIST &&
        Math.abs(e.clientY - lastTapY) < TAP_DIST
      ) {
        if (scale() > 1) {
          setScale(1);
          setOffset({ x: 0, y: 0 });
        } else {
          const f = focal(e.clientX, e.clientY);
          setScale(2);
          setOffset({ x: -f.x, y: -f.y });
        }
        setTween(true);
        lastTapT = 0;
        pointers.delete(e.pointerId);
        return;
      }
      lastTapT = now;
      lastTapX = e.clientX;
      lastTapY = e.clientY;
    }

    if (pointers.size === 2) {
      if (scale() < 1) {
        setScale(1);
        setOffset({ x: 0, y: 0 });
      } else {
        const c = clampOff(scale(), offset().x, offset().y);
        setOffset(c);
      }
      setTween(true);
    }

    pointers.delete(e.pointerId);

    if (pointers.size === 0 && scale() <= 1) {
      setDragging(false);
      const threshold = containerW * 0.18;
      const dx = dragX();
      if (dx < -threshold && current() < props.images.length - 1) setCurrent(current() + 1);
      else if (dx > threshold && current() > 0) setCurrent(current() - 1);
      setDragX(0);
    } else if (pointers.size === 0) {
      setDragging(false);
    }
  };

  const onPCancel = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    if (pointers.size === 0) {
      setDragging(false);
      setDragX(0);
      if (scale() < 1) {
        setScale(1);
        setOffset({ x: 0, y: 0 });
        setTween(true);
      }
    }
  };

  return (
    <Show when={props.open}>
      <Portal>
        <div
          class="fixed inset-0 z-50 bg-black/95 flex flex-col select-none"
          style={{ 'touch-action': 'none' }}
          onClick={(e) => {
            if (e.target === e.currentTarget && scale() === 1) props.onClose();
          }}
        >
          <div class="flex justify-between items-center px-4 py-3 text-white">
            <span class="text-sm">
              {current() + 1} / {props.images.length}
            </span>
            <button
              class="w-9 h-9 rounded-full bg-white/10 active:bg-white/20"
              onClick={() => props.onClose()}
            >
              ✕
            </button>
          </div>
          <div
            ref={containerRef}
            class="flex-1 overflow-hidden relative touch-none"
            onPointerDown={onPDown}
            onPointerMove={onPMove}
            onPointerUp={onPUp}
            onPointerCancel={onPCancel}
          >
            <div
              class="flex h-full"
              style={{
                width: `${props.images.length * 100}%`,
                transform: `translateX(calc(${-current() * (100 / props.images.length)}% + ${dragX()}px))`,
                transition: dragging() || scale() !== 1 ? 'none' : 'transform 0.28s ease-out',
              }}
            >
              <For each={props.images}>
                {(src, i) => (
                  <div
                    class="h-full flex items-center justify-center px-2"
                    style={{ width: `${100 / props.images.length}%` }}
                  >
                    <img
                      src={src}
                      draggable={false}
                      ref={(el) => { imgRefs[i()] = el; }}
                      class="max-w-full max-h-full object-contain"
                      style={{
                        transform: `translate(${offset().x}px, ${offset().y}px) scale(${scale()})`,
                        transition: tween() ? 'transform 0.3s ease-out' : 'none',
                      }}
                    />
                  </div>
                )}
              </For>
            </div>
          </div>
          <Show when={props.images.length > 1}>
            <div class="flex justify-center gap-1.5 py-4">
              <For each={props.images}>
                {(_, i) => (
                  <span
                    class={`h-1.5 rounded-full transition-all ${
                      i() === current() ? 'w-5 bg-white' : 'w-1.5 bg-white/40'
                    }`}
                  />
                )}
              </For>
            </div>
          </Show>
        </div>
      </Portal>
    </Show>
  );
};

export default ImageViewer;
