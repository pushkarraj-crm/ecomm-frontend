'use client';
import { useRef, useEffect, useState } from 'react';
import {
  categoryBranchIds,
  orderedCategories,
  toggleCategoryBranch,
} from '@/lib/categories.mjs';
function CategoryNode({ category, selected, inherited, onToggle }) {
  const children = category.children || [],
    explicit = selected.has(String(category.id)),
    covered = inherited || explicit;
  const descendantSelected = categoryBranchIds(category).some((id) => selected.has(id));
  const [expanded, setExpanded] = useState(descendantSelected),
    checkbox = useRef(null);
  const mixed = !covered && descendantSelected;
  useEffect(() => {
    if (checkbox.current) checkbox.current.indeterminate = mixed;
  }, [mixed]);
  const id = 'catalog-category-' + category.id;
  return (
    <li>
      <div className="market-category-filter-row">
        <input
          ref={checkbox}
          id={id}
          type="checkbox"
          checked={covered}
          aria-checked={mixed ? 'mixed' : covered}
          onChange={() => onToggle(category.id)}
        />
        <label htmlFor={id}>{category.name}</label>
        {children.length > 0 && (
          <button
            type="button"
            aria-label={(expanded ? 'Collapse ' : 'Expand ') + category.name}
            aria-expanded={expanded}
            aria-controls={id + '-children'}
            onClick={() => setExpanded((value) => !value)}
          >
            <span aria-hidden="true">{expanded ? '−' : '+'}</span>
          </button>
        )}
      </div>
      {children.length > 0 && expanded && (
        <ul id={id + '-children'}>
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              selected={selected}
              inherited={covered}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
export default function CategoryFilter({
  categories,
  selected,
  onChange,
  loading,
  error,
  retry,
}) {
  const chosen = new Set(selected);
  return (
    <details className="market-category-filter" open>
      <summary>
        Categories<span aria-hidden="true">⌃</span>
      </summary>
      {loading ? (
        <p role="status">Loading categories…</p>
      ) : error ? (
        <div role="alert">
          <p>Categories could not be loaded.</p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <div className="market-category-filter-tools">
            <span>
              {selected.length ? selected.length + ' selected' : 'All categories'}
            </span>
            {selected.length > 0 && (
              <button type="button" onClick={() => onChange([])}>
                Clear
              </button>
            )}
          </div>
          <div className="market-category-filter-scroll">
            <ul>
              {orderedCategories(categories).map((category) => (
                <CategoryNode
                  key={category.id}
                  category={category}
                  selected={chosen}
                  inherited={false}
                  onToggle={(id) =>
                    onChange(toggleCategoryBranch(categories, selected, id))
                  }
                />
              ))}
            </ul>
            {!categories.length && <p>No categories available.</p>}
          </div>
        </>
      )}
    </details>
  );
}
