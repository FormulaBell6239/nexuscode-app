import { CompletionContext, CompletionResult, Completion } from '@codemirror/autocomplete';
import { htmlLanguage } from '@codemirror/lang-html';
import { cssLanguage } from '@codemirror/lang-css';
import { Extension } from '@codemirror/state';

// ── HTML snippets ─────────────────────────────────────────────────────────────
const HTML_SNIPPETS: Completion[] = [
  {
    label: '<!DOCTYPE html>',
    type: 'keyword',
    boost: 99,
    detail: 'HTML5 doctype',
    apply: '<!DOCTYPE html>',
  },
  {
    label: 'html:5',
    type: 'function',
    boost: 95,
    detail: 'Full HTML5 boilerplate',
    apply(view, _c, from, to) {
      const insert =
        '<!DOCTYPE html>\n' +
        '<html lang="en">\n' +
        '<head>\n' +
        '  <meta charset="UTF-8">\n' +
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
        '  <title>Document</title>\n' +
        '</head>\n' +
        '<body>\n' +
        '  \n' +
        '</body>\n' +
        '</html>';
      const anchor = from + insert.indexOf('<body>\n  ') + '<body>\n  '.length;
      view.dispatch({ changes: { from, to, insert }, selection: { anchor } });
    },
  },
  { label: '<html>',     type: 'keyword', boost: 50, apply: '<html lang="en">\n  \n</html>' },
  { label: '<head>',     type: 'keyword', boost: 45, apply: '<head>\n  \n</head>' },
  { label: '<body>',     type: 'keyword', boost: 45, apply: '<body>\n  \n</body>' },
  { label: '<header>',   type: 'keyword', boost: 18, apply: '<header>\n  \n</header>' },
  { label: '<footer>',   type: 'keyword', boost: 17, apply: '<footer>\n  \n</footer>' },
  { label: '<main>',     type: 'keyword', boost: 17, apply: '<main>\n  \n</main>' },
  { label: '<nav>',      type: 'keyword', boost: 16, apply: '<nav>\n  <a href="/">Home</a>\n</nav>' },
  { label: '<section>',  type: 'keyword', boost: 15, apply: '<section>\n  \n</section>' },
  { label: '<article>',  type: 'keyword', boost: 14, apply: '<article>\n  \n</article>' },
  { label: '<div>',      type: 'keyword', boost: 20, apply: '<div></div>' },
  { label: '<h1>',       type: 'keyword', boost: 20, apply: '<h1></h1>' },
  { label: '<h2>',       type: 'keyword', boost: 19, apply: '<h2></h2>' },
  { label: '<h3>',       type: 'keyword', boost: 18, apply: '<h3></h3>' },
  { label: '<p>',        type: 'keyword', boost: 20, apply: '<p></p>' },
  { label: '<span>',     type: 'keyword', boost: 15, apply: '<span></span>' },
  { label: '<a>',        type: 'keyword', boost: 18, apply: '<a href=""></a>' },
  { label: '<img>',      type: 'keyword', boost: 17, apply: '<img src="" alt="" />' },
  { label: '<button>',   type: 'keyword', boost: 14, apply: '<button type="button"></button>' },
  { label: '<input>',    type: 'keyword', boost: 14, apply: '<input type="text" placeholder="" />' },
  { label: '<form>',     type: 'keyword', boost: 13, apply: '<form action="" method="post">\n  \n</form>' },
  { label: '<label>',    type: 'keyword', boost: 12, apply: '<label for=""></label>' },
  { label: '<ul>',       type: 'keyword', boost: 14, apply: '<ul>\n  <li></li>\n</ul>' },
  { label: '<ol>',       type: 'keyword', boost: 13, apply: '<ol>\n  <li></li>\n</ol>' },
  { label: '<li>',       type: 'keyword', boost: 12, apply: '<li></li>' },
  { label: '<select>',   type: 'keyword', boost: 11, apply: '<select>\n  <option value=""></option>\n</select>' },
  { label: '<textarea>', type: 'keyword', boost: 10, apply: '<textarea rows="4"></textarea>' },
  { label: '<table>',    type: 'keyword', boost: 9,  apply: '<table>\n  <tr>\n    <th></th>\n  </tr>\n  <tr>\n    <td></td>\n  </tr>\n</table>' },
  { label: '<tr>',       type: 'keyword', boost: 8,  apply: '<tr>\n  <td></td>\n</tr>' },
  { label: '<td>',       type: 'keyword', boost: 7,  apply: '<td></td>' },
  { label: '<th>',       type: 'keyword', boost: 7,  apply: '<th></th>' },
  { label: '<script>',   type: 'keyword', boost: 10, apply: '<script>\n  \n</script>' },
  { label: '<style>',    type: 'keyword', boost: 10, apply: '<style>\n  \n</style>' },
  { label: '<link>',     type: 'keyword', boost: 8,  apply: '<link rel="stylesheet" href="style.css" />' },
  { label: '<meta charset>',  type: 'keyword', boost: 7, apply: '<meta charset="UTF-8" />' },
  { label: '<meta viewport>', type: 'keyword', boost: 7, apply: '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' },
  { label: '<title>',    type: 'keyword', boost: 6,  apply: '<title></title>' },
  { label: '<!-- -->',   type: 'keyword', boost: 4,  apply: '<!-- -->' },
];

function htmlSnippetSource(context: CompletionContext): CompletionResult | null {
  const before = context.matchBefore(/<[!\w-]*$/);
  if (!before && !context.explicit) return null;
  const typed   = before?.text ?? '';
  const from    = before?.from  ?? context.pos;
  const lower   = typed.toLowerCase();
  const options = HTML_SNIPPETS.filter(c => c.label.toLowerCase().startsWith(lower));
  if (!options.length) return null;
  return { from, options, validFor: /<[!\w-]*$/ };
}

/**
 * Adds rich HTML snippet completions alongside (not replacing) the built-in
 * tag/attribute completions from @codemirror/lang-html.
 */
export function htmlSnippetCompletions(): Extension {
  return htmlLanguage.data.of({ autocomplete: htmlSnippetSource });
}

// ── CSS snippets ──────────────────────────────────────────────────────────────

const CSS_SNIPPETS: Completion[] = [
  {
    label: '* reset',
    type: 'function',
    boost: 22,
    detail: 'Universal box-sizing reset',
    apply: '* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}',
  },
  {
    label: ':root',
    type: 'function',
    boost: 20,
    detail: 'CSS custom properties',
    apply: ':root {\n  --primary: #6366f1;\n  --bg: #ffffff;\n  --text: #1e293b;\n}',
  },
  {
    label: 'flex-center',
    type: 'function',
    boost: 18,
    detail: 'Flexbox centering',
    apply: 'display: flex;\n  align-items: center;\n  justify-content: center;',
  },
  { label: 'display: flex',            type: 'property', boost: 16, apply: 'display: flex;' },
  { label: 'display: grid',            type: 'property', boost: 15, apply: 'display: grid;' },
  { label: 'display: block',           type: 'property', boost: 9,  apply: 'display: block;' },
  { label: 'display: none',            type: 'property', boost: 9,  apply: 'display: none;' },
  { label: 'position: relative',       type: 'property', boost: 9,  apply: 'position: relative;' },
  { label: 'position: absolute',       type: 'property', boost: 9,  apply: 'position: absolute;' },
  { label: 'position: fixed',          type: 'property', boost: 9,  apply: 'position: fixed;' },
  { label: 'box-sizing: border-box',   type: 'property', boost: 14, apply: 'box-sizing: border-box;' },
  { label: 'margin: 0 auto',           type: 'property', boost: 13, apply: 'margin: 0 auto;' },
  { label: 'align-items: center',      type: 'property', boost: 10, apply: 'align-items: center;' },
  { label: 'justify-content: center',  type: 'property', boost: 10, apply: 'justify-content: center;' },
  { label: 'transition',               type: 'property', boost: 8,  apply: 'transition: all 0.3s ease;' },
  { label: 'border-radius',            type: 'property', boost: 8,  apply: 'border-radius: 8px;' },
  { label: 'background-color',         type: 'property', boost: 7,  apply: 'background-color: ;' },
  { label: 'font-family',              type: 'property', boost: 7,  apply: 'font-family: Arial, sans-serif;' },
  { label: 'text-align: center',       type: 'property', boost: 7,  apply: 'text-align: center;' },
  { label: 'width: 100%',              type: 'property', boost: 6,  apply: 'width: 100%;' },
  { label: 'height: 100vh',            type: 'property', boost: 6,  apply: 'height: 100vh;' },
  {
    label: '@media mobile',
    type: 'keyword',
    boost: 12,
    detail: 'Mobile breakpoint',
    apply: '@media (max-width: 768px) {\n  \n}',
  },
  {
    label: '@media tablet',
    type: 'keyword',
    boost: 11,
    detail: 'Tablet breakpoint',
    apply: '@media (max-width: 1024px) {\n  \n}',
  },
];

function cssSnippetSource(context: CompletionContext): CompletionResult | null {
  const word    = context.matchBefore(/[@\w:-]+$/);
  if (!word && !context.explicit) return null;
  const typed   = word?.text ?? '';
  const from    = word?.from  ?? context.pos;
  const lower   = typed.toLowerCase();
  const options = CSS_SNIPPETS.filter(c => c.label.toLowerCase().startsWith(lower));
  if (!options.length) return null;
  return { from, options };
}

/** Adds CSS snippet completions alongside the built-in @codemirror/lang-css completions. */
export function cssSnippetCompletions(): Extension {
  return cssLanguage.data.of({ autocomplete: cssSnippetSource });
}

// ── JS snippet source (exported — attach via javascriptLanguage.data when available) ──

export const JS_SNIPPETS: Completion[] = [
  { label: 'console.log()',             type: 'function', boost: 22, apply: "console.log();" },
  { label: 'console.error()',           type: 'function', boost: 10, apply: "console.error();" },
  { label: 'document.querySelector()',  type: 'function', boost: 20, apply: "document.querySelector('');" },
  { label: 'document.getElementById()', type: 'function', boost: 18, apply: "document.getElementById('');" },
  { label: 'addEventListener()',        type: 'function', boost: 16, apply: "addEventListener('click', (e) => {\n  \n});" },
  {
    label: 'DOMContentLoaded',
    type: 'keyword',
    boost: 14,
    detail: 'Safe DOM entry point',
    apply: "document.addEventListener('DOMContentLoaded', () => {\n  \n});",
  },
  { label: 'function',      type: 'keyword',  boost: 14, apply: "function name() {\n  \n}" },
  { label: 'const',         type: 'keyword',  boost: 14, apply: "const name = ;" },
  { label: 'let',           type: 'keyword',  boost: 13, apply: "let name = ;" },
  { label: 'arrow function',type: 'function', boost: 12, apply: "const name = () => {\n  \n};" },
  { label: 'if ()',         type: 'keyword',  boost: 12, apply: "if (condition) {\n  \n}" },
  { label: 'if/else',       type: 'keyword',  boost: 11, apply: "if (condition) {\n  \n} else {\n  \n}" },
  { label: 'for loop',      type: 'keyword',  boost: 10, apply: "for (let i = 0; i < arr.length; i++) {\n  \n}" },
  { label: 'forEach()',     type: 'function', boost: 10, apply: "array.forEach((item) => {\n  \n});" },
  { label: 'map()',         type: 'function', boost: 9,  apply: "const result = array.map((item) => item);" },
  { label: 'fetch()',       type: 'function', boost: 8,  apply: "fetch('')\n  .then(res => res.json())\n  .then(data => console.log(data))\n  .catch(err => console.error(err));" },
];

export function jsSnippetSource(context: CompletionContext): CompletionResult | null {
  const word    = context.matchBefore(/[\w.]+$/);
  if (!word && !context.explicit) return null;
  const typed   = word?.text ?? '';
  const from    = word?.from  ?? context.pos;
  const lower   = typed.toLowerCase();
  const options = JS_SNIPPETS.filter(c => c.label.toLowerCase().startsWith(lower));
  if (!options.length) return null;
  return { from, options };
}
