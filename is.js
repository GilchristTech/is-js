export function describeType (value) {
  if (value === null) {
    return "null";
  }

  return value?.constructor ?? typeof value;
}


export function formatDescriptor (descriptor) {
  if (typeof descriptor !== "string") {
    switch (descriptor) {
      case Iterable:
      case Symbol.iterator:
        return "iterable";

      case null:      return "null";
      case true:      return "true";
      case false:     return "false";
      case undefined: return "undefined";
      case Boolean:   return "boolean";
      case Number:    return "number";
      case String:    return "string";
      case BigInt:    return "bigint";
      case Symbol:    return "symbol";
      case Function:  return "function";
      case Object:    return "object";

      case Nullish: case Truthy: case Falsey:
      case Finite:  case Int:    case Uint: 
        return descriptor.constructor.name.toLowerCase()
    }

    switch ((typeof descriptor)[0]) {
      case "f" /*function*/:
        return descriptor.name || "Anonymous";

      /*
        Cases that are implicitly discluded by previous checks:
        case "b": // boolean
        case "s": // string
        case "u": // undefined
      */

      case "n" /*number*/:
        if (Number.isNaN(descriptor)) {
          return "NaN";
        }
      case "s" /*symbol*/:
        // typeof "string" and Symbol.iterator have been
        // implicitly discluded.
      case "b" /*bigint*/:
        break;

      case "o" /*object*/:
        if (Array.isArray(descriptor)) {
          let types = new Set();

          function * flatten (arr) {
            if (is([Array, Set], arr)) {
              for (let a of arr) {
                for (let b of flatten(a)) {
                  yield b;
                }
              }

            } else {
              yield arr;
            }
          }

          for (let type_element of flatten(descriptor)) {
            types.add(type_element);
          }

          return `<${Array.from(types).map((t) => formatDescriptor(t)).join(" | ")}>`;
        }

    }

    throw new TypeError(
      `Expected a type descriptor, got a ${describeTypeAsString(descriptor)}`
    );

  } else /* typeof descriptor === "string" */ {
    switch (descriptor) {
      default:
        throw new TypeError(
          `Unknown type descriptor string: ${descriptor}`
        );

      case "undefined": case "null":       case "boolean":
      case "number":    case "bigint":     case "string":
      case "symbol":    case "object":     case "function":

      case "type":      case "descriptor": case "nullish":
      case "uint":      case "int":        case "integer":
      case "finite":    case "iterable":   case "iter":
      case "NaN":       case "any":
        return descriptor;

      case "*":  return "any";
      case "!":  case "falsey": return "falsey";
      case "!!": case "truthy": return "truthy";
    }
  }

}


export function describeTypeAsString (value) {
  const desc = describeType(value);

  if (desc === Number) {
    if (Number.isNaN(value)) {
      return "NaN";

    } else if (Number.isInteger(value)) {
      return "int";

    } else {
      return "number";
    }

  } else {
    return formatDescriptor(desc);
  }
}



export function is (desc, value) {
  if (arguments.length !== 2) {
    throw new TypeError(
      `is(desc, val) expects 2 arguments, got ${arguments.length}`
    );
  }

  switch (desc) {
    case "type": case "descriptor":
      return isDescriptor(value);

    case "*":    case "any":               return true;
    case Falsey: case "!":  case "falsey": return !value  || value == false;
    case Truthy: case "!!": case "truthy": return !!value || value == true;;

    case Nullish: case "nullish":
      return value == null;

    case "NaN":
      return Number.isNaN(value);

    case Finite: case "finite":
      return Number.isFinite(value) || value instanceof Number && Number.isFinite(value+0);

    case Int: case "int": case "integer":
      return Number.isInteger(value) || value instanceof Number && Number.isInteger(value+0);

    case Uint: case "uint":
      return (
          Number.isInteger(value) ||
          ( value instanceof Number && Number.isInteger(value+1) )
        ) && value >= 0;

    case "undefined": return value === undefined;
    case "null":      return value === null;

    case undefined: case null:
    case true:      case false:
      return value === desc

    case Boolean:  case "boolean":  return typeof value == "boolean"   || value instanceof Boolean;

    case Number:   case "number":   return typeof value == "number"    || value instanceof Number;
    case String:   case "string":   return typeof value == "string"    || value instanceof String;
    case BigInt:   case "bigint":   return typeof value == "bigint";
    case Symbol:   case "symbol":   return typeof value == "symbol"    || value instanceof Symbol;
    case Function: case "function": return typeof value === "function" || value instanceof Function;

    case Object:
    case "object":
      if (value === null) {
        return false;
      }
      return typeof value === "object";

    case Iterable:
    case "iterable":
    case "iter":
    case Symbol.iterator:
      return !(typeof value[Symbol.iterator] !== "function");
  }

  if (typeof desc !== "function") {
    if (Array.isArray(desc)) {
      return desc.some((t) => is(t, value));

    } else if (typeof desc === "string") {
      throw new TypeError(`Unknown type descriptor string: ${desc}`);

    } else if (Number.isNaN(desc)) {
      return Number.isNaN(value);

    } else {
      throw new TypeError(`Expected a type descriptor, got a ${formatDescriptor(desc)}`);
    }

  } else {
    return value instanceof desc;
  }

}


export function isDescriptor (desc) {
  // benchmark: Previously, this if block was one unified switch
  // statement containing all the builtin descriptors. However,
  // it was almost twice as fast (and much shorter) to check for
  // strings first and whether they are in the descriptor set,
  // before checking a switch of the descriptor constructor and
  // primative values.
  //
  if (typeof desc === "string") {
    return descriptors.has(desc);

  } else {
    switch (desc) {
      case false:   case true:     case null:   case undefined:
      case Boolean: case Number:   case String: case BigInt:
      case Symbol:  case Function: case Object:
      case Symbol.iterator:
        return true;
    }
  }

  if (Array.isArray(desc)) {
    return desc.every(t => is("type", t));

  } else if (desc instanceof Set) {
    for (let d of desc) if (!isDescriptor(d)) {
      return false;
    }

    return true;

  } else if (Number.isNaN(desc)) {
    return true;

  } else {
    return typeof desc === "function";
  }
}


export function mustBe (type, value, msg) {
  if (!msg) {
    msg = "Expected a value that is";
  }

  let err;

  if (is(type, value)) {
    return value;

  } if (is(String, value)) {
    err =  new TypeError(
        `${msg}: ${formatDescriptor(type)}; got string with value "${value}"}`
      );

  } else {
    err =  new TypeError(
        `${msg}: ${formatDescriptor(type)}; got ${describeTypeAsString(value)}`
      );
  }

  Error.captureStackTrace(err, assertIs);
  throw err;
}


export function pick (desc, ...candidates) {
  if (arguments.length < 2) {
    throw new TypeError(
      "pick() expects two or more arguments, got " + arguments.length
    );

  } else if (! isDescriptor(desc)){
      throw new TypeError(
        "pick() expects a type descriptor as the first argument, got " +
        describeTypeS(desc)
      );
  }

  let last_candidate;

  for (let candidate of candidates) {
    if (is(desc, candidate)) {
      return candidate;

    } else if (is(Function, candidate)) {
      candidate = candidate(last_candidate);
      if (is(desc, candidate)) {
        return candidate;
      }
    }

    last_candidate = candidate;
  }

  const last_arg = candidates[candidates.length - 1];

  if (last_arg == undefined) {
    return last_arg;

  } else {
    const err = new TypeError(
      `No candidates were a ${formatDescriptor(desc)}`
    );

    Error.captureStackTrace(err);
    throw err;
  }
}


export function when (desc, value, then, otherwise) {
  if (arguments.length < 2 || arguments.length > 4) {
    throw new TypeError(
      `when(desc, value, then, otherwise) requires 2-4 arguments, got ${arguments.length}`,
    );
  }

  if (is(desc, value)) {
    if (arguments.length >= 3) {
      if (is(Function, then)) { return then(value) }
      else                    { return then        }

    } else {
      return value;
    }

  } else {
    if (arguments.length >= 4) {
      if (is(Function, otherwise)) { return otherwise(value) }
      else                         { return otherwise        }

    } else {
      return undefined;
    }

    // ^ implicit: If the otherwise argument was not
    // provided, return undefined.
  }
}


/* --- Alias exports --- */

export const assertIs         = mustBe;
export const describeTypeS    = describeTypeAsString;

// DEPRECATED aliases.
// Should be removed in the next major version

export const getTypeOf        = describeType;
export const typeToString     = formatDescriptor;
export const getTypeString    = describeTypeAsString;
export const isTypeDescriptor = isDescriptor;


/* --- Type descriptor functions --- */

export function Nullish  (n) { return (mustBe("nullish", n), null ) }
export function Truthy   (b) { return (mustBe("truthy",  b), true ) }
export function Falsey   (b) { return (mustBe("falsey",  b), false) }
export function Iterable (i) { return mustBe(Iterable, i)           }

export function Finite (n) {
  return pick(Finite,
    when(NaN, n, null),
    when(Finite, n),
    () => when(String, n, parseFloat),
  );
}

export function Int (n) {
  return pick(Int,
    when(NaN,    n, null),
    when(Finite, n, n >> 0),
    () => when(String, n, parseInt, n),
  );
}

export function Uint (n) {
  return pick(Uint,
    when(NaN,    n, null),
    when(Finite, n, n >>> 0),
    () => when(String, n, parseInt),
  );
}

/* --- All builtin type descriptors --- */

export const descriptors = new Set([
  "*",        "any",
  false,      true,
  "!",        "falsey",
  "!!",       "truthy",
  null,       "null",
  undefined,  "undefined",
  "iterable", "iter",
  NaN,        "NaN",
  "finite",   "uint",
  "int",      "integer",
  Boolean,    "boolean",
  Number,     "number",
  String,     "string",
  BigInt,     "bigint",
  Symbol,     "symbol",
  Function,   "function",
  Object,     "object",
  "type",     "descriptor",
  "nullish",

  Nullish, Int, Uint,
  Truthy, Falsey,
  Iterable,
  Finite,
]);

descriptors.add    = null;
descriptors.clear  = null;
descriptors.remove = null;
