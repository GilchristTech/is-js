export function getTypeOf (value) {
  if (value === null) {
    return "null";
  }

  return value?.constructor ?? typeof value;
}


export function typeToString (type) {
  assertIs("type", type);

  if (Array.isArray(type)) {
    const types = [];
 
    function flatten (arr) {
      if (arr instanceof Set) {
        arr = Array.from(arr);
      } else if (!Array.isArray(arr)) {
        return arr;
      } else {
        return arr.map(e => flatten(e));
      }
    }

    return `<${types.map((t) => typeToString(t)).join(" | ")}>`;
  } else if (typeof type === "function") {
    return type.name || "Anonymous";
  }

  switch (type) {
    case "type":
    case "nullish":
    case "NaN":
    case "uint":
    case "int":   case "integer":
    case "finite":
      return type;

    case "":    case "*":  case "any":    return "any";
    case false: case "!":  case "falsey": return "falsey";
    case true:  case "!!": case "truthy": return "truthy";

    case "iterable":
    case "iter":
    case [Symbol.iterator]:
      return "iterable";

    case null:      case "null":      return "null";
    case undefined: case "undefined": return "undefined";
    case Boolean:   case "boolean":   return "boolean";
    case Number:    case "number":    return "number";
    case String:    case "string":    return "string";
    case BigInt:    case "bigint":    return "bigint";
    case Symbol:    case "symbol":    return "symbol";
    case Function:  case "function":  return "function";
    case Object:    case "object":    return "object";
  }

  if (typeof type === "string") {
    throw new TypeError(`Unknown type descriptor string: ${type}`);
  }

  throw new TypeError(`Expected a type descriptor, got a ${getTypeString(type)}`);
}


export function getTypeString (value) {
  const type = getTypeOf(value);

  if (type === Number) {
    if (Number.isNaN(value)) {
      return "NaN";
    } else if (Number.isInteger(value)) {
      return "int";
    } else {
      return "number";
    }
  }

  return typeToString(type);
}


export function is (type, value) {
  if (type === "type") {
    return isTypeDescriptor(value);
  }

  switch (type) {
    case "":        case "*":         case "any":    return true;
    case false:     case "!":         case "falsey": return !value;
    case true:      case "!!":        case "truthy": return !!value;

    case "nullish": return value == null;
    case "NaN":     return Number.isNaN(value);

    case "finite":
      return Number.isFinite(value);

    case "int": case "integer":
      return Number.isInteger(value);

    case "uint":
      return Number.isInteger(value) && value >= 0;

    case undefined: case "undefined": return value === undefined;
    case null:      case "null":      return value === null;

    case Boolean:  case "boolean":  return typeof value == "boolean"   || value instanceof Boolean;
    case Number:   case "number":   return typeof value == "number"    || value instanceof Number;
    case String:   case "string":   return typeof value == "string"    || value instanceof String;
    case BigInt:   case "bigint":   return typeof value == "bigint"    || value instanceof BigInt;
    case Symbol:   case "symbol":   return typeof value == "symbol"    || value instanceof Symbol;
    case Function: case "function": return typeof value === "function" || value instanceof Function;
    case Object:   case "object":   return value instanceof Object;

    case "iterable":
    case "iter":
    case [Symbol.iterator]:
      if (value == null) {
        return false;
      }
      return typeof value[Symbol.iterator] === "function";
  }

  if (Array.isArray(type)) {
    return type.some((t) => is(t, value));

  } else if (typeof type === "function") {
    return value instanceof type;
  
  } else if (typeof type === "string") {
    throw new TypeError(`Unknown type string: ${type}`);

  } else {
    throw new TypeError(`Expected a type descriptor, got a ${typeToString(value)}`);
  }
}


export function isTypeDescriptor (value) {
  switch (value) {
    case "":         case "*":  case "any":
    case false:      case "!":  case "falsey":
    case true:       case "!!": case "truthy":
    case null:       case "null":
    case undefined:  case "undefined":
    case "iterable": case "iter":
    case "finite":
    case "uint":
    case "int":      case "integer":
    case Boolean:    case "boolean":
    case Number:     case "number":
    case String:     case "string":
    case BigInt:     case "bigint":
    case Symbol:     case "symbol":
    case Function:   case "function":
    case Object:     case "object":
    case "type":
    case "nullish":
    case [Symbol.iterator]:
      return true;
  }

  if (Array.isArray(value)) {
    return value.every(t => is("type", t));
  } else if (value instanceof Set) {
    return Array.from(value).every(t => is("type", t));
  } else {
    return typeof value === "function";
  }
}



export function assertIs (type, value, msg) {
  if (!msg) {
    msg = "Expected a value that is";
  }

  if (is(type, value)) {
    return value;
  }

  const err =  new TypeError(
      `${msg}: ${typeToString(type)}; got ${getTypeString(value)}`
    );

  Error.captureStackTrace(err, assertIs);
  throw err;
}


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
