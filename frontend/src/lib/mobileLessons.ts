export type MobileStep =
  | { type: 'explain'; text: string; code?: string }
  | { type: 'mcq'; question: string; options: string[]; correct: number }
  | { type: 'fillblank'; template: string; answer: string; hint?: string };

export interface MobileLesson {
  steps: MobileStep[];
}

export const MOBILE_LESSONS: Record<string, MobileLesson> = {

  // ── HTML ──────────────────────────────────────────────────────────────────

  'html-headings': {
    steps: [
      {
        type: 'explain',
        text: "Headings create a visual hierarchy on your page. <h1> is the biggest and most important — use it once as your page title. <h2> through <h6> create sub-sections, getting smaller each level.",
        code: "<h1>NexusCode</h1>\n<h2>Today's Lessons</h2>\n<h3>HTML Basics</h3>",
      },
      {
        type: 'fillblank',
        template: '<___>Hello World</h1>',
        answer: 'h1',
        hint: 'Opening tag for the largest heading',
      },
      {
        type: 'mcq',
        question: 'How many <h1> tags should a page ideally have?',
        options: ['As many as needed', 'Exactly one', 'Two at most', 'One per section'],
        correct: 1,
      },
    ],
  },

  'html-paragraphs': {
    steps: [
      {
        type: 'explain',
        text: "Paragraphs wrap blocks of text in <p> tags. Browsers automatically add spacing above and below each paragraph — no blank lines or <br> tags needed between them.",
        code: "<p>HTML is the skeleton of every website.</p>\n<p>CSS makes it look great.</p>\n<p>JavaScript makes it interactive.</p>",
      },
      {
        type: 'fillblank',
        template: '<___>Learn HTML today.</p>',
        answer: 'p',
        hint: 'The paragraph tag',
      },
      {
        type: 'mcq',
        question: 'What does the <p> tag create?',
        options: ['A page header', 'A paragraph of text', 'A bulleted list item', 'A line break'],
        correct: 1,
      },
    ],
  },

  'html-links': {
    steps: [
      {
        type: 'explain',
        text: "Links use the <a> tag. The href attribute is the destination URL — without it, the tag is just styled text, not an actual link. The text between the tags is what users click.",
        code: "<a href=\"https://nexuscode.dev\">Start Coding</a>\n<a href=\"/about\">About Us</a>",
      },
      {
        type: 'fillblank',
        template: '<a ___="https://nexuscode.dev">Learn More</a>',
        answer: 'href',
        hint: 'Attribute that sets the link destination',
      },
      {
        type: 'mcq',
        question: 'What does href stand for?',
        options: ['Hyperlink reference', 'HTML redirect', 'Heading reference', 'HTML resource'],
        correct: 0,
      },
    ],
  },

  'html-images': {
    steps: [
      {
        type: 'explain',
        text: "Images use <img> — a self-closing tag with no </img>. The src attribute points to the image file. Always add alt text: it describes the image for screen readers and shows when the image fails to load.",
        code: "<img src=\"logo.png\" alt=\"NexusCode logo\">\n<img src=\"photo.jpg\" alt=\"A mountain at sunset\">",
      },
      {
        type: 'fillblank',
        template: '<img ___="photo.jpg" alt="A photo">',
        answer: 'src',
        hint: 'Attribute pointing to the image file path',
      },
      {
        type: 'mcq',
        question: 'Why should you always add an alt attribute to images?',
        options: [
          'It makes images load faster',
          'It is required for the image to display',
          'It describes the image for accessibility and when it fails to load',
          'It sets the image dimensions',
        ],
        correct: 2,
      },
    ],
  },

  'html-lists': {
    steps: [
      {
        type: 'explain',
        text: "Two list types: <ul> for unordered (bullets) and <ol> for ordered (numbers). Each item in either list uses an <li> tag. Lists are also commonly used for navigation menus.",
        code: "<ul>\n  <li>HTML</li>\n  <li>CSS</li>\n  <li>JavaScript</li>\n</ul>",
      },
      {
        type: 'fillblank',
        template: '<ul>\n  <li>Learn HTML</li>\n  <___>Learn CSS</li>\n</ul>',
        answer: 'li',
        hint: 'The list item tag',
      },
      {
        type: 'mcq',
        question: 'Which tag creates an unordered (bulleted) list?',
        options: ['<ol>', '<ul>', '<li>', '<dl>'],
        correct: 1,
      },
    ],
  },

  'html-forms': {
    steps: [
      {
        type: 'explain',
        text: "Forms collect user input. The <form> tag wraps all the inputs. The action attribute sets where the data is sent when submitted. Without JavaScript, forms need a server to process the data.",
        code: "<form action=\"/submit\">\n  <input type=\"text\" placeholder=\"Your name\">\n  <button type=\"submit\">Send</button>\n</form>",
      },
      {
        type: 'fillblank',
        template: '<___>\n  <input type="email">\n  <button>Subscribe</button>\n</form>',
        answer: 'form',
        hint: 'Wrapper element for a form',
      },
      {
        type: 'mcq',
        question: 'What does the action attribute on a <form> do?',
        options: ['Styles the form', 'Validates all inputs', 'Sets where form data is sent', 'Triggers JavaScript automatically'],
        correct: 2,
      },
    ],
  },

  'html-divs': {
    steps: [
      {
        type: 'explain',
        text: "<div> is a generic container with no default styling or meaning. It is the most-used HTML tag. Group related elements inside a div so you can style or position them together with CSS.",
        code: "<div class=\"card\">\n  <h2>Lesson Title</h2>\n  <p>Lesson description here.</p>\n</div>",
      },
      {
        type: 'fillblank',
        template: '<___ class="hero">Welcome</div>',
        answer: 'div',
        hint: 'Generic block container tag',
      },
      {
        type: 'mcq',
        question: 'What is the main purpose of a <div> tag?',
        options: ['Display an image', 'Create a clickable link', 'Group and structure content', 'Add a line break'],
        correct: 2,
      },
    ],
  },

  'html-tables': {
    steps: [
      {
        type: 'explain',
        text: "Tables organize data into rows and columns. <tr> is a table row, <td> is a data cell, and <th> is a header cell (bold and centered by default). Use tables for data — not for page layout.",
        code: "<table>\n  <tr>\n    <th>Name</th>\n    <th>Score</th>\n  </tr>\n  <tr>\n    <td>Alice</td>\n    <td>95</td>\n  </tr>\n</table>",
      },
      {
        type: 'fillblank',
        template: '<table>\n  <___>\n    <td>Cell</td>\n  </tr>\n</table>',
        answer: 'tr',
        hint: 'Table row element',
      },
      {
        type: 'mcq',
        question: 'Which tag creates a table header cell?',
        options: ['<td>', '<th>', '<tr>', '<thead>'],
        correct: 1,
      },
    ],
  },

  'html-semantic': {
    steps: [
      {
        type: 'explain',
        text: "Semantic tags describe the meaning of content, not just its appearance. <header>, <nav>, <main>, <article>, and <footer> replace meaningless <div>s. They help search engines understand your page and make screen readers work better.",
        code: "<header>Site title</header>\n<nav>Menu links</nav>\n<main>\n  <article>Blog post here</article>\n</main>\n<footer>2026 NexusCode</footer>",
      },
      {
        type: 'fillblank',
        template: '<___>This is a standalone article.</article>',
        answer: 'article',
        hint: 'Semantic tag for self-contained content',
      },
      {
        type: 'mcq',
        question: 'Why use <article> instead of <div>?',
        options: [
          'It loads faster',
          'It tells browsers and screen readers what the content means',
          'It adds automatic styling',
          'It is required in HTML5',
        ],
        correct: 1,
      },
    ],
  },

  'html-buttons': {
    steps: [
      {
        type: 'explain',
        text: "Buttons trigger actions. The type attribute matters: submit sends the parent form, button does nothing by default (add JavaScript for behavior), and reset clears the form fields.",
        code: "<button type=\"button\" onclick=\"alert('Hi!')\">Click me</button>\n<button type=\"submit\">Send Form</button>\n<button type=\"reset\">Clear</button>",
      },
      {
        type: 'fillblank',
        template: '<___ type="submit">Send</button>',
        answer: 'button',
        hint: 'The clickable button tag',
      },
      {
        type: 'mcq',
        question: 'What happens when you click a <button type="button"> with no JavaScript attached?',
        options: ['Submits the parent form', 'Resets the form', 'Nothing happens', 'Navigates to a new page'],
        correct: 2,
      },
    ],
  },

  'html-textarea': {
    steps: [
      {
        type: 'explain',
        text: "<textarea> accepts multi-line text input. Unlike <input>, it has an opening AND closing tag. The rows and cols attributes set the default visible size, but users can resize it by dragging the corner.",
        code: "<textarea rows=\"4\" placeholder=\"Write your message...\">\n</textarea>",
      },
      {
        type: 'fillblank',
        template: '<___ rows="5" placeholder="Comments..."></textarea>',
        answer: 'textarea',
        hint: 'Multi-line text input tag',
      },
      {
        type: 'mcq',
        question: 'How is <textarea> different from <input type="text">?',
        options: [
          '<textarea> is an inline element',
          '<textarea> allows multiple lines of text',
          '<textarea> does not need a closing tag',
          '<textarea> is for passwords',
        ],
        correct: 1,
      },
    ],
  },

  'html-select': {
    steps: [
      {
        type: 'explain',
        text: "<select> creates a dropdown menu. Each choice is an <option> tag. The value attribute on <option> is what gets submitted — it can differ from the visible text shown to the user.",
        code: "<select name=\"language\">\n  <option value=\"html\">HTML</option>\n  <option value=\"css\">CSS</option>\n  <option value=\"js\">JavaScript</option>\n</select>",
      },
      {
        type: 'fillblank',
        template: '<select>\n  <___ value="py">Python</option>\n</select>',
        answer: 'option',
        hint: 'Dropdown choice element',
      },
      {
        type: 'mcq',
        question: 'In a <select> dropdown, what does the value attribute on <option> represent?',
        options: [
          'The text shown to users',
          'The position of the option in the list',
          'The data submitted to the server',
          'The styling of that option',
        ],
        correct: 2,
      },
    ],
  },

  'html-comments': {
    steps: [
      {
        type: 'explain',
        text: "HTML comments are invisible to users — they only appear in the source code. Use them for notes, explanations, or to temporarily disable HTML. The syntax is <!-- your note here -->.",
        code: "<!-- Navigation will expand in phase 2 -->\n<nav>\n  <a href=\"/\">Home</a>\n</nav>\n<!-- TODO: add dark mode toggle -->",
      },
      {
        type: 'mcq',
        question: 'How do you write a comment in HTML?',
        options: ['// comment', '/* comment */', '<!-- comment -->', '# comment'],
        correct: 2,
      },
      {
        type: 'mcq',
        question: 'HTML comments are visible to...',
        options: [
          'All users in the browser',
          'Only logged-in users',
          'Nobody — only in the source code',
          'Search engines only',
        ],
        correct: 2,
      },
    ],
  },

  'html-classes': {
    steps: [
      {
        type: 'explain',
        text: "The class attribute lets you apply CSS styles to elements. Multiple elements can share the same class name. One element can also have multiple classes separated by spaces: class=\"card highlight\".",
        code: "<div class=\"card highlight\">Featured</div>\n<div class=\"card\">Regular</div>\n<div class=\"card\">Regular</div>",
      },
      {
        type: 'fillblank',
        template: '<p ___="highlight">This stands out!</p>',
        answer: 'class',
        hint: 'Attribute used to apply CSS styles',
      },
      {
        type: 'mcq',
        question: 'Can two different HTML elements share the same class name?',
        options: [
          'No, classes must be unique like IDs',
          'Yes, any number of elements can share a class',
          'Only if they are the same tag type',
          'Only with JavaScript',
        ],
        correct: 1,
      },
    ],
  },

  'html-anchor-target': {
    steps: [
      {
        type: 'explain',
        text: "The target attribute on <a> controls where the link opens. _blank opens a new tab. _self replaces the current page (the default). Always add rel=\"noopener\" with _blank for security.",
        code: "<a href=\"https://github.com\" target=\"_blank\" rel=\"noopener\">\n  View on GitHub\n</a>",
      },
      {
        type: 'fillblank',
        template: '<a href="/docs" target="___">Open Docs</a>',
        answer: '_blank',
        hint: 'Value that opens in a new tab',
      },
      {
        type: 'mcq',
        question: 'Which target value opens a link in a new browser tab?',
        options: ['_self', '_new', '_blank', '_top'],
        correct: 2,
      },
    ],
  },

  'html-ordered-list': {
    steps: [
      {
        type: 'explain',
        text: "Ordered lists <ol> auto-number their items: 1, 2, 3... You can change the style with type=\"A\" (letters) or type=\"I\" (Roman numerals). The start attribute lets you begin numbering from any number.",
        code: "<ol start=\"3\">\n  <li>Learn HTML</li>\n  <li>Learn CSS</li>\n  <li>Build something real</li>\n</ol>",
      },
      {
        type: 'fillblank',
        template: '<___>\n  <li>First</li>\n  <li>Second</li>\n</ol>',
        answer: 'ol',
        hint: 'Ordered (numbered) list tag',
      },
      {
        type: 'mcq',
        question: 'How does <ol> differ from <ul>?',
        options: [
          '<ol> is for images',
          '<ol> produces numbered items, <ul> produces bullets',
          '<ol> requires a start attribute',
          'They are identical',
        ],
        correct: 1,
      },
    ],
  },

  'html-input-types': {
    steps: [
      {
        type: 'explain',
        text: "The type attribute completely changes how an <input> behaves. Common types: text, email, password, number, checkbox, date. Browsers show different keyboards on mobile based on the type — email shows the @ key, number shows a numpad.",
        code: "<input type=\"email\" placeholder=\"you@example.com\">\n<input type=\"password\" placeholder=\"Password\">\n<input type=\"number\" min=\"0\" max=\"100\">",
      },
      {
        type: 'fillblank',
        template: '<input ___="email" placeholder="Email address">',
        answer: 'type',
        hint: 'Attribute that controls input behavior',
      },
      {
        type: 'mcq',
        question: 'Why should you use type="email" instead of type="text" for email fields?',
        options: [
          'It is required by the HTML spec',
          'It validates format and shows the right mobile keyboard',
          'It encrypts the value',
          'It prevents copy-paste',
        ],
        correct: 1,
      },
    ],
  },

  'html-meta': {
    steps: [
      {
        type: 'explain',
        text: "<meta> tags go in the <head> and configure your page without displaying content. charset=\"UTF-8\" sets text encoding (always use this). The viewport meta tag is essential — without it, mobile browsers zoom out and make your page tiny.",
        code: "<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>My Page</title>\n</head>",
      },
      {
        type: 'fillblank',
        template: '<___ charset="UTF-8">',
        answer: 'meta',
        hint: 'Tag for page metadata (self-closing)',
      },
      {
        type: 'mcq',
        question: 'What does the viewport meta tag do?',
        options: [
          'Sets the background color',
          'Makes the page responsive on mobile screens',
          'Adds SEO keywords',
          'Loads fonts faster',
        ],
        correct: 1,
      },
    ],
  },

  // ── CSS ───────────────────────────────────────────────────────────────────

  'css-selectors': {
    steps: [
      {
        type: 'explain',
        text: "CSS selectors target elements to style them. Tag selectors (p) target all elements of that type. Class selectors (.card) target elements with that class. ID selectors (#hero) target a single unique element.",
        code: "p { color: #94a3b8; }\n.card { background: #0d1b2e; }\n#hero { font-size: 2rem; }",
      },
      {
        type: 'fillblank',
        template: '___ { padding: 8px 16px; }',
        answer: '.btn',
        hint: 'Class selector — starts with a dot',
      },
      {
        type: 'mcq',
        question: 'How do you select all elements with class "card" in CSS?',
        options: ['#card', '.card', '*card', 'card'],
        correct: 1,
      },
    ],
  },

  'css-background': {
    steps: [
      {
        type: 'explain',
        text: "CSS backgrounds can be solid colors, gradients, or images. Use background-color for solid fills. The background shorthand handles gradients and images. Hex (#0a1628), rgb(), and hsl() are all valid color formats.",
        code: ".hero {\n  background-color: #0a1628;\n}\n.banner {\n  background: linear-gradient(135deg, #6366f1, #06b6d4);\n}",
      },
      {
        type: 'fillblank',
        template: 'background-___: #1a2744;',
        answer: 'color',
        hint: 'The full property name is background-___',
      },
      {
        type: 'mcq',
        question: 'Which property sets a background image?',
        options: ['background-color', 'background-image', 'background-src', 'background-url'],
        correct: 1,
      },
    ],
  },

  'css-font-size': {
    steps: [
      {
        type: 'explain',
        text: "Font size controls text size. px is fixed pixels. rem is relative to the browser root size (16px = 1rem by default). Use rem for body text — it respects the user's accessibility text-size setting, px does not.",
        code: "h1 { font-size: 2rem; }    /* 32px */\np  { font-size: 1rem; }    /* 16px */\nsmall { font-size: 0.875rem; } /* 14px */",
      },
      {
        type: 'fillblank',
        template: 'font-___: 1.5rem;',
        answer: 'size',
        hint: 'The property that controls text size',
      },
      {
        type: 'mcq',
        question: 'Which unit respects the user browser text-size accessibility setting?',
        options: ['px', 'pt', 'rem', 'vw'],
        correct: 2,
      },
    ],
  },

  'css-text-align': {
    steps: [
      {
        type: 'explain',
        text: "text-align controls the horizontal alignment of inline content (text, images, inline elements) inside a container. It does not move block elements — use margin: auto or flexbox for centering block elements.",
        code: ".hero-title {\n  text-align: center;\n}\n.receipt {\n  text-align: right;\n}",
      },
      {
        type: 'fillblank',
        template: 'text-___: center;',
        answer: 'align',
        hint: 'The property that aligns text horizontally',
      },
      {
        type: 'mcq',
        question: 'text-align: center on a <div> centers...',
        options: [
          'The div itself on the page',
          'The text and inline content inside the div',
          'All child elements including nested divs',
          'Only images inside the div',
        ],
        correct: 1,
      },
    ],
  },

  'css-padding': {
    steps: [
      {
        type: 'explain',
        text: "Padding is the space inside an element, between its content and its border. padding: 12px sets all four sides equally. padding: 8px 16px sets top/bottom to 8px and left/right to 16px (top-bottom left-right).",
        code: ".btn {\n  padding: 12px 24px; /* top/bottom left/right */\n}\n.card {\n  padding: 20px; /* all four sides */\n}",
      },
      {
        type: 'fillblank',
        template: '___: 16px 32px;',
        answer: 'padding',
        hint: 'Inner spacing between content and border',
      },
      {
        type: 'mcq',
        question: 'Where does padding add space?',
        options: [
          'Outside the border, pushing away other elements',
          'Inside the element, between content and border',
          'Between sibling elements',
          'Only on left and right sides',
        ],
        correct: 1,
      },
    ],
  },

  'css-flexbox': {
    steps: [
      {
        type: 'explain',
        text: "Flexbox makes row and column layouts easy. Set display: flex on the parent container. justify-content aligns items along the main axis (horizontal by default). align-items aligns along the cross axis (vertical by default).",
        code: ".navbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}",
      },
      {
        type: 'fillblank',
        template: 'display: ___;',
        answer: 'flex',
        hint: 'Value that enables Flexbox layout',
      },
      {
        type: 'mcq',
        question: 'Which property centers flex items vertically (in a row)?',
        options: ['justify-content: center', 'align-items: center', 'flex-center: true', 'vertical-align: center'],
        correct: 1,
      },
    ],
  },

  'css-colors': {
    steps: [
      {
        type: 'explain',
        text: "CSS supports many color formats — all equivalent. Hex (#6366f1) is the most common. rgb(99, 102, 241) sets channels directly. hsl(239, 84%, 67%) is great for generating palettes since you can shift the hue easily.",
        code: ".primary  { color: #6366f1; }\n.secondary { color: rgb(99, 102, 241); }\n.accent    { color: hsl(239, 84%, 67%); }",
      },
      {
        type: 'fillblank',
        template: 'color: ___6366f1;',
        answer: '#',
        hint: 'Hex colors start with this character',
      },
      {
        type: 'mcq',
        question: 'Which is a valid CSS hex color?',
        options: ['color(255,0,0)', 'hx#FF0000', '#ff0000', '0xff0000'],
        correct: 2,
      },
    ],
  },

  'css-font-weight': {
    steps: [
      {
        type: 'explain',
        text: "font-weight controls text boldness. Named values: normal (400), bold (700). Numeric values 100-900 give precise control when your font supports them. 600 is a popular semi-bold that is slightly lighter than full bold.",
        code: "h1    { font-weight: 800; }  /* extra bold */\np     { font-weight: 400; }  /* normal */\n.label { font-weight: 600; } /* semi-bold */",
      },
      {
        type: 'fillblank',
        template: 'font-___: 700;',
        answer: 'weight',
        hint: 'Controls text boldness',
      },
      {
        type: 'mcq',
        question: 'What numeric value does font-weight: bold equal?',
        options: ['400', '600', '700', '900'],
        correct: 2,
      },
    ],
  },

  'css-border': {
    steps: [
      {
        type: 'explain',
        text: "Borders take three values in order: width, style, color. The style is required — common values are solid, dashed, and dotted. Without a style, no border appears regardless of width or color.",
        code: ".card {\n  border: 1px solid #1e2d45;\n  border-radius: 8px;\n}\n.warning {\n  border: 2px dashed #fbbf24;\n}",
      },
      {
        type: 'fillblank',
        template: 'border: 2px ___ #818cf8;',
        answer: 'solid',
        hint: 'Border style keyword for a continuous line',
      },
      {
        type: 'mcq',
        question: 'Which border style creates a continuous unbroken line?',
        options: ['dashed', 'dotted', 'solid', 'none'],
        correct: 2,
      },
    ],
  },

  'css-margin': {
    steps: [
      {
        type: 'explain',
        text: "Margin is the space outside an element, pushing away neighboring elements. margin: 0 auto centers a block element horizontally — it needs a defined width to work. Margins can be negative to create overlapping effects.",
        code: ".container {\n  width: 960px;\n  margin: 0 auto;  /* centered */\n}\n.card + .card {\n  margin-top: 16px;\n}",
      },
      {
        type: 'fillblank',
        template: '___: 0 auto;',
        answer: 'margin',
        hint: 'Outer spacing property (0 auto centers a block)',
      },
      {
        type: 'mcq',
        question: 'What does margin: 0 auto do to a block element?',
        options: ['Removes padding', 'Centers it horizontally', 'Makes it full-width', 'Centers it vertically'],
        correct: 1,
      },
    ],
  },

  'css-width-height': {
    steps: [
      {
        type: 'explain',
        text: "width and height set element dimensions. 100% is relative to the parent. 100vw/100vh are relative to the viewport (screen). Use max-width to prevent elements from stretching too wide on large screens.",
        code: ".hero {\n  width: 100%;\n  height: 100vh;\n  max-width: 1200px;\n}",
      },
      {
        type: 'fillblank',
        template: '___: 100%;\nheight: 200px;',
        answer: 'width',
        hint: 'Horizontal size property',
      },
      {
        type: 'mcq',
        question: 'What does 100vh mean?',
        options: ['100 pixels', '100% of the parent height', '100% of the viewport height', '100 vertical grid units'],
        correct: 2,
      },
    ],
  },

  'css-border-radius': {
    steps: [
      {
        type: 'explain',
        text: "border-radius rounds element corners. 4px is subtle, 12px is card-like, 50% makes a circle on a square element. Set individual corners: border-radius: 8px 8px 0 0 rounds only the top two corners.",
        code: ".avatar {\n  border-radius: 50%; /* circle */\n  width: 48px;\n  height: 48px;\n}\n.card {\n  border-radius: 12px;\n}",
      },
      {
        type: 'fillblank',
        template: 'border-___: 8px;',
        answer: 'radius',
        hint: 'Property that rounds element corners',
      },
      {
        type: 'mcq',
        question: 'What border-radius value creates a perfect circle on a square element?',
        options: ['100px', '50%', 'round', 'circle'],
        correct: 1,
      },
    ],
  },

  'css-box-shadow': {
    steps: [
      {
        type: 'explain',
        text: "Box shadows add depth. The syntax is: offset-x offset-y blur spread color. A soft card shadow: 0 4px 16px rgba(0,0,0,0.2). Separate multiple shadows with commas. Add inset to make the shadow appear inside the element.",
        code: ".card {\n  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);\n}\n.btn:hover {\n  box-shadow: 0 0 20px rgba(129, 140, 248, 0.5);\n}",
      },
      {
        type: 'fillblank',
        template: 'box-___: 0 2px 8px rgba(0,0,0,0.4);',
        answer: 'shadow',
        hint: 'Property that adds a drop shadow',
      },
      {
        type: 'mcq',
        question: 'In box-shadow: 0 4px 16px rgba(0,0,0,0.3), what does 16px control?',
        options: ['Horizontal offset', 'Vertical offset', 'Blur radius', 'Shadow spread'],
        correct: 2,
      },
    ],
  },

  'css-hover': {
    steps: [
      {
        type: 'explain',
        text: "The :hover pseudo-class applies styles when the user's mouse moves over an element. Combine it with transition for smooth animations. You can hover on any element, not just links.",
        code: ".btn {\n  background: #6366f1;\n  transition: background 0.2s ease;\n}\n.btn:hover {\n  background: #818cf8;\n}",
      },
      {
        type: 'fillblank',
        template: 'button:___ { opacity: 0.8; }',
        answer: 'hover',
        hint: 'Pseudo-class triggered on mouse-over',
      },
      {
        type: 'mcq',
        question: 'When does a :hover style apply?',
        options: ['When the element is clicked', 'When the mouse moves over the element', 'When the element is focused', 'Always'],
        correct: 1,
      },
    ],
  },

  'css-variables': {
    steps: [
      {
        type: 'explain',
        text: "CSS custom properties (variables) store reusable values. Define them in :root with a -- prefix. Access them with var(). Change one variable and it updates everywhere — perfect for themes and color systems.",
        code: ":root {\n  --primary: #6366f1;\n  --bg: #0a1628;\n  --text: #e2e8f0;\n}\n.btn {\n  background: var(--primary);\n  color: var(--text);\n}",
      },
      {
        type: 'fillblank',
        template: ':root {\n  ___primary: #6366f1;\n}',
        answer: '--',
        hint: 'CSS custom properties start with two of these',
      },
      {
        type: 'mcq',
        question: 'How do you use a CSS variable called --primary?',
        options: ['color: primary', 'color: $primary', 'color: var(--primary)', 'color: --primary'],
        correct: 2,
      },
    ],
  },

  'css-media-query': {
    steps: [
      {
        type: 'explain',
        text: "Media queries apply styles only at certain screen sizes. max-width: 768px targets screens 768px and narrower (mobile). Start with mobile styles then add @media (min-width) for larger screens — this is called mobile-first design.",
        code: "/* Mobile first */\n.grid { grid-template-columns: 1fr; }\n\n@media (min-width: 768px) {\n  .grid { grid-template-columns: 1fr 1fr; }\n}",
      },
      {
        type: 'fillblank',
        template: '@___ (max-width: 768px) { }',
        answer: 'media',
        hint: 'At-rule for responsive breakpoints',
      },
      {
        type: 'mcq',
        question: 'What does @media (max-width: 600px) mean?',
        options: [
          'Apply styles when screen is 600px or wider',
          'Apply styles when screen is 600px or narrower',
          'Set the page width to 600px',
          'Load a different CSS file',
        ],
        correct: 1,
      },
    ],
  },

  'css-grid': {
    steps: [
      {
        type: 'explain',
        text: "CSS Grid is the most powerful layout system. Set display: grid on the parent. grid-template-columns defines the columns: 1fr means one equal fraction of available space. gap sets the spacing between all cells.",
        code: ".dashboard {\n  display: grid;\n  grid-template-columns: 1fr 2fr 1fr;\n  gap: 16px;\n}",
      },
      {
        type: 'fillblank',
        template: 'display: ___;\ngrid-template-columns: 1fr 1fr;',
        answer: 'grid',
        hint: 'Value that enables CSS Grid layout',
      },
      {
        type: 'mcq',
        question: 'What does 1fr mean in grid-template-columns?',
        options: ['1 fixed pixel', '1 flexible fraction of the available space', '1 viewport unit', '1 em unit'],
        correct: 1,
      },
    ],
  },

  'css-transition': {
    steps: [
      {
        type: 'explain',
        text: "Transitions smoothly animate property changes. Syntax: property duration timing delay. ease starts slow, speeds up, then slows down. Transitioning transform and opacity is GPU-accelerated — it stays smooth even on mobile devices.",
        code: ".btn {\n  background: #6366f1;\n  transform: translateY(0);\n  transition: background 0.2s ease,\n              transform 0.2s ease;\n}\n.btn:hover {\n  background: #818cf8;\n  transform: translateY(-2px);\n}",
      },
      {
        type: 'fillblank',
        template: '___: background 0.3s ease;',
        answer: 'transition',
        hint: 'Property that smoothly animates changes',
      },
      {
        type: 'mcq',
        question: 'Which CSS properties are best to animate for smooth performance?',
        options: ['width and height', 'margin and padding', 'transform and opacity', 'color and font-size'],
        correct: 2,
      },
    ],
  },

  // ── JavaScript ────────────────────────────────────────────────────────────

  'js-variables': {
    steps: [
      {
        type: 'explain',
        text: "let and const declare block-scoped variables. const cannot be reassigned after declaration. let can. Avoid var — it has quirky function-scoped behavior. Use const by default, let when you need to reassign.",
        code: "const name = 'Alice';  // can't reassign\nlet score = 0;          // can reassign\nscore = 10;             // works fine",
      },
      { type: 'mcq', question: 'Which keyword declares a block-scoped variable that can be reassigned?', options: ['var', 'let', 'const', 'def'], correct: 1 },
    ],
  },

  'js-console': {
    steps: [
      {
        type: 'explain',
        text: "console.log() prints values to the browser's Developer Tools console. It's your most-used debugging tool. console.error() prints red messages. console.table() displays arrays or objects as a formatted table.",
        code: "console.log('Hello, World!');\nconsole.log(42, true, [1,2,3]);\nconsole.error('Something went wrong');",
      },
      { type: 'fillblank', template: 'console._("Hello, World!");', answer: 'log', hint: 'Method that prints to the console' },
    ],
  },

  'js-functions': {
    steps: [
      {
        type: 'explain',
        text: "Functions are reusable blocks of code. Define them once and call them as many times as needed. Parameters are the named inputs listed in the definition. Arguments are the actual values passed when calling.",
        code: "function greet(name) {\n  return 'Hi ' + name + '!';\n}\nconsole.log(greet('Alice')); // 'Hi Alice!'",
      },
      { type: 'fillblank', template: '___ greet(name) {\n  return "Hi " + name;\n}', answer: 'function', hint: 'Keyword that declares a function' },
    ],
  },

  'js-conditionals': {
    steps: [
      {
        type: 'explain',
        text: "if/else runs different code based on a condition. The condition must evaluate to true or false. else is optional — only add it when there is a fallback case. else if handles multiple distinct cases.",
        code: "if (score >= 90) {\n  console.log('A');\n} else if (score >= 70) {\n  console.log('B');\n} else {\n  console.log('Try again');\n}",
      },
      { type: 'fillblank', template: 'if (x > 0) {\n  console.log("pos");\n} ___ {\n  console.log("neg");\n}', answer: 'else', hint: 'Fallback branch keyword' },
    ],
  },

  'js-arrays': {
    steps: [
      {
        type: 'explain',
        text: "Arrays store ordered lists of values. Index counting starts at 0 — so arr[0] is the first item. Arrays can hold any mix of types. .length gives the count. They are mutable — you can add, remove, and change items.",
        code: "const langs = ['HTML', 'CSS', 'JS'];\nconsole.log(langs[0]); // 'HTML'\nconsole.log(langs.length); // 3",
      },
      { type: 'mcq', question: 'How do you create an empty array in JavaScript?', options: ['{}', '()', '[]', 'new Array[]'], correct: 2 },
    ],
  },

  'js-loops': {
    steps: [
      {
        type: 'explain',
        text: "for loops repeat code a set number of times. Three parts: initializer (let i = 0), condition (i < 5), and increment (i++). The loop body runs while the condition is true, then stops.",
        code: "for (let i = 0; i < 5; i++) {\n  console.log(i); // 0 1 2 3 4\n}",
      },
      { type: 'fillblank', template: 'for (let i = 0; i < 5; ___) {\n  console.log(i);\n}', answer: 'i++', hint: 'The increment expression at the end of a for loop' },
    ],
  },

  'js-strings': {
    steps: [
      {
        type: 'explain',
        text: "Strings have built-in properties and methods. .length returns the character count. .toUpperCase() and .toLowerCase() change case. .includes() checks for substrings. .slice() extracts a portion. Strings are immutable — methods return new strings.",
        code: "const s = 'hello world';\nconsole.log(s.length);       // 11\nconsole.log(s.toUpperCase()); // 'HELLO WORLD'\nconsole.log(s.includes('world')); // true",
      },
      { type: 'fillblank', template: '"hello world".___', answer: 'length', hint: 'Property that returns the character count' },
    ],
  },

  'js-numbers': {
    steps: [
      {
        type: 'explain',
        text: "JavaScript uses one number type for integers and decimals. Math operators: + - * / and ** for powers. % is modulo (remainder after division). Division always produces a decimal: 7/2 = 3.5, not 3.",
        code: "console.log(10 + 3);  // 13\nconsole.log(10 % 3);  // 1 (remainder)\nconsole.log(2 ** 8);  // 256\nconsole.log(typeof 42); // 'number'",
      },
      { type: 'mcq', question: 'What does `typeof 42` return in JavaScript?', options: ['"integer"', '"float"', '"number"', '"int"'], correct: 2 },
    ],
  },

  'js-objects': {
    steps: [
      {
        type: 'explain',
        text: "Objects store key-value pairs. Keys are strings (no quotes needed in declarations). Access values with dot notation (obj.key) or bracket notation (obj['key']). Bracket notation is needed when the key is in a variable.",
        code: "const user = {\n  name: 'Alice',\n  score: 95,\n  isPro: true,\n};\nconsole.log(user.name);  // 'Alice'",
      },
      { type: 'mcq', question: 'How do you access the `name` property of an object called `user`?', options: ['user->name', 'user[name]', 'user::name', 'user.name'], correct: 3 },
    ],
  },

  'js-template-literals': {
    steps: [
      {
        type: 'explain',
        text: "Template literals use backticks instead of quotes. Embed variables or expressions with ${expression}. They also support multi-line strings without needing \\n escape sequences.",
        code: "const name = 'Alice';\nconst score = 95;\nconsole.log(`Hello, ${name}! You scored ${score}.`);",
      },
      { type: 'mcq', question: 'Which quote character wraps a template literal in JavaScript?', options: ["Single quote '", 'Double quote "', 'Backtick `', 'Slash /'], correct: 2 },
    ],
  },

  'js-arrow-functions': {
    steps: [
      {
        type: 'explain',
        text: "Arrow functions are a shorter way to write functions. => replaces the function keyword. When the body is a single expression, curly braces and return are implicit — the expression value is returned automatically.",
        code: "// Traditional\nfunction add(a, b) { return a + b; }\n\n// Arrow\nconst add = (a, b) => a + b;",
      },
      { type: 'fillblank', template: 'const add = (a, b) ___ a + b;', answer: '=>', hint: 'Arrow symbol between params and body' },
    ],
  },

  'js-array-push': {
    steps: [
      {
        type: 'explain',
        text: "Arrays are mutable — you can add and remove items after creation. .push() adds one or more items to the end. .pop() removes the last item. .unshift() adds to the start. .shift() removes from the start.",
        code: "const arr = [1, 2, 3];\narr.push(4);         // [1,2,3,4]\narr.pop();           // [1,2,3]\narr.unshift(0);      // [0,1,2,3]",
      },
      { type: 'fillblank', template: 'const arr = [1, 2, 3];\narr.___(4);', answer: 'push', hint: 'Method that adds to the end of an array' },
    ],
  },

  'js-array-map': {
    steps: [
      {
        type: 'explain',
        text: ".map() creates a NEW array by running a function on every item. It never changes the original array. The callback receives the current item, its index, and the whole array. Always return a value inside the callback.",
        code: "const nums = [1, 2, 3, 4];\nconst doubled = nums.map(x => x * 2);\nconsole.log(doubled); // [2, 4, 6, 8]\nconsole.log(nums);    // [1, 2, 3, 4] — unchanged",
      },
      { type: 'fillblank', template: 'const doubled = arr.___(x => x * 2);', answer: 'map', hint: 'Creates a new array by transforming each item' },
    ],
  },

  'js-array-filter': {
    steps: [
      {
        type: 'explain',
        text: ".filter() creates a NEW array with only items that pass a test. Return true to keep an item, false to exclude it. The original array is unchanged. Chain it with .map() to filter then transform.",
        code: "const nums = [1, -2, 3, -4, 5];\nconst positive = nums.filter(x => x > 0);\nconsole.log(positive); // [1, 3, 5]",
      },
      { type: 'fillblank', template: 'const evens = arr.___(x => x % 2 === 0);', answer: 'filter', hint: 'Returns only items that pass the test' },
    ],
  },

  'js-dom-select': {
    steps: [
      {
        type: 'explain',
        text: "document.querySelector() finds the FIRST element matching a CSS selector. document.querySelectorAll() finds ALL matches and returns a NodeList. These are the modern selectors — no need for getElementById or getElementsByClassName.",
        code: "const btn    = document.querySelector('#submit');\nconst cards  = document.querySelectorAll('.card');\nconst first  = document.querySelector('h1');",
      },
      { type: 'fillblank', template: 'const btn = document.___(\'#submit\');', answer: 'querySelector', hint: 'Selects one element by CSS selector' },
    ],
  },

  'js-events': {
    steps: [
      {
        type: 'explain',
        text: "addEventListener() attaches a function that runs when an event fires. Common events: click, input, submit, keydown, mouseover, load. Always use addEventListener — it lets you attach multiple handlers to the same element.",
        code: "const btn = document.querySelector('#btn');\nbtn.addEventListener('click', () => {\n  console.log('Button clicked!');\n});",
      },
      { type: 'fillblank', template: 'btn.addEventListener("___", handleClick);', answer: 'click', hint: 'The most common mouse interaction event' },
    ],
  },

  'js-ternary': {
    steps: [
      {
        type: 'explain',
        text: "The ternary operator is a one-line if/else: condition ? valueIfTrue : valueIfFalse. Great for assigning a value based on a condition. Avoid nesting ternaries inside each other — it becomes unreadable fast.",
        code: "const score = 85;\nconst grade = score >= 90 ? 'A' : 'B';\nconsole.log(grade); // 'B'",
      },
      { type: 'fillblank', template: 'const label = x > 0 ___ "positive" : "negative";', answer: '?', hint: 'Character between the condition and the two values' },
    ],
  },

  'js-spread': {
    steps: [
      {
        type: 'explain',
        text: "The spread operator (...) expands an iterable into individual elements. Use it to copy arrays, merge arrays, or clone objects without mutation. Spreading into a function call passes array items as separate arguments.",
        code: "const a = [1, 2, 3];\nconst b = [...a, 4, 5]; // [1,2,3,4,5]\n\nconst user = { name: 'Alice' };\nconst updated = { ...user, score: 95 };",
      },
      { type: 'mcq', question: 'What does `...arr` (spread) do inside `[...arr, 4]`?', options: ['Deletes all items in arr', 'Expands arr items into the new array', 'Copies only the reference', 'Sorts arr ascending'], correct: 1 },
    ],
  },

  // ── Python ────────────────────────────────────────────────────────────────

  'py-print': {
    steps: [
      {
        type: 'explain',
        text: "print() outputs text to the terminal. Pass multiple arguments separated by commas and they print with spaces between them. The end parameter controls what follows (default is a newline character).",
        code: "print('Hello, World!')\nprint('Score:', 95)\nprint('A', 'B', 'C', sep='-')  # A-B-C",
      },
      { type: 'fillblank', template: '_("Hello, World!")', answer: 'print', hint: 'Built-in function to output text' },
    ],
  },

  'py-variables': {
    steps: [
      {
        type: 'explain',
        text: "Python variables need no type declaration — just assign with =. Python infers the type automatically. Names are case-sensitive: name and Name are different variables. Use snake_case by convention.",
        code: "name = 'Alice'\nscore = 95\nis_pro = True\nprint(name, score)  # Alice 95",
      },
      { type: 'mcq', question: 'How do you assign a value to a variable in Python?', options: ['var x = 42', 'let x = 42', 'x = 42', 'int x = 42'], correct: 2 },
    ],
  },

  'py-conditionals': {
    steps: [
      {
        type: 'explain',
        text: "Python uses indentation (4 spaces) to define code blocks instead of curly braces. No parentheses needed around the condition. elif is Python's else if. The colon at the end of each condition line is required.",
        code: "score = 88\nif score >= 90:\n    print('A')\nelif score >= 70:\n    print('B')\nelse:\n    print('Try again')",
      },
      { type: 'fillblank', template: '___ score > 90:\n    print("A")', answer: 'if', hint: 'Keyword that starts a conditional block' },
    ],
  },

  'py-loops': {
    steps: [
      {
        type: 'explain',
        text: "for loops iterate over any sequence — lists, strings, ranges. range(5) generates 0,1,2,3,4. The loop variable takes each value in turn. break exits the loop early. continue skips to the next iteration.",
        code: "for i in range(5):\n    print(i)  # 0 1 2 3 4\n\nfor lang in ['HTML', 'CSS', 'JS']:\n    print(lang)",
      },
      { type: 'fillblank', template: '___ i in range(5):\n    print(i)', answer: 'for', hint: 'Keyword for iterating over a sequence' },
    ],
  },

  'py-functions': {
    steps: [
      {
        type: 'explain',
        text: "def defines a function. Parameters are the named inputs in the def line. Functions return None unless you explicitly use return. Default parameter values are set with =: def greet(name='World').",
        code: "def greet(name):\n    return f'Hi {name}!'\n\nprint(greet('Alice'))  # Hi Alice!",
      },
      { type: 'fillblank', template: '___ greet(name):\n    return f"Hi {name}"', answer: 'def', hint: 'Keyword that defines a function' },
    ],
  },

  'py-lists': {
    steps: [
      {
        type: 'explain',
        text: "Lists are ordered mutable sequences. Create with square brackets. .append() adds to the end. len() returns the count. Access by index starting at 0. Negative indexes count from the end: list[-1] is the last item.",
        code: "nums = [1, 2, 3]\nnums.append(4)     # [1,2,3,4]\nprint(len(nums))   # 4\nprint(nums[-1])    # 4",
      },
      { type: 'mcq', question: 'How do you add an item to the end of a Python list?', options: ['list.add(x)', 'list.push(x)', 'list.insert(x)', 'list.append(x)'], correct: 3 },
    ],
  },

  'py-strings': {
    steps: [
      {
        type: 'explain',
        text: "Strings are immutable sequences of characters. Methods return new strings — they do not modify the original. Common methods: .upper(), .lower(), .strip() (removes whitespace), .split(), .replace().",
        code: "s = '  Hello World  '\nprint(s.strip())        # 'Hello World'\nprint(s.lower())        # '  hello world  '\nprint(s.replace('o','0')) # '  Hell0 W0rld  '",
      },
      { type: 'fillblank', template: '"hello".___()  # → "HELLO"', answer: 'upper', hint: 'String method that converts to uppercase' },
    ],
  },

  'py-numbers': {
    steps: [
      {
        type: 'explain',
        text: "Python has int for whole numbers and float for decimals. Regular division always returns a float: 7/2 = 3.5. Use // for floor (integer) division: 7//2 = 3. % returns the remainder (modulo): 7%2 = 1.",
        code: "print(7 / 2)   # 3.5  (float division)\nprint(7 // 2)  # 3    (floor division)\nprint(7 % 2)   # 1    (remainder)",
      },
      { type: 'mcq', question: 'What does the // operator do in Python?', options: ['Remainder (modulo)', 'Comment', 'Floor (integer) division', 'Power'], correct: 2 },
    ],
  },

  'py-fstrings': {
    steps: [
      {
        type: 'explain',
        text: "f-strings are the modern way to embed variables in strings. Prefix with f and put expressions in curly braces. They can even contain arithmetic: f'{2+2}' outputs '4'. Much cleaner than string concatenation.",
        code: "name = 'Alice'\nscore = 95\nprint(f'Hello, {name}!')\nprint(f'Score: {score}/100 ({score}%)')",
      },
      { type: 'fillblank', template: 'name = "Alice"\nprint(___"Hello, {name}!")', answer: 'f', hint: 'Single-character prefix before the quote' },
    ],
  },

  'py-while': {
    steps: [
      {
        type: 'explain',
        text: "while loops repeat as long as a condition is true. You must change something inside the loop — otherwise it runs forever (infinite loop). Use break to exit early and continue to skip the current iteration.",
        code: "count = 0\nwhile count < 5:\n    print(count)\n    count += 1  # must increment!",
      },
      { type: 'fillblank', template: '___ count < 10:\n    count += 1', answer: 'while', hint: 'Keyword for a condition-based loop' },
    ],
  },

  'py-dict': {
    steps: [
      {
        type: 'explain',
        text: "Dictionaries store key-value pairs. Keys must be unique and immutable. Access values with square brackets: d['key']. Use .get() to avoid KeyError if a key might not exist. Add or update with d['key'] = value.",
        code: "user = {'name': 'Alice', 'score': 95}\nprint(user['name'])          # Alice\nprint(user.get('age', 0))    # 0 (default)",
      },
      { type: 'mcq', question: 'How do you access the key "age" in dictionary `d`?', options: ['d.age', 'd->age', 'd("age")', 'd["age"]'], correct: 3 },
    ],
  },

  'py-tuples': {
    steps: [
      {
        type: 'explain',
        text: "Tuples are like lists but immutable — once created, they cannot be changed. Use parentheses instead of brackets. They are often used to return multiple values from a function and as dictionary keys (lists cannot be keys).",
        code: "point = (10, 20)\nprint(point[0])   # 10\n\n# Functions can return multiple values as tuples\ndef min_max(lst):\n    return min(lst), max(lst)",
      },
      { type: 'mcq', question: 'What makes tuples different from lists in Python?', options: ['Tuples use curly braces {}', 'Tuples are mutable', 'Tuples are immutable', 'Tuples allow only one item'], correct: 2 },
    ],
  },

  'py-list-comp': {
    steps: [
      {
        type: 'explain',
        text: "List comprehensions create lists in a single expression: [expression for item in iterable]. Add a condition to filter: [x for x in nums if x > 0]. They are more Pythonic and often faster than a for loop with .append().",
        code: "nums = [1, 2, 3, 4, 5]\ndoubled = [x * 2 for x in nums]\nevens   = [x for x in nums if x % 2 == 0]\nprint(doubled) # [2,4,6,8,10]",
      },
      { type: 'fillblank', template: 'doubled = [x * 2 ___ x in nums]', answer: 'for', hint: 'Keyword inside a list comprehension' },
    ],
  },

  'py-classes': {
    steps: [
      {
        type: 'explain',
        text: "Classes are blueprints for objects. __init__ is the constructor — it runs when you create an instance with ClassName(). self refers to the instance. Attributes store data on the object, methods define its behavior.",
        code: "class Dog:\n    def __init__(self, name):\n        self.name = name\n    def bark(self):\n        print(f'{self.name} says woof!')\n\ndog = Dog('Rex')\ndog.bark()  # Rex says woof!",
      },
      { type: 'fillblank', template: '___ Dog:\n    def __init__(self, name):\n        self.name = name', answer: 'class', hint: 'Keyword that defines a class' },
    ],
  },

  'py-try-except': {
    steps: [
      {
        type: 'explain',
        text: "try/except handles errors without crashing. Put risky code in try. Specify the error type after except for precise handling. Use finally for code that always runs regardless of success or failure.",
        code: "try:\n    result = 10 / 0\nexcept ZeroDivisionError:\n    print('Cannot divide by zero')\nfinally:\n    print('This always runs')",
      },
      { type: 'fillblank', template: 'try:\n    risky_operation()\n___:\n    print("Error caught")', answer: 'except', hint: 'Keyword that catches errors in a try block' },
    ],
  },

  'py-import': {
    steps: [
      {
        type: 'explain',
        text: "import loads modules. Python has a huge standard library: math, datetime, random, os. from module import name lets you use names directly without the module prefix. Third-party packages install with pip.",
        code: "import math\nprint(math.pi)          # 3.14159...\nprint(math.sqrt(16))    # 4.0\n\nfrom random import choice\nprint(choice(['HTML','CSS','JS']))",
      },
      { type: 'fillblank', template: '___ math\nprint(math.pi)', answer: 'import', hint: 'Keyword to load a module' },
    ],
  },

  'py-range-step': {
    steps: [
      {
        type: 'explain',
        text: "range(start, stop, step) generates numbers efficiently without building a list. A negative step counts backwards: range(10, 0, -2) gives 10,8,6,4,2. range() is memory-efficient — it generates values on demand.",
        code: "for i in range(0, 10, 2):\n    print(i)   # 0 2 4 6 8\n\nfor i in range(5, 0, -1):\n    print(i)   # 5 4 3 2 1",
      },
      { type: 'fillblank', template: 'for i in range(0, 10, ___):\n    print(i)  # 0, 2, 4, 6, 8', answer: '2', hint: 'The step value to count by twos' },
    ],
  },

  // ── SQL ───────────────────────────────────────────────────────────────────

  'sql-select-all': {
    steps: [
      {
        type: 'explain',
        text: "SELECT retrieves data from a table. * means all columns. FROM specifies which table. SQL keywords are case-insensitive but convention is to capitalize them. Every statement ends with a semicolon.",
        code: "SELECT * FROM users;",
      },
      { type: 'fillblank', template: 'SELECT ___ FROM users;', answer: '*', hint: 'Wildcard that selects every column' },
    ],
  },

  'sql-select-columns': {
    steps: [
      {
        type: 'explain',
        text: "List specific column names instead of * to fetch only what you need. This is faster and more explicit. Rename columns in results with AS: SELECT name AS full_name FROM users.",
        code: "SELECT name, email, score\nFROM users;\n\nSELECT name AS full_name, score AS points\nFROM users;",
      },
      { type: 'mcq', question: 'Which SQL clause specifies which columns to retrieve?', options: ['FROM', 'WHERE', 'SELECT', 'GET'], correct: 2 },
    ],
  },

  'sql-where': {
    steps: [
      {
        type: 'explain',
        text: "WHERE filters rows by a condition. Without it you get every row. Comparison operators: = != < > <= >=. Combine conditions with AND (both must be true) and OR (at least one must be true).",
        code: "SELECT * FROM users WHERE age > 18;\nSELECT * FROM users WHERE age > 18 AND city = 'NYC';",
      },
      { type: 'fillblank', template: 'SELECT * FROM users\n___ age > 18;', answer: 'WHERE', hint: 'Clause that filters rows by condition' },
    ],
  },

  'sql-where-string': {
    steps: [
      {
        type: 'explain',
        text: "String values in SQL use single quotes, not double. Comparisons are case-sensitive by default. Use LIKE for pattern matching instead of = when you need wildcards.",
        code: "SELECT * FROM users WHERE name = 'Alice';\nSELECT * FROM users WHERE email LIKE '%@gmail.com';",
      },
      { type: 'mcq', question: "How do you match a text value in a SQL WHERE clause?", options: ["age = 18", "name = Alice", "name = 'Alice'", "name == 'Alice'"], correct: 2 },
    ],
  },

  'sql-order-by': {
    steps: [
      {
        type: 'explain',
        text: "ORDER BY sorts results. ASC is ascending (default), DESC is descending. Sort by multiple columns by separating them with commas. Sorting happens after filtering with WHERE.",
        code: "SELECT * FROM users ORDER BY score DESC;\nSELECT * FROM users ORDER BY country ASC, name ASC;",
      },
      { type: 'fillblank', template: 'SELECT * FROM users\nORDER ___ age ASC;', answer: 'BY', hint: 'ORDER ___ is always two words' },
    ],
  },

  'sql-limit': {
    steps: [
      {
        type: 'explain',
        text: "LIMIT caps how many rows are returned. Essential for performance with large tables. Combine with ORDER BY to get the top-N results — for example, the 10 highest scoring users.",
        code: "SELECT * FROM posts ORDER BY created_at DESC LIMIT 10;\nSELECT * FROM users ORDER BY score DESC LIMIT 3;",
      },
      { type: 'fillblank', template: 'SELECT * FROM posts\n___ 10;', answer: 'LIMIT', hint: 'Clause that caps the number of rows returned' },
    ],
  },

  'sql-distinct': {
    steps: [
      {
        type: 'explain',
        text: "DISTINCT removes duplicate values from results. It applies to the entire row when multiple columns are selected. Slightly slower than regular SELECT due to deduplication work.",
        code: "SELECT DISTINCT country FROM users;\nSELECT DISTINCT city, country FROM users;",
      },
      { type: 'fillblank', template: 'SELECT ___ country FROM users;', answer: 'DISTINCT', hint: 'Keyword that removes duplicate values' },
    ],
  },

  'sql-and-or': {
    steps: [
      {
        type: 'explain',
        text: "AND requires BOTH conditions to be true. OR requires AT LEAST ONE. AND has higher precedence than OR — use parentheses to make complex conditions unambiguous.",
        code: "SELECT * FROM users\nWHERE age > 18 AND city = 'NYC';\n\nSELECT * FROM users\nWHERE (age > 18 AND city = 'NYC') OR is_pro = true;",
      },
      { type: 'fillblank', template: "WHERE age > 18\n___ city = 'NYC';", answer: 'AND', hint: 'Logical operator — both conditions must be true' },
    ],
  },

  'sql-like': {
    steps: [
      {
        type: 'explain',
        text: "LIKE does pattern matching. % is a wildcard for any sequence of characters. _ is a wildcard for exactly one character. Use 'A%' to find values starting with A, '%@gmail.com' for Gmail addresses.",
        code: "SELECT * FROM users WHERE name LIKE 'A%';\nSELECT * FROM users WHERE email LIKE '%@gmail.com';\nSELECT * FROM users WHERE code LIKE 'N_X___';",
      },
      { type: 'fillblank', template: "WHERE name ___ 'A%';", answer: 'LIKE', hint: 'Pattern-matching operator (% is the wildcard)' },
    ],
  },

  'sql-insert': {
    steps: [
      {
        type: 'explain',
        text: "INSERT INTO adds a new row. List the column names, then the VALUES in matching order. You can omit columns that have default values or allow NULL. The users sheet already has Alice, so add a different person.",
        code: "INSERT INTO users (name, age, city)\nVALUES ('Bob', 25, 'NYC');",
      },
      { type: 'fillblank', template: "___ INTO users (name, age)\nVALUES ('Bob', 25);", answer: 'INSERT', hint: 'Keyword that adds a new row to a table' },
    ],
  },

  'sql-update': {
    steps: [
      {
        type: 'explain',
        text: "UPDATE modifies existing rows. SET specifies the new values. Always use WHERE with UPDATE — without it you change every row in the table. Double-check your WHERE clause before running.",
        code: "UPDATE users\nSET age = 30, city = 'LA'\nWHERE id = 1;",
      },
      { type: 'fillblank', template: '___ users\nSET age = 30\nWHERE id = 1;', answer: 'UPDATE', hint: 'Keyword that modifies existing rows' },
    ],
  },

  'sql-delete': {
    steps: [
      {
        type: 'explain',
        text: "DELETE removes rows. Like UPDATE, always use WHERE or you delete every row. DELETE FROM table removes all rows but keeps the table structure. DROP TABLE removes the table entirely.",
        code: "DELETE FROM users WHERE id = 1;\nDELETE FROM users WHERE last_login < '2024-01-01';",
      },
      { type: 'fillblank', template: '___ FROM users\nWHERE id = 1;', answer: 'DELETE', hint: 'Keyword that removes rows from a table' },
    ],
  },

  'sql-create-table': {
    steps: [
      {
        type: 'explain',
        text: "CREATE TABLE defines a new table. The users, products, and orders sheets are provided already; create a separate reading_lists table for this task.",
        code: "CREATE TABLE reading_lists (\n  id INT,\n  title VARCHAR(100)\n);",
      },
      { type: 'fillblank', template: '___ TABLE reading_lists (\n  id INT,\n  title VARCHAR(100)\n);', answer: 'CREATE', hint: 'Keyword that creates a new table' },
    ],
  },

  'sql-primary-key': {
    steps: [
      {
        type: 'explain',
        text: "PRIMARY KEY uniquely identifies each row — values must be unique and NOT NULL. Usually it is an auto-incrementing integer. Foreign keys in other tables reference primary keys to link related data.",
        code: "CREATE TABLE teams (\n  id INT PRIMARY KEY,\n  name VARCHAR(100) NOT NULL\n);",
      },
      { type: 'mcq', question: 'What does a PRIMARY KEY constraint enforce?', options: ['Encrypts the column', 'Each row has a unique identifier', 'The column cannot be NULL', 'Values auto-increment'], correct: 1 },
    ],
  },

  'sql-count': {
    steps: [
      {
        type: 'explain',
        text: "COUNT(*) counts all rows in the result. COUNT(column) counts non-NULL values in that column. Aggregate functions collapse many rows into one value. Use with GROUP BY to get counts per group.",
        code: "SELECT COUNT(*) AS total FROM users;\nSELECT COUNT(email) AS with_email FROM users;",
      },
      { type: 'fillblank', template: 'SELECT ___(id) AS total\nFROM orders;', answer: 'COUNT', hint: 'Aggregate function that counts rows' },
    ],
  },

  'sql-group-by': {
    steps: [
      {
        type: 'explain',
        text: "GROUP BY collapses rows sharing a value into one group, then aggregates them. In the orders sheet, user_id links each order to users.id. Grouping by it shows each user's order count.",
        code: "SELECT user_id, COUNT(*) AS order_count\nFROM orders\nGROUP BY user_id;",
      },
      { type: 'fillblank', template: 'SELECT user_id, COUNT(*)\nFROM orders\nGROUP ___ user_id;', answer: 'BY', hint: 'GROUP ___ is always two words' },
    ],
  },

  'sql-having': {
    steps: [
      {
        type: 'explain',
        text: "HAVING filters groups after GROUP BY — like WHERE but for aggregated results. The orders sheet has four orders for user_id 1, so a count greater than 3 keeps that group.",
        code: "SELECT user_id, COUNT(*) AS order_count\nFROM orders\nGROUP BY user_id\nHAVING COUNT(*) > 3;",
      },
      { type: 'fillblank', template: 'GROUP BY user_id\n___ COUNT(*) > 3;', answer: 'HAVING', hint: 'Filters groups — like WHERE but after GROUP BY' },
    ],
  },

  'sql-inner-join': {
    steps: [
      {
        type: 'explain',
        text: "INNER JOIN combines rows from two tables where a condition matches. Only rows with matches in BOTH tables appear — if a user has no orders, they will not appear in an INNER JOIN with the orders table.",
        code: "SELECT users.name, orders.total\nFROM users\nINNER JOIN orders\n  ON users.id = orders.user_id;",
      },
      { type: 'fillblank', template: 'SELECT *\nFROM users\n___ JOIN orders\n  ON users.id = orders.user_id;', answer: 'INNER', hint: 'Returns only rows with matches in both tables' },
    ],
  },

  'ts-type-annotations': {
    steps: [
      {
        type: 'explain',
        text: 'TypeScript adds type annotations to JavaScript. Write a colon and a type after a variable name: string for text, number for numeric values, and boolean for true or false.',
        code: 'const course: string = "TypeScript";\nlet lessonsDone: number = 2;',
      },
      { type: 'fillblank', template: 'const memberName ___ string = "Ada";', answer: ':', hint: 'Place the type annotation after the variable name' },
      { type: 'mcq', question: 'Which type describes a whole or decimal numeric value?', options: ['string', 'number', 'boolean', 'text'], correct: 1 },
    ],
  },

  'ts-function-types': {
    steps: [
      {
        type: 'explain',
        text: 'Typed functions describe both their inputs and their output. Add a type after each parameter name, then put the return type after the closing parenthesis.',
        code: 'function addScores(first: number, second: number): number {\n  return first + second;\n}',
      },
      { type: 'fillblank', template: 'function addScores(first: number, second: ___): number {', answer: 'number', hint: 'Both inputs are numeric values' },
      { type: 'mcq', question: 'Where does a function return type go?', options: ['Before the function name', 'After the parameter list', 'After the opening brace', 'After the return statement'], correct: 1 },
    ],
  },
};

