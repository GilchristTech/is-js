import { describe, it, expect, vi } from "vitest";

import { Ptr } from "./ptr.js";

describe("Ptr", () => {

  describe("constructor", () => {

    it("stores type, object, and property", () => {
      const obj = { x: 123 };

      const ptr = new Ptr(Number, obj, "x");

      expect(ptr.type).toBe(Number);
      expect(ptr.obj).toBe(obj);
      expect(ptr.$).toBe(123);
    });

    it("throws when obj is not an object", () => {
      expect(() => {
        new Ptr(Number, 5, "x");
      }).toThrow(TypeError);
    });

  });

  describe("obj setter", () => {

    it("accepts objects", () => {
      const ptr = new Ptr(Number, { x: 1 }, "x");

      const obj = { x: 2 };

      ptr.obj = obj;

      expect(ptr.obj).toBe(obj);
      expect(ptr.$).toBe(2);
    });

    it("rejects primitives", () => {
      const ptr = new Ptr(Number, { x: 1 }, "x");

      expect(() => {
        ptr.obj = 123;
      }).toThrow(TypeError);
    });

  });

  describe("$ getter", () => {

    it("returns the property value", () => {
      const obj = { x: 5 };
      const ptr = new Ptr(Number, obj, "x");

      expect(ptr.$).toBe(5);
    });

    it("throws if the property has the wrong type", () => {
      const ptr = new Ptr(Number, { x: "hello" }, "x");

      expect(() => ptr.$).toThrow();
    });

  });

  describe("$ setter", () => {

    it("updates the underlying object", () => {
      const obj = { x: 1 };
      const ptr = new Ptr(Number, obj, "x");

      ptr.$ = 42;

      expect(obj.x).toBe(42);
      expect(ptr.$).toBe(42);
    });

    it("rejects values of the wrong type", () => {
      const ptr = new Ptr(Number, { x: 1 }, "x");

      expect(() => {
        ptr.$ = "abc";
      }).toThrow();
    });

  });

  describe("aliases", () => {

    it("getValue() returns the value", () => {
      const ptr = new Ptr(Number, { x: 8 }, "x");

      expect(ptr.getValue()).toBe(8);
    });

    it("setValue() updates the value", () => {
      const obj = { x: 1 };
      const ptr = new Ptr(Number, obj, "x");

      ptr.setValue(9);

      expect(obj.x).toBe(9);
    });

    it("valueIs() matches $is()", () => {
      const ptr = new Ptr(Number, { x: 5 }, "x");

      expect(ptr.valueIs(Number)).toBe(true);
    });

    it("assertValueIs() matches $assertIs()", () => {
      const ptr = new Ptr(Number, { x: 5 }, "x");

      expect(ptr.assertValueIs(Number)).toBe(5);
    });

  });

  describe("$is", () => {

    it("returns true for matching type", () => {
      const ptr = new Ptr(Number, { x: 10 }, "x");

      expect(ptr.$is(Number)).toBe(true);
    });

    it("returns false for non-matching type", () => {
      const ptr = new Ptr(Number, { x: 10 }, "x");

      expect(ptr.$is(String)).toBe(false);
    });

    it("accepts multiple types", () => {
      const ptr = new Ptr(Number, { x: 10 }, "x");

      expect(ptr.$is(String, Number)).toBe(true);
    });

  });

  describe("$assertIs", () => {

    it("returns the value for a matching type", () => {
      const ptr = new Ptr(Number, { x: 123 }, "x");

      expect(ptr.$assertIs(Number)).toBe(123);
    });

    it("throws for an invalid type", () => {
      const ptr = new Ptr(Number, { x: 123 }, "x");

      expect(() => {
        ptr.$assertIs(String);
      }).toThrow();
    });

  });

  describe("observe", () => {

    it("calls observers when the value changes", () => {
      const ptr = new Ptr(Number, { x: 1 }, "x");

      const fn = vi.fn();

      ptr.observe(fn);

      ptr.$ = 7;

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith(7);
    });

    it("calls multiple observers", () => {
      const ptr = new Ptr(Number, { x: 1 }, "x");

      const a = vi.fn();
      const b = vi.fn();

      ptr.observe(a);
      ptr.observe(b);

      ptr.$ = 15;

      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
      expect(a).toHaveBeenCalledWith(15);
      expect(b).toHaveBeenCalledWith(15);
    });

    it("returns this for chaining", () => {
      const ptr = new Ptr(Number, { x: 1 }, "x");

      expect(ptr.observe(() => {})).toBe(ptr);
    });

    it("rejects non-functions", () => {
      const ptr = new Ptr(Number, { x: 1 }, "x");

      expect(() => {
        ptr.observe(123);
      }).toThrow();
    });

  });

  describe("typeToString", () => {

    it("returns a string", () => {
      const ptr = new Ptr(Number, { x: 1 }, "x");

      expect(typeof ptr.typeToString).toBe("string");
    });

  });

  describe("toString", () => {

    it("includes property name and value", () => {
      const ptr = new Ptr(Number, { answer: 42 }, "answer");

      const str = ptr.toString();

      expect(str).toContain("answer");
      expect(str).toContain("42");
    });

  });

  describe("optional()", () => {

    it("returns an existing Ptr unchanged", () => {
      const ptr = new Ptr(Number, { x: 1 }, "x");

      expect(Ptr.optional(Number, ptr)).toBe(ptr);
    });

    it("constructs a Ptr from an object", () => {
      const obj = { x: 5 };

      const ptr = Ptr.optional(Number, obj, "x");

      expect(ptr).toBeInstanceOf(Ptr);
      expect(ptr.$).toBe(5);
    });

    it("returns null unchanged", () => {
      expect(Ptr.optional(Number, null)).toBeNull();
    });

    it("returns undefined unchanged", () => {
      expect(Ptr.optional(Number, undefined)).toBeUndefined();
    });

  });

});
