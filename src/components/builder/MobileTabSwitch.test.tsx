import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MobileTabSwitch } from "./MobileTabSwitch";

describe("MobileTabSwitch", () => {
  it("renders both tabs with the active one selected", () => {
    render(
      <MobileTabSwitch value="library" onChange={vi.fn()} classCount={0} />,
    );

    const library = screen.getByRole("tab", { name: "Library" });
    const yourClass = screen.getByRole("tab", { name: "Your class" });

    expect(library.getAttribute("aria-selected")).toBe("true");
    expect(yourClass.getAttribute("aria-selected")).toBe("false");
  });

  it("toggles aria-selected when a different tab is clicked", () => {
    const onChange = vi.fn();
    render(
      <MobileTabSwitch value="library" onChange={onChange} classCount={2} />,
    );

    screen.getByRole("tab", { name: "Your class 2" }).click();

    expect(onChange).toHaveBeenCalledWith("class");
  });

  it("shows the badge count only when the class has items", () => {
    const { rerender } = render(
      <MobileTabSwitch value="library" onChange={vi.fn()} classCount={0} />,
    );
    expect(screen.queryByText("0")).toBeNull();

    rerender(
      <MobileTabSwitch value="class" onChange={vi.fn()} classCount={3} />,
    );
    expect(screen.getByText("3")).toBeTruthy();
  });
});
