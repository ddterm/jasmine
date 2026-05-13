import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

let jasmineUnderTestRequire = {};

// Individual source files call getJasmineRequireObj. It's normally defined
// by requireCore.js which is concatenated into jasmine.js before other source
// files. Since we're bypassing that mechanism, we need to provide our own.
globalThis.getJasmineRequireObj = function() {
  return jasmineUnderTestRequire;
};

function* collectFiles(directory) {
  const enumerator = directory.enumerate_children(
    'standard::*',
    Gio.FileQueryInfoFlags.NONE,
    null
  );

  let info;
  while ((info = enumerator.next_file(null))) {
    const file = enumerator.get_child(info);

    if (info.get_file_type() === Gio.FileType.DIRECTORY) {
      yield* collectFiles(file);
    } else {
      const basename = file.get_basename();

      if (basename.endsWith('.js') && basename !== 'requireSuffix.js') {
        yield file;
      }
    }
  }
}

const coreUri = GLib.Uri.resolve_relative(
  import.meta.url,
  '../../src/core',
  GLib.UriFlags.NONE
);

const srcFiles = Array.from(collectFiles(Gio.File.new_for_uri(coreUri)));

await import('../../src/core/requireCore.js');

for (const file of srcFiles) {
  await import(file.get_uri());
}

await import('../../src/version.js');

delete globalThis.getJasmineRequireObj;

const built = jasmineUnderTestRequire.core(jasmineUnderTestRequire);
globalThis.jasmineUnderTest = built.jasmine;
globalThis.privateUnderTest = built.private;
