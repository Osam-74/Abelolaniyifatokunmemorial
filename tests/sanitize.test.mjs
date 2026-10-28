// Run with: npx tsx tests/sanitize.test.mjs
import { sanitizeHtml, htmlToText, readingMinutes } from '../src/lib/sanitizeHtml.ts';
import assert from 'node:assert/strict';

const cases = [
  ['<p>Hello <strong>world</strong></p>', '<p>Hello <strong>world</strong></p>'],
  ['<p onclick="x()">a</p>', '<p>a</p>'],
  ['<script>alert(1)</script><p>ok</p>', '<p>ok</p>'],
  ['<img src=x onerror=alert(1)>text', 'text'],
  ['<a href="javascript:alert(1)">click</a>', 'click'],
  ['<p style="color:red">x</p>', '<p>x</p>'],
  ['<p>unclosed <em>text', '<p>unclosed <em>text</em></p>'],
  ['</p>stray', 'stray'],
  ['a < b > c', 'a &lt; b &gt; c'],
  ['<svg onload=alert(1)><circle/></svg>after', 'after'],
  ['<iframe src="//evil"></iframe>ok', 'ok'],
  ['<p>Tom &amp; Jerry</p>', '<p>Tom &amp; Jerry</p>'],
  ['<h2>Title</h2><br><ul><li>x</li></ul>', '<h2>Title</h2><br><ul><li>x</li></ul>'],
  ['<p>dangling <b', '<p>dangling </p>'],
];
for (const [i, o] of cases) assert.equal(sanitizeHtml(i), o, `input: ${i}`);
assert.equal(htmlToText('<p>One</p><p>Two</p>'), 'One\nTwo');
assert.equal(readingMinutes('<p>' + 'word '.repeat(450) + '</p>'), 2);
assert.equal(readingMinutes(''), 1);
console.log(`sanitize: ${cases.length + 3} checks passed`);
