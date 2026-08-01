export function describeType (value) {
  if (value === null) {
    return "null";
  }

  return value?.constructor ?? typeof value;
}


export function formatDescriptor (descriptor) {
  assertIs("type",
    descriptor,
    "formatDescriptor() expects",
  );

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

  } else if (typeof descriptor === "function") {
    return descriptor.name || "Anonymous";
  }

  switch (descriptor) {
    case "type":
    case "nullish":
    case "NaN":
    case "uint":
    case "int":   case "integer":
    case "finite":
      return descriptor;

    case "":    case "*":  case "any":    return "any";
    case false: case "!":  case "falsey": return "falsey";
    case true:  case "!!": case "truthy": return "truthy";

    case "iterable":
    case "iter":
    case Symbol.iterator:
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

  if (typeof descriptor === "string") {
    throw new TypeError(
      `Unknown type descriptor string: ${descriptor}`
    );

  } else {
    throw new TypeError(
      `Expected a type descriptor, got a ${describeTypeAsString(descriptor)}`
    );
  }
}


export function describeTypeAsString (value) {
  const type = describeType(value);

  if (type === Number) {
    if (Number.isNaN(value)) {
      return "NaN";
    } else if (Number.isInteger(value)) {
      return "int";
    } else {
      return "number";
    }

  } else {
    return formatDescriptor(type);
  }
}



export function is (type, value) {
  if (type === "type") {
    return isDescriptor(value);
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

    case Object:
    case "object":
      if (value === null) {
        return false;
      }
      return typeof value === "object";

    case "iterable":
    case "iter":
    case Symbol.iterator:
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
    throw new TypeError(`Expected a type descriptor, got a ${formatDescriptor(value)}`);
  }
}


export function isDescriptor (value) {
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
    case Symbol.iterator:
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


/* --- Alias exports --- */

export const assertIs         = mustBe;
export const describeTypeS    = describeTypeAsString;

// DEPRECATED aliases.
// Should be removed in the next major version

export const getTypeOf        = describeType;
export const typeToString     = formatDescriptor;
export const getTypeString    = describeTypeAsString;
export const isTypeDescriptor = isDescriptor;
