# Is: Type Utils for Vanilla JavaScript

JavaScript's dynamic typing system is infamously confusing and
inconsistent. This is a module to help with runtime type checks,
assertions, and inspection; and also includes the `Ptr` class for
typed property references. It `is`:

- a function which validates JavaScript types, like so: `is(Array, [1,2,3]) // true`.

- a module which aims to iron out different means of type checking
  and inspection, while providing a concise means of writing type
  checks and assertions.

- a third-person singular verb.

- installed with:
  ```bash
  npm install @gilchrist/is
  ```

The titular function, `is`, returns true if a value matches a
type descriptor:

```javascript
if (is([Array, "nullish"], foo)) {
  console.log("foo is an array or nullish value");
}

if (Array.isArray(foo) || foo == null) {
  // This is equivalent to the above
}

// Here, bar is guaranteed to be an Array or
// nullish value, or else a TypeError is thrown.
const bar = assertIs([Array, "nullish"], foo);
```

Here, the type descriptor is `[Array, "nullish"]`. Notice that to
check this in vanilla JavaScript, `Array.isArray(foo) || foo ==
null` was used. Arrays and nullish values have two different
expression styles to check, and although a developer should be
familiar with these, in practice it can discourage writing type
checks.

Suppose you'd like to throw an error when a function is given a
parameter of the wrong type. `typeof parameter` will tell you the
primitive type, and `parameter.constructor.name` will tell you
the name of the object type (its constructor). Also, `typeof`
will tell you `undefined` is an `"undefined"`, but it will also
tell you that `null` is an `"object"` (and that `null instanceof
Object` is `false`). This makes reporting the type of a value
within an error more ambiguous, which is why `is` provides
`getTypeName` for better reporting:

```javascript
let not_date = [];
throw new TypeError(`Expected a Date, got: ${getTypeName(not_date)}`);
// ^ "Expected a Date, got: Array"

// versus
throw new TypeError(`Expected a Date, got ${not_date.constructor.name}`);
// ^ "Expected a Date, got: Array"

// ...which gets weirder with null values
not_date = null;
throw new TypeError(`Expected a Date, got: ${getTypeName(not_date)}`);
// ^ "Expected a Date, got: null"

// ...versus
throw new TypeError(`Expected a Date, got: ${not_date?.constructor.name || typeof not_date}`
// ^ "Expected a Date, got: object"  GAH!!
```

And for these situations, the module also provides `assertIs` to
throw `TypeError`s and guarantee a value is what you expect.

```JavaScript
const is_a_date = assertIs(Date, value);
// ^ This will either be a Date, or an exception like so will follow:
// "Expected a value that is: Date; got null"
```

With these type utilities, it can be easier to write safer
vanilla JavaScript, while throwing errors earlier for smoother
debugging.

## Type handling functions

`is` exports several functions for validating and reporting
types.

  ### `function is (type, value)`

  Returns true if the value matches the type descriptor.

  ### `function assertIs (type, value, msg)`

  Throws an error if `value` does not match type. If it matches,
  return `value`. Optionally, `msg` may be used to customize the
  prefix of the error value, which defaults to `"Expected a value
  that is"`;

  ### `function getTypeOf (value)`

  Returns a type descriptor which matches `value`, as either a
  string or constructor function (class). 

  **NOTE**: this returns an `is` type descriptor, not a type that
  is guaranteed to be comparable via `type === typeof other`, but
  in many cases it can be compared with `object instanceof type`.

  Examples:
  ```javascript
  getTypeOf(null);      // "null"
  getTypeOf(new Set()); // Set constructor
  getTypeOf("foo");     // "string"
  getTypeOf({});        // Object constructor
  ```

  ### `function getTypeString (value)`

  Returns a stringified type descriptor of `value`.

  Examples:
  ```javascript
  getTypeString(null);      // "null"
  getTypeString(undefined); // "undefined"
  getTypeString(42);        // "number"
  getTypeString(new Set()); // "Set"
  getTypeString({});        // "Object"
  ```

  ### `function typeToString (type)`

  Returns a type descriptor in stringified form.

  ### `function isTypeDescriptor (type)`

  Returns true if `type` is a valid type descriptor.

## Type Descriptors

Any parameter within `is` that is called `type` consumes a type
descriptor value. These are strings, Arrays, Sets, or constructor
functions (classes) which match the data type of objects or
primitive values. They describe what something `is`!

  ### Primitive Descriptors

  These can be specified within a type descriptor with a string
  value, or with their global object-form constructors and
  generic functions, or with their values (in the case of
  `undefined` and `null`).

  | String        | Object      | Matches                                        |
  | ------------- | ----------- | ---------------------------------------------- |
  | `"string"`    | `String`    | String primitives and `new String()` objects   |
  | `"number"`    | `Number`    | Number primitives and `new Number()` objects   |
  | `"boolean"`   | `Boolean`   | Boolean primitives and `new Boolean()` objects |
  | `"bigint"`    | \*`BigInt`  | `BigInt` values.                               |
  | `"symbol"`    | \*`Symbol`  | `Symbol` values                                |
  | `"function"`  | `Function`  | `Function` objects                             |
  | `"object"`    | `Object`    | Any non-null object                            |
  | `"undefined"` | `undefined` | The `undefined` value                          |
  | `"null"`      | `null`      | The `null` value                               |

  \* Value is a non-constructor function.

  ### Constructors / Classes

  If a constructor function (class) is used, the type is evaluated with
  `instanceof`. One exception is when the `Array` class is used,
  in which case `Array.isArray` is called. 

  ### Special Keywords and Values

  Many type descriptors are strings which to not directly map
  onto JavaScript type primitives or constructors. Many of these
  use the value to simulate more specific types.

  | String                                   | Matches                               |
  | ---------------------------------------- | ------------------------------------- |
  | `""`, `"*"`, `"any"`                     | Matches all values                    |
  | `"type"`                                 | A valid type descriptor value         |
  | `"nullish"`                              | `null` and `undefined` values         |
  | `"truthy"`                               | Any truthy value                      |
  | `"falsey"`                               | Any falsey value                      |
  | `"iter"`, `"iterable"`, Symbol.iterator  | An iterable value, such as an array   |
  | `NaN`                                    | Not a number (`Number.isNaN(x)`)      |
  | `finite`                                 | Finite numbers (`Number.isFinite(x)`) |
  | `int`, `integer`                         | Integers (`Number.isInteger(x)`)      |
  | `uint`                                   | Non-negative (unsigned) integers      |

  ### Unions (Multiple Possible Types)

  Multiple types can be matched with an `Array` or `Set`, and all
  type-relating functions will recurse through elements of the
  union. If at least one type is matched with a value, the value
  is considered to match the union type.

## `Ptr` Class

This module also contains the `Ptr` class, which is a
typed-checked value reference wrapper. It validates type
correctness on both reads and writes, throwing a TypeError when a
property in the reverenced object does not match its declared
type.”

Further documentation on the `Ptr` class is pending. In the
meantime, see the source code in `index.js` to determine the
functionality (it's fairly short).

## License

MIT
