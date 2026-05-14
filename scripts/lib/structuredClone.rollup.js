import { deserialize, serialize } from '@ungap/structured-clone';

getJasmineRequireObj().structuredClone = function(j$, private$, jasmineGlobal) {
  const { structuredClone } = jasmineGlobal;

  if (structuredClone) {
    return function (any, options) {
      return structuredClone(any, options);
    };
  }

  return function (any, options) {
    return deserialize(serialize(any, options));
  };
};
