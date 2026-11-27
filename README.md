# Helix Html2MD

> Library to convert Helix Generic HTML Content to Markdown.

## Status
[![codecov](https://img.shields.io/codecov/c/github/adobe/helix-html2md-lib.svg)](https://codecov.io/gh/adobe/helix-html2md-lib)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/adobe/helix-html2md-lib/main.yaml)
[![GitHub license](https://img.shields.io/github/license/adobe/helix-html2md-lib.svg)](https://github.com/adobe/helix-html2md-lib/blob/main/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/helix-html2md-lib.svg)](https://github.com/adobe/helix-html2md-lib/issues)
[![LGTM Code Quality Grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/adobe/helix-html2md-lib.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/adobe/helix-html2md-lib)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Security

URLs are sanitized during conversion. They are checked with the standard WHATWG `URL` parser, the same one browsers use. Unsafe URLs, and URLs the parser rejects as invalid, are replaced with `about:error`, the same marker used for images that fail to upload.

- Links and `hreflang` URLs: only relative URLs (paths, `?query`, `#fragment`) and these well-known schemes are kept:
  - web and file transfer: `http`, `https`, `ftp`, `sftp`
  - communication: `mailto`, `tel`, `sms`, `callto`, `facetime`, `facetime-audio`, `sip`, `sips`, `xmpp`, `skype`, `whatsapp`, `tg`, `viber`, `msteams`, `zoommtg`, `zoomus`, `slack`
  - other: `webcal`, `geo`, `maps`, `market`, `itms-apps`, `spotify`
- URL-valued metadata (`canonical`, `og:url`, `twitter:url`, `og:video`, `og:video:url`, `og:video:secure_url`, `og:audio`, `og:audio:url`, `og:audio:secure_url`, `twitter:player`, `og:see_also`) is checked like links.
- Images: only relative URLs and the `http`, `https`, `data` and `about` schemes are kept.

Everything else is replaced, e.g. `javascript:`, `vbscript:`, `file:`, `blob:`, and app-launching schemes such as `intent:`, `itms-services:`, `ms-msdt:`, `search-ms:` and `ms-word:`.
