import {
  ComposableNode,
  LayoutConstraintHorizontal,
  LayoutConstraintVertical,
} from '../types/fig';
import { GenContext } from '../types/gen';
import { StrategyInterface } from '../types/strategy';
import {
  ParentVisitContext,
  VisitContext,
  VisitContextWithCursor,
} from '../types/visit';
import { applyStyles } from './styles';
import { makeVisitContext } from './visit-context';

/**
 * TODO: Split into different responsibilities
 */
export function expandChildren(context: VisitContext, offset: number) {
  const {
    node,
    // minChildren,
    // maxChildren,
    // centerChildren,
    parentNode,
  } = context;
  const children = node.children;
  // let order = offset;

  if (!children) return;

  for (const child of children) {
    // TODO: Do we want this?
    if (
      parentNode &&
      (node.type === 'COMPONENT' ||
        node.type === 'COMPONENT_SET' ||
        node.type === 'INSTANCE')
    ) {
      child.constraints = {
        vertical: LayoutConstraintVertical.TOP_BOTTOM,
        horizontal: LayoutConstraintHorizontal.LEFT_RIGHT,
      };
    }

    // child.order = i + order;

    // if (child.constraints?.vertical === 'TOP') {
    //   minChildren.push(child);
    // } else if (child.constraints?.vertical === 'BOTTOM') {
    //   maxChildren.push(child);
    // } else {
    // centerChildren.push(child);
    // }
  }

  // minChildren.sort(sortByYAxis);
  // maxChildren.sort(sortByYAxis);

  // return order + children.length - offset;
}

// // TODO: Not tested I guess
// function appendMaxerElement(
//   cursor: NodePath<JSXElement>
//   // context: VisitContext
// ) {
//   // const { outerStyle, styles } = context;
//   const wrapper = parseExpression<JSXElement>(`
//   <div className="maxer" ${TEMP_REF_ATTR}></div>
// `);
//   appendJsxNode(cursor, wrapper);
//   // Find the inner div element
//   return findTempRefJsxElement(cursor);
// }

// function applySizes(bounds: Bound | null, styles: React.CSSProperties) {
//   if (bounds) {
//     styles.minWidth = bounds.width;
//     styles.minHeight = bounds.height;
//   }
// }

function checkShouldImportComponent(
  context: VisitContext,
  parentContext: ParentVisitContext,
  genContext: GenContext
) {
  const { node: parentNode } = parentContext;
  const { node } = context;
  if (!parentNode) return false;

  if (
    (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') &&
    genContext.componentsMap.has(node.id)
  )
    return true;

  if (
    node.type === 'INSTANCE' &&
    genContext.componentsMap.has(node.componentId)
  )
    return true;

  return false;
}

export function visitNode(
  node: ComposableNode,
  parentContext: ParentVisitContext,
  strategy: StrategyInterface,
  genContext: GenContext
): VisitContextWithCursor | null {
  const { vectorsMap } = genContext;

  const context = makeVisitContext(node, parentContext, genContext);

  // TODO: Rethink whether we want this.
  expandChildren(context, 0);

  // if (node?.order != null) {
  //   styles.zIndex = node.order;
  // }

  applyStyles(context, genContext);

  const shouldImportComponent = checkShouldImportComponent(
    context,
    parentContext,
    genContext
  );
  if (shouldImportComponent) {
    strategy.appendComponentInstanceElement(
      context,
      parentContext as VisitContextWithCursor,
      genContext
    );
    return null;
  }

  if (vectorsMap.has(node.id)) {
    strategy.appendSvgElement(context, parentContext, vectorsMap.get(node.id)!);
    return null;
  }

  if (node?.type === 'TEXT') {
    strategy.appendTextElement(context, parentContext);
    return null;
  }

  const cursor = strategy.appendElement(context, parentContext);

  return { ...context, cursor };
  // for (const child of centerChildren) {
  //   visitNode(child, contextWithCursor, genContext);
  // }

  // if (maxChildren.length > 0) {
  //   // outerClass.push('maxer');
  //   // styles.width = '100%';
  //   // styles.pointerEvents = 'none';
  //   // delete styles.backgroundColor;
  //   parentCursor = appendMaxerElement(parentCursor);
  //   // first = true;
  //   for (const child of maxChildren) {
  //     visitNode(parentCursor, child, context, genContext);
  //     // first = false;
  //   }
  // }
}
