import { describe, test, it, expect } from "vitest";

import {
  is,
  pick,
  when,
  mustBe,

  descriptors,

  descriptors,

  describeType,
  describeTypeS,
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
    expect(describeType(NaN)            ).toBe(Number);
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

  it("throws when not given a descriptor", () => {
    expect(() => is()            ).toThrow();
    expect(() => is("not a type")).toThrow();
  });
});


describe("mustBe()", () => {
  it("errors with a mismatched type value", () => {
    expect(() => mustBe(String, 1234)).toThrow();
  });

  it("errors with invalid type strings", () => {
    expect(() => mustBe("invalid-type?!", 1)).toThrow();
  });

  it("includes invalid string values in errors messages", () => {
    expect(() => mustBe(Number, "my string")).toThrow("my string");
  });
});


describe("formatDescriptor()", () => {
  it("Returns a string for every builtin descriptor", () => {
    for (let desc of descriptors) {
      let fmt;

      expect(
        () => (fmt = formatDescriptor(desc))
      ).not.toThrow();

      expect( typeof fmt ).toBe("string");
      expect( fmt.length ).toBeGreaterThan(0);
    }
  });

  it("Can return a composite type name", () => {
    expect(formatDescriptor([Array, "finite"], NaN)).toBe("<Array | finite>");
  });
});


describe("isDescriptor", () => {
  it("Returns true for every builtin types and related strings", () => {
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

  it("accepts valid Set descriptors", () => {
    expect(isDescriptor(new Set([String, Number]))   ).toBe(true);
    expect(isDescriptor(new Set([String, "invalid"]))).toBe(false);
  });
});


describe("pick", () => {
  it("throws a TypeError if there isn't a descriptor argument", () => {
    let _;

    expect(() => pick()       ).toThrow(TypeError);
    expect(() => pick(1, 2, 3)).toThrow(TypeError);
    expect(
      () => (_ = pick(String)),
      `pick(String) returned a ${describeTypeS(_)}`
    ).toThrow(TypeError);
  });

  it("returns the correct candidate from a list of immediate candidates", () => {
    expect(
      pick(String, 0, "Correct value!", 1),
    ).toBe(
      "Correct value!",
    );
  });

  it("returns an error if no candidate is found", () => {
    expect(() => pick(String, 1)).toThrow();
  });

  it("evaluates lazy candidates", () => {
    expect(
      pick(Number,
        ( )  => { return { my_num: "25" }},
        (o) => o.my_num,
        parseInt,
      ),
    ).toBe(25);
  });

  it("returns a nullish value if no candidate is found and its the final value", () => {
    expect(pick(String,   1, undefined)).toBe(undefined);
    expect(pick(Function, null)        ).toBe(null);
  });
});


describe("when()", () => {
  it("errors without the correct number of arguments", () => {
    expect(() => when()).toThrow();
    expect(() => when(Number)).toThrow();
    expect(() => when(Number, 1, 2, 3, 4, 5, 6, 7)).toThrow();
  });

  it("returns its immediate value argument when it matches", () => {
    expect(when(Number, 999)).toBe(999);
    expect(when(Number, 999, "number!")).toBe("number!");
    expect(when(Number, 999, "number!", ">_<")).toBe("number!");
  });

  it("returns undefined when the value does not match", () => {
    expect(when(Symbol, 999)).toBe(undefined);
    expect(when(Symbol, 999, "number!")).toBe(undefined);
    expect(when(Symbol, 999, "number!", ">_<")).toBe(">_<");
  });
});
