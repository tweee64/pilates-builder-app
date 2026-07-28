import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Library } from "./Library";
import type * as ExercisesModule from "~/lib/exercises";

describe("Exercise card expand/collapse", () => {
  it("toggles expanded detail when the card body is clicked", () => {
    render(<Library discipline="mat" onAdd={vi.fn()} />);
    const card = screen.getByText("Breath & Body Scan").closest("button")!;
    expect(screen.queryByText("Slow, even breath")).toBeNull();

    fireEvent.click(card);
    expect(screen.queryByText("Slow, even breath")).not.toBeNull();

    fireEvent.click(card);
    expect(screen.queryByText("Slow, even breath")).toBeNull();
  });

  it("does not toggle expand state when the + button is clicked", () => {
    const onAdd = vi.fn();
    render(<Library discipline="mat" onAdd={onAdd} />);
    const addButton = screen.getByLabelText("Add Breath & Body Scan");

    fireEvent.click(addButton);

    expect(onAdd).toHaveBeenCalledWith(
      "breath-body-scan",
      "Breath & Body Scan",
    );
    expect(screen.queryByText("Slow, even breath")).toBeNull();
  });

  it("keeps expand state stable when a filter chip changes", () => {
    render(<Library discipline="mat" onAdd={vi.fn()} />);
    const card = screen.getByText("Breath & Body Scan").closest("button")!;
    fireEvent.click(card);
    expect(screen.queryByText("Slow, even breath")).not.toBeNull();

    // "Breath & Body Scan" is Warm-Up, so filtering to Warm-Up keeps it visible.
    fireEvent.click(screen.getByRole("button", { name: "Warm-Up" }));

    expect(screen.queryByText("Slow, even breath")).not.toBeNull();
  });
});

describe("Compact card content", () => {
  it("shows exactly one primary tag and one secondary text label by default", () => {
    render(<Library discipline="mat" onAdd={vi.fn()} />);
    const cardEl = screen.getByText("Breath & Body Scan").closest(".ex")!;
    const scoped = within(cardEl as HTMLElement);

    expect(scoped.getByText("Warm-Up")).toBeTruthy();
    expect(scoped.getByText("· Beginner")).toBeTruthy();
    // The action tag ("Stability") is dropped from the compact view.
    expect(scoped.queryByText("Stability")).toBeNull();
  });

  it("renders the same meta structure with and without prenatalSafe", () => {
    render(<Library discipline="reformer" onAdd={vi.fn()} />);
    const nonPrenatal = screen.getByText("Footwork — Heels").closest(".ex")!;
    const prenatal = screen
      .getByText("Knee Stretch — Flat Back")
      .closest(".ex")!;

    // The prenatal badge lives next to the name, not in the meta row, so the
    // meta row's child count is identical either way.
    const metaCount = (el: Element) =>
      el.querySelector(".meta")!.children.length;
    expect(metaCount(nonPrenatal)).toBe(metaCount(prenatal));
  });
});

describe("Edge cases", () => {
  afterEach(() => {
    vi.doUnmock("~/lib/exercises");
    vi.resetModules();
  });

  it("hides Variations/Modifications sub-headings when arrays are empty", async () => {
    // Mock a reformer exercise with empty variations/modifications so this
    // doesn't depend on real library data happening to have an empty entry.
    // Scoped to this test via vi.doMock + resetModules + dynamic import, so
    // other tests in this file still see the real library data.
    vi.doMock("~/lib/exercises", async () => {
      const actual =
        await vi.importActual<typeof ExercisesModule>("~/lib/exercises");
      return {
        ...actual,
        REFORMER_EXERCISES: [
          {
            key: "bare-bones",
            name: "Bare Bones Exercise",
            category: "Fundamentals",
            focus: "Quads, calves, carriage control",
            springOptions: "RR — heavier adds resistance.",
            defaultSpring: "RR",
            defaultDuration: 90,
            setupCue: "Lying supine, heels on the bar.",
            cues: ["Press through the whole foot."],
            variations: [],
            modifications: [],
            prenatalSafe: false,
          },
        ],
      };
    });
    vi.resetModules();
    const { Library: MockedLibrary } = await import("./Library");

    render(<MockedLibrary discipline="reformer" onAdd={vi.fn()} />);
    const card = screen.getByText("Bare Bones Exercise").closest("button")!;
    fireEvent.click(card);

    expect(screen.queryByText("Spring options")).not.toBeNull();
    expect(screen.queryByText("Cues")).not.toBeNull();
    expect(screen.queryByText("Variations")).toBeNull();
    expect(screen.queryByText("Modifications")).toBeNull();
  });
});

describe("Accessibility", () => {
  it("exposes aria-expanded on the card toggle and updates it on click", () => {
    render(<Library discipline="mat" onAdd={vi.fn()} />);
    const card = screen.getByText("Breath & Body Scan").closest("button")!;

    expect(card.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(card);
    expect(card.getAttribute("aria-expanded")).toBe("true");
  });

  it("supports Enter/Space to toggle expand when the card is focused", async () => {
    const user = userEvent.setup();
    render(<Library discipline="mat" onAdd={vi.fn()} />);
    const card = screen.getByText("Breath & Body Scan").closest("button")!;

    card.focus();
    await user.keyboard("{Enter}");
    expect(card.getAttribute("aria-expanded")).toBe("true");

    await user.keyboard(" ");
    expect(card.getAttribute("aria-expanded")).toBe("false");
  });

  it("exposes the full focus text via an accessible title when truncated", () => {
    render(<Library discipline="reformer" onAdd={vi.fn()} />);
    const sub = screen.getByText("· Quads, calves, carriage control");
    expect(sub.getAttribute("title")).toBe("Quads, calves, carriage control");
  });
});
