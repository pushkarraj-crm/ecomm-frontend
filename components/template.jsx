import { createElement } from 'react';
import Link from 'next/link';
import { Carousel, TemplateForm } from './template-interactions';
import { HomeProductSlot } from './home-products';
export function TemplateNode({ node }) {
  if (typeof node === 'string') return node;
  if (!node) return null;
  if (node.component === 'HomeProduct') return <HomeProductSlot index={node.index} />;
  const children = (node.children || []).map((child, index) => (
    <TemplateNode key={index} node={child} />
  ));
  if (node.component === 'Carousel')
    return <Carousel {...node.props}>{children}</Carousel>;
  if (node.component === 'Form')
    return <TemplateForm {...node.props}>{children}</TemplateForm>;
  const props = { ...node.props };
  if (node.tag === 'a' && props.href?.startsWith('/') && !props.href.startsWith('//'))
    return (
      <Link {...props} prefetch={false}>
        {children}
      </Link>
    );
  if (
    [
      'img',
      'input',
      'br',
      'hr',
      'source',
      'wbr',
      'area',
      'col',
      'embed',
      'link',
      'meta',
      'param',
      'track',
    ].includes(node.tag)
  )
    return createElement(node.tag, props);
  if (node.tag === 'textarea')
    return createElement('textarea', {
      ...props,
      defaultValue: (node.children || []).filter((x) => typeof x === 'string').join(''),
    });
  return createElement(node.tag, props, ...children);
}
export default function Template({ nodes }) {
  return nodes.map((node, index) => <TemplateNode key={index} node={node} />);
}
