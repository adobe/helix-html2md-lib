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
import { CONTINUE, visit } from 'unist-util-visit';

export const UNSAFE_URL_REPLACEMENT = 'about:error';

// well-known schemes that only navigate or open a communication / store / map app.
// schemes that can execute code or run installers (javascript:, data:, blob:, file:,
// intent:, itms-services:, ms-msdt:, search-ms:, ms-word: ...) are deliberately excluded.
export const LINK_SCHEMES = new Set([
  'http', 'https', 'ftp', 'sftp',
  'mailto', 'tel', 'sms', 'callto', 'facetime', 'facetime-audio', 'sip', 'sips', 'xmpp',
  'skype', 'whatsapp', 'tg', 'viber', 'msteams', 'zoommtg', 'zoomus', 'slack',
  'webcal', 'geo', 'maps', 'market', 'itms-apps', 'spotify',
]);

// image sources cannot execute script, so inline (data:) and about: images are allowed
export const IMAGE_SCHEMES = new Set(['http', 'https', 'data', 'about']);

// metadata keys whose values are urls and are checked against LINK_SCHEMES
export const URL_META = new Set([
  'canonical', 'og:url', 'twitter:url',
  'og:video', 'og:video:url', 'og:video:secure_url',
  'og:audio', 'og:audio:url', 'og:audio:secure_url',
  'twitter:player', 'og:see_also',
]);

const NODE_SCHEMES = {
  link: LINK_SCHEMES,
  definition: LINK_SCHEMES,
  image: IMAGE_SCHEMES,
};

// base for resolving relative urls. it uses a special scheme so that scheme-relative urls
// (//host) resolve as well. relative urls therefore resolve to https and are considered safe.
const RELATIVE_BASE = 'https://base.invalid/';

/**
 * Checks if the given url is safe, using the WHATWG URL parser (the same algorithm browsers use).
 * Only relative urls and urls with one of the allowed schemes are considered safe.
 * Urls that cannot be parsed are considered unsafe.
 * @param {string} url
 * @param {Set<string>} [schemes] allowed schemes, defaults to LINK_SCHEMES
 * @returns {boolean}
 */
export function isSafeUrl(url, schemes = LINK_SCHEMES) {
  try {
    const { protocol } = new URL(String(url ?? ''), RELATIVE_BASE);
    return schemes.has(protocol.slice(0, -1));
  } catch {
    return false;
  }
}

/**
 * Replaces the url of all link, image and definition nodes that have an unsafe url.
 * @param {Console} log
 * @param {object} tree mdast
 */
export function sanitizeUrls(log, tree) {
  visit(tree, (node) => {
    const schemes = NODE_SCHEMES[node.type];
    if (schemes && node.url && !isSafeUrl(node.url, schemes)) {
      log.warn(`Replacing unsafe ${node.type} url: ${String(node.url).substring(0, 64)}`);
      // eslint-disable-next-line no-param-reassign
      node.url = UNSAFE_URL_REPLACEMENT;
    }
    return CONTINUE;
  });
}
