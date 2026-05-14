import { deserialize, serialize } from '@ungap/structured-clone';

getJasmineRequireObj().structuredClone = function(j$, private$, jasmineGlobal) {
  const { structuredClone } = jasmineGlobal;

  if (structuredClone) {
    return structuredClone.bind(jasmineGlobal);
  }

  return function (any, options) {
    return deserialize(serialize(any, options));
  };
};
