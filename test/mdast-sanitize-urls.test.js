/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import assert from 'assert';
import { IMAGE_SCHEMES, isSafeUrl } from '../src/mdast-sanitize-urls.js';

describe('isSafeUrl Tests', () => {
  [
    'https://www.example.com/',
    'HTTP://www.example.com/',
    ' https://www.example.com/ ',
    'mailto:info@example.com',
    'tel:+15551234',
    'sms:+15551234?body=hello',
    'callto:+15551234',
    'facetime:user@example.com',
    'facetime-audio:+15551234',
    'sip:user@example.com',
    'sips:user@example.com',
    'xmpp:user@example.com',
    'skype:user?call',
    'whatsapp://send?phone=15551234',
    'tg://resolve?domain=example',
    'viber://chat?number=15551234',
    'msteams://teams.microsoft.com/l/chat/0/0?users=user@example.com',
    'zoommtg://zoom.us/join?confno=123',
    'zoomus://zoom.us/join?confno=123',
    'slack://open?team=T123',
    'webcal://www.example.com/calendar.ics',
    'geo:37.786971,-122.399677',
    'maps:?q=San+Francisco',
    'ftp://ftp.example.com/file.txt',
    'sftp://sftp.example.com/file.txt',
    'market://details?id=com.example.app',
    'itms-apps://apps.apple.com/app/id123',
    'spotify:track:123',
    '/absolute/path',
    'relative/path',
    './media_123.png',
    'foo/bar:baz',
    '#fragment',
    '?query=1',
    '//cdn.example.com/x.png',
    '',
    undefined,
  ].forEach((url) => {
    it(`accepts ${JSON.stringify(url)}`, () => {
      assert.strictEqual(isSafeUrl(url), true);
    });
  });

  [
    // eslint-disable-next-line no-script-url
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    '\u0001javascript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
    'data:image/png;base64,AAAA',
    'file:///etc/passwd',
    'about:blank',
    'blob:https://www.example.com/1234',
    'intent://scan/#Intent;scheme=zxing;package=com.example;end',
    'itms-services://?action=download-manifest&url=https://evil.example.com/app.plist',
    'ms-msdt:/id PCWDiagnostic /skip force',
    'search-ms:query=x&crumb=location:\\\\evil.example.com\\share',
    'ms-word:ofe|u|https://evil.example.com/doc.docx',
    'ms-officecmd:{}',
    'http://a b/',
    'https://[bad',
    'https://www.example.com:99999/',
    'http://',
  ].forEach((url) => {
    it(`rejects ${JSON.stringify(url)}`, () => {
      assert.strictEqual(isSafeUrl(url), false);
    });
  });

  [
    'data:image/png;base64,AAAA',
    'data:image/svg+xml,<svg onload=alert(1)>',
    'about:blank',
    'about:error',
    'https://www.example.com/image.png',
    './media_123.png',
  ].forEach((url) => {
    it(`accepts image ${JSON.stringify(url)}`, () => {
      assert.strictEqual(isSafeUrl(url, IMAGE_SCHEMES), true);
    });
  });

  [
    // eslint-disable-next-line no-script-url
    'javascript:alert(1)',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'mailto:info@example.com',
    'https://[bad/image.png',
  ].forEach((url) => {
    it(`rejects image ${JSON.stringify(url)}`, () => {
      assert.strictEqual(isSafeUrl(url, IMAGE_SCHEMES), false);
    });
  });
});
