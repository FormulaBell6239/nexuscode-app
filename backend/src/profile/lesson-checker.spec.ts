import { LESSON_CATALOG } from '../lesson-catalog';
import {
  canonicalizeRegexIgnoreCaseCodeUnit,
  checkHtmlFormsReference,
  checkLesson,
  LESSON_CHECKER_KEYS,
} from './lesson-checker';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Worker } from 'worker_threads';
import { ModuleKind, ScriptTarget, transpileModule } from 'typescript';

describe('backend lesson checker catalog', () => {
  it('validates non-Unicode /i code-unit canonicalization against JavaScript backreferences', () => {
    const referenceByLength = new Map<number, RegExp>();
    const regexEqual = (left: string, right: string) => {
      if (left.length !== right.length) return false;
      let reference = referenceByLength.get(left.length);
      if (!reference) {
        reference = new RegExp('^([\\s\\S]{' + left.length + '})\\1$', 'i');
        referenceByLength.set(left.length, reference);
      }
      return reference.test(left + right);
    };
    const helperEqual = (left: string, right: string) => {
      if (left.length !== right.length) return false;
      for (let index = 0; index < left.length; index += 1) {
        if (canonicalizeRegexIgnoreCaseCodeUnit(left.charCodeAt(index)) !== canonicalizeRegexIgnoreCaseCodeUnit(right.charCodeAt(index))) {
          return false;
        }
      }
      return true;
    };

    const asciiLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    for (const left of asciiLetters) {
      for (const right of asciiLetters) {
        expect(helperEqual(left, right)).toBe(regexEqual(left, right));
      }
    }

    for (let unit = 0; unit <= 0xffff; unit += 1) {
      const character = String.fromCharCode(unit);
      expect(helperEqual(character, character)).toBe(regexEqual(character, character));
      const uppercase = character.toUpperCase();
      if (uppercase.length === 1) {
        expect(helperEqual(character, uppercase)).toBe(regexEqual(character, uppercase));
      }
    }

    const specialPairs = [
      ['é', 'É'], ['å', 'Å'], ['σ', 'Σ'], ['ς', 'Σ'],
      ['ſ', 'S'], ['K', 'K'], ['ı', 'I'], ['İ', 'i'],
      ['𐐨', '𐐀'], ['\uD800', '\uD800'], ['\uDC00', '\uDC01'],
      ['ß', 'ẞ'], ['ß', 'SS'], ['ﬃ', 'FFI'],
    ];
    for (const [left, right] of specialPairs) {
      expect(helperEqual(left, right)).toBe(regexEqual(left, right));
    }

    const fullFormsExamples: Array<[string, boolean]> = [
      ['<form><label for="Alpha"></label><input id=\'aLPHa\'></form>', true],
      ['<form><label for="é"></label><input id="É"></form>', true],
      ['<form><label for="ſ"></label><input id="S"></form>', false],
      ['<form><label for=\'x>y"></label><input id="x>y"></form>', true],
      ['<form><label data-for="x"></label><input data-id="X"></form>', true],
      ['<form><label for="𐐨"></label><input id="𐐀"></form>', false],
    ];
    for (const [input, expected] of fullFormsExamples) {
      expect(checkHtmlFormsReference(input)).toBe(expected);
    }
  });

  it('has a checker for every catalogued lesson and no unknown lesson', () => {
    expect(LESSON_CHECKER_KEYS).toEqual(expect.arrayContaining(Object.keys(LESSON_CATALOG)));
    expect(checkLesson('not-a-lesson', 'anything')).toBe(false);
  });

  it('preserves current weak comment matching behavior for later review', () => {
    expect(checkLesson('js-console', '// console.log(')).toBe(true);
    expect(checkLesson('css-selectors', '/* h1 { color: blue; } */')).toBe(true);
  });

  it.each(adversarialInputs())('bounds 64 KiB checker input for %s in an isolated worker', async (lessonKey, input) => {
    expect(Buffer.byteLength(input, 'utf8')).toBeLessThanOrEqual(64 * 1024);
    const result = await runCheckerWithTimeout(lessonKey, input, 2000);
    expect(typeof result).toBe('boolean');
  });

  it.each(tableCompatibilityInputs())('matches the table reference for %s in an isolated worker', async (label, input) => {
    expect(Buffer.byteLength(input, 'utf8')).toBeLessThanOrEqual(64 * 1024);
    const result = await runTableComparisonWithTimeout(input, 2000);
    expect(result.referenceTimedOut).toBe(false);
    expect(result.scannerResult).toBe(result.referenceResult);
  });

  it('preserves the table result for deterministic generated inputs up to 64 KiB', async () => {
    const inputs = seededTableInputs(20, 0x51a7e);
    for (const input of inputs) {
      const result = await runTableComparisonWithTimeout(input, 2000);
      expect(result.referenceTimedOut).toBe(false);
      expect(result.scannerResult).toBe(result.referenceResult);
    }
  });

  it.each(divCompatibilityInputs())('matches the Divs reference for %s in an isolated worker', async (label, input) => {
    expect(Buffer.byteLength(input, 'utf8')).toBeLessThanOrEqual(64 * 1024);
    const result = await runDivComparisonWithTimeout(input, 2000);
    expect(result.referenceTimedOut).toBe(false);
    expect(result.scannerResult).toBe(result.referenceResult);
  });

  it('preserves Divs results for deterministic generated inputs up to 64 KiB', async () => {
    const inputs = seededDivInputs(20, 0xd1a5);
    for (const input of inputs) {
      expect(Buffer.byteLength(input, 'utf8')).toBeLessThanOrEqual(64 * 1024);
      const result = await runDivComparisonWithTimeout(input, 2000);
      expect(result.referenceTimedOut).toBe(false);
      expect(result.scannerResult).toBe(result.referenceResult);
    }
  });

  it.each(commentCompatibilityInputs())('matches the Comments reference for %s in an isolated worker', async (label, input) => {
    expect(Buffer.byteLength(input, 'utf8')).toBeLessThanOrEqual(64 * 1024);
    const result = await runCommentsComparisonWithTimeout(input, 2000);
    expect(result.referenceTimedOut).toBe(false);
    expect(result.scannerResult).toBe(result.referenceResult);
  });

  it('preserves Comments results for deterministic generated inputs up to 64 KiB', async () => {
    const inputs = seededCommentInputs(20, 0xc011e17);
    for (const input of inputs) {
      expect(Buffer.byteLength(input, 'utf8')).toBeLessThanOrEqual(64 * 1024);
      const result = await runCommentsComparisonWithTimeout(input, 2000);
      expect(result.referenceTimedOut).toBe(false);
      expect(result.scannerResult).toBe(result.referenceResult);
    }
  });

  it.each(formsCompatibilityInputs())('matches the Forms reference for %s in an isolated worker', async (label, input) => {
    expect(Buffer.byteLength(input, 'utf8')).toBeLessThanOrEqual(64 * 1024);
    const result = await runFormsComparisonWithTimeout(input, 2000);
    expect(result.referenceTimedOut).toBe(false);
    expect(result.scannerResult).toBe(result.referenceResult);
  });

  it('compares Forms results on deterministic generated inputs up to 64 KiB', async () => {
    const inputs = seededFormsInputs(24, 0xf04a5);
    for (const input of inputs) {
      expect(Buffer.byteLength(input, 'utf8')).toBeLessThanOrEqual(64 * 1024);
      const result = await runFormsComparisonWithTimeout(input, 2000);
      expect(result.referenceTimedOut).toBe(false);
      expect(result.scannerResult).toBe(result.referenceResult);
    }
  });
});

function tableCompatibilityInputs(): Array<[string, string]> {
  return [
    ['existing table lesson example', '<table>\n  <tr>\n    <th>Name</th>\n    <th>Score</th>\n  </tr>\n  <tr>\n    <td>Alice</td>\n    <td>95</td>\n  </tr>\n</table>'],
    ['lesson-shaped success', '<table><tr><th>Name</th><tr><td>Ada</td></table>'],
    ['missing first row', '<table><th>x</th><tr><td>x>'],
    ['missing second row', '<table><tr><th>x</th><td>x>'],
    ['missing final boundary', '<table><tr><th>x</th><tr><td'],
    ['malformed and unclosed markup', '<table><tr><th><tr><td '],
    ['mixed-case tags', '<TABLE><Tr><tH><TR><Td>'],
    ['JavaScript whitespace', '<table\n><tr\t><th\r><tr\f><td\v'],
    ['non-ASCII whitespace boundary', '<table\u00a0><tr><th><tr><td>'],
    ['repeated prefixes', '<table'.repeat(20) + '><tr'.repeat(20) + '><th'.repeat(20) + '><tr><td>'],
    ['near match', '<table><tr><th><tr><tdx>'],
    ['UTF-16 supplementary characters', '😀<TABLE>😀<TR>😀<TH>😀<TR>😀<TD>'],
    ['64 KiB without table tokens', 'x'.repeat(64 * 1024)],
    ['64 KiB successful sequence near end', 'x'.repeat(64 * 1024 - 30) + '<table><tr><th><tr><td>'],
  ];
}

function seededTableInputs(count: number, initialSeed: number): string[] {
  let seed = initialSeed >>> 0;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  const pieces = ['x', '<table>', '<tr ', '<th>', '<tr>', '<td>', '<TD\t', '<tablex>', '<tr', '😀', '\u00a0'];
  return Array.from({ length: count }, (_, index) => {
    const targetLength = index === count - 1 ? 64 * 1024 : 100 + (next() % 4000);
    let input = '';
    while (input.length < targetLength) input += pieces[next() % pieces.length];
    return input.slice(0, targetLength);
  });
}

function divCompatibilityInputs(): Array<[string, string]> {
  return [
    ['existing div lesson example', '<div class="card">\n  <h2>Lesson Title</h2>\n  <p>Lesson description here.</p>\n</div>'],
    ['successful sequence with independently matched heading levels', '<div><h1>x</h2><p>x</p></div>'],
    ['missing heading', '<div><p>x</p></div>'],
    ['missing heading close', '<div><h1>x<p>x</p></div>'],
    ['missing paragraph close', '<div><h1>x</h1><p>x</div>'],
    ['missing div close', '<div><h1>x</h1><p>x</p>'],
    ['malformed and mismatched markup', '<div><h6><p>x</p></span></div>'],
    ['mixed-case tags', '<DIV><H3>x</h3><P>x</P></DIV>'],
    ['JavaScript whitespace boundaries', '<div\n><h4\t>x</h2><p\r>x</p></DIV>'],
    ['non-whitespace Unicode separator is not a tag boundary', '<div\u200b><h1>x</h1><p>x</p></div>'],
    ['repeated opening prefixes without a close', '<div><h1>x</h1><p>x</p>'.repeat(30)],
    ['near-match closing heading', '<div><h1>x</h7><p>x</p></div>'],
    ['UTF-16 supplementary characters', '😀<DIV>😀<H2>😀</h6>😀<P>😀</P>😀</DIV>'],
    ['64 KiB without div tokens', 'x'.repeat(64 * 1024)],
    ['64 KiB successful sequence near end', 'x'.repeat(64 * 1024 - 40) + '<div><h1></h1><p></p></div>'],
  ];
}

function seededDivInputs(count: number, initialSeed: number): string[] {
  let seed = initialSeed >>> 0;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  const pieces = ['x', '<div>', '<h1>', '</h2>', '<h6 ', '</h6>', '<p>', '</p>', '</div>', '<divx>', '😀', '\u00a0'];
  return Array.from({ length: count }, (_, index) => {
    if (index === count - 1) return 'x'.repeat(64 * 1024);
    const targetLength = 100 + (next() % 4000);
    let input = '';
    while (input.length < targetLength) input += pieces[next() % pieces.length];
    return input.slice(0, targetLength);
  });
}

function commentCompatibilityInputs(): Array<[string, string]> {
  return [
    ['lesson-shaped success', '<!-- intro --><h1>Welcome</h1><!-- note --><p>Text</p>'],
    ['successful sequence with multiple comments', '<!--a--><!--b-->\n<h1 >Title<!--c--><!--d-->\t<p class="x">'],
    ['missing second comment', '<!--a--><h1>Title</h1><p>Text</p>'],
    ['missing first terminator', '<!--a<h1>Title</h1><!--b--><p>Text</p>'],
    ['missing second terminator', '<!--a--><h1>Title<!--b<p>Text</p>'],
    ['near-match --!> terminator', '<!--a--!><h1>Title</h1><!--b--><p>Text</p>'],
    ['near-match spaced terminator', '<!--a-- ><h1>Title</h1><!--b--><p>Text</p>'],
    ['malformed terminator before a valid later match', '<!--bad--!><h1>skip</h1><!--ok--><h1>Title</h1><!--end--><p>Text</p>'],
    ['mixed-case tags', '<!--A--><H1>Title</h1><!--B--><P>Text</P>'],
    ['JavaScript whitespace', '<!--A-->\n\t\r<h1\v>Title<!--B-->\f\u00a0<p\n>Text'],
    ['non-whitespace separator', '<!--A-->\u200b<h1>Title<!--B--><p>Text'],
    ['repeated-prefix failure', '<!--x--><h1>x'.repeat(25)],
    ['UTF-16 and non-ASCII content', '😀<!--雪--><H1>🧪<!--注-->\u2028<P>é'],
    ['64 KiB without comment tokens', 'x'.repeat(64 * 1024)],
    ['64 KiB successful sequence near end', 'x'.repeat(64 * 1024 - 40) + '<!--a--><h1>x<!--b--><p>'],
  ];
}

function seededCommentInputs(count: number, initialSeed: number): string[] {
  let seed = initialSeed >>> 0;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  const pieces = ['x', '<!--', '-->', '--!>', '<h1>', '<H1 ', '<p>', '<P>', ' ', '\n', '\u00a0', '😀'];
  return Array.from({ length: count }, (_, index) => {
    if (index === count - 1) return 'x'.repeat(64 * 1024);
    const targetLength = 100 + (next() % 4000);
    let input = '';
    while (input.length < targetLength) input += pieces[next() % pieces.length];
    return input.slice(0, targetLength);
  });
}

function formsCompatibilityInputs(): Array<[string, string]> {
  return [
    ['existing lesson-shaped success', '<form><label for="name">Name</label><input id="name"></form>'],
    ['ordinary unsuccessful submission', '<form><label for="name">Name</label><input id="email"></form>'],
    ['backtracking to earlier for candidate', '<form><label for="x" data-for="y"></label><input id="x"></form>'],
    ['backtracking to earlier id candidate', '<form><label for="x"></label><input id="x" data-id="y"></form>'],
    ['multiple forms labels and inputs', '<form><label for="a"></label></form><form><label for="b"></label><input id="B"></form>'],
    ['mixed opening and closing quotes', '<FORM><LABEL for=\'x"></LABEL><INPUT id="X\'></INPUT></FORM>'],
    ['embedded attribute-like substrings', '<form><label data-for="x"></label><input data-id="X"></form>'],
    ['notfor substring', '<form><label notfor="x"></label><input id="X"></form>'],
    ['value crosses greater-than boundaries', '<form><label for="x>y"></label><input id="X>Y"></form>'],
    ['input value crosses a tag boundary character', '<form><label for="x>y"></label><input id="x>y"></form>'],
    ['empty for value', '<form><label for=""></label><input id=""></form>'],
    ['empty id value', '<form><label for="x"></label><input id=""></form>'],
    ['missing closing form', '<form><label for="x"></label><input id="x">'],
    ['malformed incomplete label and input', '<form><label for="x"><input id="x"></form>'],
    ['JavaScript whitespace around equals', '<form><label for\n =\t"x"></label><input id\r=\f"X"></form>'],
    ['non-ASCII case-fold pair', '<form><label for="é"></label><input id="É"></form>'],
    ['non-ASCII to ASCII case-fold is blocked', '<form><label for="ſ"></label><input id="S"></form>'],
    ['supplementary case pair uses UTF-16 units', '<form><label for="𐐨"></label><input id="𐐀"></form>'],
    ['lone surrogate code unit', '<form><label for="\uD800"></label><input id="\uD800"></form>'],
    ['repeated-prefix failure', '<form><label for="x"></label><input id="y">'.repeat(8)],
    ['candidate-dense successful sequence', '<form><label for="x"></label><label for="y"></label><input id="y"><input id="x"></form>'],
    ['candidate-dense unsuccessful sequence', '<form><label for="x"></label><input id="y"></input><label for="z"></label><input id="w"></form>'],
    ['64 KiB without checker tokens', 'x'.repeat(64 * 1024)],
    ['64 KiB successful sequence near end', 'x'.repeat(64 * 1024 - 64) + '<form><label for="value"></label><input id="VALUE"></form>'],
  ];
}

function seededFormsInputs(count: number, initialSeed: number): string[] {
  let seed = initialSeed >>> 0;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  const pieces = [
    'x', '<form>', '<label ', 'data-for="a"', 'for="b"', 'for=\'c"',
    '<input ', 'data-id="A"', 'id="b"', 'id=\'C"', '>', '</form>',
    ' ', '\n', 'é', '😀',
  ];
  return Array.from({ length: count }, (_, index) => {
    if (index === count - 1) return 'x'.repeat(64 * 1024);
    const targetLength = 80 + (next() % 900);
    let input = '';
    while (input.length < targetLength) input += pieces[next() % pieces.length];
    return input.slice(0, targetLength);
  });
}

function adversarialInputs(): Array<[string, string]> {
  const cases: Record<string, string> = {
    'html-paragraphs': '<p>a</p>'.repeat(7000) + '<p>' + 'a'.repeat(9000),
    'html-forms': '<form><label for="x">x</label><input id="x">'.repeat(1100),
    'html-lists': '<ul>' + '<li>x</li>'.repeat(2) + '<li'.repeat(9000),
    'html-divs': '<div><h1>x</h1><p>x</p>'.repeat(1800),
    'html-tables': '<table><tr><th>x</th><tr><td'.repeat(2200),
    'html-select': '<select>' + '<option value="x">x</option>'.repeat(2) + '<option'.repeat(4000),
    'html-comments': '<!--x--><h1>x'.repeat(4000),
    'html-classes': 'class="a" class="b" '.repeat(3200),
    'py-try-except': 'try:\n' + 'x = 1\n'.repeat(8000),
    'sql-update': "UPDATE users SET email = '" + 'x'.repeat(64 * 1024),
  };
  return Object.entries(cases).map(([key, value]) => [key, value.slice(0, 64 * 1024)]);
}

function runCheckerWithTimeout(lessonKey: string, input: string, timeoutMs: number): Promise<boolean> {
  const checkerPath = join(__dirname, 'lesson-checker.ts');
  const checkerSource = readFileSync(checkerPath, 'utf8');
  const compiled = transpileModule(checkerSource, {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2019 },
  }).outputText;
  const workerSource = `
    const { parentPort, workerData } = require('worker_threads');
    const loaded = { exports: {} };
    new Function('module', 'exports', workerData.compiled)(loaded, loaded.exports);
    const start = process.hrtime.bigint();
    const result = loaded.exports.checkLesson(workerData.lessonKey, workerData.input);
    const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
    parentPort.postMessage({ result, elapsedMs });
  `;

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerSource, {
      eval: true,
      workerData: { compiled, lessonKey, input },
    });
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error(`Checker '${lessonKey}' exceeded ${timeoutMs} ms on a 64 KiB adversarial input.`));
    }, timeoutMs);
    worker.once('message', ({ result, elapsedMs }) => {
      clearTimeout(timeout);
      if (elapsedMs > timeoutMs) reject(new Error(`Checker '${lessonKey}' took ${elapsedMs} ms.`));
      else resolve(result);
    });
    worker.once('error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Checker '${lessonKey}' worker failed: ${error.message}`));
    });
  });
}

function runTableComparisonWithTimeout(
  input: string,
  timeoutMs: number,
): Promise<{ scannerResult: boolean; referenceResult?: boolean; referenceTimedOut: boolean }> {
  const checkerPath = join(__dirname, 'lesson-checker.ts');
  const checkerSource = readFileSync(checkerPath, 'utf8');
  const compiled = transpileModule(checkerSource, {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2019 },
  }).outputText;
  const workerSource = `
    const { parentPort, workerData } = require('worker_threads');
    const loaded = { exports: {} };
    new Function('module', 'exports', workerData.compiled)(loaded, loaded.exports);
    const scannerResult = loaded.exports.checkLesson('html-tables', workerData.input);
    parentPort.postMessage({ stage: 'scanner', scannerResult });
    const referenceResult = loaded.exports.checkHtmlTablesReference(workerData.input);
    parentPort.postMessage({ stage: 'reference', referenceResult });
  `;

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerSource, { eval: true, workerData: { compiled, input } });
    let scannerResult: boolean | undefined;
    let finished = false;
    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      worker.terminate();
      if (scannerResult === undefined) {
        reject(new Error('Table scanner exceeded the isolated worker timeout.'));
      } else {
        resolve({ scannerResult, referenceTimedOut: true });
      }
    }, timeoutMs);
    worker.on('message', (message: { stage: string; scannerResult?: boolean; referenceResult?: boolean }) => {
      if (message.stage === 'scanner') scannerResult = message.scannerResult;
      if (message.stage === 'reference' && !finished) {
        finished = true;
        clearTimeout(timeout);
        resolve({ scannerResult: scannerResult!, referenceResult: message.referenceResult, referenceTimedOut: false });
      }
    });
    worker.once('error', (error) => {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        reject(new Error(`Table comparison worker failed: ${error.message}`));
      }
    });
  });
}

function runDivComparisonWithTimeout(
  input: string,
  timeoutMs: number,
): Promise<{ scannerResult: boolean; referenceResult?: boolean; referenceTimedOut: boolean }> {
  const checkerPath = join(__dirname, 'lesson-checker.ts');
  const checkerSource = readFileSync(checkerPath, 'utf8');
  const compiled = transpileModule(checkerSource, {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2019 },
  }).outputText;
  const workerSource = `
    const { parentPort, workerData } = require('worker_threads');
    const loaded = { exports: {} };
    new Function('module', 'exports', workerData.compiled)(loaded, loaded.exports);
    const scannerResult = loaded.exports.checkLesson('html-divs', workerData.input);
    parentPort.postMessage({ stage: 'scanner', scannerResult });
    const referenceResult = loaded.exports.checkHtmlDivsReference(workerData.input);
    parentPort.postMessage({ stage: 'reference', referenceResult });
  `;

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerSource, { eval: true, workerData: { compiled, input } });
    let scannerResult: boolean | undefined;
    let finished = false;
    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      worker.terminate();
      if (scannerResult === undefined) {
        reject(new Error('Divs scanner exceeded the isolated worker timeout.'));
      } else {
        resolve({ scannerResult, referenceTimedOut: true });
      }
    }, timeoutMs);
    worker.on('message', (message: { stage: string; scannerResult?: boolean; referenceResult?: boolean }) => {
      if (message.stage === 'scanner') scannerResult = message.scannerResult;
      if (message.stage === 'reference' && !finished) {
        finished = true;
        clearTimeout(timeout);
        resolve({ scannerResult: scannerResult!, referenceResult: message.referenceResult, referenceTimedOut: false });
      }
    });
    worker.once('error', (error) => {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        reject(new Error(`Divs comparison worker failed: ${error.message}`));
      }
    });
  });
}

function runCommentsComparisonWithTimeout(
  input: string,
  timeoutMs: number,
): Promise<{ scannerResult: boolean; referenceResult?: boolean; referenceTimedOut: boolean }> {
  const checkerPath = join(__dirname, 'lesson-checker.ts');
  const checkerSource = readFileSync(checkerPath, 'utf8');
  const compiled = transpileModule(checkerSource, {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2019 },
  }).outputText;
  const workerSource = `
    const { parentPort, workerData } = require('worker_threads');
    const loaded = { exports: {} };
    new Function('module', 'exports', workerData.compiled)(loaded, loaded.exports);
    const scannerResult = loaded.exports.checkLesson('html-comments', workerData.input);
    parentPort.postMessage({ stage: 'scanner', scannerResult });
    const referenceResult = loaded.exports.checkHtmlCommentsReference(workerData.input);
    parentPort.postMessage({ stage: 'reference', referenceResult });
  `;

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerSource, { eval: true, workerData: { compiled, input } });
    let scannerResult: boolean | undefined;
    let finished = false;
    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      worker.terminate();
      if (scannerResult === undefined) {
        reject(new Error('Comments scanner exceeded the isolated worker timeout.'));
      } else {
        resolve({ scannerResult, referenceTimedOut: true });
      }
    }, timeoutMs);
    worker.on('message', (message: { stage: string; scannerResult?: boolean; referenceResult?: boolean }) => {
      if (message.stage === 'scanner') scannerResult = message.scannerResult;
      if (message.stage === 'reference' && !finished) {
        finished = true;
        clearTimeout(timeout);
        resolve({ scannerResult: scannerResult!, referenceResult: message.referenceResult, referenceTimedOut: false });
      }
    });
    worker.once('error', (error) => {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        reject(new Error(`Comments comparison worker failed: ${error.message}`));
      }
    });
  });
}

function runFormsComparisonWithTimeout(
  input: string,
  timeoutMs: number,
): Promise<{ scannerResult: boolean; referenceResult?: boolean; referenceTimedOut: boolean }> {
  const checkerPath = join(__dirname, 'lesson-checker.ts');
  const checkerSource = readFileSync(checkerPath, 'utf8');
  const compiled = transpileModule(checkerSource, {
    compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2019 },
  }).outputText;
  const workerSource = `
    const { parentPort, workerData } = require('worker_threads');
    const loaded = { exports: {} };
    new Function('module', 'exports', workerData.compiled)(loaded, loaded.exports);
    const scannerResult = loaded.exports.checkLesson('html-forms', workerData.input);
    parentPort.postMessage({ stage: 'scanner', scannerResult });
    const referenceResult = loaded.exports.checkHtmlFormsReference(workerData.input);
    parentPort.postMessage({ stage: 'reference', referenceResult });
  `;

  return new Promise((resolve, reject) => {
    const worker = new Worker(workerSource, { eval: true, workerData: { compiled, input } });
    let scannerResult: boolean | undefined;
    let finished = false;
    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      worker.terminate();
      if (scannerResult === undefined) {
        reject(new Error('Forms scanner exceeded the isolated worker timeout.'));
      } else {
        resolve({ scannerResult, referenceTimedOut: true });
      }
    }, timeoutMs);
    worker.on('message', (message: { stage: string; scannerResult?: boolean; referenceResult?: boolean }) => {
      if (message.stage === 'scanner') scannerResult = message.scannerResult;
      if (message.stage === 'reference' && !finished) {
        finished = true;
        clearTimeout(timeout);
        resolve({ scannerResult: scannerResult!, referenceResult: message.referenceResult, referenceTimedOut: false });
      }
    });
    worker.once('error', (error) => {
      if (!finished) {
        finished = true;
        clearTimeout(timeout);
        reject(new Error(`Forms comparison worker failed: ${error.message}`));
      }
    });
  });
}
