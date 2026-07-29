import {
  is,
  assertIs,
  typeToString,
} from "./is.js";

export class Ptr {
  #type;
  #obj;
  #observers = [];

  constructor (type, obj, property) {
    this.#type    = assertIs("type", type);
    this.obj      = obj;
    this.property = property;
  }

  get type () {
    return this.#type;
  }

  get obj () {
    return this.#obj;
  }

  set obj (value) {
    if (typeof value !== "object") {
      throw new TypeError(`Expected an object, got ${typeof value}`);
    }
    this.#obj = value;
  }

  get $ () {
    try {
      return assertIs(this.#type, this.#obj[this.property]);
    } catch (err) {
      Error.captureStackTrace(
          err,
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), "$").get,
        );
      throw err;
    }
  }

  set $ (value) {
    try {
      value = this.obj[this.property] = assertIs(this.#type, value);
    } catch (err) {
      Error.captureStackTrace(
          err,
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), "$").set,
        );
      throw err;
    }

    for (let callback of this.#observers) {
      callback(value);
    }
  }

  $is (types) {
    if (arguments.length == 1)
      return is(types, this.#obj[this.property]);
    return is(Array.from(arguments), this.#obj[this.property]);
  }

  $assertIs (types) {
    try {
      if (arguments.length == 1)
        return assertIs(types, this.$);
      return assertIs(Array.from(arguments), this.$);
    } catch (err) {
      Error.captureStackTrace(err, this.$assertIs);
      throw err;
    }
  }

  valueIs (types) {
    return this.$is(...arguments);
  }

  assertValueIs (types) {
    try {
      return this.$assertIs(...arguments);
    } catch (err) {
      Error.captureStackTrace(err, this.assertValueIs);
      throw err;
    }
  }

  getValue ()  {
    try {
      return this.$
    } catch (err) {
      Error.captureStackTrace(err, this.getValue);
      throw err;
    }
  }

  setValue (v) {
    try {
      return this.$ = v;
    } catch (err) {
      Error.captureStackTrace(err, this.setValue);
      throw err;
    }
  }

  get typeToString () {
    return typeToString(this.type);
  }

  static optional (type, obj, property) {
    assertIs([Ptr, "nullish", Object], obj);

    if (obj instanceof Ptr) {
      // TODO: check for compatible typing
      return obj;

    } else if (obj instanceof Object) {
      return new Ptr(type, obj, property);

    } else {
      // Value is nullish
      return obj;
    }
  }

  toString () {
    return `*${this.typeToString}[${this.property}] = ${(this.$.toJSON && JSON.stringify(this.$, null, 2)) || this.$}`;
  }

  observe (callback) {
    assertIs(Function, callback);
    this.#observers.push(callback);
    return this;
  }
}
