import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddCustomExercise } from "./AddCustomExercise";

/** Expand the collapsed panel so the form fields are present in the DOM. */
function expandForm() {
  fireEvent.click(
    screen.getByRole("button", { name: /add your own exercise/i }),
  );
}

describe("AddCustomExercise", () => {
  it("is collapsed by default and exposes aria-expanded on the toggle", () => {
    render(<AddCustomExercise discipline="mat" onAdd={vi.fn()} />);
    const toggle = screen.getByRole("button", {
      name: /add your own exercise/i,
    });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByLabelText("Name")).toBeNull();

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });

  it("shows Action (not Spring) for mat, and Spring (not Action) for reformer", () => {
    const { rerender } = render(
      <AddCustomExercise discipline="mat" onAdd={vi.fn()} />,
    );
    expandForm();
    expect(screen.queryByText("Action")).not.toBeNull();
    expect(screen.queryByText("Spring")).toBeNull();

    rerender(<AddCustomExercise discipline="reformer" onAdd={vi.fn()} />);
    expect(screen.queryByText("Spring")).not.toBeNull();
    expect(screen.queryByText("Action")).toBeNull();
  });

  it("blocks submission until name/category(/action for mat) are filled, cue/breath never block", () => {
    const onAdd = vi.fn();
    render(<AddCustomExercise discipline="mat" onAdd={onAdd} />);
    expandForm();

    const submit: HTMLButtonElement = screen.getByRole("button", {
      name: /add to class/i,
    });
    expect(submit.disabled).toBe(true);

    fireEvent.change(screen.getByPlaceholderText(/side plank/i), {
      target: { value: "My move" },
    });
    expect(submit.disabled).toBe(true); // category still missing

    const selects = screen.getAllByRole("combobox");
    const categorySelect = selects[0]!;
    const actionSelect = selects[1]!;
    fireEvent.change(categorySelect, { target: { value: "Core" } });
    expect(submit.disabled).toBe(true); // action still missing (mat)

    fireEvent.change(actionSelect, { target: { value: "stability" } });
    expect(submit.disabled).toBe(false);

    fireEvent.click(submit);
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "My move",
        category: "Core",
        action: "stability",
        cue: undefined,
        breath: undefined,
      }),
    );
  });

  it("includes optional cue/breath when filled, and resets/collapses after a successful add", () => {
    const onAdd = vi.fn();
    render(<AddCustomExercise discipline="mat" onAdd={onAdd} />);
    expandForm();

    fireEvent.change(screen.getByPlaceholderText(/side plank/i), {
      target: { value: "My move" },
    });
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0]!, { target: { value: "Core" } });
    fireEvent.change(selects[1]!, { target: { value: "stability" } });
    fireEvent.change(screen.getByLabelText("Cue (optional)"), {
      target: { value: "Reach and rotate" },
    });
    fireEvent.change(screen.getByLabelText("Breath (optional)"), {
      target: { value: "Exhale on the reach" },
    });

    fireEvent.click(screen.getByRole("button", { name: /add to class/i }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        cue: "Reach and rotate",
        breath: "Exhale on the reach",
      }),
    );
    // Collapsed + reset after a successful add.
    expect(
      screen
        .getByRole("button", { name: /add your own exercise/i })
        .getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("resets category/action/spring when the discipline changes", () => {
    const { rerender } = render(
      <AddCustomExercise discipline="mat" onAdd={vi.fn()} />,
    );
    expandForm();
    const categorySelect = screen.getAllByRole("combobox")[0]!;
    fireEvent.change(categorySelect, { target: { value: "Core" } });
    expect((categorySelect as HTMLSelectElement).value).toBe("Core");

    rerender(<AddCustomExercise discipline="reformer" onAdd={vi.fn()} />);
    const categorySelectAfter = screen.getAllByRole("combobox")[0]!;
    expect((categorySelectAfter as HTMLSelectElement).value).toBe("");
  });
});
