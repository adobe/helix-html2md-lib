/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-env mocha */
import assert from 'assert';
import { SizeTooLargeException } from '@adobe/helix-mediahandler';
import { processImages, TooManyImagesError } from '../src/mdast-process-images.js';
import { ImageUploadError } from '../src/image-upload-error.js';
import { imageFilterFromPrefixes } from '../src/html2md.js';

class ValidationError extends Error {
  fatal = true;
}

describe('mdast-process-images Tests', () => {
  let processedUrls;

  const mockLog = {
    debug: () => {},
    warn: () => {},
  };

  const mockMediaHandler = {
    getBlob: async (url) => {
      processedUrls.push(url);
      if (url === 'https://error.com') {
        throw new Error('Failed to get image');
      }
      if (url === 'https://fail.com') {
        return null;
      }
      if (url.startsWith('https://large.com/')) {
        throw new SizeTooLargeException('Image is too large', 200, 100);
      }
      if (url.startsWith('https://invalid.com/')) {
        throw new ValidationError('Image is not valid');
      }
      return { uri: url };
    },
  };

  const baseUrl = 'https://example.com';

  beforeEach(() => {
    processedUrls = [];
  });

  it('handles external asset URLs', async () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://example.com/adobe/assets/urn:aaid:aem:12345-abcde',
              alt: 'External Asset',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://regular-image.com/image.jpg',
              alt: 'Regular Image',
            },
            {
              type: 'image',
              url: 'https://regular-image.com/image.jpg',
              alt: '2nd Regular Image',
            },
            {
              type: 'image',
              url: '/image.jpg',
              alt: 'relative image',
            },
          ],
        },
      ],
    };

    await processImages(mockLog, tree, mockMediaHandler, baseUrl, imageFilterFromPrefixes('https://example.com/adobe/assets/urn:aaid:aem:'));

    // Verify external asset node is not processed and URL is preserved
    const externalAssetNode = tree.children[0].children[0];
    assert.strictEqual(externalAssetNode.url, 'https://example.com/adobe/assets/urn:aaid:aem:12345-abcde', 'External asset URL should remain unchanged');

    // Verify only the regular image was processed by mediaHandler
    assert.deepStrictEqual(processedUrls, [
      'https://regular-image.com/image.jpg',
      'https://example.com/image.jpg',
    ]);
  });

  it('handles image load failures gracefully', async () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://error.com',
              alt: 'Bad Image',
            },
            {
              type: 'image',
              url: 'https://fail.com',
              alt: 'fail image',
            },
          ],
        },
      ],
    };

    await processImages(mockLog, tree, mockMediaHandler, baseUrl);

    // Verify the URL is set to about:error
    assert.strictEqual(tree.children[0].children[0].url, 'about:error');
    assert.strictEqual(tree.children[0].children[1].url, 'about:error');
  });

  it('handles 1 large image', async () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://large.com/1',
              alt: 'large image',
            },
          ],
        },
      ],
    };

    const error = new ImageUploadError('One or more images failed uploading.', [{
      idx: 1,
      error: new SizeTooLargeException('Image is too large', 200, 100),
      url: 'https://large.com/1',
    }]);
    await assert.rejects(processImages(mockLog, tree, mockMediaHandler, baseUrl), error);
  });

  it('handles large and invalid images', async () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://large.com/1',
              alt: 'large image',
            },
            {
              type: 'image',
              url: 'https://invalid.com/2',
              alt: 'an invalid image',
            },
          ],
        },
      ],
    };
    const error = new ImageUploadError('One or more images failed uploading.', [{
      idx: 1,
      error: new SizeTooLargeException('Image is too large', 200, 100),
      url: 'https://large.com/1',
    }, {
      idx: 2,
      error: new ValidationError('Image is not valid'),
      url: 'https://invalid.com/2',
    }]);
    // eslint-disable-next-line max-len
    await assert.rejects(processImages(mockLog, tree, mockMediaHandler, baseUrl), error);
  });

  it('skips processing external asset images without counting them toward limit', async () => {
    // Create 150 external assets and 50 regular images (should be under limit)
    const children = [];
    for (let i = 0; i < 150; i += 1) {
      children.push({
        type: 'paragraph',
        children: [
          {
            type: 'image',
            url: `https://example.com/adobe/assets/urn:aaid:aem:${i}`,
            alt: `External Asset ${i}`,
          },
        ],
      });
    }

    for (let i = 0; i < 50; i += 1) {
      children.push({
        type: 'paragraph',
        children: [
          {
            type: 'image',
            url: `https://example.com/regular-${i}.jpg`,
            alt: `Regular Image ${i}`,
          },
        ],
      });
    }

    const tree = {
      type: 'root',
      children,
    };

    const aemFilter = imageFilterFromPrefixes('https://example.com/adobe/assets/urn:aaid:aem:');
    await processImages(mockLog, tree, mockMediaHandler, baseUrl, aemFilter);

    // Verify only regular images were processed
    assert.strictEqual(processedUrls.length, 50, 'Only regular images should be processed');

    // All processed URLs should be the regular images
    for (let i = 0; i < 50; i += 1) {
      assert.ok(processedUrls.includes(`https://example.com/regular-${i}.jpg`), `Regular image ${i} should be processed`);
    }

    // Create 200 regular images (should hit the limit)
    const regularImages = [];
    for (let i = 0; i < 200; i += 1) {
      regularImages.push({
        type: 'paragraph',
        children: [
          {
            type: 'image',
            url: `https://example.com/regular-limit-${i}.jpg`,
            alt: `Regular Image Limit ${i}`,
          },
        ],
      });
    }

    const treeLimitRegular = {
      type: 'root',
      children: regularImages,
    };

    // This should not throw with exactly 200 regular images
    await processImages(mockLog, treeLimitRegular, mockMediaHandler, baseUrl, aemFilter);

    // But if we add external images + 200 regular images, it should also not throw
    const mixedTreeWithinLimit = {
      type: 'root',
      children: [...children, ...regularImages.slice(0, 150)],
    };

    // This should not throw because external images don't count toward the limit
    await processImages(mockLog, mixedTreeWithinLimit, mockMediaHandler, baseUrl, aemFilter);

    // And if we add one more regular image beyond 200, it should throw
    const treeOverLimit = {
      type: 'root',
      children: [
        ...regularImages,
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://example.com/one-too-many.jpg',
              alt: 'One Too Many',
            },
          ],
        },
      ],
    };

    // This should throw an error because we now have 201 regular images
    await assert.rejects(
      async () => processImages(mockLog, treeOverLimit, mockMediaHandler, baseUrl, aemFilter),
      (err) => {
        assert.ok(err instanceof TooManyImagesError);
        assert.ok(err.message.includes('maximum number of images reached'));
        return true;
      },
    );
  });

  it('handles multiple external image patterns', async () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://example.com/adobe/assets/urn:aaid:aem:12345',
              alt: 'External Asset 1',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://example.com/adobe/dam/123456',
              alt: 'External Asset 2',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://regular-image.com/image.jpg',
              alt: 'Regular Image',
            },
          ],
        },
      ],
    };

    await processImages(mockLog, tree, mockMediaHandler, baseUrl, imageFilterFromPrefixes(['https://example.com/adobe/assets/urn:aaid:aem:', 'https://example.com/adobe/dam/']));

    // Verify all external images URLs remain unchanged
    const aemNode = tree.children[0].children[0];
    const damNode = tree.children[1].children[0];

    // Check URLs remain unchanged for external images
    assert.strictEqual(aemNode.url, 'https://example.com/adobe/assets/urn:aaid:aem:12345');
    assert.strictEqual(damNode.url, 'https://example.com/adobe/dam/123456');

    // Verify only the regular image was processed
    assert.strictEqual(processedUrls.length, 1, 'Only regular image should be processed');
    assert.strictEqual(processedUrls[0], 'https://regular-image.com/image.jpg');
  });

  it('processes all images when imageFilter returns true for all', async () => {
    // Create a tree with different types of images
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://example.com/adobe/assets/urn:aaid:aem:12345',
              alt: 'AEM Asset',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://dam.example.com/content/asset.jpg',
              alt: 'DAM Asset',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://cdn.example.net/external/image.png',
              alt: 'CDN Asset',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://example.com/regular-image.jpg',
              alt: 'Regular Image',
            },
          ],
        },
      ],
    };

    // Call processImages with no filter (process all)
    await processImages(mockLog, tree, mockMediaHandler, baseUrl, () => true);

    // Verify no images are marked as external
    for (let i = 0; i < tree.children.length; i += 1) {
      const node = tree.children[i].children[0];
      assert.ok(!node.data || !node.data.externalImage, `Image ${i} should not be marked as external`);
    }

    // Verify all images are processed
    assert.strictEqual(processedUrls.length, 4, 'All 4 images should be processed');
    assert.deepStrictEqual(
      processedUrls,
      [
        'https://example.com/adobe/assets/urn:aaid:aem:12345',
        'https://dam.example.com/content/asset.jpg',
        'https://cdn.example.net/external/image.png',
        'https://example.com/regular-image.jpg',
      ],
      'All image URLs should be processed',
    );
  });

  it('handles scene7 external asset URL patterns', async () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://example.com/is/image/mycompany/product123',
              alt: 'Image Server Asset',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://example.com/is/content/mycompany/product456.jpg',
              alt: 'Content Server Asset',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://regular-image.com/image.jpg',
              alt: 'Regular Image',
            },
          ],
        },
      ],
    };

    await processImages(mockLog, tree, mockMediaHandler, baseUrl, imageFilterFromPrefixes(['https://example.com/is/image/', 'https://example.com/is/content/']));

    // Verify external asset nodes are not processed and URLs are preserved
    const imageNode = tree.children[0].children[0];
    const contentNode = tree.children[1].children[0];

    assert.strictEqual(imageNode.url, 'https://example.com/is/image/mycompany/product123', 'Image URL should remain unchanged');
    assert.strictEqual(contentNode.url, 'https://example.com/is/content/mycompany/product456.jpg', 'Content URL should remain unchanged');

    // Verify only the regular image was processed by mediaHandler
    assert.strictEqual(processedUrls.length, 1, 'Only regular image should be processed');
    assert.strictEqual(processedUrls[0], 'https://regular-image.com/image.jpg', 'Regular image should be processed');
  });

  it('imageFilter function filters images by custom predicate', async () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://example.com/adobe/assets/urn:aaid:aem:12345',
              alt: 'External Asset',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://regular-image.com/image.jpg',
              alt: 'Regular Image',
            },
          ],
        },
      ],
    };

    await processImages(
      mockLog,
      tree,
      mockMediaHandler,
      baseUrl,
      (url) => !url.includes('/adobe/assets/'),
    );

    // Verify the filtered image is not processed and URL is preserved
    const filteredNode = tree.children[0].children[0];
    assert.strictEqual(filteredNode.url, 'https://example.com/adobe/assets/urn:aaid:aem:12345', 'Filtered image URL should remain unchanged');

    // Verify only the regular image was processed
    assert.strictEqual(processedUrls.length, 1, 'Only regular image should be processed');
    assert.strictEqual(processedUrls[0], 'https://regular-image.com/image.jpg');
  });

  it('processes all images when no imageFilter is provided', async () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://example.com/image1.jpg',
              alt: 'Image 1',
            },
          ],
        },
        {
          type: 'paragraph',
          children: [
            {
              type: 'image',
              url: 'https://example.com/image2.jpg',
              alt: 'Image 2',
            },
          ],
        },
      ],
    };

    await processImages(mockLog, tree, mockMediaHandler, baseUrl);

    assert.strictEqual(processedUrls.length, 2, 'All images should be processed when no filter is provided');
    assert.ok(processedUrls.includes('https://example.com/image1.jpg'));
    assert.ok(processedUrls.includes('https://example.com/image2.jpg'));
  });
});
