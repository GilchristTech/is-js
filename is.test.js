import { describe, test, it, expect } from "vitest";
import { is, getTypeOf, assertIs, typeToString } from "./is.js";


describe("getTypeOf()", () => {
  it("Gets primative types", () => {
    expect(getTypeOf("test")         ).toBe(String);
    expect(getTypeOf(1)              ).toBe(Number);
    expect(getTypeOf(false)          ).toBe(Boolean);
    expect(getTypeOf(undefined)      ).toBe("undefined");
    expect(getTypeOf(null)           ).toBe("null");
    expect(getTypeOf(Symbol.iterator)).toBe(Symbol);
    expect(getTypeOf(BigInt(0))      ).toBe(BigInt);
    expect(getTypeOf(() => 1)        ).toBe(Function);
  });

  it("Gets Object", () => {
    expect(getTypeOf({})).toBe(Object);
  });

  it("Gets a custom class", () => {
    class TestClass {}
    expect(getTypeOf(new TestClass)).toBe(TestClass);
    expect(getTypeOf(TestClass)).toBe(Function);
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


describe("typeToString()", () => {
  it("Can return a composite type name", () => {
    expect(typeToString([Array, "finite"], NaN)).toBe("<Array | finite>");
  });
});
