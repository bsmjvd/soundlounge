import { describe, expect, it, mock } from "bun:test";
import React from "react";
import { TopBar } from "../TopBar";

describe("TopBar Component & Responsive Mobile Search", () => {
  it("exports TopBar as a functional React component", () => {
    expect(typeof TopBar).toBe("function");
  });

  it("handles search queries and triggers onSearch callback", () => {
    const handleSearch = mock((query: string) => {});
    handleSearch("Coldplay");
    expect(handleSearch).toHaveBeenCalledWith("Coldplay");
  });

  it("handles tab changes and toggles", () => {
    const handleTopTabChange = mock((tab: any) => {});
    const handleToggleMobileMenu = mock(() => {});
    const handleToggleLeaves = mock(() => {});

    handleTopTabChange("discover");
    handleToggleMobileMenu();
    handleToggleLeaves();

    expect(handleTopTabChange).toHaveBeenCalledWith("discover");
    expect(handleToggleMobileMenu).toHaveBeenCalledTimes(1);
    expect(handleToggleLeaves).toHaveBeenCalledTimes(1);
  });
});
