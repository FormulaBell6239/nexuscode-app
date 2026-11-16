import { EditorState } from '@codemirror/state';
import { getHtmlSuggestion } from './ghostText';

function suggest(html: string, typed = false) {
  const pos = html.indexOf('|');
  if (pos < 0) throw new Error('Test HTML must contain a cursor marker');
  const doc = html.slice(0, pos) + html.slice(pos + 1);
  return getHtmlSuggestion({ state: EditorState.create({ doc, selection: { anchor: pos } }) }, typed);
}

describe('HTML ghost closing tags', () => {
  test('does not suggest a second body closing tag after existing content', () => {
    expect(suggest('<body>\n  <p>Hello</p>\n  |\n</body>')).toBeNull();
  });

  test('still suggests a missing closing tag', () => {
    expect(suggest('<body>\n  <p>Hello</p>\n  |')?.text).toBe('</body>');
  });

  test('keeps content suggestions on a new line after an opening body tag', () => {
    expect(suggest('<body>\n  |\n</body>')?.text).toBe('<h1></h1>');
  });

  test('recognizes the correct matching tag with nested elements of the same name', () => {
    expect(suggest('<div>\n  |\n  <div>Nested</div>\n</div>')).toBeNull();
    expect(suggest('<div>\n  |\n  <div>Nested</div>')?.text).toBe('</div>');
  });

  test('does not treat a later unrelated closing tag as the matching close', () => {
    expect(suggest('<body>\n  <section>\n    <p>Hello</p>\n    |\n</body>\n<section></section>')?.text)
      .toBe('</section>');
  });

  test('ignores closing tags in comments', () => {
    expect(suggest('<body>\n  <p>Hello</p>\n  |\n  <!-- </body> -->')?.text).toBe('</body>');
  });

  test('does not duplicate an existing closing tag after typing an opening tag', () => {
    expect(suggest('<body>|\n  <p>Hello</p>\n</body>', true)).toBeNull();
    expect(suggest('<body>|', true)).toMatchObject({ text: '</body>', cursor: 0 });
  });

  test('does not duplicate a closing tag suggested by a chain', () => {
    expect(suggest('<html>\n<body>\n</body>\n|\n</html>')).toBeNull();
    expect(suggest('<html>\n<body>\n</body>\n|')?.text).toBe('</html>');
  });

  test('matches closing tag names without regard to case', () => {
    expect(suggest('<BODY>\n  <p>Hello</p>\n  |\n</body>')).toBeNull();
  });
});
