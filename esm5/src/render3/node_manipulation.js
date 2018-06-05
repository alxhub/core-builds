/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { callHooks } from './hooks';
import { unusedValueExportToPlacateAjd as unused1 } from './interfaces/container';
import { unusedValueExportToPlacateAjd as unused2 } from './interfaces/node';
import { unusedValueExportToPlacateAjd as unused3 } from './interfaces/projection';
import { isProceduralRenderer, unusedValueExportToPlacateAjd as unused4 } from './interfaces/renderer';
import { unusedValueExportToPlacateAjd as unused5 } from './interfaces/view';
import { assertNodeType } from './node_assert';
import { stringify } from './util';
var unusedValueToPlacateAjd = unused1 + unused2 + unused3 + unused4 + unused5;
/**
 * Returns the first RNode following the given LNode in the same parent DOM element.
 *
 * This is needed in order to insert the given node with insertBefore.
 *
 * @param node The node whose following DOM node must be found.
 * @param stopNode A parent node at which the lookup in the tree should be stopped, or null if the
 * lookup should not be stopped until the result is found.
 * @returns RNode before which the provided node should be inserted or null if the lookup was
 * stopped
 * or if there is no native node after the given logical node in the same native parent.
 */
function findNextRNodeSibling(node, stopNode) {
    var currentNode = node;
    while (currentNode && currentNode !== stopNode) {
        var pNextOrParent = currentNode.pNextOrParent;
        if (pNextOrParent) {
            while (pNextOrParent.tNode.type !== 1 /* Projection */) {
                var nativeNode = findFirstRNode(pNextOrParent);
                if (nativeNode) {
                    return nativeNode;
                }
                pNextOrParent = (pNextOrParent.pNextOrParent);
            }
            currentNode = pNextOrParent;
        }
        else {
            var currentSibling = getNextLNode(currentNode);
            while (currentSibling) {
                var nativeNode = findFirstRNode(currentSibling);
                if (nativeNode) {
                    return nativeNode;
                }
                currentSibling = getNextLNode(currentSibling);
            }
            var parentNode = getParentLNode(currentNode);
            currentNode = null;
            if (parentNode) {
                var parentType = parentNode.tNode.type;
                if (parentType === 0 /* Container */ || parentType === 2 /* View */) {
                    currentNode = parentNode;
                }
            }
        }
    }
    return null;
}
/** Retrieves the sibling node for the given node. */
export function getNextLNode(node) {
    // View nodes don't have TNodes, so their next must be retrieved through their LView.
    if (node.tNode.type === 2 /* View */) {
        var lView = node.data;
        return lView.next ? lView.next.node : null;
    }
    return node.tNode.next ? node.view.data[node.tNode.next.index] : null;
}
/** Retrieves the first child of a given node */
export function getChildLNode(node) {
    if (node.tNode.child) {
        var view = node.tNode.type === 2 /* View */ ? node.data : node.view;
        return view.data[node.tNode.child.index];
    }
    return null;
}
export function getParentLNode(node) {
    if (node.tNode.index === -1)
        return null;
    var parent = node.tNode.parent;
    return parent ? node.view.data[parent.index] : node.view.node;
}
/**
 * Get the next node in the LNode tree, taking into account the place where a node is
 * projected (in the shadow DOM) rather than where it comes from (in the light DOM).
 *
 * @param node The node whose next node in the LNode tree must be found.
 * @return LNode|null The next sibling in the LNode tree.
 */
function getNextLNodeWithProjection(node) {
    var pNextOrParent = node.pNextOrParent;
    if (pNextOrParent) {
        // The node is projected
        var isLastProjectedNode = pNextOrParent.tNode.type === 1 /* Projection */;
        // returns pNextOrParent if we are not at the end of the list, null otherwise
        return isLastProjectedNode ? null : pNextOrParent;
    }
    // returns node.next because the the node is not projected
    return getNextLNode(node);
}
/**
 * Find the next node in the LNode tree, taking into account the place where a node is
 * projected (in the shadow DOM) rather than where it comes from (in the light DOM).
 *
 * If there is no sibling node, this function goes to the next sibling of the parent node...
 * until it reaches rootNode (at which point null is returned).
 *
 * @param initialNode The node whose following node in the LNode tree must be found.
 * @param rootNode The root node at which the lookup should stop.
 * @return LNode|null The following node in the LNode tree.
 */
function getNextOrParentSiblingNode(initialNode, rootNode) {
    var node = initialNode;
    var nextNode = getNextLNodeWithProjection(node);
    while (node && !nextNode) {
        // if node.pNextOrParent is not null here, it is not the next node
        // (because, at this point, nextNode is null, so it is the parent)
        node = node.pNextOrParent || getParentLNode(node);
        if (node === rootNode) {
            return null;
        }
        nextNode = node && getNextLNodeWithProjection(node);
    }
    return nextNode;
}
/**
 * Returns the first RNode inside the given LNode.
 *
 * @param node The node whose first DOM node must be found
 * @returns RNode The first RNode of the given LNode or null if there is none.
 */
function findFirstRNode(rootNode) {
    var node = rootNode;
    while (node) {
        var nextNode = null;
        if (node.tNode.type === 3 /* Element */) {
            // A LElementNode has a matching RNode in LElementNode.native
            return node.native;
        }
        else if (node.tNode.type === 0 /* Container */) {
            var lContainerNode = node;
            var childContainerData = lContainerNode.dynamicLContainerNode ?
                lContainerNode.dynamicLContainerNode.data :
                lContainerNode.data;
            nextNode =
                childContainerData.views.length ? getChildLNode(childContainerData.views[0]) : null;
        }
        else if (node.tNode.type === 1 /* Projection */) {
            // For Projection look at the first projected node
            nextNode = node.data.head;
        }
        else {
            // Otherwise look at the first child
            nextNode = getChildLNode(node);
        }
        node = nextNode === null ? getNextOrParentSiblingNode(node, rootNode) : nextNode;
    }
    return null;
}
export function createTextNode(value, renderer) {
    return isProceduralRenderer(renderer) ? renderer.createText(stringify(value)) :
        renderer.createTextNode(stringify(value));
}
export function addRemoveViewFromContainer(container, rootNode, insertMode, beforeNode) {
    ngDevMode && assertNodeType(container, 0 /* Container */);
    ngDevMode && assertNodeType(rootNode, 2 /* View */);
    var parentNode = container.data.renderParent;
    var parent = parentNode ? parentNode.native : null;
    var node = getChildLNode(rootNode);
    if (parent) {
        while (node) {
            var nextNode = null;
            var renderer = container.view.renderer;
            if (node.tNode.type === 3 /* Element */) {
                if (insertMode) {
                    isProceduralRenderer(renderer) ?
                        renderer.insertBefore(parent, (node.native), beforeNode) :
                        parent.insertBefore((node.native), beforeNode, true);
                }
                else {
                    if (isProceduralRenderer(renderer)) {
                        renderer.removeChild(parent, (node.native));
                        if (renderer.destroyNode) {
                            ngDevMode && ngDevMode.rendererDestroyNode++;
                            renderer.destroyNode((node.native));
                        }
                    }
                    else {
                        parent.removeChild((node.native));
                    }
                }
                nextNode = getNextLNode(node);
            }
            else if (node.tNode.type === 0 /* Container */) {
                // if we get to a container, it must be a root node of a view because we are only
                // propagating down into child views / containers and not child elements
                var childContainerData = node.data;
                childContainerData.renderParent = parentNode;
                nextNode =
                    childContainerData.views.length ? getChildLNode(childContainerData.views[0]) : null;
            }
            else if (node.tNode.type === 1 /* Projection */) {
                nextNode = node.data.head;
            }
            else {
                nextNode = getChildLNode(node);
            }
            if (nextNode === null) {
                node = getNextOrParentSiblingNode(node, rootNode);
            }
            else {
                node = nextNode;
            }
        }
    }
}
/**
 * Traverses down and up the tree of views and containers to remove listeners and
 * call onDestroy callbacks.
 *
 * Notes:
 *  - Because it's used for onDestroy calls, it needs to be bottom-up.
 *  - Must process containers instead of their views to avoid splicing
 *  when views are destroyed and re-added.
 *  - Using a while loop because it's faster than recursion
 *  - Destroy only called on movement to sibling or movement to parent (laterally or up)
 *
 *  @param rootView The view to destroy
 */
export function destroyViewTree(rootView) {
    // If the view has no children, we can clean it up and return early.
    if (rootView.tView.childIndex === -1) {
        return cleanUpView(rootView);
    }
    var viewOrContainer = getLViewChild(rootView);
    while (viewOrContainer) {
        var next = null;
        if (viewOrContainer.views && viewOrContainer.views.length) {
            next = viewOrContainer.views[0].data;
        }
        else if (viewOrContainer.tView && viewOrContainer.tView.childIndex > -1) {
            next = getLViewChild(viewOrContainer);
        }
        else if (viewOrContainer.next) {
            // Only move to the side and clean if operating below rootView -
            // otherwise we would start cleaning up sibling views of the rootView.
            cleanUpView(viewOrContainer);
            next = viewOrContainer.next;
        }
        if (next == null) {
            // If the viewOrContainer is the rootView and next is null it means that we are dealing
            // with a root view that doesn't have children. We didn't descend into child views
            // so no need to go back up the views tree.
            while (viewOrContainer && !viewOrContainer.next && viewOrContainer !== rootView) {
                cleanUpView(viewOrContainer);
                viewOrContainer = getParentState(viewOrContainer, rootView);
            }
            cleanUpView(viewOrContainer || rootView);
            next = viewOrContainer && viewOrContainer.next;
        }
        viewOrContainer = next;
    }
}
/**
 * Inserts a view into a container.
 *
 * This adds the view to the container's array of active views in the correct
 * position. It also adds the view's elements to the DOM if the container isn't a
 * root node of another view (in that case, the view's elements will be added when
 * the container's parent view is added later).
 *
 * @param container The container into which the view should be inserted
 * @param viewNode The view to insert
 * @param index The index at which to insert the view
 * @returns The inserted view
 */
export function insertView(container, viewNode, index) {
    var state = container.data;
    var views = state.views;
    if (index > 0) {
        // This is a new view, we need to add it to the children.
        views[index - 1].data.next = viewNode.data;
    }
    if (index < views.length) {
        viewNode.data.next = views[index].data;
        views.splice(index, 0, viewNode);
    }
    else {
        views.push(viewNode);
        viewNode.data.next = null;
    }
    // Notify query that a new view has been added
    var lView = viewNode.data;
    if (lView.queries) {
        lView.queries.insertView(index);
    }
    // If the container's renderParent is null, we know that it is a root node of its own parent view
    // and we should wait until that parent processes its nodes (otherwise, we will insert this view's
    // nodes twice - once now and once when its parent inserts its views).
    if (container.data.renderParent !== null) {
        var beforeNode = findNextRNodeSibling(viewNode, container);
        if (!beforeNode) {
            var containerNextNativeNode = container.native;
            if (containerNextNativeNode === undefined) {
                containerNextNativeNode = container.native = findNextRNodeSibling(container, null);
            }
            beforeNode = containerNextNativeNode;
        }
        addRemoveViewFromContainer(container, viewNode, true, beforeNode);
    }
    return viewNode;
}
/**
 * Removes a view from a container.
 *
 * This method splices the view from the container's array of active views. It also
 * removes the view's elements from the DOM and conducts cleanup (e.g. removing
 * listeners, calling onDestroys).
 *
 * @param container The container from which to remove a view
 * @param removeIndex The index of the view to remove
 * @returns The removed view
 */
export function removeView(container, removeIndex) {
    var views = container.data.views;
    var viewNode = views[removeIndex];
    if (removeIndex > 0) {
        views[removeIndex - 1].data.next = viewNode.data.next;
    }
    views.splice(removeIndex, 1);
    destroyViewTree(viewNode.data);
    addRemoveViewFromContainer(container, viewNode, false);
    // Notify query that view has been removed
    var removedLview = viewNode.data;
    if (removedLview.queries) {
        removedLview.queries.removeView(removeIndex);
    }
    return viewNode;
}
/** Gets the child of the given LView */
export function getLViewChild(view) {
    if (view.tView.childIndex === -1)
        return null;
    var hostNode = view.data[view.tView.childIndex];
    return hostNode.data ? hostNode.data : hostNode.dynamicLContainerNode.data;
}
/**
 * Determines which LViewOrLContainer to jump to when traversing back up the
 * tree in destroyViewTree.
 *
 * Normally, the view's parent LView should be checked, but in the case of
 * embedded views, the container (which is the view node's parent, but not the
 * LView's parent) needs to be checked for a possible next property.
 *
 * @param state The LViewOrLContainer for which we need a parent state
 * @param rootView The rootView, so we don't propagate too far up the view tree
 * @returns The correct parent LViewOrLContainer
 */
export function getParentState(state, rootView) {
    var node;
    if ((node = state.node) && node.tNode.type === 2 /* View */) {
        // if it's an embedded view, the state needs to go up to the container, in case the
        // container has a next
        return getParentLNode(node).data;
    }
    else {
        // otherwise, use parent view for containers or component views
        return state.parent === rootView ? null : state.parent;
    }
}
/**
 * Removes all listeners and call all onDestroys in a given view.
 *
 * @param view The LView to clean up
 */
function cleanUpView(view) {
    removeListeners(view);
    executeOnDestroys(view);
    executePipeOnDestroys(view);
    // For component views only, the local renderer is destroyed as clean up time.
    if (view.tView && view.tView.id === -1 && isProceduralRenderer(view.renderer)) {
        ngDevMode && ngDevMode.rendererDestroy++;
        view.renderer.destroy();
    }
}
/** Removes listeners and unsubscribes from output subscriptions */
function removeListeners(view) {
    var cleanup = (view.cleanup);
    if (cleanup != null) {
        for (var i = 0; i < cleanup.length - 1; i += 2) {
            if (typeof cleanup[i] === 'string') {
                cleanup[i + 1].removeEventListener(cleanup[i], cleanup[i + 2], cleanup[i + 3]);
                i += 2;
            }
            else {
                cleanup[i].call(cleanup[i + 1]);
            }
        }
        view.cleanup = null;
    }
}
/** Calls onDestroy hooks for this view */
function executeOnDestroys(view) {
    var tView = view.tView;
    var destroyHooks;
    if (tView != null && (destroyHooks = tView.destroyHooks) != null) {
        callHooks((view.directives), destroyHooks);
    }
}
/** Calls pipe destroy hooks for this view */
function executePipeOnDestroys(view) {
    var pipeDestroyHooks = view.tView && view.tView.pipeDestroyHooks;
    if (pipeDestroyHooks) {
        callHooks((view.data), pipeDestroyHooks);
    }
}
/**
 * Returns whether a native element should be inserted in the given parent.
 *
 * The native node can be inserted when its parent is:
 * - A regular element => Yes
 * - A component host element =>
 *    - if the `currentView` === the parent `view`: The element is in the content (vs the
 *      template)
 *      => don't add as the parent component will project if needed.
 *    - `currentView` !== the parent `view` => The element is in the template (vs the content),
 *      add it
 * - View element => delay insertion, will be done on `viewEnd()`
 *
 * @param parent The parent in which to insert the child
 * @param currentView The LView being processed
 * @return boolean Whether the child element should be inserted.
 */
export function canInsertNativeNode(parent, currentView) {
    var parentIsElement = parent.tNode.type === 3 /* Element */;
    return parentIsElement &&
        (parent.view !== currentView || parent.data === null /* Regular Element. */);
}
/**
 * Appends the `child` element to the `parent`.
 *
 * The element insertion might be delayed {@link canInsertNativeNode}
 *
 * @param parent The parent to which to append the child
 * @param child The child that should be appended
 * @param currentView The current LView
 * @returns Whether or not the child was appended
 */
export function appendChild(parent, child, currentView) {
    if (child !== null && canInsertNativeNode(parent, currentView)) {
        // We only add element if not in View or not projected.
        var renderer = currentView.renderer;
        isProceduralRenderer(renderer) ? renderer.appendChild(parent.native, child) :
            parent.native.appendChild(child);
        return true;
    }
    return false;
}
/**
 * Appends a projected node to the DOM, or in the case of a projected container,
 * appends the nodes from all of the container's active views to the DOM.
 *
 * @param node The node to process
 * @param currentParent The last parent element to be processed
 * @param currentView Current LView
 */
export function appendProjectedNode(node, currentParent, currentView) {
    if (node.tNode.type !== 0 /* Container */) {
        appendChild(currentParent, node.native, currentView);
    }
    else {
        // The node we are adding is a Container and we are adding it to Element which
        // is not a component (no more re-projection).
        // Alternatively a container is projected at the root of a component's template
        // and can't be re-projected (as not content of any component).
        // Assignee the final projection location in those cases.
        var lContainer = node.data;
        lContainer.renderParent = currentParent;
        var views = lContainer.views;
        for (var i = 0; i < views.length; i++) {
            addRemoveViewFromContainer(node, views[i], true, null);
        }
    }
    if (node.dynamicLContainerNode) {
        node.dynamicLContainerNode.data.renderParent = currentParent;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9tYW5pcHVsYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfbWFuaXB1bGF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFTQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2xDLE9BQU8sRUFBYSw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM1RixPQUFPLEVBQW9HLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzlLLE9BQU8sRUFBQyw2QkFBNkIsSUFBSSxPQUFPLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUNqRixPQUFPLEVBQXlELG9CQUFvQixFQUFFLDZCQUE2QixJQUFJLE9BQU8sRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzdKLE9BQU8sRUFBNEMsNkJBQTZCLElBQUksT0FBTyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDdEgsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRWpDLElBQU0sdUJBQXVCLEdBQUcsT0FBTyxHQUFHLE9BQU8sR0FBRyxPQUFPLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQzs7Ozs7Ozs7Ozs7OztBQWNoRiw4QkFBOEIsSUFBa0IsRUFBRSxRQUFzQjtJQUN0RSxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUM7SUFDdkIsT0FBTyxXQUFXLElBQUksV0FBVyxLQUFLLFFBQVEsRUFBRTtRQUM5QyxJQUFJLGFBQWEsR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDO1FBQzlDLElBQUksYUFBYSxFQUFFO1lBQ2pCLE9BQU8sYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLHVCQUF5QixFQUFFO2dCQUN4RCxJQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ2pELElBQUksVUFBVSxFQUFFO29CQUNkLE9BQU8sVUFBVSxDQUFDO2lCQUNuQjtnQkFDRCxhQUFhLElBQUcsYUFBYSxDQUFDLGFBQWUsQ0FBQSxDQUFDO2FBQy9DO1lBQ0QsV0FBVyxHQUFHLGFBQWEsQ0FBQztTQUM3QjthQUFNO1lBQ0wsSUFBSSxjQUFjLEdBQUcsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQy9DLE9BQU8sY0FBYyxFQUFFO2dCQUNyQixJQUFNLFVBQVUsR0FBRyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ2xELElBQUksVUFBVSxFQUFFO29CQUNkLE9BQU8sVUFBVSxDQUFDO2lCQUNuQjtnQkFDRCxjQUFjLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2FBQy9DO1lBQ0QsSUFBTSxVQUFVLEdBQUcsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQy9DLFdBQVcsR0FBRyxJQUFJLENBQUM7WUFDbkIsSUFBSSxVQUFVLEVBQUU7Z0JBQ2QsSUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7Z0JBQ3pDLElBQUksVUFBVSxzQkFBd0IsSUFBSSxVQUFVLGlCQUFtQixFQUFFO29CQUN2RSxXQUFXLEdBQUcsVUFBVSxDQUFDO2lCQUMxQjthQUNGO1NBQ0Y7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0NBQ2I7O0FBR0QsTUFBTSx1QkFBdUIsSUFBVzs7SUFFdEMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksaUJBQW1CLEVBQUU7UUFDdEMsSUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQWEsQ0FBQztRQUNqQyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFFLEtBQUssQ0FBQyxJQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7S0FDdkQ7SUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0NBQ3pFOztBQUdELE1BQU0sd0JBQXdCLElBQVc7SUFDdkMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRTtRQUNwQixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksaUJBQW1CLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFhLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDakYsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzFDO0lBQ0QsT0FBTyxJQUFJLENBQUM7Q0FDYjtBQU9ELE1BQU0seUJBQXlCLElBQVc7SUFDeEMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxDQUFDLENBQUM7UUFBRSxPQUFPLElBQUksQ0FBQztJQUN6QyxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUNqQyxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztDQUMvRDs7Ozs7Ozs7QUFTRCxvQ0FBb0MsSUFBVztJQUM3QyxJQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO0lBRXpDLElBQUksYUFBYSxFQUFFOztRQUVqQixJQUFNLG1CQUFtQixHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSx1QkFBeUIsQ0FBQzs7UUFFOUUsT0FBTyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUM7S0FDbkQ7O0lBR0QsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDM0I7Ozs7Ozs7Ozs7OztBQWFELG9DQUFvQyxXQUFrQixFQUFFLFFBQWU7SUFDckUsSUFBSSxJQUFJLEdBQWUsV0FBVyxDQUFDO0lBQ25DLElBQUksUUFBUSxHQUFHLDBCQUEwQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2hELE9BQU8sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFOzs7UUFHeEIsSUFBSSxHQUFHLElBQUksQ0FBQyxhQUFhLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2xELElBQUksSUFBSSxLQUFLLFFBQVEsRUFBRTtZQUNyQixPQUFPLElBQUksQ0FBQztTQUNiO1FBQ0QsUUFBUSxHQUFHLElBQUksSUFBSSwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNyRDtJQUNELE9BQU8sUUFBUSxDQUFDO0NBQ2pCOzs7Ozs7O0FBUUQsd0JBQXdCLFFBQWU7SUFDckMsSUFBSSxJQUFJLEdBQWUsUUFBUSxDQUFDO0lBQ2hDLE9BQU8sSUFBSSxFQUFFO1FBQ1gsSUFBSSxRQUFRLEdBQWUsSUFBSSxDQUFDO1FBQ2hDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLG9CQUFzQixFQUFFOztZQUV6QyxPQUFRLElBQXFCLENBQUMsTUFBTSxDQUFDO1NBQ3RDO2FBQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksc0JBQXdCLEVBQUU7WUFDbEQsSUFBTSxjQUFjLEdBQW9CLElBQXVCLENBQUM7WUFDaEUsSUFBTSxrQkFBa0IsR0FBZSxjQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQztnQkFDekUsY0FBYyxDQUFDLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUMzQyxjQUFjLENBQUMsSUFBSSxDQUFDO1lBQ3hCLFFBQVE7Z0JBQ0osa0JBQWtCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7U0FDekY7YUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSx1QkFBeUIsRUFBRTs7WUFFbkQsUUFBUSxHQUFJLElBQXdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztTQUNoRDthQUFNOztZQUVMLFFBQVEsR0FBRyxhQUFhLENBQUMsSUFBaUIsQ0FBQyxDQUFDO1NBQzdDO1FBRUQsSUFBSSxHQUFHLFFBQVEsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLDBCQUEwQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO0tBQ2xGO0lBQ0QsT0FBTyxJQUFJLENBQUM7Q0FDYjtBQUVELE1BQU0seUJBQXlCLEtBQVUsRUFBRSxRQUFtQjtJQUM1RCxPQUFPLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztDQUNuRjtBQW1CRCxNQUFNLHFDQUNGLFNBQXlCLEVBQUUsUUFBbUIsRUFBRSxVQUFtQixFQUNuRSxVQUF5QjtJQUMzQixTQUFTLElBQUksY0FBYyxDQUFDLFNBQVMsb0JBQXNCLENBQUM7SUFDNUQsU0FBUyxJQUFJLGNBQWMsQ0FBQyxRQUFRLGVBQWlCLENBQUM7SUFDdEQsSUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDL0MsSUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDckQsSUFBSSxJQUFJLEdBQWUsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQy9DLElBQUksTUFBTSxFQUFFO1FBQ1YsT0FBTyxJQUFJLEVBQUU7WUFDWCxJQUFJLFFBQVEsR0FBZSxJQUFJLENBQUM7WUFDaEMsSUFBTSxRQUFRLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUM7WUFDekMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksb0JBQXNCLEVBQUU7Z0JBQ3pDLElBQUksVUFBVSxFQUFFO29CQUNkLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7d0JBQzVCLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUEsSUFBSSxDQUFDLE1BQVEsQ0FBQSxFQUFFLFVBQTBCLENBQUMsQ0FBQyxDQUFDO3dCQUMxRSxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUEsSUFBSSxDQUFDLE1BQVEsQ0FBQSxFQUFFLFVBQTBCLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQzFFO3FCQUFNO29CQUNMLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7d0JBQ2xDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBa0IsRUFBRSxDQUFBLElBQUksQ0FBQyxNQUFRLENBQUEsQ0FBQyxDQUFDO3dCQUN4RCxJQUFJLFFBQVEsQ0FBQyxXQUFXLEVBQUU7NEJBQ3hCLFNBQVMsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQzs0QkFDN0MsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFBLElBQUksQ0FBQyxNQUFRLENBQUEsQ0FBQyxDQUFDO3lCQUNyQztxQkFDRjt5QkFBTTt3QkFDTCxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUEsSUFBSSxDQUFDLE1BQVEsQ0FBQSxDQUFDLENBQUM7cUJBQ25DO2lCQUNGO2dCQUNELFFBQVEsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDL0I7aUJBQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksc0JBQXdCLEVBQUU7OztnQkFHbEQsSUFBTSxrQkFBa0IsR0FBZ0IsSUFBdUIsQ0FBQyxJQUFJLENBQUM7Z0JBQ3JFLGtCQUFrQixDQUFDLFlBQVksR0FBRyxVQUFVLENBQUM7Z0JBQzdDLFFBQVE7b0JBQ0osa0JBQWtCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7YUFDekY7aUJBQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksdUJBQXlCLEVBQUU7Z0JBQ25ELFFBQVEsR0FBSSxJQUF3QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7YUFDaEQ7aUJBQU07Z0JBQ0wsUUFBUSxHQUFHLGFBQWEsQ0FBQyxJQUFpQixDQUFDLENBQUM7YUFDN0M7WUFDRCxJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUU7Z0JBQ3JCLElBQUksR0FBRywwQkFBMEIsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDbkQ7aUJBQU07Z0JBQ0wsSUFBSSxHQUFHLFFBQVEsQ0FBQzthQUNqQjtTQUNGO0tBQ0Y7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7QUFlRCxNQUFNLDBCQUEwQixRQUFlOztJQUU3QyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsVUFBVSxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQ3BDLE9BQU8sV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQzlCO0lBQ0QsSUFBSSxlQUFlLEdBQTJCLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUV0RSxPQUFPLGVBQWUsRUFBRTtRQUN0QixJQUFJLElBQUksR0FBMkIsSUFBSSxDQUFDO1FBRXhDLElBQUksZUFBZSxDQUFDLEtBQUssSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUN6RCxJQUFJLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7U0FDdEM7YUFBTSxJQUFJLGVBQWUsQ0FBQyxLQUFLLElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQUU7WUFDekUsSUFBSSxHQUFHLGFBQWEsQ0FBQyxlQUF3QixDQUFDLENBQUM7U0FDaEQ7YUFBTSxJQUFJLGVBQWUsQ0FBQyxJQUFJLEVBQUU7OztZQUcvQixXQUFXLENBQUMsZUFBd0IsQ0FBQyxDQUFDO1lBQ3RDLElBQUksR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDO1NBQzdCO1FBRUQsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFOzs7O1lBSWhCLE9BQU8sZUFBZSxJQUFJLENBQUMsZUFBaUIsQ0FBQyxJQUFJLElBQUksZUFBZSxLQUFLLFFBQVEsRUFBRTtnQkFDakYsV0FBVyxDQUFDLGVBQXdCLENBQUMsQ0FBQztnQkFDdEMsZUFBZSxHQUFHLGNBQWMsQ0FBQyxlQUFlLEVBQUUsUUFBUSxDQUFDLENBQUM7YUFDN0Q7WUFDRCxXQUFXLENBQUMsZUFBd0IsSUFBSSxRQUFRLENBQUMsQ0FBQztZQUVsRCxJQUFJLEdBQUcsZUFBZSxJQUFJLGVBQWUsQ0FBQyxJQUFJLENBQUM7U0FDaEQ7UUFDRCxlQUFlLEdBQUcsSUFBSSxDQUFDO0tBQ3hCO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7O0FBZUQsTUFBTSxxQkFDRixTQUF5QixFQUFFLFFBQW1CLEVBQUUsS0FBYTtJQUMvRCxJQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDO0lBQzdCLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7SUFFMUIsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFOztRQUViLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsSUFBYSxDQUFDO0tBQ3JEO0lBRUQsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTtRQUN4QixRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3ZDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztLQUNsQztTQUFNO1FBQ0wsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyQixRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7S0FDM0I7O0lBR0QsSUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztJQUM1QixJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUU7UUFDakIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDakM7Ozs7SUFLRCxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxLQUFLLElBQUksRUFBRTtRQUN4QyxJQUFJLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFM0QsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNmLElBQUksdUJBQXVCLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQztZQUMvQyxJQUFJLHVCQUF1QixLQUFLLFNBQVMsRUFBRTtnQkFDekMsdUJBQXVCLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDcEY7WUFDRCxVQUFVLEdBQUcsdUJBQXVCLENBQUM7U0FDdEM7UUFDRCwwQkFBMEIsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztLQUNuRTtJQUVELE9BQU8sUUFBUSxDQUFDO0NBQ2pCOzs7Ozs7Ozs7Ozs7QUFhRCxNQUFNLHFCQUFxQixTQUF5QixFQUFFLFdBQW1CO0lBQ3ZFLElBQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ25DLElBQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNwQyxJQUFJLFdBQVcsR0FBRyxDQUFDLEVBQUU7UUFDbkIsS0FBSyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBYSxDQUFDO0tBQ2hFO0lBQ0QsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDN0IsZUFBZSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQiwwQkFBMEIsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDOztJQUd2RCxJQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO0lBQ25DLElBQUksWUFBWSxDQUFDLE9BQU8sRUFBRTtRQUN4QixZQUFZLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUM5QztJQUVELE9BQU8sUUFBUSxDQUFDO0NBQ2pCOztBQUdELE1BQU0sd0JBQXdCLElBQVc7SUFDdkMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsS0FBSyxDQUFDLENBQUM7UUFBRSxPQUFPLElBQUksQ0FBQztJQUU5QyxJQUFNLFFBQVEsR0FBZ0MsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRS9FLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUUsUUFBUSxDQUFDLHFCQUF3QyxDQUFDLElBQUksQ0FBQztDQUNoRzs7Ozs7Ozs7Ozs7OztBQWNELE1BQU0seUJBQXlCLEtBQXdCLEVBQUUsUUFBZTtJQUN0RSxJQUFJLElBQUksQ0FBQztJQUNULElBQUksQ0FBQyxJQUFJLEdBQUksS0FBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksaUJBQW1CLEVBQUU7OztRQUcxRSxPQUFPLGNBQWMsQ0FBQyxJQUFJLENBQUcsQ0FBQyxJQUFXLENBQUM7S0FDM0M7U0FBTTs7UUFFTCxPQUFPLEtBQUssQ0FBQyxNQUFNLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7S0FDeEQ7Q0FDRjs7Ozs7O0FBT0QscUJBQXFCLElBQVc7SUFDOUIsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RCLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hCLHFCQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDOztJQUU1QixJQUFJLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLElBQUksb0JBQW9CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQzdFLFNBQVMsSUFBSSxTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDekMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUN6QjtDQUNGOztBQUdELHlCQUF5QixJQUFXO0lBQ2xDLElBQU0sT0FBTyxHQUFHLENBQUEsSUFBSSxDQUFDLE9BQVMsQ0FBQSxDQUFDO0lBQy9CLElBQUksT0FBTyxJQUFJLElBQUksRUFBRTtRQUNuQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM5QyxJQUFJLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLFFBQVEsRUFBRTtnQkFDbEMsT0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2pGLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDUjtpQkFBTTtnQkFDTCxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNqQztTQUNGO1FBQ0QsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7S0FDckI7Q0FDRjs7QUFHRCwyQkFBMkIsSUFBVztJQUNwQyxJQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3pCLElBQUksWUFBMkIsQ0FBQztJQUNoQyxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLElBQUksRUFBRTtRQUNoRSxTQUFTLENBQUMsQ0FBQSxJQUFJLENBQUMsVUFBWSxDQUFBLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDNUM7Q0FDRjs7QUFHRCwrQkFBK0IsSUFBVztJQUN4QyxJQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztJQUNuRSxJQUFJLGdCQUFnQixFQUFFO1FBQ3BCLFNBQVMsQ0FBQyxDQUFBLElBQUksQ0FBQyxJQUFNLENBQUEsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0tBQzFDO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CRCxNQUFNLDhCQUE4QixNQUFhLEVBQUUsV0FBa0I7SUFDbkUsSUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLG9CQUFzQixDQUFDO0lBRWhFLE9BQU8sZUFBZTtRQUNsQixDQUFDLE1BQU0sQ0FBQyxJQUFJLEtBQUssV0FBVyxJQUFJLE1BQU0sQ0FBQyxJQUFJLEtBQUssSUFBSSx3QkFBd0IsQ0FBQztDQUNsRjs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLHNCQUFzQixNQUFhLEVBQUUsS0FBbUIsRUFBRSxXQUFrQjtJQUNoRixJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksbUJBQW1CLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxFQUFFOztRQUU5RCxJQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDO1FBQ3RDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFtQixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDekQsTUFBTSxDQUFDLE1BQVEsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEUsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE9BQU8sS0FBSyxDQUFDO0NBQ2Q7Ozs7Ozs7OztBQVVELE1BQU0sOEJBQ0YsSUFBK0MsRUFBRSxhQUEyQixFQUM1RSxXQUFrQjtJQUNwQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxzQkFBd0IsRUFBRTtRQUMzQyxXQUFXLENBQUMsYUFBYSxFQUFHLElBQWlDLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0tBQ3BGO1NBQU07Ozs7OztRQU1MLElBQU0sVUFBVSxHQUFJLElBQXVCLENBQUMsSUFBSSxDQUFDO1FBQ2pELFVBQVUsQ0FBQyxZQUFZLEdBQUcsYUFBYSxDQUFDO1FBQ3hDLElBQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUM7UUFDL0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDckMsMEJBQTBCLENBQUMsSUFBc0IsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQzFFO0tBQ0Y7SUFDRCxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtRQUM5QixJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDLFlBQVksR0FBRyxhQUFhLENBQUM7S0FDOUQ7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnROb3ROdWxsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2NhbGxIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0xDb250YWluZXIsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDF9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTFByb2plY3Rpb25Ob2RlLCBMVGV4dE5vZGUsIExWaWV3Tm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCB1bnVzZWRWYWx1ZUV4cG9ydFRvUGxhY2F0ZUFqZCBhcyB1bnVzZWQyfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge3VudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDN9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkVsZW1lbnQsIFJOb2RlLCBSVGV4dCwgUmVuZGVyZXIzLCBpc1Byb2NlZHVyYWxSZW5kZXJlciwgdW51c2VkVmFsdWVFeHBvcnRUb1BsYWNhdGVBamQgYXMgdW51c2VkNH0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7SG9va0RhdGEsIExWaWV3LCBMVmlld09yTENvbnRhaW5lciwgVFZpZXcsIHVudXNlZFZhbHVlRXhwb3J0VG9QbGFjYXRlQWpkIGFzIHVudXNlZDV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IHVudXNlZFZhbHVlVG9QbGFjYXRlQWpkID0gdW51c2VkMSArIHVudXNlZDIgKyB1bnVzZWQzICsgdW51c2VkNCArIHVudXNlZDU7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgUk5vZGUgZm9sbG93aW5nIHRoZSBnaXZlbiBMTm9kZSBpbiB0aGUgc2FtZSBwYXJlbnQgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpcyBuZWVkZWQgaW4gb3JkZXIgdG8gaW5zZXJ0IHRoZSBnaXZlbiBub2RlIHdpdGggaW5zZXJ0QmVmb3JlLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIGZvbGxvd2luZyBET00gbm9kZSBtdXN0IGJlIGZvdW5kLlxuICogQHBhcmFtIHN0b3BOb2RlIEEgcGFyZW50IG5vZGUgYXQgd2hpY2ggdGhlIGxvb2t1cCBpbiB0aGUgdHJlZSBzaG91bGQgYmUgc3RvcHBlZCwgb3IgbnVsbCBpZiB0aGVcbiAqIGxvb2t1cCBzaG91bGQgbm90IGJlIHN0b3BwZWQgdW50aWwgdGhlIHJlc3VsdCBpcyBmb3VuZC5cbiAqIEByZXR1cm5zIFJOb2RlIGJlZm9yZSB3aGljaCB0aGUgcHJvdmlkZWQgbm9kZSBzaG91bGQgYmUgaW5zZXJ0ZWQgb3IgbnVsbCBpZiB0aGUgbG9va3VwIHdhc1xuICogc3RvcHBlZFxuICogb3IgaWYgdGhlcmUgaXMgbm8gbmF0aXZlIG5vZGUgYWZ0ZXIgdGhlIGdpdmVuIGxvZ2ljYWwgbm9kZSBpbiB0aGUgc2FtZSBuYXRpdmUgcGFyZW50LlxuICovXG5mdW5jdGlvbiBmaW5kTmV4dFJOb2RlU2libGluZyhub2RlOiBMTm9kZSB8IG51bGwsIHN0b3BOb2RlOiBMTm9kZSB8IG51bGwpOiBSRWxlbWVudHxSVGV4dHxudWxsIHtcbiAgbGV0IGN1cnJlbnROb2RlID0gbm9kZTtcbiAgd2hpbGUgKGN1cnJlbnROb2RlICYmIGN1cnJlbnROb2RlICE9PSBzdG9wTm9kZSkge1xuICAgIGxldCBwTmV4dE9yUGFyZW50ID0gY3VycmVudE5vZGUucE5leHRPclBhcmVudDtcbiAgICBpZiAocE5leHRPclBhcmVudCkge1xuICAgICAgd2hpbGUgKHBOZXh0T3JQYXJlbnQudE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgY29uc3QgbmF0aXZlTm9kZSA9IGZpbmRGaXJzdFJOb2RlKHBOZXh0T3JQYXJlbnQpO1xuICAgICAgICBpZiAobmF0aXZlTm9kZSkge1xuICAgICAgICAgIHJldHVybiBuYXRpdmVOb2RlO1xuICAgICAgICB9XG4gICAgICAgIHBOZXh0T3JQYXJlbnQgPSBwTmV4dE9yUGFyZW50LnBOZXh0T3JQYXJlbnQgITtcbiAgICAgIH1cbiAgICAgIGN1cnJlbnROb2RlID0gcE5leHRPclBhcmVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGN1cnJlbnRTaWJsaW5nID0gZ2V0TmV4dExOb2RlKGN1cnJlbnROb2RlKTtcbiAgICAgIHdoaWxlIChjdXJyZW50U2libGluZykge1xuICAgICAgICBjb25zdCBuYXRpdmVOb2RlID0gZmluZEZpcnN0Uk5vZGUoY3VycmVudFNpYmxpbmcpO1xuICAgICAgICBpZiAobmF0aXZlTm9kZSkge1xuICAgICAgICAgIHJldHVybiBuYXRpdmVOb2RlO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnRTaWJsaW5nID0gZ2V0TmV4dExOb2RlKGN1cnJlbnRTaWJsaW5nKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShjdXJyZW50Tm9kZSk7XG4gICAgICBjdXJyZW50Tm9kZSA9IG51bGw7XG4gICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICBjb25zdCBwYXJlbnRUeXBlID0gcGFyZW50Tm9kZS50Tm9kZS50eXBlO1xuICAgICAgICBpZiAocGFyZW50VHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lciB8fCBwYXJlbnRUeXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgICAgIGN1cnJlbnROb2RlID0gcGFyZW50Tm9kZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgc2libGluZyBub2RlIGZvciB0aGUgZ2l2ZW4gbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROZXh0TE5vZGUobm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgLy8gVmlldyBub2RlcyBkb24ndCBoYXZlIFROb2Rlcywgc28gdGhlaXIgbmV4dCBtdXN0IGJlIHJldHJpZXZlZCB0aHJvdWdoIHRoZWlyIExWaWV3LlxuICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIGNvbnN0IGxWaWV3ID0gbm9kZS5kYXRhIGFzIExWaWV3O1xuICAgIHJldHVybiBsVmlldy5uZXh0ID8gKGxWaWV3Lm5leHQgYXMgTFZpZXcpLm5vZGUgOiBudWxsO1xuICB9XG4gIHJldHVybiBub2RlLnROb2RlLm5leHQgPyBub2RlLnZpZXcuZGF0YVtub2RlLnROb2RlLm5leHQgIS5pbmRleF0gOiBudWxsO1xufVxuXG4vKiogUmV0cmlldmVzIHRoZSBmaXJzdCBjaGlsZCBvZiBhIGdpdmVuIG5vZGUgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDaGlsZExOb2RlKG5vZGU6IExOb2RlKTogTE5vZGV8bnVsbCB7XG4gIGlmIChub2RlLnROb2RlLmNoaWxkKSB7XG4gICAgY29uc3QgdmlldyA9IG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgPyBub2RlLmRhdGEgYXMgTFZpZXcgOiBub2RlLnZpZXc7XG4gICAgcmV0dXJuIHZpZXcuZGF0YVtub2RlLnROb2RlLmNoaWxkLmluZGV4XTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFJldHJpZXZlcyB0aGUgcGFyZW50IExOb2RlIG9mIGEgZ2l2ZW4gbm9kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRMTm9kZShub2RlOiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMUHJvamVjdGlvbk5vZGUpOiBMRWxlbWVudE5vZGV8XG4gICAgTFZpZXdOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudExOb2RlKG5vZGU6IExWaWV3Tm9kZSk6IExDb250YWluZXJOb2RlfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTE5vZGUpOiBMRWxlbWVudE5vZGV8TENvbnRhaW5lck5vZGV8TFZpZXdOb2RlfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50TE5vZGUobm9kZTogTE5vZGUpOiBMRWxlbWVudE5vZGV8TENvbnRhaW5lck5vZGV8TFZpZXdOb2RlfG51bGwge1xuICBpZiAobm9kZS50Tm9kZS5pbmRleCA9PT0gLTEpIHJldHVybiBudWxsO1xuICBjb25zdCBwYXJlbnQgPSBub2RlLnROb2RlLnBhcmVudDtcbiAgcmV0dXJuIHBhcmVudCA/IG5vZGUudmlldy5kYXRhW3BhcmVudC5pbmRleF0gOiBub2RlLnZpZXcubm9kZTtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSwgdGFraW5nIGludG8gYWNjb3VudCB0aGUgcGxhY2Ugd2hlcmUgYSBub2RlIGlzXG4gKiBwcm9qZWN0ZWQgKGluIHRoZSBzaGFkb3cgRE9NKSByYXRoZXIgdGhhbiB3aGVyZSBpdCBjb21lcyBmcm9tIChpbiB0aGUgbGlnaHQgRE9NKS5cbiAqXG4gKiBAcGFyYW0gbm9kZSBUaGUgbm9kZSB3aG9zZSBuZXh0IG5vZGUgaW4gdGhlIExOb2RlIHRyZWUgbXVzdCBiZSBmb3VuZC5cbiAqIEByZXR1cm4gTE5vZGV8bnVsbCBUaGUgbmV4dCBzaWJsaW5nIGluIHRoZSBMTm9kZSB0cmVlLlxuICovXG5mdW5jdGlvbiBnZXROZXh0TE5vZGVXaXRoUHJvamVjdGlvbihub2RlOiBMTm9kZSk6IExOb2RlfG51bGwge1xuICBjb25zdCBwTmV4dE9yUGFyZW50ID0gbm9kZS5wTmV4dE9yUGFyZW50O1xuXG4gIGlmIChwTmV4dE9yUGFyZW50KSB7XG4gICAgLy8gVGhlIG5vZGUgaXMgcHJvamVjdGVkXG4gICAgY29uc3QgaXNMYXN0UHJvamVjdGVkTm9kZSA9IHBOZXh0T3JQYXJlbnQudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb247XG4gICAgLy8gcmV0dXJucyBwTmV4dE9yUGFyZW50IGlmIHdlIGFyZSBub3QgYXQgdGhlIGVuZCBvZiB0aGUgbGlzdCwgbnVsbCBvdGhlcndpc2VcbiAgICByZXR1cm4gaXNMYXN0UHJvamVjdGVkTm9kZSA/IG51bGwgOiBwTmV4dE9yUGFyZW50O1xuICB9XG5cbiAgLy8gcmV0dXJucyBub2RlLm5leHQgYmVjYXVzZSB0aGUgdGhlIG5vZGUgaXMgbm90IHByb2plY3RlZFxuICByZXR1cm4gZ2V0TmV4dExOb2RlKG5vZGUpO1xufVxuXG4vKipcbiAqIEZpbmQgdGhlIG5leHQgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZSwgdGFraW5nIGludG8gYWNjb3VudCB0aGUgcGxhY2Ugd2hlcmUgYSBub2RlIGlzXG4gKiBwcm9qZWN0ZWQgKGluIHRoZSBzaGFkb3cgRE9NKSByYXRoZXIgdGhhbiB3aGVyZSBpdCBjb21lcyBmcm9tIChpbiB0aGUgbGlnaHQgRE9NKS5cbiAqXG4gKiBJZiB0aGVyZSBpcyBubyBzaWJsaW5nIG5vZGUsIHRoaXMgZnVuY3Rpb24gZ29lcyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSBwYXJlbnQgbm9kZS4uLlxuICogdW50aWwgaXQgcmVhY2hlcyByb290Tm9kZSAoYXQgd2hpY2ggcG9pbnQgbnVsbCBpcyByZXR1cm5lZCkuXG4gKlxuICogQHBhcmFtIGluaXRpYWxOb2RlIFRoZSBub2RlIHdob3NlIGZvbGxvd2luZyBub2RlIGluIHRoZSBMTm9kZSB0cmVlIG11c3QgYmUgZm91bmQuXG4gKiBAcGFyYW0gcm9vdE5vZGUgVGhlIHJvb3Qgbm9kZSBhdCB3aGljaCB0aGUgbG9va3VwIHNob3VsZCBzdG9wLlxuICogQHJldHVybiBMTm9kZXxudWxsIFRoZSBmb2xsb3dpbmcgbm9kZSBpbiB0aGUgTE5vZGUgdHJlZS5cbiAqL1xuZnVuY3Rpb24gZ2V0TmV4dE9yUGFyZW50U2libGluZ05vZGUoaW5pdGlhbE5vZGU6IExOb2RlLCByb290Tm9kZTogTE5vZGUpOiBMTm9kZXxudWxsIHtcbiAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSBpbml0aWFsTm9kZTtcbiAgbGV0IG5leHROb2RlID0gZ2V0TmV4dExOb2RlV2l0aFByb2plY3Rpb24obm9kZSk7XG4gIHdoaWxlIChub2RlICYmICFuZXh0Tm9kZSkge1xuICAgIC8vIGlmIG5vZGUucE5leHRPclBhcmVudCBpcyBub3QgbnVsbCBoZXJlLCBpdCBpcyBub3QgdGhlIG5leHQgbm9kZVxuICAgIC8vIChiZWNhdXNlLCBhdCB0aGlzIHBvaW50LCBuZXh0Tm9kZSBpcyBudWxsLCBzbyBpdCBpcyB0aGUgcGFyZW50KVxuICAgIG5vZGUgPSBub2RlLnBOZXh0T3JQYXJlbnQgfHwgZ2V0UGFyZW50TE5vZGUobm9kZSk7XG4gICAgaWYgKG5vZGUgPT09IHJvb3ROb2RlKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgbmV4dE5vZGUgPSBub2RlICYmIGdldE5leHRMTm9kZVdpdGhQcm9qZWN0aW9uKG5vZGUpO1xuICB9XG4gIHJldHVybiBuZXh0Tm9kZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmaXJzdCBSTm9kZSBpbnNpZGUgdGhlIGdpdmVuIExOb2RlLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHdob3NlIGZpcnN0IERPTSBub2RlIG11c3QgYmUgZm91bmRcbiAqIEByZXR1cm5zIFJOb2RlIFRoZSBmaXJzdCBSTm9kZSBvZiB0aGUgZ2l2ZW4gTE5vZGUgb3IgbnVsbCBpZiB0aGVyZSBpcyBub25lLlxuICovXG5mdW5jdGlvbiBmaW5kRmlyc3RSTm9kZShyb290Tm9kZTogTE5vZGUpOiBSRWxlbWVudHxSVGV4dHxudWxsIHtcbiAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSByb290Tm9kZTtcbiAgd2hpbGUgKG5vZGUpIHtcbiAgICBsZXQgbmV4dE5vZGU6IExOb2RlfG51bGwgPSBudWxsO1xuICAgIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAvLyBBIExFbGVtZW50Tm9kZSBoYXMgYSBtYXRjaGluZyBSTm9kZSBpbiBMRWxlbWVudE5vZGUubmF0aXZlXG4gICAgICByZXR1cm4gKG5vZGUgYXMgTEVsZW1lbnROb2RlKS5uYXRpdmU7XG4gICAgfSBlbHNlIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgIGNvbnN0IGxDb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSA9IChub2RlIGFzIExDb250YWluZXJOb2RlKTtcbiAgICAgIGNvbnN0IGNoaWxkQ29udGFpbmVyRGF0YTogTENvbnRhaW5lciA9IGxDb250YWluZXJOb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSA/XG4gICAgICAgICAgbENvbnRhaW5lck5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGEgOlxuICAgICAgICAgIGxDb250YWluZXJOb2RlLmRhdGE7XG4gICAgICBuZXh0Tm9kZSA9XG4gICAgICAgICAgY2hpbGRDb250YWluZXJEYXRhLnZpZXdzLmxlbmd0aCA/IGdldENoaWxkTE5vZGUoY2hpbGRDb250YWluZXJEYXRhLnZpZXdzWzBdKSA6IG51bGw7XG4gICAgfSBlbHNlIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAvLyBGb3IgUHJvamVjdGlvbiBsb29rIGF0IHRoZSBmaXJzdCBwcm9qZWN0ZWQgbm9kZVxuICAgICAgbmV4dE5vZGUgPSAobm9kZSBhcyBMUHJvamVjdGlvbk5vZGUpLmRhdGEuaGVhZDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT3RoZXJ3aXNlIGxvb2sgYXQgdGhlIGZpcnN0IGNoaWxkXG4gICAgICBuZXh0Tm9kZSA9IGdldENoaWxkTE5vZGUobm9kZSBhcyBMVmlld05vZGUpO1xuICAgIH1cblxuICAgIG5vZGUgPSBuZXh0Tm9kZSA9PT0gbnVsbCA/IGdldE5leHRPclBhcmVudFNpYmxpbmdOb2RlKG5vZGUsIHJvb3ROb2RlKSA6IG5leHROb2RlO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodmFsdWU6IGFueSwgcmVuZGVyZXI6IFJlbmRlcmVyMyk6IFJUZXh0IHtcbiAgcmV0dXJuIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmNyZWF0ZVRleHQoc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIuY3JlYXRlVGV4dE5vZGUoc3RyaW5naWZ5KHZhbHVlKSk7XG59XG5cbi8qKlxuICogQWRkcyBvciByZW1vdmVzIGFsbCBET00gZWxlbWVudHMgYXNzb2NpYXRlZCB3aXRoIGEgdmlldy5cbiAqXG4gKiBCZWNhdXNlIHNvbWUgcm9vdCBub2RlcyBvZiB0aGUgdmlldyBtYXkgYmUgY29udGFpbmVycywgd2Ugc29tZXRpbWVzIG5lZWRcbiAqIHRvIHByb3BhZ2F0ZSBkZWVwbHkgaW50byB0aGUgbmVzdGVkIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGFsbCBlbGVtZW50cyBpbiB0aGVcbiAqIHZpZXdzIGJlbmVhdGggaXQuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIHRvIHdoaWNoIHRoZSByb290IHZpZXcgYmVsb25nc1xuICogQHBhcmFtIHJvb3ROb2RlIFRoZSB2aWV3IGZyb20gd2hpY2ggZWxlbWVudHMgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWRcbiAqIEBwYXJhbSBpbnNlcnRNb2RlIFdoZXRoZXIgb3Igbm90IGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCAoaWYgZmFsc2UsIHJlbW92aW5nKVxuICogQHBhcmFtIGJlZm9yZU5vZGUgVGhlIG5vZGUgYmVmb3JlIHdoaWNoIGVsZW1lbnRzIHNob3VsZCBiZSBhZGRlZCwgaWYgaW5zZXJ0IG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKFxuICAgIGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJvb3ROb2RlOiBMVmlld05vZGUsIGluc2VydE1vZGU6IHRydWUsXG4gICAgYmVmb3JlTm9kZTogUk5vZGUgfCBudWxsKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihcbiAgICBjb250YWluZXI6IExDb250YWluZXJOb2RlLCByb290Tm9kZTogTFZpZXdOb2RlLCBpbnNlcnRNb2RlOiBmYWxzZSk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgcm9vdE5vZGU6IExWaWV3Tm9kZSwgaW5zZXJ0TW9kZTogYm9vbGVhbixcbiAgICBiZWZvcmVOb2RlPzogUk5vZGUgfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXIsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocm9vdE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgY29uc3QgcGFyZW50Tm9kZSA9IGNvbnRhaW5lci5kYXRhLnJlbmRlclBhcmVudDtcbiAgY29uc3QgcGFyZW50ID0gcGFyZW50Tm9kZSA/IHBhcmVudE5vZGUubmF0aXZlIDogbnVsbDtcbiAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSBnZXRDaGlsZExOb2RlKHJvb3ROb2RlKTtcbiAgaWYgKHBhcmVudCkge1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICBsZXQgbmV4dE5vZGU6IExOb2RlfG51bGwgPSBudWxsO1xuICAgICAgY29uc3QgcmVuZGVyZXIgPSBjb250YWluZXIudmlldy5yZW5kZXJlcjtcbiAgICAgIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAgIGlmIChpbnNlcnRNb2RlKSB7XG4gICAgICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICAgICAgcmVuZGVyZXIuaW5zZXJ0QmVmb3JlKHBhcmVudCwgbm9kZS5uYXRpdmUgISwgYmVmb3JlTm9kZSBhcyBSTm9kZSB8IG51bGwpIDpcbiAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShub2RlLm5hdGl2ZSAhLCBiZWZvcmVOb2RlIGFzIFJOb2RlIHwgbnVsbCwgdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICAgICAgcmVuZGVyZXIucmVtb3ZlQ2hpbGQocGFyZW50IGFzIFJFbGVtZW50LCBub2RlLm5hdGl2ZSAhKTtcbiAgICAgICAgICAgIGlmIChyZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgICAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyRGVzdHJveU5vZGUrKztcbiAgICAgICAgICAgICAgcmVuZGVyZXIuZGVzdHJveU5vZGUobm9kZS5uYXRpdmUgISk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChub2RlLm5hdGl2ZSAhKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgbmV4dE5vZGUgPSBnZXROZXh0TE5vZGUobm9kZSk7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICAvLyBpZiB3ZSBnZXQgdG8gYSBjb250YWluZXIsIGl0IG11c3QgYmUgYSByb290IG5vZGUgb2YgYSB2aWV3IGJlY2F1c2Ugd2UgYXJlIG9ubHlcbiAgICAgICAgLy8gcHJvcGFnYXRpbmcgZG93biBpbnRvIGNoaWxkIHZpZXdzIC8gY29udGFpbmVycyBhbmQgbm90IGNoaWxkIGVsZW1lbnRzXG4gICAgICAgIGNvbnN0IGNoaWxkQ29udGFpbmVyRGF0YTogTENvbnRhaW5lciA9IChub2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhO1xuICAgICAgICBjaGlsZENvbnRhaW5lckRhdGEucmVuZGVyUGFyZW50ID0gcGFyZW50Tm9kZTtcbiAgICAgICAgbmV4dE5vZGUgPVxuICAgICAgICAgICAgY2hpbGRDb250YWluZXJEYXRhLnZpZXdzLmxlbmd0aCA/IGdldENoaWxkTE5vZGUoY2hpbGRDb250YWluZXJEYXRhLnZpZXdzWzBdKSA6IG51bGw7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgbmV4dE5vZGUgPSAobm9kZSBhcyBMUHJvamVjdGlvbk5vZGUpLmRhdGEuaGVhZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5leHROb2RlID0gZ2V0Q2hpbGRMTm9kZShub2RlIGFzIExWaWV3Tm9kZSk7XG4gICAgICB9XG4gICAgICBpZiAobmV4dE5vZGUgPT09IG51bGwpIHtcbiAgICAgICAgbm9kZSA9IGdldE5leHRPclBhcmVudFNpYmxpbmdOb2RlKG5vZGUsIHJvb3ROb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5vZGUgPSBuZXh0Tm9kZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBUcmF2ZXJzZXMgZG93biBhbmQgdXAgdGhlIHRyZWUgb2Ygdmlld3MgYW5kIGNvbnRhaW5lcnMgdG8gcmVtb3ZlIGxpc3RlbmVycyBhbmRcbiAqIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBOb3RlczpcbiAqICAtIEJlY2F1c2UgaXQncyB1c2VkIGZvciBvbkRlc3Ryb3kgY2FsbHMsIGl0IG5lZWRzIHRvIGJlIGJvdHRvbS11cC5cbiAqICAtIE11c3QgcHJvY2VzcyBjb250YWluZXJzIGluc3RlYWQgb2YgdGhlaXIgdmlld3MgdG8gYXZvaWQgc3BsaWNpbmdcbiAqICB3aGVuIHZpZXdzIGFyZSBkZXN0cm95ZWQgYW5kIHJlLWFkZGVkLlxuICogIC0gVXNpbmcgYSB3aGlsZSBsb29wIGJlY2F1c2UgaXQncyBmYXN0ZXIgdGhhbiByZWN1cnNpb25cbiAqICAtIERlc3Ryb3kgb25seSBjYWxsZWQgb24gbW92ZW1lbnQgdG8gc2libGluZyBvciBtb3ZlbWVudCB0byBwYXJlbnQgKGxhdGVyYWxseSBvciB1cClcbiAqXG4gKiAgQHBhcmFtIHJvb3RWaWV3IFRoZSB2aWV3IHRvIGRlc3Ryb3lcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlc3Ryb3lWaWV3VHJlZShyb290VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgLy8gSWYgdGhlIHZpZXcgaGFzIG5vIGNoaWxkcmVuLCB3ZSBjYW4gY2xlYW4gaXQgdXAgYW5kIHJldHVybiBlYXJseS5cbiAgaWYgKHJvb3RWaWV3LnRWaWV3LmNoaWxkSW5kZXggPT09IC0xKSB7XG4gICAgcmV0dXJuIGNsZWFuVXBWaWV3KHJvb3RWaWV3KTtcbiAgfVxuICBsZXQgdmlld09yQ29udGFpbmVyOiBMVmlld09yTENvbnRhaW5lcnxudWxsID0gZ2V0TFZpZXdDaGlsZChyb290Vmlldyk7XG5cbiAgd2hpbGUgKHZpZXdPckNvbnRhaW5lcikge1xuICAgIGxldCBuZXh0OiBMVmlld09yTENvbnRhaW5lcnxudWxsID0gbnVsbDtcblxuICAgIGlmICh2aWV3T3JDb250YWluZXIudmlld3MgJiYgdmlld09yQ29udGFpbmVyLnZpZXdzLmxlbmd0aCkge1xuICAgICAgbmV4dCA9IHZpZXdPckNvbnRhaW5lci52aWV3c1swXS5kYXRhO1xuICAgIH0gZWxzZSBpZiAodmlld09yQ29udGFpbmVyLnRWaWV3ICYmIHZpZXdPckNvbnRhaW5lci50Vmlldy5jaGlsZEluZGV4ID4gLTEpIHtcbiAgICAgIG5leHQgPSBnZXRMVmlld0NoaWxkKHZpZXdPckNvbnRhaW5lciBhcyBMVmlldyk7XG4gICAgfSBlbHNlIGlmICh2aWV3T3JDb250YWluZXIubmV4dCkge1xuICAgICAgLy8gT25seSBtb3ZlIHRvIHRoZSBzaWRlIGFuZCBjbGVhbiBpZiBvcGVyYXRpbmcgYmVsb3cgcm9vdFZpZXcgLVxuICAgICAgLy8gb3RoZXJ3aXNlIHdlIHdvdWxkIHN0YXJ0IGNsZWFuaW5nIHVwIHNpYmxpbmcgdmlld3Mgb2YgdGhlIHJvb3RWaWV3LlxuICAgICAgY2xlYW5VcFZpZXcodmlld09yQ29udGFpbmVyIGFzIExWaWV3KTtcbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIubmV4dDtcbiAgICB9XG5cbiAgICBpZiAobmV4dCA9PSBudWxsKSB7XG4gICAgICAvLyBJZiB0aGUgdmlld09yQ29udGFpbmVyIGlzIHRoZSByb290VmlldyBhbmQgbmV4dCBpcyBudWxsIGl0IG1lYW5zIHRoYXQgd2UgYXJlIGRlYWxpbmdcbiAgICAgIC8vIHdpdGggYSByb290IHZpZXcgdGhhdCBkb2Vzbid0IGhhdmUgY2hpbGRyZW4uIFdlIGRpZG4ndCBkZXNjZW5kIGludG8gY2hpbGQgdmlld3NcbiAgICAgIC8vIHNvIG5vIG5lZWQgdG8gZ28gYmFjayB1cCB0aGUgdmlld3MgdHJlZS5cbiAgICAgIHdoaWxlICh2aWV3T3JDb250YWluZXIgJiYgIXZpZXdPckNvbnRhaW5lciAhLm5leHQgJiYgdmlld09yQ29udGFpbmVyICE9PSByb290Vmlldykge1xuICAgICAgICBjbGVhblVwVmlldyh2aWV3T3JDb250YWluZXIgYXMgTFZpZXcpO1xuICAgICAgICB2aWV3T3JDb250YWluZXIgPSBnZXRQYXJlbnRTdGF0ZSh2aWV3T3JDb250YWluZXIsIHJvb3RWaWV3KTtcbiAgICAgIH1cbiAgICAgIGNsZWFuVXBWaWV3KHZpZXdPckNvbnRhaW5lciBhcyBMVmlldyB8fCByb290Vmlldyk7XG5cbiAgICAgIG5leHQgPSB2aWV3T3JDb250YWluZXIgJiYgdmlld09yQ29udGFpbmVyLm5leHQ7XG4gICAgfVxuICAgIHZpZXdPckNvbnRhaW5lciA9IG5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnNlcnRzIGEgdmlldyBpbnRvIGEgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgYWRkcyB0aGUgdmlldyB0byB0aGUgY29udGFpbmVyJ3MgYXJyYXkgb2YgYWN0aXZlIHZpZXdzIGluIHRoZSBjb3JyZWN0XG4gKiBwb3NpdGlvbi4gSXQgYWxzbyBhZGRzIHRoZSB2aWV3J3MgZWxlbWVudHMgdG8gdGhlIERPTSBpZiB0aGUgY29udGFpbmVyIGlzbid0IGFcbiAqIHJvb3Qgbm9kZSBvZiBhbm90aGVyIHZpZXcgKGluIHRoYXQgY2FzZSwgdGhlIHZpZXcncyBlbGVtZW50cyB3aWxsIGJlIGFkZGVkIHdoZW5cbiAqIHRoZSBjb250YWluZXIncyBwYXJlbnQgdmlldyBpcyBhZGRlZCBsYXRlcikuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgY29udGFpbmVyIGludG8gd2hpY2ggdGhlIHZpZXcgc2hvdWxkIGJlIGluc2VydGVkXG4gKiBAcGFyYW0gdmlld05vZGUgVGhlIHZpZXcgdG8gaW5zZXJ0XG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRvIGluc2VydCB0aGUgdmlld1xuICogQHJldHVybnMgVGhlIGluc2VydGVkIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydFZpZXcoXG4gICAgY29udGFpbmVyOiBMQ29udGFpbmVyTm9kZSwgdmlld05vZGU6IExWaWV3Tm9kZSwgaW5kZXg6IG51bWJlcik6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGFpbmVyLmRhdGE7XG4gIGNvbnN0IHZpZXdzID0gc3RhdGUudmlld3M7XG5cbiAgaWYgKGluZGV4ID4gMCkge1xuICAgIC8vIFRoaXMgaXMgYSBuZXcgdmlldywgd2UgbmVlZCB0byBhZGQgaXQgdG8gdGhlIGNoaWxkcmVuLlxuICAgIHZpZXdzW2luZGV4IC0gMV0uZGF0YS5uZXh0ID0gdmlld05vZGUuZGF0YSBhcyBMVmlldztcbiAgfVxuXG4gIGlmIChpbmRleCA8IHZpZXdzLmxlbmd0aCkge1xuICAgIHZpZXdOb2RlLmRhdGEubmV4dCA9IHZpZXdzW2luZGV4XS5kYXRhO1xuICAgIHZpZXdzLnNwbGljZShpbmRleCwgMCwgdmlld05vZGUpO1xuICB9IGVsc2Uge1xuICAgIHZpZXdzLnB1c2godmlld05vZGUpO1xuICAgIHZpZXdOb2RlLmRhdGEubmV4dCA9IG51bGw7XG4gIH1cblxuICAvLyBOb3RpZnkgcXVlcnkgdGhhdCBhIG5ldyB2aWV3IGhhcyBiZWVuIGFkZGVkXG4gIGNvbnN0IGxWaWV3ID0gdmlld05vZGUuZGF0YTtcbiAgaWYgKGxWaWV3LnF1ZXJpZXMpIHtcbiAgICBsVmlldy5xdWVyaWVzLmluc2VydFZpZXcoaW5kZXgpO1xuICB9XG5cbiAgLy8gSWYgdGhlIGNvbnRhaW5lcidzIHJlbmRlclBhcmVudCBpcyBudWxsLCB3ZSBrbm93IHRoYXQgaXQgaXMgYSByb290IG5vZGUgb2YgaXRzIG93biBwYXJlbnQgdmlld1xuICAvLyBhbmQgd2Ugc2hvdWxkIHdhaXQgdW50aWwgdGhhdCBwYXJlbnQgcHJvY2Vzc2VzIGl0cyBub2RlcyAob3RoZXJ3aXNlLCB3ZSB3aWxsIGluc2VydCB0aGlzIHZpZXcnc1xuICAvLyBub2RlcyB0d2ljZSAtIG9uY2Ugbm93IGFuZCBvbmNlIHdoZW4gaXRzIHBhcmVudCBpbnNlcnRzIGl0cyB2aWV3cykuXG4gIGlmIChjb250YWluZXIuZGF0YS5yZW5kZXJQYXJlbnQgIT09IG51bGwpIHtcbiAgICBsZXQgYmVmb3JlTm9kZSA9IGZpbmROZXh0Uk5vZGVTaWJsaW5nKHZpZXdOb2RlLCBjb250YWluZXIpO1xuXG4gICAgaWYgKCFiZWZvcmVOb2RlKSB7XG4gICAgICBsZXQgY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPSBjb250YWluZXIubmF0aXZlO1xuICAgICAgaWYgKGNvbnRhaW5lck5leHROYXRpdmVOb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGFpbmVyTmV4dE5hdGl2ZU5vZGUgPSBjb250YWluZXIubmF0aXZlID0gZmluZE5leHRSTm9kZVNpYmxpbmcoY29udGFpbmVyLCBudWxsKTtcbiAgICAgIH1cbiAgICAgIGJlZm9yZU5vZGUgPSBjb250YWluZXJOZXh0TmF0aXZlTm9kZTtcbiAgICB9XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZSwgdHJ1ZSwgYmVmb3JlTm9kZSk7XG4gIH1cblxuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKlxuICogUmVtb3ZlcyBhIHZpZXcgZnJvbSBhIGNvbnRhaW5lci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBzcGxpY2VzIHRoZSB2aWV3IGZyb20gdGhlIGNvbnRhaW5lcidzIGFycmF5IG9mIGFjdGl2ZSB2aWV3cy4gSXQgYWxzb1xuICogcmVtb3ZlcyB0aGUgdmlldydzIGVsZW1lbnRzIGZyb20gdGhlIERPTSBhbmQgY29uZHVjdHMgY2xlYW51cCAoZS5nLiByZW1vdmluZ1xuICogbGlzdGVuZXJzLCBjYWxsaW5nIG9uRGVzdHJveXMpLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIGNvbnRhaW5lciBmcm9tIHdoaWNoIHRvIHJlbW92ZSBhIHZpZXdcbiAqIEBwYXJhbSByZW1vdmVJbmRleCBUaGUgaW5kZXggb2YgdGhlIHZpZXcgdG8gcmVtb3ZlXG4gKiBAcmV0dXJucyBUaGUgcmVtb3ZlZCB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVWaWV3KGNvbnRhaW5lcjogTENvbnRhaW5lck5vZGUsIHJlbW92ZUluZGV4OiBudW1iZXIpOiBMVmlld05vZGUge1xuICBjb25zdCB2aWV3cyA9IGNvbnRhaW5lci5kYXRhLnZpZXdzO1xuICBjb25zdCB2aWV3Tm9kZSA9IHZpZXdzW3JlbW92ZUluZGV4XTtcbiAgaWYgKHJlbW92ZUluZGV4ID4gMCkge1xuICAgIHZpZXdzW3JlbW92ZUluZGV4IC0gMV0uZGF0YS5uZXh0ID0gdmlld05vZGUuZGF0YS5uZXh0IGFzIExWaWV3O1xuICB9XG4gIHZpZXdzLnNwbGljZShyZW1vdmVJbmRleCwgMSk7XG4gIGRlc3Ryb3lWaWV3VHJlZSh2aWV3Tm9kZS5kYXRhKTtcbiAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIoY29udGFpbmVyLCB2aWV3Tm9kZSwgZmFsc2UpO1xuXG4gIC8vIE5vdGlmeSBxdWVyeSB0aGF0IHZpZXcgaGFzIGJlZW4gcmVtb3ZlZFxuICBjb25zdCByZW1vdmVkTHZpZXcgPSB2aWV3Tm9kZS5kYXRhO1xuICBpZiAocmVtb3ZlZEx2aWV3LnF1ZXJpZXMpIHtcbiAgICByZW1vdmVkTHZpZXcucXVlcmllcy5yZW1vdmVWaWV3KHJlbW92ZUluZGV4KTtcbiAgfVxuXG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuLyoqIEdldHMgdGhlIGNoaWxkIG9mIHRoZSBnaXZlbiBMVmlldyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldExWaWV3Q2hpbGQodmlldzogTFZpZXcpOiBMVmlld3xMQ29udGFpbmVyfG51bGwge1xuICBpZiAodmlldy50Vmlldy5jaGlsZEluZGV4ID09PSAtMSkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3QgaG9zdE5vZGU6IExFbGVtZW50Tm9kZXxMQ29udGFpbmVyTm9kZSA9IHZpZXcuZGF0YVt2aWV3LnRWaWV3LmNoaWxkSW5kZXhdO1xuXG4gIHJldHVybiBob3N0Tm9kZS5kYXRhID8gaG9zdE5vZGUuZGF0YSA6IChob3N0Tm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG59XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGljaCBMVmlld09yTENvbnRhaW5lciB0byBqdW1wIHRvIHdoZW4gdHJhdmVyc2luZyBiYWNrIHVwIHRoZVxuICogdHJlZSBpbiBkZXN0cm95Vmlld1RyZWUuXG4gKlxuICogTm9ybWFsbHksIHRoZSB2aWV3J3MgcGFyZW50IExWaWV3IHNob3VsZCBiZSBjaGVja2VkLCBidXQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGVtYmVkZGVkIHZpZXdzLCB0aGUgY29udGFpbmVyICh3aGljaCBpcyB0aGUgdmlldyBub2RlJ3MgcGFyZW50LCBidXQgbm90IHRoZVxuICogTFZpZXcncyBwYXJlbnQpIG5lZWRzIHRvIGJlIGNoZWNrZWQgZm9yIGEgcG9zc2libGUgbmV4dCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3T3JMQ29udGFpbmVyIGZvciB3aGljaCB3ZSBuZWVkIGEgcGFyZW50IHN0YXRlXG4gKiBAcGFyYW0gcm9vdFZpZXcgVGhlIHJvb3RWaWV3LCBzbyB3ZSBkb24ndCBwcm9wYWdhdGUgdG9vIGZhciB1cCB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgY29ycmVjdCBwYXJlbnQgTFZpZXdPckxDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudFN0YXRlKHN0YXRlOiBMVmlld09yTENvbnRhaW5lciwgcm9vdFZpZXc6IExWaWV3KTogTFZpZXdPckxDb250YWluZXJ8bnVsbCB7XG4gIGxldCBub2RlO1xuICBpZiAoKG5vZGUgPSAoc3RhdGUgYXMgTFZpZXcpICEubm9kZSkgJiYgbm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIC8vIGlmIGl0J3MgYW4gZW1iZWRkZWQgdmlldywgdGhlIHN0YXRlIG5lZWRzIHRvIGdvIHVwIHRvIHRoZSBjb250YWluZXIsIGluIGNhc2UgdGhlXG4gICAgLy8gY29udGFpbmVyIGhhcyBhIG5leHRcbiAgICByZXR1cm4gZ2V0UGFyZW50TE5vZGUobm9kZSkgIS5kYXRhIGFzIGFueTtcbiAgfSBlbHNlIHtcbiAgICAvLyBvdGhlcndpc2UsIHVzZSBwYXJlbnQgdmlldyBmb3IgY29udGFpbmVycyBvciBjb21wb25lbnQgdmlld3NcbiAgICByZXR1cm4gc3RhdGUucGFyZW50ID09PSByb290VmlldyA/IG51bGwgOiBzdGF0ZS5wYXJlbnQ7XG4gIH1cbn1cblxuLyoqXG4gKiBSZW1vdmVzIGFsbCBsaXN0ZW5lcnMgYW5kIGNhbGwgYWxsIG9uRGVzdHJveXMgaW4gYSBnaXZlbiB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlldyB0byBjbGVhbiB1cFxuICovXG5mdW5jdGlvbiBjbGVhblVwVmlldyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICByZW1vdmVMaXN0ZW5lcnModmlldyk7XG4gIGV4ZWN1dGVPbkRlc3Ryb3lzKHZpZXcpO1xuICBleGVjdXRlUGlwZU9uRGVzdHJveXModmlldyk7XG4gIC8vIEZvciBjb21wb25lbnQgdmlld3Mgb25seSwgdGhlIGxvY2FsIHJlbmRlcmVyIGlzIGRlc3Ryb3llZCBhcyBjbGVhbiB1cCB0aW1lLlxuICBpZiAodmlldy50VmlldyAmJiB2aWV3LnRWaWV3LmlkID09PSAtMSAmJiBpc1Byb2NlZHVyYWxSZW5kZXJlcih2aWV3LnJlbmRlcmVyKSkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJEZXN0cm95Kys7XG4gICAgdmlldy5yZW5kZXJlci5kZXN0cm95KCk7XG4gIH1cbn1cblxuLyoqIFJlbW92ZXMgbGlzdGVuZXJzIGFuZCB1bnN1YnNjcmliZXMgZnJvbSBvdXRwdXQgc3Vic2NyaXB0aW9ucyAqL1xuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXJzKHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IGNsZWFudXAgPSB2aWV3LmNsZWFudXAgITtcbiAgaWYgKGNsZWFudXAgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xlYW51cC5sZW5ndGggLSAxOyBpICs9IDIpIHtcbiAgICAgIGlmICh0eXBlb2YgY2xlYW51cFtpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgY2xlYW51cCAhW2kgKyAxXS5yZW1vdmVFdmVudExpc3RlbmVyKGNsZWFudXBbaV0sIGNsZWFudXBbaSArIDJdLCBjbGVhbnVwW2kgKyAzXSk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNsZWFudXBbaV0uY2FsbChjbGVhbnVwW2kgKyAxXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHZpZXcuY2xlYW51cCA9IG51bGw7XG4gIH1cbn1cblxuLyoqIENhbGxzIG9uRGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlT25EZXN0cm95cyh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IHZpZXcudFZpZXc7XG4gIGxldCBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGw7XG4gIGlmICh0VmlldyAhPSBudWxsICYmIChkZXN0cm95SG9va3MgPSB0Vmlldy5kZXN0cm95SG9va3MpICE9IG51bGwpIHtcbiAgICBjYWxsSG9va3Modmlldy5kaXJlY3RpdmVzICEsIGRlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqIENhbGxzIHBpcGUgZGVzdHJveSBob29rcyBmb3IgdGhpcyB2aWV3ICovXG5mdW5jdGlvbiBleGVjdXRlUGlwZU9uRGVzdHJveXModmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgcGlwZURlc3Ryb3lIb29rcyA9IHZpZXcudFZpZXcgJiYgdmlldy50Vmlldy5waXBlRGVzdHJveUhvb2tzO1xuICBpZiAocGlwZURlc3Ryb3lIb29rcykge1xuICAgIGNhbGxIb29rcyh2aWV3LmRhdGEgISwgcGlwZURlc3Ryb3lIb29rcyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHdoZXRoZXIgYSBuYXRpdmUgZWxlbWVudCBzaG91bGQgYmUgaW5zZXJ0ZWQgaW4gdGhlIGdpdmVuIHBhcmVudC5cbiAqXG4gKiBUaGUgbmF0aXZlIG5vZGUgY2FuIGJlIGluc2VydGVkIHdoZW4gaXRzIHBhcmVudCBpczpcbiAqIC0gQSByZWd1bGFyIGVsZW1lbnQgPT4gWWVzXG4gKiAtIEEgY29tcG9uZW50IGhvc3QgZWxlbWVudCA9PlxuICogICAgLSBpZiB0aGUgYGN1cnJlbnRWaWV3YCA9PT0gdGhlIHBhcmVudCBgdmlld2A6IFRoZSBlbGVtZW50IGlzIGluIHRoZSBjb250ZW50ICh2cyB0aGVcbiAqICAgICAgdGVtcGxhdGUpXG4gKiAgICAgID0+IGRvbid0IGFkZCBhcyB0aGUgcGFyZW50IGNvbXBvbmVudCB3aWxsIHByb2plY3QgaWYgbmVlZGVkLlxuICogICAgLSBgY3VycmVudFZpZXdgICE9PSB0aGUgcGFyZW50IGB2aWV3YCA9PiBUaGUgZWxlbWVudCBpcyBpbiB0aGUgdGVtcGxhdGUgKHZzIHRoZSBjb250ZW50KSxcbiAqICAgICAgYWRkIGl0XG4gKiAtIFZpZXcgZWxlbWVudCA9PiBkZWxheSBpbnNlcnRpb24sIHdpbGwgYmUgZG9uZSBvbiBgdmlld0VuZCgpYFxuICpcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCBpbiB3aGljaCB0byBpbnNlcnQgdGhlIGNoaWxkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIExWaWV3IGJlaW5nIHByb2Nlc3NlZFxuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgdGhlIGNoaWxkIGVsZW1lbnQgc2hvdWxkIGJlIGluc2VydGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQ6IExOb2RlLCBjdXJyZW50VmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgY29uc3QgcGFyZW50SXNFbGVtZW50ID0gcGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50O1xuXG4gIHJldHVybiBwYXJlbnRJc0VsZW1lbnQgJiZcbiAgICAgIChwYXJlbnQudmlldyAhPT0gY3VycmVudFZpZXcgfHwgcGFyZW50LmRhdGEgPT09IG51bGwgLyogUmVndWxhciBFbGVtZW50LiAqLyk7XG59XG5cbi8qKlxuICogQXBwZW5kcyB0aGUgYGNoaWxkYCBlbGVtZW50IHRvIHRoZSBgcGFyZW50YC5cbiAqXG4gKiBUaGUgZWxlbWVudCBpbnNlcnRpb24gbWlnaHQgYmUgZGVsYXllZCB7QGxpbmsgY2FuSW5zZXJ0TmF0aXZlTm9kZX1cbiAqXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgdG8gd2hpY2ggdG8gYXBwZW5kIHRoZSBjaGlsZFxuICogQHBhcmFtIGNoaWxkIFRoZSBjaGlsZCB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBjdXJyZW50IExWaWV3XG4gKiBAcmV0dXJucyBXaGV0aGVyIG9yIG5vdCB0aGUgY2hpbGQgd2FzIGFwcGVuZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhcHBlbmRDaGlsZChwYXJlbnQ6IExOb2RlLCBjaGlsZDogUk5vZGUgfCBudWxsLCBjdXJyZW50VmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgaWYgKGNoaWxkICE9PSBudWxsICYmIGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50LCBjdXJyZW50VmlldykpIHtcbiAgICAvLyBXZSBvbmx5IGFkZCBlbGVtZW50IGlmIG5vdCBpbiBWaWV3IG9yIG5vdCBwcm9qZWN0ZWQuXG4gICAgY29uc3QgcmVuZGVyZXIgPSBjdXJyZW50Vmlldy5yZW5kZXJlcjtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hcHBlbmRDaGlsZChwYXJlbnQubmF0aXZlICFhcyBSRWxlbWVudCwgY2hpbGQpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQubmF0aXZlICEuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBBcHBlbmRzIGEgcHJvamVjdGVkIG5vZGUgdG8gdGhlIERPTSwgb3IgaW4gdGhlIGNhc2Ugb2YgYSBwcm9qZWN0ZWQgY29udGFpbmVyLFxuICogYXBwZW5kcyB0aGUgbm9kZXMgZnJvbSBhbGwgb2YgdGhlIGNvbnRhaW5lcidzIGFjdGl2ZSB2aWV3cyB0byB0aGUgRE9NLlxuICpcbiAqIEBwYXJhbSBub2RlIFRoZSBub2RlIHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBjdXJyZW50UGFyZW50IFRoZSBsYXN0IHBhcmVudCBlbGVtZW50IHRvIGJlIHByb2Nlc3NlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IEN1cnJlbnQgTFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgbm9kZTogTEVsZW1lbnROb2RlIHwgTFRleHROb2RlIHwgTENvbnRhaW5lck5vZGUsIGN1cnJlbnRQYXJlbnQ6IExFbGVtZW50Tm9kZSxcbiAgICBjdXJyZW50VmlldzogTFZpZXcpOiB2b2lkIHtcbiAgaWYgKG5vZGUudE5vZGUudHlwZSAhPT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIGFwcGVuZENoaWxkKGN1cnJlbnRQYXJlbnQsIChub2RlIGFzIExFbGVtZW50Tm9kZSB8IExUZXh0Tm9kZSkubmF0aXZlLCBjdXJyZW50Vmlldyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlIG5vZGUgd2UgYXJlIGFkZGluZyBpcyBhIENvbnRhaW5lciBhbmQgd2UgYXJlIGFkZGluZyBpdCB0byBFbGVtZW50IHdoaWNoXG4gICAgLy8gaXMgbm90IGEgY29tcG9uZW50IChubyBtb3JlIHJlLXByb2plY3Rpb24pLlxuICAgIC8vIEFsdGVybmF0aXZlbHkgYSBjb250YWluZXIgaXMgcHJvamVjdGVkIGF0IHRoZSByb290IG9mIGEgY29tcG9uZW50J3MgdGVtcGxhdGVcbiAgICAvLyBhbmQgY2FuJ3QgYmUgcmUtcHJvamVjdGVkIChhcyBub3QgY29udGVudCBvZiBhbnkgY29tcG9uZW50KS5cbiAgICAvLyBBc3NpZ25lZSB0aGUgZmluYWwgcHJvamVjdGlvbiBsb2NhdGlvbiBpbiB0aG9zZSBjYXNlcy5cbiAgICBjb25zdCBsQ29udGFpbmVyID0gKG5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGE7XG4gICAgbENvbnRhaW5lci5yZW5kZXJQYXJlbnQgPSBjdXJyZW50UGFyZW50O1xuICAgIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lci52aWV3cztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcihub2RlIGFzIExDb250YWluZXJOb2RlLCB2aWV3c1tpXSwgdHJ1ZSwgbnVsbCk7XG4gICAgfVxuICB9XG4gIGlmIChub2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgIG5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGEucmVuZGVyUGFyZW50ID0gY3VycmVudFBhcmVudDtcbiAgfVxufVxuIl19