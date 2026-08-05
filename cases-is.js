import {
  Nullish, Int, Uint,
  Truthy, Falsey,
  Iterable,
  Finite,
} from "./is.js";


// TODO: add negative test cases

export function cases (cases_obj, descriptors, ...case_args) {
  if (! Array.isArray(descriptors)) {
    descriptors = [ descriptors ]
  }

  for (let desc of descriptors) {
    let cases_list = cases_obj.get(desc) ?? [];

    cases_list = [
      ...cases_list,

      ...case_args.map((case_value, i) => {
        if (case_value instanceof DescriptorTestCase) {
          const error = new Error(
            `Case number: ${i+1}`, { cause: case_value.error }
          );
          Error.captureStackTrace(cases);

          return new DescriptorTestCase({
            desc, value: case_value.value, error,
          });

        } else {
          const error = new Error(`Case number: ${i}`);
          Error.captureStackTrace(cases);

          return new DescriptorTestCase({
            desc, value: case_value, error
          });
        }
      }),
    ];

    cases_obj.set(desc, cases_list);
  }
}


export class DescriptorTestCase {
  constructor (obj) {
    Object.assign(this, obj);
  }
}


class ExtString  extends String  {}
class ExtNumber  extends Number  {}
class ExtBoolean extends Boolean {}

export const desc_cases = new Map;

cases(desc_cases, false,   false      );
cases(desc_cases, true,    true       );
cases(desc_cases, Boolean, true, false);

cases(desc_cases,
  [Iterable, "iterable", "iter", Symbol.iterator],
  [1,2,3,4],
  new Set([1,2,3,4]),
  function(){ return arguments }(1,2,3,4),
);


cases(desc_cases, [null     , "null"        ], null      );
cases(desc_cases, [undefined, "undefined"   ], undefined );
cases(desc_cases, [NaN      , "NaN"         ], NaN, -NaN );
cases(desc_cases, [Truthy   , "truthy", "!!"], true, 1, "string", {});
cases(desc_cases, [BigInt   , "bigint"      ], BigInt(0), BigInt(1234));

cases(desc_cases, [Falsey, "falsey", "!" ],
  false, 0, "", null, undefined,
  new Number(0), new String(""), new Boolean(false),
  new ExtNumber(0), new ExtString(""), new ExtBoolean(false)
);

cases(desc_cases, [Number, "number"],
  ...[ 0, 1, -1, 0.5, -0.5, 1000, NaN, -NaN ],
  ...[ 0, 1, -1, 0.5, -0.5, 1000, NaN, -NaN ].map(n => new Number(n)),
  ...[ 0, 1, -1, 0.5, -0.5, 1000, NaN, -NaN ].map(n => new ExtNumber(n)),
);

cases(desc_cases, [Finite, "finite"],
  ...[ 0, 1, -1, 0.5, -0.5, 1000 ],
  ...[ 0, 1, -1, 0.5, -0.5, 1000 ].map(n => new Number(n)),
  ...[ 0, 1, -1, 0.5, -0.5, 1000 ].map(n => new ExtNumber(n)),
);

cases(desc_cases, [Int, "int", "integer"],
  ...[ 0, 1, -1, 1000 ],
  ...[ 0, 1, -1, 1000 ].map(n => new Number(n)),
  ...[ 0, 1, -1, 1000 ].map(n => new ExtNumber(n)),
);

cases(desc_cases, [Uint, "uint"],
  ...[ 0, 1, 1000 ],
  ...[ 0, 1, 1000 ].map(n => new Number(n)),
  ...[ 0, 1, 1000 ].map(n => new ExtNumber(n)),
);

cases(desc_cases, [String, "string"],
  "", "string!",
  new String(""),    new String("string!"),
  new ExtString(""), new ExtString("string!"),
);

cases(desc_cases, [Symbol, "symbol"],
  Symbol.iterator, Symbol(), Symbol("symbol!"),
);

cases(desc_cases, [Function, "function"],
  Function, parseInt,
  function () {},
  function named () {},
  () => {},
  (class {}),
);

cases(desc_cases, [Object, "object"], {});

cases(desc_cases, ["descriptor", "type"], ...desc_cases.keys());
cases(desc_cases, ["*", "any"          ], ...Array.from(desc_cases.values()).flat());
