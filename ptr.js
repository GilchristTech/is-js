import {
  is,
  mustBe,
  describeTypeAsString,
} from "./is.js";

export class Ptr {
  #type;
  #obj;
  #observers = [];

  constructor (type, obj, property) {
    this.#type    = mustBe("type", type);
    this.obj      = obj;
    this.property = property;
  }

  get typeDescription () { return this.#type }
  get descriptor      () { return this.#type }
  get type            () { return this.#type }

  get typeDescriptionAsString () {
    return describeTypeAsString(this.#type);
  }

  get typeDescriptionS () { return this.typeDescriptionAsString }
  get descriptorS      () { return this.typeDescriptionAsString }
  get typeS            () { return this.typeDescriptionAsString }

  // DEPRECATE
  get typeToString     () { return this.typeDescriptionAsString }

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
      return mustBe(this.#type, this.#obj[this.property]);
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
      value = this.obj[this.property] = mustBe(this.#type, value);
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

  valueIs (types) {
    return this.$is(...arguments);
  }

  valueMustBe (types) {
    try {
      return this.$mustBe(...arguments);
    } catch (err) {
      Error.captureStackTrace(err, this.assertValueIs);
      throw err;
    }
  }

  $mustBe (types) {
    try {
      if (arguments.length == 1)
        return mustBe(types, this.$);
      return mustBe(Array.from(arguments), this.$);
    } catch (err) {
      Error.captureStackTrace(err, this.$mustBe);
      throw err;
    }
  }

  $assertIs (types) {
    return this.$mustBe(...arguments);
  }

  assertValueIs (types) {
    return this.valueMustBe(...arguments);
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

  static optional (type, obj, property) {
    mustBe([Ptr, "nullish", Object], obj);

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
    mustBe(Function, callback);
    this.#observers.push(callback);
    return this;
  }
}
