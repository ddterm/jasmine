#!/usr/bin/env -S gjs -m

import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import System from 'system';

import '../lib/jasmine-core/jasmine.js';

class Reporter {
  jasmineStarted(suiteInfo) {
    console.log('Started', JSON.stringify(suiteInfo, null, 2));
  }

  jasmineDone(suiteInfo) {
    if (suiteInfo.overallStatus === 'passed' && !suiteInfo.failedExpectations?.length)
      console.log(suiteInfo.overallStatus, JSON.stringify(suiteInfo, null, 2));
    else
      console.warn(suiteInfo.overallStatus, JSON.stringify(suiteInfo, null, 2));
  }

  suiteStarted(result) {
    console.info('Suite started', JSON.stringify(result, null, 2));
  }

  suiteDone(result) {
    if (result.status === 'passed')
      console.info('Suite', result.status, JSON.stringify(result, null, 2));
    else
      console.warn('Suite', result.status, JSON.stringify(result, null, 2));
  }

  specStarted(result) {
    console.info('Spec started', JSON.stringify(result, null, 2));
  }

  specDone(result) {
    if (result.status === 'passed')
      console.info('Spec', result.status, JSON.stringify(result, null, 2));
    else
      console.warn('Spec', result.status, JSON.stringify(result, null, 2));
  }
}

const app = new Gio.Application();

const helpers = [
  '../spec/helpers/init.js',
  '../spec/helpers/checkForUrl.js',
  '../spec/helpers/integrationMatchers.js',
  '../spec/helpers/callerFilenameShim.js',
  '../spec/helpers/monkeyPatchingSpecs.js',
  '../spec/helpers/gjsDefineJasmineUnderTest.js',
  '../spec/helpers/resetEnv.js',
];

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
      if (/[Ss]pec\.js$/.test(file.get_path())) {
        yield file;
      }
    }
  }
}

const specUri = GLib.Uri.resolve_relative(
  import.meta.url,
  '../spec/core',
  GLib.UriFlags.NONE
);

const specFiles = Array.from(collectFiles(Gio.File.new_for_uri(specUri)));

const exclude = [
];

app.connect('activate', async () => {
  let result;

  app.hold();

  try {
    const env = jasmine.getEnv();

    env.addReporter(new Reporter());

    env.configure({
      specFilter: spec => !exclude.some(pattern => pattern.test(spec.getFullName())),
    });

    for (const helper of helpers) {
      await import(helper);
    }

    for (const specFile of specFiles) {
      await import(specFile.get_uri());
    }

    await new Promise(resolve => GLib.idle_add(GLib.PRIORITY_LOW, () => resolve()));

    result = await env.execute();
  } catch (error) {
    logError(error);
  } finally {
    app.release();
    app.quit();
  }

  if (result?.overallStatus !== 'passed') {
    System.exit(1);
  }
});

app.runAsync([System.programInvocationName, ...System.programArgs]).catch(logError);
