import test from 'node:test';
import assert from 'node:assert/strict';
import {
  categoryPath,
  orderedCategories,
  matchesCategory,
} from '../lib/categories.mjs';
const roots = [
  { id: 8, name: 'Custom category', children: [] },
  { id: 2, name: 'Sports', children: [] },
  {
    id: 1,
    name: 'Women Wear',
    children: [
      {
        id: 3,
        name: 'Ethnic Wear',
        children: [{ id: 4, name: 'Kurta Set', children: [] }],
      },
    ],
  },
];
test('category browsing resolves complete breadcrumb paths and unknown IDs safely', () => {
  assert.deepEqual(
    categoryPath(roots, '4').map((c) => c.id),
    [1, 3, 4],
  );
  assert.deepEqual(categoryPath(roots, '404'), []);
});
test('category search includes parents when a nested product category matches', () => {
  assert.equal(matchesCategory(roots[2], ' KURTA '), true);
  assert.equal(matchesCategory(roots[2], 'sports'), false);
  assert.equal(matchesCategory(roots[2], ''), true);
});
test('category ordering retains existing custom categories without mutating API data', () => {
  assert.deepEqual(
    orderedCategories(roots).map((c) => c.id),
    [1, 2, 8],
  );
  assert.deepEqual(
    roots.map((c) => c.id),
    [8, 2, 1],
  );
});

test('main search finds nested categories and distinguishes duplicate names by parent', async () => {
  const { categorySuggestions } = await import('../lib/categories.mjs');
  const categories = [
    { id: 1, name: 'Women Wear', children: [{ id: 2, name: 'Shirts', children: [] }] },
    { id: 3, name: 'Mens Wear', children: [{ id: 4, name: 'Shirts', children: [] }] },
  ];
  const found = categorySuggestions(categories, 'shirts');
  assert.equal(found.length, 2);
  assert.deepEqual(
    new Set(found.map((c) => c.breadcrumb)),
    new Set(['Women Wear', 'Mens Wear']),
  );
  assert.deepEqual(categorySuggestions(categories, 'x'), []);
  assert.equal(categorySuggestions(categories, 'wear', 1).length, 1);
});

test('category checkbox branches narrow parent selections and preserve sibling branches', async () => {
  const { toggleCategoryBranch, selectedCategoryIds } =
    await import('../lib/categories.mjs');
  const tree = [
    {
      id: 1,
      name: 'Root',
      children: [
        {
          id: 2,
          name: 'First',
          children: [
            { id: 3, name: 'Leaf', children: [] },
            { id: 4, name: 'Sibling', children: [] },
          ],
        },
        { id: 5, name: 'Other', children: [] },
      ],
    },
  ];
  assert.deepEqual(toggleCategoryBranch(tree, ['1'], 3), ['5', '4']);
  assert.deepEqual(toggleCategoryBranch(tree, ['3', '5'], 2), ['5', '2']);
  assert.deepEqual(toggleCategoryBranch(tree, ['3'], 3), []);
  assert.deepEqual(selectedCategoryIds(new URLSearchParams('category=3')), ['3']);
  assert.deepEqual(selectedCategoryIds(new URLSearchParams('category_ids=3,5,3')), [
    '3',
    '5',
  ]);
});
