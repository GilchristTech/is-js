import { describe, test, it, expect } from "vitest";
import { is, describeType, assertIs, formatDescriptor } from "./is.js";


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
