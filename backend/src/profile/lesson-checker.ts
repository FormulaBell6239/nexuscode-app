/**
 * Backend copy of the current curriculum source-pattern checks.
 * These checks inspect source text only; submitted code is never executed.
 */
const checkers: Record<string, (code: string) => boolean> = {
  'html-headings': (c) => /<h1>[^<]*Welcome to NexusCode[^<]*<\/h1>/i.test(c) && /<h2>\s*[^<\s][^<]*<\/h2>/i.test(c),
  'html-paragraphs': (c) => /<p>\s*[^<\s][\s\S]*?<\/p>[\s\S]*<p>\s*[^<\s][\s\S]*?<\/p>/i.test(c),
  'html-links': (c) => /<a\s[^>]*href\s*=\s*["'][^"']+["'][^>]*>\s*[^<\s][^<]*<\/a>/i.test(c),
  'html-images': (c) => /<img\b(?=[^>]*\ssrc\s*=\s*["'][^"']+["'])(?=[^>]*\salt\s*=\s*["'][^"']+["'])[^>]*>/i.test(c),
  'html-lists': (c) => /<ul[\s>](?:[\s\S]*?<li[\s>][\s\S]*?<\/li>){3}/i.test(c),
  'html-forms': checkHtmlForms,
  'css-selectors': (c) => /h1\s*{[^}]*color\s*:\s*blue\s*;?[^}]*}/i.test(c),
  'css-background': (c) => /body\s*{[^}]*background(-color)?\s*:\s*lightgr[ae]y\s*;?[^}]*}/i.test(c),
  'css-font-size': (c) => /p\s*{[^}]*font-size\s*:\s*20px\s*;?[^}]*}/i.test(c),
  'css-text-align': (c) => /h1\s*{[^}]*text-align\s*:\s*center\s*;?[^}]*}/i.test(c),
  'css-padding': (c) => /div\s*{[^}]*padding\s*:\s*20px\s*;?[^}]*}/i.test(c),
  'css-flexbox': (c) => /\.container\s*{[^}]*display\s*:\s*flex\s*;?[^}]*}/i.test(c),
  'js-variables': (c) => /(let|const|var)\s+name\s*=/.test(c),
  'js-console': (c) => /console\.log\s*\(/.test(c),
  'js-functions': (c) => /function\s+greet\s*\(/.test(c),
  'js-conditionals': (c) => /if\s*\(/.test(c),
  'js-arrays': (c) => /(let|const|var)\s+colors\s*=\s*\[/.test(c),
  'js-loops': (c) => /for\s*\(/.test(c),
  'py-print': (c) => /print\s*\(\s*['"]Hello,\s*NexusCode!['"]\s*\)/.test(c),
  'py-variables': (c) => /^\s*name\s*=/m.test(c) && /print\s*\(\s*name\s*\)/.test(c),
  'py-conditionals': (c) => /if\s+age\s*>=\s*18\s*:/.test(c),
  'py-loops': (c) => /for\s+\w+\s+in\s+range\s*\(/.test(c),
  'py-functions': (c) => /def\s+greet\s*\(/.test(c),
  'py-lists': (c) => /^\s*fruits\s*=\s*\[/m.test(c) && /print\s*\(\s*fruits\s*\)/.test(c),
  'html-divs': checkHtmlDivs,
  'html-tables': checkHtmlTables,
  'html-semantic': (c) => /<header[\s>]/i.test(c) && /<main[\s>]/i.test(c) && /<footer[\s>]/i.test(c),
  'html-buttons': (c) => /<button\s[^>]*type\s*=\s*["'](button|submit|reset)["'][^>]*>\s*[^<\s]/i.test(c),
  'html-textarea': (c) => /<textarea(?=[^>]*\srows\s*=\s*["']?\d)(?=[^>]*\splaceholder\s*=\s*["'][^"']+["'])[^>]*>/i.test(c),
  'html-select': (c) => /<select[\s>](?:[\s\S]*?<option\s[^>]*value\s*=[^>]*>[\s\S]*?<\/option>){3}/i.test(c),
  'html-comments': checkHtmlComments,
  'html-classes': (c) => /class\s*=\s*["']([\w-]+)["'][\s\S]*class\s*=\s*["']\1["']/i.test(c),
  'html-anchor-target': (c) => /<a\s(?=[^>]*target\s*=\s*["']_blank["'])(?=[^>]*rel\s*=\s*["'][^"']*noopener)[^>]*>/i.test(c),
  'html-ordered-list': (c) => /<ol[\s>](?:[\s\S]*?<li[\s>][\s\S]*?<\/li>){3}/i.test(c),
  'html-input-types': (c) => /<input\s[^>]*type\s*=\s*["']email["']/i.test(c) && /<input\s[^>]*type\s*=\s*["']password["']/i.test(c),
  'html-meta': (c) => /<meta\s(?=[^>]*name\s*=\s*["']description["'])(?=[^>]*content\s*=\s*["'][^"']+["'])[^>]*>/i.test(c),
  'css-colors': (c) => /color\s*:\s*#[0-9a-f]{3,6}/i.test(c),
  'css-font-weight': (c) => /font-weight\s*:\s*(bold|[0-9]+)/i.test(c),
  'css-border': (c) => /border\s*:\s*\S/i.test(c),
  'css-margin': (c) => /margin\s*:\s*\S/i.test(c),
  'css-width-height': (c) => /width\s*:\s*\d+/i.test(c),
  'css-border-radius': (c) => /border-radius\s*:\s*\S/i.test(c),
  'css-box-shadow': (c) => /box-shadow\s*:\s*\S/i.test(c),
  'css-hover': (c) => /:\s*hover\s*\{/i.test(c),
  'css-variables': (c) => /--[\w-]+\s*:/.test(c),
  'css-media-query': (c) => /@media\s/i.test(c),
  'css-grid': (c) => /display\s*:\s*grid/i.test(c),
  'css-transition': (c) => /transition\s*:\s*\S/i.test(c),
  'js-strings': (c) => /\.(toUpperCase|toLowerCase|trim|split|replace)\s*\(/.test(c),
  'js-numbers': (c) => /Math\.\w+\s*\(/.test(c),
  'js-objects': (c) => /(let|const|var)\s+\w+\s*=\s*\{/.test(c),
  'js-template-literals': (c) => /`[^`]*\$\{/.test(c),
  'js-arrow-functions': (c) => /const\s+\w+\s*=\s*(\([^)]*\)|\w+)\s*=>/.test(c),
  'js-array-push': (c) => /\.\s*push\s*\(/.test(c),
  'js-array-map': (c) => /\.\s*map\s*\(/.test(c),
  'js-array-filter': (c) => /\.\s*filter\s*\(/.test(c),
  'js-dom-select': (c) => /document\s*\.\s*querySelector\s*\(/.test(c),
  'js-events': (c) => /\.addEventListener\s*\(/.test(c),
  'js-ternary': (c) => /\?\s*['"\w].*\s*:\s*['"\w]/.test(c),
  'js-spread': (c) => /\.\.\.\w+/.test(c),
  'py-strings': (c) => /\.(upper|lower|strip|split|replace)\s*\(/.test(c),
  'py-numbers': (c) => /^\s*result\s*=\s*[\d\s+\-*\/().**%]+/m.test(c),
  'py-fstrings': (c) => /f['"][^'"]*\{/.test(c),
  'py-while': (c) => /while\s+\S.*:/.test(c),
  'py-dict': (c) => /^\s*\w+\s*=\s*\{[^}]*:\s*/m.test(c),
  'py-tuples': (c) => /^\s*\w+\s*=\s*\([^)]+,[^)]+\)/m.test(c),
  'py-list-comp': (c) => /\[\s*\S+\s+for\s+\w+\s+in\s+/.test(c),
  'py-classes': (c) => /class\s+\w+\s*[:(]/.test(c),
  'py-try-except': (c) => /try\s*:[\s\S]*?except/.test(c),
  'py-import': (c) => /^import\s+\w+|^from\s+\w+\s+import/m.test(c),
  'py-string-format': (c) => /f['"][^'"]*\{|['"][^'"]*\{\}[^'"]*['"]\s*\.\s*format\s*\(/.test(c),
  'py-range-step': (c) => /range\s*\(\s*\d+\s*,\s*\d+\s*,\s*-?\d+\s*\)/.test(c),
  'sql-select-all': (c) => /SELECT\s+\*\s+FROM\s+users/i.test(c),
  'sql-select-columns': (c) => /SELECT\s+name\s*,\s*email\s+FROM\s+users/i.test(c),
  'sql-where': (c) => /SELECT\s+\*\s+FROM\s+users\s+WHERE\s+age\s*=\s*25/i.test(c),
  'sql-where-string': (c) => /SELECT\s+\*\s+FROM\s+products\s+WHERE\s+category\s*=\s*'Electronics'/i.test(c),
  'sql-order-by': (c) => /ORDER\s+BY\s+price\s+DESC/i.test(c),
  'sql-limit': (c) => /ORDER\s+BY\s+price\s+DESC\s+LIMIT\s+5/i.test(c),
  'sql-distinct': (c) => /SELECT\s+DISTINCT\s+category\s+FROM\s+products/i.test(c),
  'sql-and-or': (c) => /WHERE\s+category\s*=\s*'Electronics'\s+AND\s+price\s*<\s*500/i.test(c),
  'sql-like': (c) => /LIKE\s+'%@gmail\.com'/i.test(c),
  'sql-insert': (c) => /INSERT\s+INTO\s+users\s*\(\s*name\s*,\s*email\s*\)\s*VALUES\s*\(\s*'Dana'\s*,\s*'dana@example\.com'\s*\)/i.test(c),
  'sql-update': (c) => /UPDATE\s+users\s+SET\s+email\s*=\s*'[^']+'/i.test(c) && /WHERE\s+name\s*=\s*'Alice'/i.test(c),
  'sql-delete': (c) => /DELETE\s+FROM\s+users\s+WHERE/i.test(c),
  'sql-create-table': (c) => /CREATE\s+TABLE\s+reading_lists/i.test(c) && /VARCHAR\s*\(\s*100\s*\)/i.test(c),
  'sql-primary-key': (c) => /CREATE\s+TABLE\s+teams/i.test(c) && /id\s+INT\s+PRIMARY\s+KEY/i.test(c),
  'sql-count': (c) => /SELECT\s+COUNT\s*\(\s*\*\s*\)\s+FROM\s+orders/i.test(c),
  'sql-group-by': (c) => /SELECT\s+user_id\s*,\s*COUNT\s*\(\s*\*\s*\)\s+FROM\s+orders\s+GROUP\s+BY\s+user_id/i.test(c),
  'sql-having': (c) => /HAVING\s+COUNT\s*\(\s*\*\s*\)\s*>\s*3/i.test(c),
  'sql-inner-join': (c) => /INNER\s+JOIN\s+users\s+ON\s+orders\.user_id\s*=\s*users\.id/i.test(c),
  'ts-type-annotations': (c) => /const\s+memberName\s*:\s*string\s*=\s*["']Ada["']/.test(c) && /let\s+lessonsDone\s*:\s*number\s*=\s*2/.test(c),
  'ts-function-types': (c) => /function\s+addScores\s*\(\s*first\s*:\s*number\s*,\s*second\s*:\s*number\s*\)\s*:\s*number\s*\{/.test(c),
};

const htmlTablesReference = /<table[\s>][\s\S]*?<tr[\s>][\s\S]*?<th[\s>][\s\S]*?<tr[\s>][\s\S]*?<td[\s>]/i;
const htmlTableTokenPatterns = [/<table[\s>]/ig, /<tr[\s>]/ig, /<th[\s>]/ig, /<tr[\s>]/ig, /<td[\s>]/ig];
const htmlDivsReference = /<div[\s>][\s\S]*?<h[1-6][\s>][\s\S]*?<\/h[1-6]>[\s\S]*?<p[\s>][\s\S]*?<\/p>[\s\S]*?<\/div>/i;
const htmlDivTokenPatterns = [/<div[\s>]/ig, /<h[1-6][\s>]/ig, /<\/h[1-6]>/ig, /<p[\s>]/ig, /<\/p>/ig, /<\/div>/ig];
const htmlCommentOpenAt = /<!--/iy;
const htmlCommentCloseAt = /-->/y;
const htmlCommentHeadingAt = /<h1[\s>]/iy;
const htmlCommentParagraphAt = /<p[\s>]/iy;
const htmlCommentWhitespaceAt = /\s/y;
const htmlCommentsReference = /<!--[\s\S]*?-->\s*<h1[\s>][\s\S]*<!--[\s\S]*?-->\s*<p[\s>]/i;
const htmlFormsReference = /<form[\s>][\s\S]*?<label\s[^>]*for\s*=\s*["']([^"']+)["'][\s\S]*?<input\s[^>]*id\s*=\s*["']\1["'][\s\S]*?<\/form>/i;
const htmlFormStarts = /<form[\s>]/ig;
const htmlFormLabels = /<label\s/ig;
const htmlFormInputs = /<input\s/ig;
const htmlFormCloses = /<\/form>/ig;
const htmlFormForMarkers = /for\s*=\s*["']/ig;
const htmlFormIdMarkers = /id\s*=\s*["']/ig;

/** Reference implementation retained for bounded compatibility comparisons. */
export function checkHtmlTablesReference(code: string): boolean {
  return htmlTablesReference.test(code);
}

/** Reference implementation retained for bounded compatibility comparisons. */
export function checkHtmlDivsReference(code: string): boolean {
  return htmlDivsReference.test(code);
}

/** Reference implementation retained for bounded compatibility comparisons. */
export function checkHtmlCommentsReference(code: string): boolean {
  return htmlCommentsReference.test(code);
}

/** Reference implementation retained for bounded compatibility comparisons. */
export function checkHtmlFormsReference(code: string): boolean {
  return htmlFormsReference.test(code);
}

/** ECMAScript non-Unicode /i canonicalization for one UTF-16 code unit. */
export function canonicalizeRegexIgnoreCaseCodeUnit(unit: number): number {
  if (unit >= 0x61 && unit <= 0x7a) return unit - 0x20;
  if (unit < 0x80) return unit;

  const uppercase = String.fromCharCode(unit).toUpperCase();
  if (uppercase.length !== 1) return unit;

  const mapped = uppercase.charCodeAt(0);
  if (unit >= 0x80 && mapped < 0x80) return unit;
  return mapped;
}

interface SourceToken {
  start: number;
  end: number;
}

interface FormValueCandidate {
  start: number;
  length: number;
  end: number;
  group?: number;
}

interface IdValueCandidate extends FormValueCandidate {
  latestInputStart: number;
}

interface FormValueDescriptor {
  start: number;
  length: number;
  rank: number;
  kind: 'capture' | 'id';
  candidateIndex: number;
  group?: number;
}

function checkHtmlForms(code: string): boolean {
  const formStarts = collectRegexTokens(htmlFormStarts, code);
  const labels = collectRegexTokens(htmlFormLabels, code);
  const inputs = collectRegexTokens(htmlFormInputs, code);
  const formCloses = collectRegexTokens(htmlFormCloses, code);
  const forMarkers = collectRegexTokens(htmlFormForMarkers, code);
  const idMarkers = collectRegexTokens(htmlFormIdMarkers, code);
  if (formStarts.length === 0 || labels.length === 0 || inputs.length === 0 || formCloses.length === 0) return false;

  const segments = buildGreaterThanSegments(code);
  const nextQuote = buildNextQuotePositions(code);

  const formEnds = formStarts.map((token) => token.end);
  const eligibleLabelEndsBySegment: Array<number[] | undefined> = new Array(code.length + 1);
  for (const label of labels) {
    if (upperBound(formEnds, label.start) === 0) continue;
    const segment = segments[label.end];
    const labelEnds = eligibleLabelEndsBySegment[segment] ?? [];
    labelEnds.push(label.end);
    eligibleLabelEndsBySegment[segment] = labelEnds;
  }

  const captures: FormValueCandidate[] = [];
  for (const marker of forMarkers) {
    const labelEnds = eligibleLabelEndsBySegment[segments[marker.start]];
    if (!labelEnds || upperBound(labelEnds, marker.start) === 0) continue;
    const quote = nextQuote[marker.end];
    if (quote > marker.end && quote <= code.length) {
      captures.push({ start: marker.end, length: quote - marker.end, end: quote + 1 });
    }
  }
  if (captures.length === 0) return false;

  const inputRangesBySegment: Array<SourceToken[] | undefined> = new Array(code.length + 1);
  for (const input of inputs) {
    const segment = segments[input.end];
    const ranges = inputRangesBySegment[segment] ?? [];
    ranges.push(input);
    inputRangesBySegment[segment] = ranges;
  }

  const closeStarts = formCloses.map((token) => token.start);
  const capturesByLength = new Uint8Array(code.length + 1);
  for (const capture of captures) capturesByLength[capture.length] = 1;

  const ids: IdValueCandidate[] = [];
  for (const marker of idMarkers) {
    const inputRanges = inputRangesBySegment[segments[marker.start]];
    if (!inputRanges) continue;
    const inputIndex = upperBoundTokenEnds(inputRanges, marker.start) - 1;
    if (inputIndex < 0) continue;

    const quote = nextQuote[marker.end];
    if (quote <= marker.end || quote > code.length) continue;
    const length = quote - marker.end;
    if (capturesByLength[length] === 0 || lowerBound(closeStarts, quote + 1) === closeStarts.length) continue;
    ids.push({
      start: marker.end,
      length,
      end: quote + 1,
      latestInputStart: inputRanges[inputIndex].start,
    });
  }
  if (ids.length === 0) return false;

  const canonicalUnits = canonicalizeSource(code);
  const suffixArray = buildSuffixArray(canonicalUnits);
  const suffixRanks = buildSuffixRanks(suffixArray);
  const lcpTree = buildLcpRangeMinimumTree(canonicalUnits, suffixArray, suffixRanks);

  const descriptors: FormValueDescriptor[] = [];
  captures.forEach((candidate, candidateIndex) => {
    descriptors.push({ ...candidate, rank: suffixRanks[candidate.start], kind: 'capture', candidateIndex });
  });
  ids.forEach((candidate, candidateIndex) => {
    descriptors.push({ ...candidate, rank: suffixRanks[candidate.start], kind: 'id', candidateIndex });
  });
  sortFormValueDescriptors(descriptors);

  let group = -1;
  let previous: FormValueDescriptor | undefined;
  for (const descriptor of descriptors) {
    const equalToPrevious = previous !== undefined
      && descriptor.length === previous.length
      && queryLcpAtLeast(lcpTree, suffixArray, previous.rank, descriptor.rank, descriptor.length);
    if (!equalToPrevious) group += 1;
    descriptor.group = group;
    previous = descriptor;
  }

  const maximumInputStartByGroup = new Int32Array(descriptors.length);
  maximumInputStartByGroup.fill(-1);
  for (const descriptor of descriptors) {
    if (descriptor.kind !== 'id') continue;
    const inputStart = ids[descriptor.candidateIndex].latestInputStart;
    if (inputStart > maximumInputStartByGroup[descriptor.group!]) {
      maximumInputStartByGroup[descriptor.group!] = inputStart;
    }
  }

  for (const descriptor of descriptors) {
    if (descriptor.kind !== 'capture') continue;
    const capture = captures[descriptor.candidateIndex];
    if (maximumInputStartByGroup[descriptor.group!] >= capture.end) return true;
  }

  return false;
}

function collectRegexTokens(pattern: RegExp, input: string): SourceToken[] {
  pattern.lastIndex = 0;
  const tokens: SourceToken[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(input)) !== null) {
    tokens.push({ start: match.index, end: pattern.lastIndex });
  }
  return tokens;
}

function buildGreaterThanSegments(input: string): Uint32Array {
  const segments = new Uint32Array(input.length + 1);
  let segment = 0;
  for (let index = 0; index < input.length; index += 1) {
    segments[index] = segment;
    if (input.charCodeAt(index) === 0x3e) segment += 1;
  }
  segments[input.length] = segment;
  return segments;
}

function buildNextQuotePositions(input: string): Uint32Array {
  const nextQuote = new Uint32Array(input.length + 1);
  nextQuote[input.length] = input.length + 1;
  for (let index = input.length - 1; index >= 0; index -= 1) {
    const unit = input.charCodeAt(index);
    nextQuote[index] = unit === 0x22 || unit === 0x27 ? index : nextQuote[index + 1];
  }
  return nextQuote;
}

function canonicalizeSource(input: string): Uint32Array {
  const units = new Uint32Array(input.length);
  for (let index = 0; index < input.length; index += 1) {
    units[index] = canonicalizeRegexIgnoreCaseCodeUnit(input.charCodeAt(index));
  }
  return units;
}

function buildSuffixArray(units: Uint32Array): Uint32Array {
  const length = units.length;
  const suffixes = new Uint32Array(length);
  if (length === 0) return suffixes;

  const alphabetCounts = new Uint32Array(0x10000);
  for (let index = 0; index < length; index += 1) alphabetCounts[units[index]] += 1;
  let prefix = 0;
  for (let unit = 0; unit < alphabetCounts.length; unit += 1) {
    const count = alphabetCounts[unit];
    alphabetCounts[unit] = prefix;
    prefix += count;
  }
  for (let index = 0; index < length; index += 1) suffixes[alphabetCounts[units[index]]++] = index;

  let ranks = new Uint32Array(length);
  let classes = 0;
  let previousUnit = -1;
  for (let order = 0; order < length; order += 1) {
    const index = suffixes[order];
    const unit = units[index];
    if (unit !== previousUnit) {
      classes += 1;
      previousUnit = unit;
    }
    ranks[index] = classes - 1;
  }

  let temporary = new Uint32Array(length);
  let nextRanks = new Uint32Array(length);
  const counts = new Uint32Array(length + 1);

  for (let step = 1; classes < length; step *= 2) {
    countingSortSuffixes(suffixes, temporary, ranks, counts, step, true, classes, length);
    countingSortSuffixes(temporary, suffixes, ranks, counts, step, false, classes, length);

    let nextClassCount = 1;
    nextRanks[suffixes[0]] = 0;
    for (let order = 1; order < length; order += 1) {
      const prior = suffixes[order - 1];
      const current = suffixes[order];
      const priorSecond = prior + step < length ? ranks[prior + step] : -1;
      const currentSecond = current + step < length ? ranks[current + step] : -1;
      if (ranks[prior] !== ranks[current] || priorSecond !== currentSecond) nextClassCount += 1;
      nextRanks[current] = nextClassCount - 1;
    }

    const previousRanks = ranks;
    ranks = nextRanks;
    nextRanks = previousRanks;
    classes = nextClassCount;
    if (step >= length) break;
  }

  return suffixes;
}

function countingSortSuffixes(
  source: Uint32Array,
  target: Uint32Array,
  ranks: Uint32Array,
  counts: Uint32Array,
  step: number,
  bySecondRank: boolean,
  classes: number,
  length: number,
): void {
  counts.fill(0, 0, classes + 1);
  for (let index = 0; index < length; index += 1) {
    const suffix = source[index];
    const key = bySecondRank
      ? (suffix + step < length ? ranks[suffix + step] + 1 : 0)
      : ranks[suffix] + 1;
    counts[key] += 1;
  }

  let position = 0;
  for (let key = 0; key <= classes; key += 1) {
    const count = counts[key];
    counts[key] = position;
    position += count;
  }

  for (let index = 0; index < length; index += 1) {
    const suffix = source[index];
    const key = bySecondRank
      ? (suffix + step < length ? ranks[suffix + step] + 1 : 0)
      : ranks[suffix] + 1;
    target[counts[key]++] = suffix;
  }
}

function buildSuffixRanks(suffixArray: Uint32Array): Uint32Array {
  const ranks = new Uint32Array(suffixArray.length);
  for (let rank = 0; rank < suffixArray.length; rank += 1) ranks[suffixArray[rank]] = rank;
  return ranks;
}

function buildLcpRangeMinimumTree(
  units: Uint32Array,
  suffixArray: Uint32Array,
  suffixRanks: Uint32Array,
): { tree: Uint32Array; base: number } {
  const length = units.length;
  let commonPrefix = 0;
  const lcp = new Uint32Array(length);
  for (let start = 0; start < length; start += 1) {
    const rank = suffixRanks[start];
    if (rank === length - 1) {
      commonPrefix = 0;
      continue;
    }
    const nextStart = suffixArray[rank + 1];
    while (start + commonPrefix < length && nextStart + commonPrefix < length
      && units[start + commonPrefix] === units[nextStart + commonPrefix]) commonPrefix += 1;
    lcp[rank + 1] = commonPrefix;
    if (commonPrefix > 0) commonPrefix -= 1;
  }

  let base = 1;
  while (base < length) base *= 2;
  const tree = new Uint32Array(base * 2);
  tree.fill(0xffffffff);
  for (let rank = 0; rank < length; rank += 1) tree[base + rank] = lcp[rank];
  for (let index = base - 1; index > 0; index -= 1) tree[index] = Math.min(tree[index * 2], tree[index * 2 + 1]);
  return { tree, base };
}

function queryLcpAtLeast(
  index: { tree: Uint32Array; base: number },
  suffixArray: Uint32Array,
  firstRank: number,
  secondRank: number,
  length: number,
): boolean {
  if (firstRank === secondRank) return suffixArray.length - suffixArray[firstRank] >= length;
  let left = Math.min(firstRank, secondRank) + 1 + index.base;
  let right = Math.max(firstRank, secondRank) + index.base;
  let commonPrefix = 0xffffffff;
  while (left <= right) {
    if (left % 2 === 1) commonPrefix = Math.min(commonPrefix, index.tree[left++]);
    if (right % 2 === 0) commonPrefix = Math.min(commonPrefix, index.tree[right--]);
    left = Math.floor(left / 2);
    right = Math.floor(right / 2);
  }
  return commonPrefix >= length;
}

function sortFormValueDescriptors(descriptors: FormValueDescriptor[]): void {
  let source = descriptors;
  let target = new Array<FormValueDescriptor>(descriptors.length);
  for (let width = 1; width < descriptors.length; width *= 2) {
    for (let start = 0; start < descriptors.length; start += width * 2) {
      const middle = Math.min(start + width, descriptors.length);
      const end = Math.min(start + width * 2, descriptors.length);
      let left = start;
      let right = middle;
      for (let output = start; output < end; output += 1) {
        if (right >= end || (left < middle && compareFormValueDescriptors(source[left], source[right]) <= 0)) {
          target[output] = source[left++];
        } else {
          target[output] = source[right++];
        }
      }
    }
    const previousSource = source;
    source = target;
    target = previousSource;
  }
  if (source !== descriptors) {
    for (let index = 0; index < descriptors.length; index += 1) descriptors[index] = source[index];
  }
}

function compareFormValueDescriptors(left: FormValueDescriptor, right: FormValueDescriptor): number {
  return left.length - right.length || left.rank - right.rank;
}

function upperBound(values: number[], value: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if (values[middle] <= value) low = middle + 1;
    else high = middle;
  }
  return low;
}

function upperBoundTokenEnds(tokens: SourceToken[], value: number): number {
  let low = 0;
  let high = tokens.length;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if (tokens[middle].end <= value) low = middle + 1;
    else high = middle;
  }
  return low;
}

function lowerBound(values: number[], value: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if (values[middle] < value) low = middle + 1;
    else high = middle;
  }
  return low;
}

/**
 * Matches the table lesson's ordered source-text tokens without parsing HTML.
 * The first viable token at each stage is sufficient: it leaves at least as
 * much input for every later stage as any later candidate would.
 */
function checkHtmlTables(code: string): boolean {
  let from = 0;

  for (const pattern of htmlTableTokenPatterns) {
    pattern.lastIndex = from;
    const match = pattern.exec(code);
    if (!match) return false;
    from = pattern.lastIndex;
  }

  return true;
}

/** Matches the Divs lesson's ordered source-text tokens without HTML parsing. */
function checkHtmlDivs(code: string): boolean {
  let from = 0;

  for (const pattern of htmlDivTokenPatterns) {
    pattern.lastIndex = from;
    const match = pattern.exec(code);
    if (!match) return false;
    from = pattern.lastIndex;
  }

  return true;
}

/** Matches the two comment/tag sequences with forward-only scans and no HTML parsing. */
function checkHtmlComments(code: string): boolean {
  let commentOpenSeen = false;
  let headingWhitespacePending = false;
  let headingCandidateFrom = 0;
  let headingEnd = -1;

  for (let index = 0; index < code.length; index += 1) {
    if (headingWhitespacePending && index >= headingCandidateFrom) {
      if (matchesAt(htmlCommentWhitespaceAt, code, index)) {
        // The regex's \s* may consume any number of consecutive JS whitespace code units.
      } else {
        const heading = matchAt(htmlCommentHeadingAt, code, index);
        if (heading) {
          headingEnd = index + heading[0].length;
          break;
        }
        headingWhitespacePending = false;
      }
    }

    if (matchesAt(htmlCommentOpenAt, code, index)) commentOpenSeen = true;
    if (commentOpenSeen && matchesAt(htmlCommentCloseAt, code, index)) {
      headingWhitespacePending = true;
      headingCandidateFrom = index + 3;
    }
  }

  if (headingEnd < 0) return false;

  let secondCommentOpenSeen = false;
  let paragraphWhitespacePending = false;
  let paragraphCandidateFrom = 0;

  for (let index = headingEnd; index < code.length; index += 1) {
    if (paragraphWhitespacePending && index >= paragraphCandidateFrom) {
      if (matchesAt(htmlCommentWhitespaceAt, code, index)) {
        // Continue the regex's optional whitespace run after the comment.
      } else {
        if (matchAt(htmlCommentParagraphAt, code, index)) return true;
        paragraphWhitespacePending = false;
      }
    }

    if (matchesAt(htmlCommentOpenAt, code, index)) secondCommentOpenSeen = true;
    if (secondCommentOpenSeen && matchesAt(htmlCommentCloseAt, code, index)) {
      paragraphWhitespacePending = true;
      paragraphCandidateFrom = index + 3;
    }
  }

  return false;
}

function matchesAt(pattern: RegExp, input: string, index: number): boolean {
  pattern.lastIndex = index;
  return pattern.test(input);
}

function matchAt(pattern: RegExp, input: string, index: number): RegExpExecArray | null {
  pattern.lastIndex = index;
  return pattern.exec(input);
}

export function checkLesson(lessonKey: string, code: string): boolean {
  return checkers[lessonKey]?.(code) ?? false;
}

export const LESSON_CHECKER_KEYS = Object.keys(checkers);
