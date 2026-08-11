import { describe, test, it, expect } from "vitest";

import {
  is,
  pick,
  pickAsync,
  when,
  mustBe,

  descriptors,

  describeType,
  describeTypeAsString,
  describeTypeS,
  formatDescriptor,
  isDescriptor,

  Nullish, Int, Uint,
  Truthy, Falsey,
  Iterable,
  Finite,
} from "./is.js";

import { desc_cases } from "./cases-is.js";


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
  it("checks that values are objects", () => {
    expect(is(Object,  {})).toBe(true);
    expect(is([Object, String], new Object)).toBe(true);
    expect(is(Object,  null)).toBe(false);
    expect(is(Object,  /(?<group>a)/.exec('cba').groups)).toBe(true);
    expect(is(Object,  0)).toBe(false);
  });

  it("matches types in all test cases", () => {
    for (let [desc, case_entries] of desc_cases)
    for (let case_entry of case_entries) {
      const { value, error } = case_entry;

      if (!is(desc, value)) {
        throw new Error(
          `${value?.toString() ?? value} is a ${describeTypeS(value)}, not a ${formatDescriptor(desc)}`,
          { cause: error },
        );
      }
    }
  });

  it("throws when not given a descriptor", () => {
    expect(() => is()               ).toThrow();
    expect(() => is("not a type")   ).toThrow();
    expect(() => is("not a type", 1)).toThrow();
    expect(() => is(BigInt(1234), 1)).toThrow(/expect.*BigInt/i);
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

  it("uses custom error messages", () => {
    expect(() => mustBe(Number, "error!", "whoopsie!")).toThrow(/whoopsie!/);
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

  it("throws an error if it receives an invalid descriptor", () => {
    expect(() => formatDescriptor("not-a-type")).toThrow();
    expect(() => formatDescriptor(new Number)  ).toThrow();
    expect(() => formatDescriptor(0)).toThrow();
  });

  it("handles classes, functions, and anonymous functions", () => {
    class MyClass {}
    function fn() {}

    expect(formatDescriptor(MyClass)).toBe("MyClass");
    expect(formatDescriptor(function () {})).toMatch(/Anonymous/i);
    expect(formatDescriptor(() => {})).toMatch(/Anonymous/i);
    expect(formatDescriptor(fn)).toBe("fn");
  });
});


describe("describeTypeAsString()", () => {
  it("Infers numeric type strings", () => {
    expect(describeTypeAsString( NaN)).toBe("NaN"   );
    expect(describeTypeAsString(  42)).toBe("int"   );
    expect(describeTypeAsString(3.14)).toBe("number");
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

  it("lazily and immediately evaluates then and otherwise", () => {
    expect(when(Number,  999, "yay!")                              ).toBe("yay!");
    expect(when(Number, null, "shouldn't happen", "oh no")        ).toBe("oh no");
    expect(when(Number,  999, ()=>"yay!")                          ).toBe("yay!");
    expect(when(Number, null, ()=>"shouldn't happen", ()=>"oh no")).toBe("oh no");
  });

  it("throws when lazy mode is not given 2-3 arguments", () => {
    expect(() => when(Number, () => 0, 0, 0)).toThrow();
  });

  it("returns functions which lazily check types", () => {
    expect(when(Number, v => "yay! "+v)(999)).toBe("yay! 999");

    expect(when(Number, ()=>"should happen", ()=>"oh no")(1)).toBe("should happen");

    expect(when(Number, ()=>"shouldn't happen", "oh no")(null)        ).toBe("oh no");
    expect(when(Number, ()=>"shouldn't happen", ()=>"oh no")(null)).toBe("oh no");
  });
});


describe("pick() (and equivalent pickAsync)", async () => {
  it("throws a TypeError if there isn't a descriptor argument", async () => {
    let _;

    expect(() => pick()       ).toThrow(TypeError);
    expect(() => pick(1, 2, 3)).toThrow(TypeError);
    expect(
      () => (_ = pick(String)),
      `pick(String) returned a ${describeTypeS(_)}`
    ).toThrow(TypeError);

    await expect(pickAsync()       ).rejects.toThrow(TypeError);
    await expect(pickAsync(1, 2, 3)).rejects.toThrow(TypeError);
    await expect(
      async () => (_ = await pickAsync(String)),
      `pickAsync(String) returned a ${describeTypeS(_)}`
    ).rejects.toThrow(TypeError);
  });

  it("returns the correct candidate from a list of immediate candidates", async () => {
    expect(
      pick(String, 0, "Correct value!", 1),
    ).toBe(
      "Correct value!",
    );

    expect(
      await pickAsync(String, 0, "Correct value!", 1),
    ).toBe(
      "Correct value!",
    );
  });

  it("returns an error if no candidate is found", async () => {
    expect(() => pick(String, 1)).toThrow();
    await expect(async () => await pickAsync(String, 1)).rejects.toThrow();
  });

  it("evaluates lazy candidates", async () => {
    expect(
      pick(Number,
        ( )  => { return { my_num: "25" }},
        (o) => o.my_num,
        parseInt,
      ),
    ).toBe(25);

    expect(
      await pickAsync(Number,
        ( )  => { return { my_num: "25" }},
        (o) => o.my_num,
        parseInt,
      ),
    ).toBe(25);
  });

  it("returns a nullish value if no candidate is found and its the final value", async () => {
    expect(pick(String,   1, undefined)).toBe(undefined);
    expect(pick(Function, null)        ).toBe(null);
    expect(await pickAsync(String,   1, undefined)).toBe(undefined);
    expect(await pickAsync(Function,         null)).toBe(null);
  });
});


describe("pickAsync()", () => {
  it("awaits promise arguments", async () => {
    expect(
      await pickAsync(String,
        Promise.resolve(1),
        Promise.resolve("It works!"),
        Promise.resolve("2"),
      ),
    ).toBe("It works!");
  });

  it("awaits promises which are the result of a lazy argument's lazy evaluation", async () => {
    expect(
      await pickAsync(String,
        () => Promise.resolve(1),
        () => Promise.resolve("It works!"),
        () => Promise.resolve("2"),
      ),
    ).toBe("It works!");
  });

  it("works with when wrappers that return promises()", async () => {
    let result = await pickAsync(BigInt,
      async () => null,
      when(Nullish, nl => Promise.resolve("10")                 ),
      when(String,  st => Promise.resolve(parseFloat(st))       ),
      when(Symbol,  sy => Promise.resolve("interfering string!")),
      when(Number,  nu => Promise.resolve(BigInt(nu))           ),
    );

    expect(typeof result).toBe("bigint");
    expect(result == 10 ).toBe(true);

    expect(
      result,
      "pickAsync() return does not equal similar pick() return",
    ).toEqual(
      pick(BigInt,
        () => null,
        when(Nullish, nl => "10"                 ),
        when(String,  st => parseFloat(st)       ),
        when(Symbol,  sy => "interfering string!"),
        when(Number,  nu => BigInt(nu)           ),
      )
    )
  });
});


describe("Type descriptor functions", () => {
  it("asserts and returns for Nullish()", () => {
    expect(Nullish(null)     ).toBe(null);
    expect(Nullish(undefined)).toBe(null);
    expect(() => Nullish(true)).toThrow();
  });

  it("asserts, rounds, converts, and returns for Int", () => {
    expect(Int( 10 )).toBe(10);
    expect(Int("-10")).toBe(-10);
    expect(() => Int("error!")).toThrow();
    expect(() => Int(NaN)).toThrow();
    expect(Int(12.34)).toBe(12);
    expect(Int(-12.34)).toBe(-12);
  });

  it("asserts, rounds, converts, and returns for Int", () => {
    expect(Uint( 10 )).toBe(10);
    expect(Uint("10")).toBe(10);
    expect(() => Uint("-10")).toThrow();
    expect(() => Uint("error!")).toThrow();
    expect(() => Uint(NaN)).toThrow();
    expect(Uint(12.34)).toBe(12);
  });

  it("asserts, converts, and returns for Finite", () => {
    expect(Finite( 10 )).toBe(10);
    expect(() => Finite("error!")).toThrow();
    expect(() => Finite(NaN)).toThrow();
    expect(Finite(12.34)).toBe(12.34);
    expect(Finite("-12.34")).toBe(-12.34);
  });

  it("asserts and returns for Truthy()", () => {
    expect(Truthy(true)  ).toBe(true);
    expect(Truthy(1)     ).toBe(true);
    expect(Truthy("asdf")).toBe(true);

    expect(() => Truthy(false)).toThrow();
    expect(() => Truthy(0)    ).toThrow();
    expect(() => Truthy(null) ).toThrow();
  });


  it("asserts and returns for Falsey()", () => {
    expect(() => Falsey(true)  ).toThrow();
    expect(() => Falsey(1)     ).toThrow();
    expect(() => Falsey("asdf")).toThrow();

    expect(Falsey(false)).toBe(false);
    expect(Falsey(0)    ).toBe(false);
    expect(Falsey(null) ).toBe(false);
  });


  it("asserts and returns for Iterable()", () => {
    expect(() => Iterable(true)).toThrow();

    const itr_arr = [1, 2, 3];
    const itr_set = new Set(itr_arr);
    const itr_obj = Object.fromEntries(Object.entries(itr_arr));

    expect(Iterable(itr_arr)).toBe(itr_arr);
    expect(Iterable(itr_set)).toBe(itr_set);
  });
});
