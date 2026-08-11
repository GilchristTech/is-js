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

- vanilla JavaScript and dependency-free

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
`describeTypeAsString` and its shorter alias, `describeTypeS` for better
reporting:

```javascript
let not_date = [];
throw new TypeError(`Expected a Date, got: ${describeTypeAsString(not_date)}`);
// ^ "Expected a Date, got: Array"

// versus
throw new TypeError(`Expected a Date, got ${not_date.constructor.name}`);
// ^ "Expected a Date, got: Array"

// ...which gets weirder with null values
not_date = null;
throw new TypeError(`Expected a Date, got: ${describeTypeS(not_date)}`);
// ^ "Expected a Date, got: null"

// ...versus
throw new TypeError(`Expected a Date, got: ${not_date?.constructor.name || typeof not_date}`
// ^ "Expected a Date, got: object"  GAH!!
```

And for these situations, the module also provides `mustBe`
and its alias `assertIs` to throw `TypeError`s and guarantee
a value is what you expect:

```JavaScript
const is_a_date = mustBe(Date, value);
// ^ This will either be a Date, or an exception like so will follow:
// "Expected a value that is: Date; got null"
```

With these type utilities, it can be easier to write safer
vanilla JavaScript and make elaborate type checks, all while
throwing errors earlier for smoother debugging.

## Type handling functions

`is` exports several functions for validating and reporting
types.

  ### `function is (desc, value)`

  Returns true if the value matches the type descriptor.

  ### `function mustBe (desc, value, msg)`

  Alias: `assertIs`

  Throws an error if `value` does not match type. If it matches,
  return `value`. Optionally, `msg` may be used to customize the
  prefix of the error value, which defaults to `"Expected a value
  that is"`;

  ### `function describeType (value)`

  Alias (*deprecated*): `getTypeOf`

  Returns a type descriptor which matches `value`, as either a
  string or constructor function (class). 

  **NOTE**: this returns an `is` type descriptor, not a type
  that is guaranteed to be comparable via `type === typeof
  other` or `instanceof`, but in many cases it can be
  compared with `object instanceof type`.

  Examples:
  ```javascript
  describeType(null);      // "null"
  describeType(new Set()); // Set constructor
  describeType("foo");     // "string"
  describeType({});        // Object constructor
  ```

  ### `function formatDescriptor (desc)`

  Alias: (*deprecated*): `describeTypeAsString`

  Returns a stringified type descriptor of `value`.

  Examples:
  ```javascript
  ```

  ### `function formatDescriptor (desc)`

  Alias (*deprecated*): `typeToString`

  Returns a type descriptor in stringified form.

  ### `function isDescriptor (desc)`

  Alias (*deprecated*): `isTypeDescriptor`

  Returns true if `type` is a valid type descriptor.

  ### `function when (desc, value, then?, otherwise?)`

  Conditionally evaluates a result based on whether a value
  matches a type descriptor. `when` has two forms: an immediate
  form which checks the type of `value` immediately, and a lazy
  form which returns a function that performs the evaluation when
  called with an input parameter. When `value` is a function, the
  lazy form is used, and when it is not a function the immediate
  form is used.

  In both forms, `when` is intended to be useful when chaining
  nullish coalescing operations (`??`) between `when` calls, or
  being combined with `pick` and `pickAsync`. Here's an example
  of a function which uses this approach with `when`'s lazy form
  to accept many data types:

  ```javascript
    async function getSomeArray (get_from) {
      return await pickAsync(String
        mustBe(
          [ null, URL, Response, Blob, String, Array ],
          get_from,
        ),

        when(null,     ()  => new URL("./file.json")        ),
        when(URL,      url => fetch(url)                    ),
        when(Response, res => res.text()                    ),
        when(String,   str => mustBe(Array, JSON.parse(str))),
      );
    }
  ```

  #### Immediate form: `function when(desc, value, then?, otherwise?) -> result`

  Returns `value` if `is(desc, value)`, otherwise returns
  `undefined`.

  If the `then` or `otherwise` arguments are provided, those
  values are used in place of `value` as an immediate value. If
  the respective argument is a function, it is instead lazily
  called with `value` as a parameter, and the result is returned
  by `when`.

  Example:

  ```javascript
  // Basic form
  const date = when(Date, value);
  // ...equivalent to:
  const date = is(Date, value) ? value : undefined;

  // Using an `otherwise` value
  const date = when(Date, value, undefined, () => new Date());
  // ...equivalent to:
  const date = is(Date, value) ? value : new Date();
  ```

  #### Lazy form: `function when(desc, then, otherwise?) -> ((value) => result)`

  The lazy form of `when` is used when the second argument is a
  function. This changes the return from the resolved value of
  `then` or `otherwise` to a lazy function which returns the
  value, based on whether its parameter matches `desc`.

  Like the immediate form, `then` and `otherwise` can be lazy or
  immediate values.

  ### `function pick (desc, ...candidates)`

  Pick the first candidate (evaluating from left to right), which
  matches the type descriptor. Each non-function argument is used
  as an immediate value. If candidates are functions, they are
  lazily called with the last non-nullish value of a previous
  candidate as an argument, or undefined, if none exists).

  Throws a TypeError if no candidate was found, unless the final
  argument is an immediate nullish value, in which case it is returned.

  Example:

  ```javascript
  // Pick a positive port
  const port = pick("uint",
      process.env.PORT,   // First try the environment variable string...

      Number.parseInt,    // Here, parseInt(process.env.PORT) would be called.
                          // This function returns NaN when an invalid
                          // string is provided, which would not
                          // match the type descriptor.

      8080,               // If that fails, use 8080
    );
  ```


## Descriptors

Any parameter within `is` that is called `type` consumes a type
descriptor value. These are strings, Arrays, Sets, or constructor
functions (classes) which match the data type of objects or
primitive values. They describe what something `is`!

In short, they are a composite of 

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

  | Value of Descriptor       | Matches                               |
  | ------------------------- | ------------------------------------- |
  | `"*"`, `"any"`            | Matches all values                    |
  | `"type"`                  | A valid type descriptor value         |
  | Is.Nullish, `"nullish"`   | `null` and `undefined` values         |
  | Is.Truthy, `"truthy"`     | Any truthy value                      |
  | Is.Falsey, `"falsey"`     | Any falsey value                      |
  | Is.Iterable, `"iter"`, `"iterable"`, Symbol.iterator  | An iterable value, such as an array |
  | NaN, `NaN`                | Not a number (`Number.isNaN(x)`)      |
  | Is.Finite, `finite`       | Finite numbers (`Number.isFinite(x)`) |
  | Is.Int, `int`, `integer`  | Integers (`Number.isInteger(x)`)      |
  | Is.Uint, `uint`           | Non-negative (unsigned) integers      |

  ### Unions (Multiple Possible Types)

  Multiple types can be matched with an `Array` or `Set`, and all
  type-relating functions will recurse through elements of the
  union. If at least one type is matched with a value, the value
  is considered to match the union type.

  ### Descriptor function exports

  `is` exports several functions, and references to them can be
  used as type descriptors. When called, they perform assertions
  and conversions of their argument, similar to Python's
  functions like `int` or `bool`. 

  | Name          | Returns                                                                                                               |
  | ------------- | --------------------------------------------------------------------------------------------------------------------- |
  | Nullish(n)    | Returns `null` if the value is nullish, or throws                                                                     |
  | Finite(n)     | Returns `n` as a number and converts strings. Throws if the value is not a finite number                              |
  | Int(n)        | Returns `n` as an integer (rounded down), and converts strings. Throws if the value is not a finite number            |
  | Uint(n)       | Returns `n` as an unsigned integer (rounded down), and converts strings. Throws if the value is not a positive number |
  | Truthy(t)     | Returns `true` if the value is truthy, or throws                                                                      |
  | Falsey(f)     | Returns `false` if the value is falsey, or throws                                                                     |
  | Iterable(itr) | Returns `itr` if the value is iterable, or throws                                                                     |

    case Nullish, Int, Uint, Truthy, Falsey,
         Iterable, Finite:

## `Ptr` Class

This module also contains the `Ptr` class, which is a
typed-checked value reference wrapper. It validates type
correctness on both reads and writes, throwing a TypeError when a
property in the reverenced object does not match its declared
type.

Further documentation on the `Ptr` class is pending. In the
meantime, see the source code in `ptr.js` to determine the
functionality (it's fairly short).

## License

MIT
