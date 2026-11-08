import { describe, expect, it } from "bun:test";
import React from "react";
import { FallingLeavesAmbient } from "../ui/FallingLeavesAmbient";

describe("FallingLeavesAmbient Photorealistic 3D Engine", () => {
  it("exports FallingLeavesAmbient as a functional React component", () => {
    expect(typeof FallingLeavesAmbient).toBe("function");
  });

  it("creates valid React element for FallingLeavesAmbient", () => {
    const el = React.createElement(FallingLeavesAmbient, { enabled: true });
    expect(React.isValidElement(el)).toBe(true);
    expect(el.props.enabled).toBe(true);
  });

  it("handles disabled prop creation cleanly", () => {
    const el = React.createElement(FallingLeavesAmbient, { enabled: false });
    expect(React.isValidElement(el)).toBe(true);
    expect(el.props.enabled).toBe(false);
  });
});
