import { describe, test, it, expect } from "vitest";

import {
  is,
  pick,
  when,

  describeType,
  describeTypeS,
  assertIs,
  formatDescriptor,
  isDescriptor,
} from "./is.js";


describe("describeType()", () => {
  it("Gets primative types", () => {
    expect(describeType("test")         ).toBe(String);
    expect(describeType(1)              ).toBe(Number);
    expect(describeType(false)          ).toBe(Boolean);
    expect(describeType(undefined)      ).toBe("undefined");
    expect(describeType(null)           ).toBe("null");
    expect(describeType(Symbol.iterator)).toBe(Symbol);
    expect(describeType(BigInt(0))      ).toBe(BigInt);
    expect(describeType(() => 1)        ).toBe(Function);
  });

  it("Gets Object", () => {
    expect(describeType({})).toBe(Object);
  });

  it("Gets a custom class", () => {
    class TestClass {}
    expect(describeType(new TestClass)).toBe(TestClass);
    expect(describeType(TestClass)).toBe(Function);
  });
});


describe("is()", () => {
  it ("checks that values are objects", () => {
    expect(is(Object,  {})).toBe(true);
    expect(is([Object, String], new Object)).toBe(true);
    expect(is(Object,  null)).toBe(false);
    expect(is(Object,  /(?<group>a)/.exec('cba').groups)).toBe(true);
    expect(is(Object,  0)).toBe(false);
  });
});


describe("formatDescriptor()", () => {
  it("Can return a composite type name", () => {
    expect(formatDescriptor([Array, "finite"], NaN)).toBe("<Array | finite>");
  });
});


describe("isDescriptor", () => {
  it("Returns true for many builtin types and related strings", () => {
    const descriptors = [
      String, "string",
      Number, "integer", "uint", "number",
      Boolean, "boolean",
      BigInt,
    ];

    for (let d of descriptors) {
      let result;

      expect(
        () => { return result = isDescriptor(d) },
        `Type threw error: ${formatDescriptor(d)}`,
      ).not.toThrow();

      expect(
        result,
        `Type returned false: ${formatDescriptor(d)}`,
      ).toBe(true);
    }
  });

  it("Returns true for a union type", () => {
    expect(
      isDescriptor([String, Number])
    ).toBe(true);
  });

});
