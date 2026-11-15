// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Modal } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
  document.body.style.overflow = "";
});

function render(el: React.ReactElement) {
  act(() => root.render(el));
}

// let the requestAnimationFrame initial-focus pass run (jsdom rAF ticks ~16ms)
const tick = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 30));
  });

describe("Modal a11y", () => {
  it("moves initial focus into the dialog and restores it on close", async () => {
    const trigger = document.createElement("button");
    trigger.textContent = "open";
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    render(
      createElement(
        Modal,
        { open: true, onClose: () => {}, title: "T", children: createElement("button", null, "inside") },
      ),
    );
    await tick();

    expect(document.activeElement?.textContent).toBe("inside");
    expect(document.body.style.overflow).toBe("hidden");

    render(createElement(Modal, { open: false, onClose: () => {}, title: "T", children: null }));
    await tick();

    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
    trigger.remove();
  });

  it("a new onClose identity while open must NOT steal/restore focus", async () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    trigger.focus();

    render(
      createElement(
        Modal,
        { open: true, onClose: () => {}, title: "T", children: createElement("button", null, "inside") },
      ),
    );
    await tick();
    const focused = document.activeElement;
    expect(focused?.textContent).toBe("inside");
    expect(document.body.style.overflow).toBe("hidden");

    // re-render with a *new* onClose identity — dialog stays open
    render(
      createElement(
        Modal,
        { open: true, onClose: () => {}, title: "T", children: createElement("button", null, "inside") },
      ),
    );
    await tick();

    expect(document.activeElement).toBe(focused); // not the trigger, not blurred
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.activeElement).not.toBe(trigger);
    trigger.remove();
  });

  it("Escape invokes the latest onClose", async () => {
    const first = vi.fn();
    const latest = vi.fn();
    render(createElement(Modal, { open: true, onClose: first, title: "T", children: "x" }));
    render(createElement(Modal, { open: true, onClose: latest, title: "T", children: "x" }));
    await tick();
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
  });

  it("Tab wraps around within the dialog", async () => {
    render(
      createElement(
        Modal,
        {
          open: true,
          onClose: () => {},
          title: "T",
          children: [
            createElement("button", { key: "a", id: "a" }, "A"),
            createElement("button", { key: "b", id: "b" }, "B"),
          ],
        },
      ),
    );
    await tick();
    const a = document.getElementById("a")!;
    const b = document.getElementById("b")!;
    // last + Tab → first
    b.focus();
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    });
    expect(document.activeElement).toBe(a);
    // first + Shift+Tab → last
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true }),
      );
    });
    expect(document.activeElement).toBe(b);
  });
});

describe("Drawer", () => {
  it("auto-closes past the desktop breakpoint so scroll lock is released", async () => {
    let mqHandler: ((e: unknown) => void) | null = null;
    const mq = {
      matches: false,
      media: "(min-width: 1024px)",
      addEventListener: (_t: string, h: (e: unknown) => void) => {
        mqHandler = h;
      },
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
      onchange: null,
    };
    const orig = window.matchMedia;
    window.matchMedia = (() => mq) as unknown as typeof window.matchMedia;

    const onClose = vi.fn();
    render(createElement(Drawer, { open: true, onClose, title: "Filters", children: "x" }));
    await tick();
    expect(document.body.style.overflow).toBe("hidden");

    act(() => {
      mq.matches = true;
      mqHandler?.({});
    });
    expect(onClose).toHaveBeenCalledTimes(1);

    // parent honors onClose → unmount → scroll restored
    render(createElement(Drawer, { open: false, onClose, title: "Filters", children: "x" }));
    await tick();
    expect(document.body.style.overflow).toBe("");
    window.matchMedia = orig;
  });
});
