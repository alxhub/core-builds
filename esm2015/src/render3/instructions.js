/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { assertEqual, assertLessThan, assertNotEqual, assertNotNull, assertNull, assertSame } from './assert';
import { NG_PROJECT_AS_ATTR_NAME } from './interfaces/projection';
import { assertNodeType } from './node_assert';
import { appendChild, insertView, appendProjectedNode, removeView, canInsertNativeNode, createTextNode, getNextLNode, getChildLNode, getParentLNode, getLViewChild } from './node_manipulation';
import { isNodeMatchingSelectorList, matchingSelectorIndex } from './node_selector_matcher';
import { RendererStyleFlags3, isProceduralRenderer } from './interfaces/renderer';
import { isDifferent, stringify } from './util';
import { executeHooks, queueLifecycleHooks, queueInitHooks, executeInitHooks } from './hooks';
import { throwCyclicDependencyError, throwErrorIfNoChangesMode, throwMultipleComponentError } from './errors';
/**
 * Directive (D) sets a property on all component instances using this constant as a key and the
 * component's host node (LElement) as the value. This is used in methods like detectChanges to
 * facilitate jumping from an instance to the host node.
 */
export const NG_HOST_SYMBOL = '__ngHostLNode__';
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 */
const _CLEAN_PROMISE = Promise.resolve(null);
/**
 * Directive and element indices for top-level directive.
 *
 * Saved here to avoid re-instantiating an array on every change detection run.
 */
export const _ROOT_DIRECTIVE_INDICES = [0, 0];
/**
 * Token set in currentMatches while dependencies are being resolved.
 *
 * If we visit a directive that has a value set to CIRCULAR, we know we've
 * already seen it, and thus have a circular dependency.
 */
export const CIRCULAR = '__CIRCULAR__';
/**
 * This property gets set before entering a template.
 *
 * This renderer can be one of two varieties of Renderer3:
 *
 * - ObjectedOrientedRenderer3
 *
 * This is the native browser API style, e.g. operations are methods on individual objects
 * like HTMLElement. With this style, no additional code is needed as a facade (reducing payload
 * size).
 *
 * - ProceduralRenderer3
 *
 * In non-native browser environments (e.g. platforms such as web-workers), this is the facade
 * that enables element manipulation. This also facilitates backwards compatibility with
 * Renderer2.
 */
let renderer;
let rendererFactory;
export function getRenderer() {
    // top level variables should not be exported for performance reason (PERF_NOTES.md)
    return renderer;
}
export function getCurrentSanitizer() {
    return currentView && currentView.sanitizer;
}
/** Used to set the parent property when nodes are created. */
let previousOrParentNode;
export function getPreviousOrParentNode() {
    // top level variables should not be exported for performance reason (PERF_NOTES.md)
    return previousOrParentNode;
}
/**
 * If `isParent` is:
 *  - `true`: then `previousOrParentNode` points to a parent node.
 *  - `false`: then `previousOrParentNode` points to previous node (sibling).
 */
let isParent;
/**
 * Static data that corresponds to the instance-specific data array on an LView.
 *
 * Each node's static data is stored in tData at the same index that it's stored
 * in the data array. Any nodes that do not have static data store a null value in
 * tData to avoid a sparse array.
 */
let tData;
/**
 * State of the current view being processed.
 *
 * NOTE: we cheat here and initialize it to `null` even thought the type does not
 * contain `null`. This is because we expect this value to be not `null` as soon
 * as we enter the view. Declaring the type as `null` would require us to place `!`
 * in most instructions since they all assume that `currentView` is defined.
 */
let currentView = null;
let currentQueries;
export function getCurrentQueries(QueryType) {
    // top level variables should not be exported for performance reason (PERF_NOTES.md)
    return currentQueries || (currentQueries = new QueryType());
}
/**
 * This property gets set before entering a template.
 */
let creationMode;
export function getCreationMode() {
    // top level variables should not be exported for performance reason (PERF_NOTES.md)
    return creationMode;
}
/**
 * An array of nodes (text, element, container, etc), pipes, their bindings, and
 * any local variables that need to be stored between invocations.
 */
let data;
/**
 * An array of directive instances in the current view.
 *
 * These must be stored separately from LNodes because their presence is
 * unknown at compile-time and thus space cannot be reserved in data[].
 */
let directives;
/**
 * When a view is destroyed, listeners need to be released and outputs need to be
 * unsubscribed. This cleanup array stores both listener data (in chunks of 4)
 * and output data (in chunks of 2) for a particular view. Combining the arrays
 * saves on memory (70 bytes per array) and on a few bytes of code size (for two
 * separate for loops).
 *
 * If it's a listener being stored:
 * 1st index is: event name to remove
 * 2nd index is: native element
 * 3rd index is: listener function
 * 4th index is: useCapture boolean
 *
 * If it's an output subscription:
 * 1st index is: unsubscribe function
 * 2nd index is: context for function
 */
let cleanup;
/**
 * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
 *
 * Necessary to support ChangeDetectorRef.checkNoChanges().
 */
let checkNoChangesMode = false;
/** Whether or not this is the first time the current view has been processed. */
let firstTemplatePass = true;
/**
 * Swap the current state with a new state.
 *
 * For performance reasons we store the state in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the state for later, and when the view is
 * exited the state has to be restored
 *
 * @param newView New state to become active
 * @param host Element to which the View is a child of
 * @returns the previous state;
 */
export function enterView(newView, host) {
    const oldView = currentView;
    data = newView && newView.data;
    directives = newView && newView.directives;
    tData = newView && newView.tView.data;
    creationMode = newView && (newView.flags & 1 /* CreationMode */) === 1 /* CreationMode */;
    firstTemplatePass = newView && newView.tView.firstTemplatePass;
    cleanup = newView && newView.cleanup;
    renderer = newView && newView.renderer;
    if (host != null) {
        previousOrParentNode = host;
        isParent = true;
    }
    currentView = newView;
    currentQueries = newView && newView.queries;
    return oldView;
}
/**
 * Used in lieu of enterView to make it clear when we are exiting a child view. This makes
 * the direction of traversal (up or down the view tree) a bit clearer.
 *
 * @param newView New state to become active
 * @param creationOnly An optional boolean to indicate that the view was processed in creation mode
 * only, i.e. the first update will be done later. Only possible for dynamically created views.
 */
export function leaveView(newView, creationOnly) {
    if (!creationOnly) {
        if (!checkNoChangesMode) {
            executeHooks(directives, currentView.tView.viewHooks, currentView.tView.viewCheckHooks, creationMode);
        }
        // Views are clean and in update mode after being checked, so these bits are cleared
        currentView.flags &= ~(1 /* CreationMode */ | 4 /* Dirty */);
    }
    currentView.flags |= 16 /* RunInit */;
    currentView.bindingIndex = -1;
    enterView(newView, null);
}
/**
 * Refreshes the view, executing the following steps in that order:
 * triggers init hooks, refreshes dynamic children, triggers content hooks, sets host bindings,
 * refreshes child components.
 * Note: view hooks are triggered later when leaving the view.
 * */
function refreshView() {
    const tView = currentView.tView;
    if (!checkNoChangesMode) {
        executeInitHooks(currentView, tView, creationMode);
    }
    refreshDynamicChildren();
    if (!checkNoChangesMode) {
        executeHooks(directives, tView.contentHooks, tView.contentCheckHooks, creationMode);
    }
    // This needs to be set before children are processed to support recursive components
    tView.firstTemplatePass = firstTemplatePass = false;
    setHostBindings(tView.hostBindings);
    refreshChildComponents(tView.components);
}
/** Sets the host bindings for the current view. */
export function setHostBindings(bindings) {
    if (bindings != null) {
        const defs = currentView.tView.directives;
        for (let i = 0; i < bindings.length; i += 2) {
            const dirIndex = bindings[i];
            const def = defs[dirIndex];
            def.hostBindings && def.hostBindings(dirIndex, bindings[i + 1]);
        }
    }
}
/** Refreshes child components in the current view. */
function refreshChildComponents(components) {
    if (components != null) {
        for (let i = 0; i < components.length; i += 2) {
            componentRefresh(components[i], components[i + 1]);
        }
    }
}
export function executeInitAndContentHooks() {
    if (!checkNoChangesMode) {
        const tView = currentView.tView;
        executeInitHooks(currentView, tView, creationMode);
        executeHooks(directives, tView.contentHooks, tView.contentCheckHooks, creationMode);
    }
}
export function createLView(renderer, tView, template, context, flags, sanitizer) {
    const newView = {
        parent: currentView,
        flags: flags | 1 /* CreationMode */ | 8 /* Attached */ | 16 /* RunInit */,
        node: null,
        data: [],
        directives: null,
        tView: tView,
        cleanup: null,
        renderer: renderer,
        tail: null,
        next: null,
        bindingIndex: -1,
        template: template,
        context: context,
        queries: null,
        injector: currentView && currentView.injector,
        sanitizer: sanitizer || null
    };
    return newView;
}
/**
 * Creation of LNode object is extracted to a separate function so we always create LNode object
 * with the same shape
 * (same properties assigned in the same order).
 */
export function createLNodeObject(type, currentView, parent, native, state, queries) {
    return {
        native: native,
        view: currentView,
        nodeInjector: parent ? parent.nodeInjector : null,
        data: state,
        queries: queries,
        tNode: null,
        pNextOrParent: null,
        dynamicLContainerNode: null
    };
}
export function createLNode(index, type, native, name, attrs, state) {
    const parent = isParent ? previousOrParentNode :
        previousOrParentNode && getParentLNode(previousOrParentNode);
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    const tParent = parent && parent.view === currentView ? parent.tNode : null;
    let queries = (isParent ? currentQueries : previousOrParentNode && previousOrParentNode.queries) ||
        parent && parent.queries && parent.queries.child();
    const isState = state != null;
    const node = createLNodeObject(type, currentView, parent, native, isState ? state : null, queries);
    if (index === -1 || type === 2 /* View */) {
        // View nodes are not stored in data because they can be added / removed at runtime (which
        // would cause indices to change). Their TNodes are instead stored in TView.node.
        node.tNode = state.tView.node || createTNode(type, index, null, null, tParent, null);
    }
    else {
        // This is an element or container or projection node
        ngDevMode && assertDataNext(index);
        data[index] = node;
        // Every node adds a value to the static data array to avoid a sparse array
        if (index >= tData.length) {
            const tNode = tData[index] = createTNode(type, index, name, attrs, tParent, null);
            if (!isParent && previousOrParentNode) {
                const previousTNode = previousOrParentNode.tNode;
                previousTNode.next = tNode;
                if (previousTNode.dynamicContainerNode)
                    previousTNode.dynamicContainerNode.next = tNode;
            }
        }
        node.tNode = tData[index];
        // Now link ourselves into the tree.
        if (isParent) {
            currentQueries = null;
            if (previousOrParentNode.tNode.child == null && previousOrParentNode.view === currentView ||
                previousOrParentNode.tNode.type === 2 /* View */) {
                // We are in the same view, which means we are adding content node to the parent View.
                previousOrParentNode.tNode.child = node.tNode;
            }
        }
    }
    // View nodes and host elements need to set their host node (components set host nodes later)
    if ((type & 2 /* ViewOrElement */) === 2 /* ViewOrElement */ && isState) {
        // Bit of a hack to bust through the readonly because there is a circular dep between
        // LView and LNode.
        ngDevMode && assertNull(state.node, 'LView.node should not have been initialized');
        state.node = node;
        if (firstTemplatePass)
            state.tView.node = node.tNode;
    }
    previousOrParentNode = node;
    isParent = true;
    return node;
}
//////////////////////////
//// Render
//////////////////////////
/**
 * Resets the application state.
 */
function resetApplicationState() {
    isParent = false;
    previousOrParentNode = null;
}
/**
 *
 * @param hostNode Existing node to render into.
 * @param template Template function with the instructions.
 * @param context to pass into the template.
 * @param providedRendererFactory renderer factory to use
 * @param host The host element node to use
 * @param directives Directive defs that should be used for matching
 * @param pipes Pipe defs that should be used for matching
 */
export function renderTemplate(hostNode, template, context, providedRendererFactory, host, directives, pipes, sanitizer) {
    if (host == null) {
        resetApplicationState();
        rendererFactory = providedRendererFactory;
        const tView = getOrCreateTView(template, directives || null, pipes || null);
        host = createLNode(-1, 3 /* Element */, hostNode, null, null, createLView(providedRendererFactory.createRenderer(null, null), tView, null, {}, 2 /* CheckAlways */, sanitizer));
    }
    const hostView = host.data;
    ngDevMode && assertNotNull(hostView, 'Host node should have an LView defined in host.data.');
    renderComponentOrTemplate(host, hostView, context, template);
    return host;
}
/**
 * Used for rendering embedded views (e.g. dynamically created views)
 *
 * Dynamically created views must store/retrieve their TViews differently from component views
 * because their template functions are nested in the template functions of their hosts, creating
 * closures. If their host template happens to be an embedded template in a loop (e.g. ngFor inside
 * an ngFor), the nesting would mean we'd have multiple instances of the template function, so we
 * can't store TViews in the template function itself (as we do for comps). Instead, we store the
 * TView for dynamically created views on their host TNode, which only has one instance.
 */
export function renderEmbeddedTemplate(viewNode, tView, template, context, renderer, queries) {
    const _isParent = isParent;
    const _previousOrParentNode = previousOrParentNode;
    let oldView;
    let rf = 2 /* Update */;
    try {
        isParent = true;
        previousOrParentNode = null;
        if (viewNode == null) {
            const lView = createLView(renderer, tView, template, context, 2 /* CheckAlways */, getCurrentSanitizer());
            if (queries) {
                lView.queries = queries.createView();
            }
            viewNode = createLNode(-1, 2 /* View */, null, null, null, lView);
            rf = 1 /* Create */;
        }
        oldView = enterView(viewNode.data, viewNode);
        template(rf, context);
        if (rf & 2 /* Update */) {
            refreshView();
        }
        else {
            viewNode.data.tView.firstTemplatePass = firstTemplatePass = false;
        }
    }
    finally {
        // renderEmbeddedTemplate() is called twice in fact, once for creation only and then once for
        // update. When for creation only, leaveView() must not trigger view hooks, nor clean flags.
        const isCreationOnly = (rf & 1 /* Create */) === 1 /* Create */;
        leaveView(oldView, isCreationOnly);
        isParent = _isParent;
        previousOrParentNode = _previousOrParentNode;
    }
    return viewNode;
}
export function renderComponentOrTemplate(node, hostView, componentOrContext, template) {
    const oldView = enterView(hostView, node);
    try {
        if (rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (template) {
            template(getRenderFlags(hostView), componentOrContext);
            refreshView();
        }
        else {
            executeInitAndContentHooks();
            // Element was stored at 0 in data and directive was stored at 0 in directives
            // in renderComponent()
            setHostBindings(_ROOT_DIRECTIVE_INDICES);
            componentRefresh(0, 0);
        }
    }
    finally {
        if (rendererFactory.end) {
            rendererFactory.end();
        }
        leaveView(oldView);
    }
}
/**
 * This function returns the default configuration of rendering flags depending on when the
 * template is in creation mode or update mode. By default, the update block is run with the
 * creation block when the view is in creation mode. Otherwise, the update block is run
 * alone.
 *
 * Dynamically created views do NOT use this configuration (update block and create block are
 * always run separately).
 */
function getRenderFlags(view) {
    return view.flags & 1 /* CreationMode */ ? 1 /* Create */ | 2 /* Update */ :
        2 /* Update */;
}
//////////////////////////
//// Element
//////////////////////////
/**
 * Create DOM element. The instruction must later be followed by `elementEnd()` call.
 *
 * @param index Index of the element in the data array
 * @param name Name of the DOM Node
 * @param attrs Statically bound set of attributes to be written into the DOM element on creation.
 * @param localRefs A set of local reference bindings on the element.
 *
 * Attributes and localRefs are passed as an array of strings where elements with an even index
 * hold an attribute name and elements with an odd index hold an attribute value, ex.:
 * ['id', 'warning5', 'class', 'alert']
 */
export function elementStart(index, name, attrs, localRefs) {
    ngDevMode &&
        assertEqual(currentView.bindingIndex, -1, 'elements should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateElement++;
    const native = renderer.createElement(name);
    ngDevMode && assertDataInRange(index - 1);
    const node = createLNode(index, 3 /* Element */, native, name, attrs || null, null);
    if (attrs)
        setUpAttributes(native, attrs);
    appendChild(getParentLNode(node), native, currentView);
    createDirectivesAndLocals(localRefs);
    return native;
}
/**
 * Creates directive instances and populates local refs.
 *
 * @param localRefs Local refs of the current node
 */
function createDirectivesAndLocals(localRefs) {
    const node = previousOrParentNode;
    if (firstTemplatePass) {
        ngDevMode && ngDevMode.firstTemplatePass++;
        cacheMatchingDirectivesForNode(node.tNode, currentView.tView, localRefs || null);
    }
    else {
        instantiateDirectivesDirectly();
    }
    saveResolvedLocalsInData();
}
/**
 * On first template pass, we match each node against available directive selectors and save
 * the resulting defs in the correct instantiation order for subsequent change detection runs
 * (so dependencies are always created before the directives that inject them).
 */
function cacheMatchingDirectivesForNode(tNode, tView, localRefs) {
    // Please make sure to have explicit type for `exportsMap`. Inferred type triggers bug in tsickle.
    const exportsMap = localRefs ? { '': -1 } : null;
    const matches = tView.currentMatches = findDirectiveMatches(tNode);
    if (matches) {
        for (let i = 0; i < matches.length; i += 2) {
            const def = matches[i];
            const valueIndex = i + 1;
            resolveDirective(def, valueIndex, matches, tView);
            saveNameToExportMap(matches[valueIndex], def, exportsMap);
        }
    }
    if (exportsMap)
        cacheMatchingLocalNames(tNode, localRefs, exportsMap);
}
/** Matches the current node against all available selectors. */
function findDirectiveMatches(tNode) {
    const registry = currentView.tView.directiveRegistry;
    let matches = null;
    if (registry) {
        for (let i = 0; i < registry.length; i++) {
            const def = registry[i];
            if (isNodeMatchingSelectorList(tNode, def.selectors)) {
                if (def.template) {
                    if (tNode.flags & 4096 /* isComponent */)
                        throwMultipleComponentError(tNode);
                    tNode.flags = 4096 /* isComponent */;
                }
                if (def.diPublic)
                    def.diPublic(def);
                (matches || (matches = [])).push(def, null);
            }
        }
    }
    return matches;
}
export function resolveDirective(def, valueIndex, matches, tView) {
    if (matches[valueIndex] === null) {
        matches[valueIndex] = CIRCULAR;
        const instance = def.factory();
        (tView.directives || (tView.directives = [])).push(def);
        return directiveCreate(matches[valueIndex] = tView.directives.length - 1, instance, def);
    }
    else if (matches[valueIndex] === CIRCULAR) {
        // If we revisit this directive before it's resolved, we know it's circular
        throwCyclicDependencyError(def.type);
    }
    return null;
}
/** Stores index of component's host element so it will be queued for view refresh during CD. */
function queueComponentIndexForCheck(dirIndex) {
    if (firstTemplatePass) {
        (currentView.tView.components || (currentView.tView.components = [])).push(dirIndex, data.length - 1);
    }
}
/** Stores index of directive and host element so it will be queued for binding refresh during CD.
 */
function queueHostBindingForCheck(dirIndex) {
    ngDevMode &&
        assertEqual(firstTemplatePass, true, 'Should only be called in first template pass.');
    (currentView.tView.hostBindings || (currentView.tView.hostBindings = [])).push(dirIndex, data.length - 1);
}
/** Sets the context for a ChangeDetectorRef to the given instance. */
export function initChangeDetectorIfExisting(injector, instance, view) {
    if (injector && injector.changeDetectorRef != null) {
        injector.changeDetectorRef._setComponentContext(view, instance);
    }
}
export function isComponent(tNode) {
    return (tNode.flags & 4096 /* isComponent */) === 4096 /* isComponent */;
}
/**
 * This function instantiates the given directives.
 */
function instantiateDirectivesDirectly() {
    const tNode = previousOrParentNode.tNode;
    const count = tNode.flags & 4095 /* DirectiveCountMask */;
    if (count > 0) {
        const start = tNode.flags >> 13 /* DirectiveStartingIndexShift */;
        const end = start + count;
        const tDirectives = currentView.tView.directives;
        for (let i = start; i < end; i++) {
            const def = tDirectives[i];
            directiveCreate(i, def.factory(), def);
        }
    }
}
/** Caches local names and their matching directive indices for query and template lookups. */
function cacheMatchingLocalNames(tNode, localRefs, exportsMap) {
    if (localRefs) {
        const localNames = tNode.localNames = [];
        // Local names must be stored in tNode in the same order that localRefs are defined
        // in the template to ensure the data is loaded in the same slots as their refs
        // in the template (for template queries).
        for (let i = 0; i < localRefs.length; i += 2) {
            const index = exportsMap[localRefs[i + 1]];
            if (index == null)
                throw new Error(`Export of name '${localRefs[i + 1]}' not found!`);
            localNames.push(localRefs[i], index);
        }
    }
}
/**
 * Builds up an export map as directives are created, so local refs can be quickly mapped
 * to their directive instances.
 */
function saveNameToExportMap(index, def, exportsMap) {
    if (exportsMap) {
        if (def.exportAs)
            exportsMap[def.exportAs] = index;
        if (def.template)
            exportsMap[''] = index;
    }
}
/**
 * Takes a list of local names and indices and pushes the resolved local variable values
 * to data[] in the same order as they are loaded in the template with load().
 */
function saveResolvedLocalsInData() {
    const localNames = previousOrParentNode.tNode.localNames;
    if (localNames) {
        for (let i = 0; i < localNames.length; i += 2) {
            const index = localNames[i + 1];
            const value = index === -1 ? previousOrParentNode.native : directives[index];
            data.push(value);
        }
    }
}
/**
 * Gets TView from a template function or creates a new TView
 * if it doesn't already exist.
 *
 * @param template The template from which to get static data
 * @param directives Directive defs that should be saved on TView
 * @param pipes Pipe defs that should be saved on TView
 * @returns TView
 */
function getOrCreateTView(template, directives, pipes) {
    // TODO(misko): reading `ngPrivateData` here is problematic for two reasons
    // 1. It is a megamorphic call on each invocation.
    // 2. For nested embedded views (ngFor inside ngFor) the template instance is per
    //    outer template invocation, which means that no such property will exist
    // Correct solution is to only put `ngPrivateData` on the Component template
    // and not on embedded templates.
    return template.ngPrivateData ||
        (template.ngPrivateData = createTView(-1, directives, pipes));
}
/**
 * Creates a TView instance
 *
 * @param viewIndex The viewBlockId for inline views, or -1 if it's a component/dynamic
 * @param directives Registry of directives for this view
 * @param pipes Registry of pipes for this view
 */
export function createTView(viewIndex, directives, pipes) {
    ngDevMode && ngDevMode.tView++;
    return {
        id: viewIndex,
        node: null,
        data: [],
        childIndex: -1,
        bindingStartIndex: -1,
        directives: null,
        firstTemplatePass: true,
        initHooks: null,
        checkHooks: null,
        contentHooks: null,
        contentCheckHooks: null,
        viewHooks: null,
        viewCheckHooks: null,
        destroyHooks: null,
        pipeDestroyHooks: null,
        hostBindings: null,
        components: null,
        directiveRegistry: typeof directives === 'function' ? directives() : directives,
        pipeRegistry: typeof pipes === 'function' ? pipes() : pipes,
        currentMatches: null
    };
}
function setUpAttributes(native, attrs) {
    const isProc = isProceduralRenderer(renderer);
    for (let i = 0; i < attrs.length; i += 2) {
        const attrName = attrs[i];
        if (attrName === 1 /* SELECT_ONLY */)
            break;
        if (attrName !== NG_PROJECT_AS_ATTR_NAME) {
            const attrVal = attrs[i + 1];
            ngDevMode && ngDevMode.rendererSetAttribute++;
            isProc ?
                renderer
                    .setAttribute(native, attrName, attrVal) :
                native.setAttribute(attrName, attrVal);
        }
    }
}
export function createError(text, token) {
    return new Error(`Renderer: ${text} [${stringify(token)}]`);
}
/**
 * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
 *
 * @param elementOrSelector Render element or CSS selector to locate the element.
 */
export function locateHostElement(factory, elementOrSelector) {
    ngDevMode && assertDataInRange(-1);
    rendererFactory = factory;
    const defaultRenderer = factory.createRenderer(null, null);
    const rNode = typeof elementOrSelector === 'string' ?
        (isProceduralRenderer(defaultRenderer) ?
            defaultRenderer.selectRootElement(elementOrSelector) :
            defaultRenderer.querySelector(elementOrSelector)) :
        elementOrSelector;
    if (ngDevMode && !rNode) {
        if (typeof elementOrSelector === 'string') {
            throw createError('Host node with selector not found:', elementOrSelector);
        }
        else {
            throw createError('Host node is required:', elementOrSelector);
        }
    }
    return rNode;
}
/**
 * Creates the host LNode.
 *
 * @param rNode Render host element.
 * @param def ComponentDef
 *
 * @returns LElementNode created
 */
export function hostElement(tag, rNode, def, sanitizer) {
    resetApplicationState();
    const node = createLNode(0, 3 /* Element */, rNode, null, null, createLView(renderer, getOrCreateTView(def.template, def.directiveDefs, def.pipeDefs), null, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, sanitizer));
    if (firstTemplatePass) {
        node.tNode.flags = 4096 /* isComponent */;
        if (def.diPublic)
            def.diPublic(def);
        currentView.tView.directives = [def];
    }
    return node;
}
/**
 * Adds an event listener to the current node.
 *
 * If an output exists on one of the node's directives, it also subscribes to the output
 * and saves the subscription for later cleanup.
 *
 * @param eventName Name of the event
 * @param listenerFn The function to be called when event emits
 * @param useCapture Whether or not to use capture in event listener.
 */
export function listener(eventName, listenerFn, useCapture = false) {
    ngDevMode && assertPreviousIsParent();
    const node = previousOrParentNode;
    const native = node.native;
    // In order to match current behavior, native DOM event listeners must be added for all
    // events (including outputs).
    const cleanupFns = cleanup || (cleanup = currentView.cleanup = []);
    ngDevMode && ngDevMode.rendererAddEventListener++;
    if (isProceduralRenderer(renderer)) {
        const wrappedListener = wrapListenerWithDirtyLogic(currentView, listenerFn);
        const cleanupFn = renderer.listen(native, eventName, wrappedListener);
        cleanupFns.push(cleanupFn, null);
    }
    else {
        const wrappedListener = wrapListenerWithDirtyAndDefault(currentView, listenerFn);
        native.addEventListener(eventName, wrappedListener, useCapture);
        cleanupFns.push(eventName, native, wrappedListener, useCapture);
    }
    let tNode = node.tNode;
    if (tNode.outputs === undefined) {
        // if we create TNode here, inputs must be undefined so we know they still need to be
        // checked
        tNode.outputs = generatePropertyAliases(node.tNode.flags, 1 /* Output */);
    }
    const outputs = tNode.outputs;
    let outputData;
    if (outputs && (outputData = outputs[eventName])) {
        createOutput(outputData, listenerFn);
    }
}
/**
 * Iterates through the outputs associated with a particular event name and subscribes to
 * each output.
 */
function createOutput(outputs, listener) {
    for (let i = 0; i < outputs.length; i += 2) {
        ngDevMode && assertDataInRange(outputs[i], directives);
        const subscription = directives[outputs[i]][outputs[i + 1]].subscribe(listener);
        cleanup.push(subscription.unsubscribe, subscription);
    }
}
/** Mark the end of the element. */
export function elementEnd() {
    if (isParent) {
        isParent = false;
    }
    else {
        ngDevMode && assertHasParent();
        previousOrParentNode = getParentLNode(previousOrParentNode);
    }
    ngDevMode && assertNodeType(previousOrParentNode, 3 /* Element */);
    const queries = previousOrParentNode.queries;
    queries && queries.addNode(previousOrParentNode);
    queueLifecycleHooks(previousOrParentNode.tNode.flags, currentView);
}
/**
 * Updates the value of removes an attribute on an Element.
 *
 * @param number index The index of the element in the data array
 * @param name name The name of the attribute.
 * @param value value The attribute is removed when value is `null` or `undefined`.
 *                  Otherwise the attribute value is set to the stringified value.
 * @param sanitizer An optional function used to sanitize the value.
 */
export function elementAttribute(index, name, value, sanitizer) {
    if (value !== NO_CHANGE) {
        const element = data[index];
        if (value == null) {
            ngDevMode && ngDevMode.rendererRemoveAttribute++;
            isProceduralRenderer(renderer) ? renderer.removeAttribute(element.native, name) :
                element.native.removeAttribute(name);
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            const strValue = sanitizer == null ? stringify(value) : sanitizer(value);
            isProceduralRenderer(renderer) ? renderer.setAttribute(element.native, name, strValue) :
                element.native.setAttribute(name, strValue);
        }
    }
}
/**
 * Update a property on an Element.
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new @Inputs don't have to be re-compiled.
 *
 * @param index The index of the element to update in the data array
 * @param propName Name of property. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param value New value to write.
 * @param sanitizer An optional function used to sanitize the value.
 */
export function elementProperty(index, propName, value, sanitizer) {
    if (value === NO_CHANGE)
        return;
    const node = data[index];
    const tNode = node.tNode;
    // if tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked
    if (tNode && tNode.inputs === undefined) {
        // mark inputs as checked
        tNode.inputs = generatePropertyAliases(node.tNode.flags, 0 /* Input */);
    }
    const inputData = tNode && tNode.inputs;
    let dataValue;
    if (inputData && (dataValue = inputData[propName])) {
        setInputsForProperty(dataValue, value);
        markDirtyIfOnPush(node);
    }
    else {
        // It is assumed that the sanitizer is only added when the compiler determines that the property
        // is risky, so sanitization can be done without further checks.
        value = sanitizer != null ? sanitizer(value) : value;
        const native = node.native;
        ngDevMode && ngDevMode.rendererSetProperty++;
        isProceduralRenderer(renderer) ? renderer.setProperty(native, propName, value) :
            (native.setProperty ? native.setProperty(propName, value) :
                native[propName] = value);
    }
}
/**
 * Constructs a TNode object from the arguments.
 *
 * @param type The type of the node
 * @param index The index of the TNode in TView.data
 * @param tagName The tag name of the node
 * @param attrs The attributes defined on this node
 * @param parent The parent of this node
 * @param tViews Any TViews attached to this node
 * @returns the TNode object
 */
export function createTNode(type, index, tagName, attrs, parent, tViews) {
    ngDevMode && ngDevMode.tNode++;
    return {
        type: type,
        index: index,
        flags: 0,
        tagName: tagName,
        attrs: attrs,
        localNames: null,
        initialInputs: undefined,
        inputs: undefined,
        outputs: undefined,
        tViews: tViews,
        next: null,
        child: null,
        parent: parent,
        dynamicContainerNode: null
    };
}
/**
 * Given a list of directive indices and minified input names, sets the
 * input properties on the corresponding directives.
 */
function setInputsForProperty(inputs, value) {
    for (let i = 0; i < inputs.length; i += 2) {
        ngDevMode && assertDataInRange(inputs[i], directives);
        directives[inputs[i]][inputs[i + 1]] = value;
    }
}
/**
 * Consolidates all inputs or outputs of all directives on this logical node.
 *
 * @param number lNodeFlags logical node flags
 * @param Direction direction whether to consider inputs or outputs
 * @returns PropertyAliases|null aggregate of all properties if any, `null` otherwise
 */
function generatePropertyAliases(tNodeFlags, direction) {
    const count = tNodeFlags & 4095 /* DirectiveCountMask */;
    let propStore = null;
    if (count > 0) {
        const start = tNodeFlags >> 13 /* DirectiveStartingIndexShift */;
        const end = start + count;
        const isInput = direction === 0 /* Input */;
        const defs = currentView.tView.directives;
        for (let i = start; i < end; i++) {
            const directiveDef = defs[i];
            const propertyAliasMap = isInput ? directiveDef.inputs : directiveDef.outputs;
            for (let publicName in propertyAliasMap) {
                if (propertyAliasMap.hasOwnProperty(publicName)) {
                    propStore = propStore || {};
                    const internalName = propertyAliasMap[publicName];
                    const hasProperty = propStore.hasOwnProperty(publicName);
                    hasProperty ? propStore[publicName].push(i, internalName) :
                        (propStore[publicName] = [i, internalName]);
                }
            }
        }
    }
    return propStore;
}
/**
 * Add or remove a class in a `classList` on a DOM element.
 *
 * This instruction is meant to handle the [class.foo]="exp" case
 *
 * @param index The index of the element to update in the data array
 * @param className Name of class to toggle. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param value A value indicating if a given class should be added or removed.
 */
export function elementClassNamed(index, className, value) {
    if (value !== NO_CHANGE) {
        const lElement = data[index];
        if (value) {
            ngDevMode && ngDevMode.rendererAddClass++;
            isProceduralRenderer(renderer) ? renderer.addClass(lElement.native, className) :
                lElement.native.classList.add(className);
        }
        else {
            ngDevMode && ngDevMode.rendererRemoveClass++;
            isProceduralRenderer(renderer) ? renderer.removeClass(lElement.native, className) :
                lElement.native.classList.remove(className);
        }
    }
}
/**
 * Set the `className` property on a DOM element.
 *
 * This instruction is meant to handle the `[class]="exp"` usage.
 *
 * `elementClass` instruction writes the value to the "element's" `className` property.
 *
 * @param index The index of the element to update in the data array
 * @param value A value indicating a set of classes which should be applied. The method overrides
 *   any existing classes. The value is stringified (`toString`) before it is applied to the
 *   element.
 */
export function elementClass(index, value) {
    if (value !== NO_CHANGE) {
        // TODO: This is a naive implementation which simply writes value to the `className`. In the
        // future
        // we will add logic here which would work with the animation code.
        const lElement = data[index];
        ngDevMode && ngDevMode.rendererSetClassName++;
        isProceduralRenderer(renderer) ? renderer.setProperty(lElement.native, 'className', value) :
            lElement.native['className'] = stringify(value);
    }
}
export function elementStyleNamed(index, styleName, value, suffixOrSanitizer) {
    if (value !== NO_CHANGE) {
        const lElement = data[index];
        if (value == null) {
            ngDevMode && ngDevMode.rendererRemoveStyle++;
            isProceduralRenderer(renderer) ?
                renderer.removeStyle(lElement.native, styleName, RendererStyleFlags3.DashCase) :
                lElement.native['style'].removeProperty(styleName);
        }
        else {
            let strValue = typeof suffixOrSanitizer == 'function' ? suffixOrSanitizer(value) : stringify(value);
            if (typeof suffixOrSanitizer == 'string')
                strValue = strValue + suffixOrSanitizer;
            ngDevMode && ngDevMode.rendererSetStyle++;
            isProceduralRenderer(renderer) ?
                renderer.setStyle(lElement.native, styleName, strValue, RendererStyleFlags3.DashCase) :
                lElement.native['style'].setProperty(styleName, strValue);
        }
    }
}
/**
 * Set the `style` property on a DOM element.
 *
 * This instruction is meant to handle the `[style]="exp"` usage.
 *
 *
 * @param index The index of the element to update in the data array
 * @param value A value indicating if a given style should be added or removed.
 *   The expected shape of `value` is an object where keys are style names and the values
 *   are their corresponding values to set. If value is falsy, then the style is removed. An absence
 *   of style does not cause that style to be removed. `NO_CHANGE` implies that no update should be
 *   performed.
 */
export function elementStyle(index, value) {
    if (value !== NO_CHANGE) {
        // TODO: This is a naive implementation which simply writes value to the `style`. In the future
        // we will add logic here which would work with the animation code.
        const lElement = data[index];
        if (isProceduralRenderer(renderer)) {
            ngDevMode && ngDevMode.rendererSetStyle++;
            renderer.setProperty(lElement.native, 'style', value);
        }
        else {
            const style = lElement.native['style'];
            for (let i = 0, keys = Object.keys(value); i < keys.length; i++) {
                const styleName = keys[i];
                const styleValue = value[styleName];
                if (styleValue == null) {
                    ngDevMode && ngDevMode.rendererRemoveStyle++;
                    style.removeProperty(styleName);
                }
                else {
                    ngDevMode && ngDevMode.rendererSetStyle++;
                    style.setProperty(styleName, styleValue);
                }
            }
        }
    }
}
//////////////////////////
//// Text
//////////////////////////
/**
 * Create static text node
 *
 * @param index Index of the node in the data array.
 * @param value Value to write. This value will be stringified.
 */
export function text(index, value) {
    ngDevMode &&
        assertEqual(currentView.bindingIndex, -1, 'text nodes should be created before bindings');
    ngDevMode && ngDevMode.rendererCreateTextNode++;
    const textNode = createTextNode(value, renderer);
    const node = createLNode(index, 3 /* Element */, textNode, null, null);
    // Text nodes are self closing.
    isParent = false;
    appendChild(getParentLNode(node), textNode, currentView);
}
/**
 * Create text node with binding
 * Bindings should be handled externally with the proper interpolation(1-8) method
 *
 * @param index Index of the node in the data array.
 * @param value Stringified value to write.
 */
export function textBinding(index, value) {
    if (value !== NO_CHANGE) {
        ngDevMode && assertDataInRange(index);
        const existingNode = data[index];
        ngDevMode && assertNotNull(existingNode, 'LNode should exist');
        ngDevMode && assertNotNull(existingNode.native, 'native element should exist');
        ngDevMode && ngDevMode.rendererSetText++;
        isProceduralRenderer(renderer) ? renderer.setValue(existingNode.native, stringify(value)) :
            existingNode.native.textContent = stringify(value);
    }
}
//////////////////////////
//// Directive
//////////////////////////
/**
 * Create a directive.
 *
 * NOTE: directives can be created in order other than the index order. They can also
 *       be retrieved before they are created in which case the value will be null.
 *
 * @param directive The directive instance.
 * @param directiveDef DirectiveDef object which contains information about the template.
 */
export function directiveCreate(index, directive, directiveDef) {
    const instance = baseDirectiveCreate(index, directive, directiveDef);
    ngDevMode && assertNotNull(previousOrParentNode.tNode, 'previousOrParentNode.tNode');
    const tNode = previousOrParentNode.tNode;
    const isComponent = directiveDef.template;
    if (isComponent) {
        addComponentLogic(index, directive, directiveDef);
    }
    if (firstTemplatePass) {
        // Init hooks are queued now so ngOnInit is called in host components before
        // any projected components.
        queueInitHooks(index, directiveDef.onInit, directiveDef.doCheck, currentView.tView);
        if (directiveDef.hostBindings)
            queueHostBindingForCheck(index);
    }
    if (tNode && tNode.attrs) {
        setInputsFromAttrs(index, instance, directiveDef.inputs, tNode);
    }
    return instance;
}
function addComponentLogic(index, instance, def) {
    const tView = getOrCreateTView(def.template, def.directiveDefs, def.pipeDefs);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    const hostView = addToViewTree(currentView, previousOrParentNode.tNode.index, createLView(rendererFactory.createRenderer(previousOrParentNode.native, def.rendererType), tView, null, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
    // We need to set the host node/data here because when the component LNode was created,
    // we didn't yet know it was a component (just an element).
    previousOrParentNode.data = hostView;
    hostView.node = previousOrParentNode;
    if (firstTemplatePass)
        tView.node = previousOrParentNode.tNode;
    initChangeDetectorIfExisting(previousOrParentNode.nodeInjector, instance, hostView);
    if (firstTemplatePass)
        queueComponentIndexForCheck(index);
}
/**
 * A lighter version of directiveCreate() that is used for the root component
 *
 * This version does not contain features that we don't already support at root in
 * current Angular. Example: local refs and inputs on root component.
 */
export function baseDirectiveCreate(index, directive, directiveDef) {
    ngDevMode &&
        assertEqual(currentView.bindingIndex, -1, 'directives should be created before any bindings');
    ngDevMode && assertPreviousIsParent();
    Object.defineProperty(directive, NG_HOST_SYMBOL, { enumerable: false, value: previousOrParentNode });
    if (directives == null)
        currentView.directives = directives = [];
    ngDevMode && assertDataNext(index, directives);
    directives[index] = directive;
    if (firstTemplatePass) {
        const flags = previousOrParentNode.tNode.flags;
        if ((flags & 4095 /* DirectiveCountMask */) === 0) {
            // When the first directive is created:
            // - save the index,
            // - set the number of directives to 1
            previousOrParentNode.tNode.flags =
                index << 13 /* DirectiveStartingIndexShift */ | flags & 4096 /* isComponent */ | 1;
        }
        else {
            // Only need to bump the size when subsequent directives are created
            ngDevMode && assertNotEqual(flags & 4095 /* DirectiveCountMask */, 4095 /* DirectiveCountMask */, 'Reached the max number of directives');
            previousOrParentNode.tNode.flags++;
        }
    }
    else {
        const diPublic = directiveDef.diPublic;
        if (diPublic)
            diPublic(directiveDef);
    }
    if (directiveDef.attributes != null && previousOrParentNode.tNode.type == 3 /* Element */) {
        setUpAttributes(previousOrParentNode.native, directiveDef.attributes);
    }
    return directive;
}
/**
 * Sets initial input properties on directive instances from attribute data
 *
 * @param directiveIndex Index of the directive in directives array
 * @param instance Instance of the directive on which to set the initial inputs
 * @param inputs The list of inputs from the directive def
 * @param tNode The static data for this node
 */
function setInputsFromAttrs(directiveIndex, instance, inputs, tNode) {
    let initialInputData = tNode.initialInputs;
    if (initialInputData === undefined || directiveIndex >= initialInputData.length) {
        initialInputData = generateInitialInputs(directiveIndex, inputs, tNode);
    }
    const initialInputs = initialInputData[directiveIndex];
    if (initialInputs) {
        for (let i = 0; i < initialInputs.length; i += 2) {
            instance[initialInputs[i]] = initialInputs[i + 1];
        }
    }
}
/**
 * Generates initialInputData for a node and stores it in the template's static storage
 * so subsequent template invocations don't have to recalculate it.
 *
 * initialInputData is an array containing values that need to be set as input properties
 * for directives on this node, but only once on creation. We need this array to support
 * the case where you set an @Input property of a directive using attribute-like syntax.
 * e.g. if you have a `name` @Input, you can set it once like this:
 *
 * <my-component name="Bess"></my-component>
 *
 * @param directiveIndex Index to store the initial input data
 * @param inputs The list of inputs from the directive def
 * @param tNode The static data on this node
 */
function generateInitialInputs(directiveIndex, inputs, tNode) {
    const initialInputData = tNode.initialInputs || (tNode.initialInputs = []);
    initialInputData[directiveIndex] = null;
    const attrs = tNode.attrs;
    for (let i = 0; i < attrs.length; i += 2) {
        const attrName = attrs[i];
        const minifiedInputName = inputs[attrName];
        const attrValue = attrs[i + 1];
        if (attrName === 1 /* SELECT_ONLY */)
            break;
        if (minifiedInputName !== undefined) {
            const inputsToStore = initialInputData[directiveIndex] || (initialInputData[directiveIndex] = []);
            inputsToStore.push(minifiedInputName, attrValue);
        }
    }
    return initialInputData;
}
//////////////////////////
//// ViewContainer & View
//////////////////////////
/**
 * Creates a LContainer, either from a container instruction, or for a ViewContainerRef.
 *
 * @param parentLNode the LNode in which the container's content will be rendered
 * @param currentView The parent view of the LContainer
 * @param template Optional the inline template (ng-template instruction case)
 * @param isForViewContainerRef Optional a flag indicating the ViewContainerRef case
 * @returns LContainer
 */
export function createLContainer(parentLNode, currentView, template, isForViewContainerRef) {
    ngDevMode && assertNotNull(parentLNode, 'containers should have a parent');
    return {
        views: [],
        nextIndex: isForViewContainerRef ? null : 0,
        // If the direct parent of the container is a view, its views will need to be added
        // through insertView() when its parent view is being inserted:
        renderParent: canInsertNativeNode(parentLNode, currentView) ? parentLNode : null,
        template: template == null ? null : template,
        next: null,
        parent: currentView,
        queries: null
    };
}
/**
 * Creates an LContainerNode.
 *
 * Only `LViewNodes` can go into `LContainerNodes`.
 *
 * @param index The index of the container in the data array
 * @param template Optional inline template
 * @param tagName The name of the container element, if applicable
 * @param attrs The attrs attached to the container, if applicable
 * @param localRefs A set of local reference bindings on the element.
 */
export function container(index, template, tagName, attrs, localRefs) {
    ngDevMode &&
        assertEqual(currentView.bindingIndex, -1, 'container nodes should be created before any bindings');
    const currentParent = isParent ? previousOrParentNode : getParentLNode(previousOrParentNode);
    const lContainer = createLContainer(currentParent, currentView, template);
    const node = createLNode(index, 0 /* Container */, undefined, tagName || null, attrs || null, lContainer);
    if (firstTemplatePass && template == null)
        node.tNode.tViews = [];
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(currentView, index, node.data);
    const queries = node.queries;
    if (queries) {
        // prepare place for matching nodes from views inserted into a given container
        lContainer.queries = queries.container();
    }
    createDirectivesAndLocals(localRefs);
    isParent = false;
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    if (queries) {
        // check if a given container node matches
        queries.addNode(node);
    }
}
/**
 * Sets a container up to receive views.
 *
 * @param index The index of the container in the data array
 */
export function containerRefreshStart(index) {
    ngDevMode && assertDataInRange(index);
    previousOrParentNode = data[index];
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    isParent = true;
    previousOrParentNode.data.nextIndex = 0;
    ngDevMode && assertSame(previousOrParentNode.native, undefined, `the container's native element should not have been set yet.`);
    if (!checkNoChangesMode) {
        // We need to execute init hooks here so ngOnInit hooks are called in top level views
        // before they are called in embedded views (for backwards compatibility).
        executeInitHooks(currentView, currentView.tView, creationMode);
    }
}
/**
 * Marks the end of the LContainerNode.
 *
 * Marking the end of LContainerNode is the time when to child Views get inserted or removed.
 */
export function containerRefreshEnd() {
    if (isParent) {
        isParent = false;
    }
    else {
        ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
        ngDevMode && assertHasParent();
        previousOrParentNode = getParentLNode(previousOrParentNode);
    }
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    const container = previousOrParentNode;
    container.native = undefined;
    ngDevMode && assertNodeType(container, 0 /* Container */);
    const nextIndex = container.data.nextIndex;
    // remove extra views at the end of the container
    while (nextIndex < container.data.views.length) {
        removeView(container, nextIndex);
    }
}
function refreshDynamicChildren() {
    for (let current = getLViewChild(currentView); current !== null; current = current.next) {
        // Note: current can be a LView or a LContainer, but here we are only interested in LContainer.
        // The distinction is made because nextIndex and views do not exist on LView.
        if (isLContainer(current)) {
            const container = current;
            for (let i = 0; i < container.views.length; i++) {
                const lViewNode = container.views[i];
                // The directives and pipes are not needed here as an existing view is only being refreshed.
                const dynamicView = lViewNode.data;
                ngDevMode && assertNotNull(dynamicView.tView, 'TView must be allocated');
                renderEmbeddedTemplate(lViewNode, dynamicView.tView, dynamicView.template, dynamicView.context, renderer);
            }
        }
    }
}
function isLContainer(node) {
    return node.nextIndex == null && node.views != null;
}
/**
 * Looks for a view with a given view block id inside a provided LContainer.
 * Removes views that need to be deleted in the process.
 *
 * @param containerNode where to search for views
 * @param startIdx starting index in the views array to search from
 * @param viewBlockId exact view block id to look for
 * @returns index of a found view or -1 if not found
 */
function scanForView(containerNode, startIdx, viewBlockId) {
    const views = containerNode.data.views;
    for (let i = startIdx; i < views.length; i++) {
        const viewAtPositionId = views[i].data.tView.id;
        if (viewAtPositionId === viewBlockId) {
            return views[i];
        }
        else if (viewAtPositionId < viewBlockId) {
            // found a view that should not be at this position - remove
            removeView(containerNode, i);
        }
        else {
            // found a view with id greater than the one we are searching for
            // which means that required view doesn't exist and can't be found at
            // later positions in the views array - stop the search here
            break;
        }
    }
    return null;
}
/**
 * Marks the start of an embedded view.
 *
 * @param viewBlockId The ID of this view
 * @return boolean Whether or not this view is in creation mode
 */
export function embeddedViewStart(viewBlockId) {
    const container = (isParent ? previousOrParentNode : getParentLNode(previousOrParentNode));
    ngDevMode && assertNodeType(container, 0 /* Container */);
    const lContainer = container.data;
    let viewNode = scanForView(container, lContainer.nextIndex, viewBlockId);
    if (viewNode) {
        previousOrParentNode = viewNode;
        ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
        isParent = true;
        enterView(viewNode.data, viewNode);
    }
    else {
        // When we create a new LView, we always reset the state of the instructions.
        const newView = createLView(renderer, getOrCreateEmbeddedTView(viewBlockId, container), null, null, 2 /* CheckAlways */, getCurrentSanitizer());
        if (lContainer.queries) {
            newView.queries = lContainer.queries.createView();
        }
        enterView(newView, viewNode = createLNode(viewBlockId, 2 /* View */, null, null, null, newView));
    }
    return getRenderFlags(viewNode.data);
}
/**
 * Initialize the TView (e.g. static data) for the active embedded view.
 *
 * Each embedded view block must create or retrieve its own TView. Otherwise, the embedded view's
 * static data for a particular node would overwrite the static data for a node in the view above
 * it with the same index (since it's in the same template).
 *
 * @param viewIndex The index of the TView in TNode.tViews
 * @param parent The parent container in which to look for the view's static data
 * @returns TView
 */
function getOrCreateEmbeddedTView(viewIndex, parent) {
    ngDevMode && assertNodeType(parent, 0 /* Container */);
    const containerTViews = parent.tNode.tViews;
    ngDevMode && assertNotNull(containerTViews, 'TView expected');
    ngDevMode && assertEqual(Array.isArray(containerTViews), true, 'TViews should be in an array');
    if (viewIndex >= containerTViews.length || containerTViews[viewIndex] == null) {
        const tView = currentView.tView;
        containerTViews[viewIndex] =
            createTView(viewIndex, tView.directiveRegistry, tView.pipeRegistry);
    }
    return containerTViews[viewIndex];
}
/** Marks the end of an embedded view. */
export function embeddedViewEnd() {
    refreshView();
    isParent = false;
    const viewNode = previousOrParentNode = currentView.node;
    const containerNode = getParentLNode(previousOrParentNode);
    if (containerNode) {
        ngDevMode && assertNodeType(viewNode, 2 /* View */);
        ngDevMode && assertNodeType(containerNode, 0 /* Container */);
        const lContainer = containerNode.data;
        if (creationMode) {
            // When projected nodes are going to be inserted, the renderParent of the dynamic container
            // used by the ViewContainerRef must be set.
            setRenderParentInProjectedNodes(lContainer.renderParent, viewNode);
            // it is a new view, insert it into collection of views for a given container
            insertView(containerNode, viewNode, lContainer.nextIndex);
        }
        lContainer.nextIndex++;
    }
    leaveView(currentView.parent);
    ngDevMode && assertEqual(isParent, false, 'isParent');
    ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
}
/**
 * For nodes which are projected inside an embedded view, this function sets the renderParent
 * of their dynamic LContainerNode.
 * @param renderParent the renderParent of the LContainer which contains the embedded view.
 * @param viewNode the embedded view.
 */
function setRenderParentInProjectedNodes(renderParent, viewNode) {
    if (renderParent != null) {
        let node = getChildLNode(viewNode);
        while (node) {
            if (node.tNode.type === 1 /* Projection */) {
                let nodeToProject = node.data.head;
                const lastNodeToProject = node.data.tail;
                while (nodeToProject) {
                    if (nodeToProject.dynamicLContainerNode) {
                        nodeToProject.dynamicLContainerNode.data.renderParent = renderParent;
                    }
                    nodeToProject = nodeToProject === lastNodeToProject ? null : nodeToProject.pNextOrParent;
                }
            }
            node = getNextLNode(node);
        }
    }
}
/////////////
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param directiveIndex
 * @param elementIndex
 */
export function componentRefresh(directiveIndex, elementIndex) {
    ngDevMode && assertDataInRange(elementIndex);
    const element = data[elementIndex];
    ngDevMode && assertNodeType(element, 3 /* Element */);
    ngDevMode && assertNotNull(element.data, `Component's host node should have an LView attached.`);
    const hostView = element.data;
    // Only attached CheckAlways components or attached, dirty OnPush components should be checked
    if (viewAttached(hostView) && hostView.flags & (2 /* CheckAlways */ | 4 /* Dirty */)) {
        ngDevMode && assertDataInRange(directiveIndex, directives);
        const def = currentView.tView.directives[directiveIndex];
        detectChangesInternal(hostView, element, def, getDirectiveInstance(directives[directiveIndex]));
    }
}
/** Returns a boolean for whether the view is attached */
function viewAttached(view) {
    return (view.flags & 8 /* Attached */) === 8 /* Attached */;
}
/**
 * Instruction to distribute projectable nodes among <ng-content> occurrences in a given template.
 * It takes all the selectors from the entire component's template and decides where
 * each projected node belongs (it re-distributes nodes among "buckets" where each "bucket" is
 * backed by a selector).
 *
 * This function requires CSS selectors to be provided in 2 forms: parsed (by a compiler) and text,
 * un-parsed form.
 *
 * The parsed form is needed for efficient matching of a node against a given CSS selector.
 * The un-parsed, textual form is needed for support of the ngProjectAs attribute.
 *
 * Having a CSS selector in 2 different formats is not ideal, but alternatives have even more
 * drawbacks:
 * - having only a textual form would require runtime parsing of CSS selectors;
 * - we can't have only a parsed as we can't re-construct textual form from it (as entered by a
 * template author).
 *
 * @param selectors A collection of parsed CSS selectors
 * @param rawSelectors A collection of CSS selectors in the raw, un-parsed form
 */
export function projectionDef(index, selectors, textSelectors) {
    const noOfNodeBuckets = selectors ? selectors.length + 1 : 1;
    const distributedNodes = new Array(noOfNodeBuckets);
    for (let i = 0; i < noOfNodeBuckets; i++) {
        distributedNodes[i] = [];
    }
    const componentNode = findComponentHost(currentView);
    let componentChild = getChildLNode(componentNode);
    while (componentChild !== null) {
        // execute selector matching logic if and only if:
        // - there are selectors defined
        // - a node has a tag name / attributes that can be matched
        if (selectors && componentChild.tNode) {
            const matchedIdx = matchingSelectorIndex(componentChild.tNode, selectors, textSelectors);
            distributedNodes[matchedIdx].push(componentChild);
        }
        else {
            distributedNodes[0].push(componentChild);
        }
        componentChild = getNextLNode(componentChild);
    }
    ngDevMode && assertDataNext(index);
    data[index] = distributedNodes;
}
/**
 * Updates the linked list of a projection node, by appending another linked list.
 *
 * @param projectionNode Projection node whose projected nodes linked list has to be updated
 * @param appendedFirst First node of the linked list to append.
 * @param appendedLast Last node of the linked list to append.
 */
function appendToProjectionNode(projectionNode, appendedFirst, appendedLast) {
    ngDevMode && assertEqual(!!appendedFirst, !!appendedLast, 'appendedFirst can be null if and only if appendedLast is also null');
    if (!appendedLast) {
        // nothing to append
        return;
    }
    const projectionNodeData = projectionNode.data;
    if (projectionNodeData.tail) {
        projectionNodeData.tail.pNextOrParent = appendedFirst;
    }
    else {
        projectionNodeData.head = appendedFirst;
    }
    projectionNodeData.tail = appendedLast;
    appendedLast.pNextOrParent = projectionNode;
}
/**
 * Inserts previously re-distributed projected nodes. This instruction must be preceded by a call
 * to the projectionDef instruction.
 *
 * @param nodeIndex
 * @param localIndex - index under which distribution of projected nodes was memorized
 * @param selectorIndex:
 *        - 0 when the selector is `*` (or unspecified as this is the default value),
 *        - 1 based index of the selector from the {@link projectionDef}
 */
export function projection(nodeIndex, localIndex, selectorIndex = 0, attrs) {
    const node = createLNode(nodeIndex, 1 /* Projection */, null, null, attrs || null, { head: null, tail: null });
    // `<ng-content>` has no content
    isParent = false;
    // re-distribution of projectable nodes is memorized on a component's view level
    const componentNode = findComponentHost(currentView);
    const componentLView = componentNode.data;
    const nodesForSelector = componentLView.data[localIndex][selectorIndex];
    // build the linked list of projected nodes:
    for (let i = 0; i < nodesForSelector.length; i++) {
        const nodeToProject = nodesForSelector[i];
        if (nodeToProject.tNode.type === 1 /* Projection */) {
            // Reprojecting a projection -> append the list of previously projected nodes
            const previouslyProjected = nodeToProject.data;
            appendToProjectionNode(node, previouslyProjected.head, previouslyProjected.tail);
        }
        else {
            // Projecting a single node
            appendToProjectionNode(node, nodeToProject, nodeToProject);
        }
    }
    const currentParent = getParentLNode(node);
    if (canInsertNativeNode(currentParent, currentView)) {
        ngDevMode && assertNodeType(currentParent, 3 /* Element */);
        // process each node in the list of projected nodes:
        let nodeToProject = node.data.head;
        const lastNodeToProject = node.data.tail;
        while (nodeToProject) {
            appendProjectedNode(nodeToProject, currentParent, currentView);
            nodeToProject = nodeToProject === lastNodeToProject ? null : nodeToProject.pNextOrParent;
        }
    }
}
/**
 * Given a current view, finds the nearest component's host (LElement).
 *
 * @param lView LView for which we want a host element node
 * @returns The host node
 */
function findComponentHost(lView) {
    let viewRootLNode = lView.node;
    while (viewRootLNode.tNode.type === 2 /* View */) {
        ngDevMode && assertNotNull(lView.parent, 'lView.parent');
        lView = lView.parent;
        viewRootLNode = lView.node;
    }
    ngDevMode && assertNodeType(viewRootLNode, 3 /* Element */);
    ngDevMode && assertNotNull(viewRootLNode.data, 'node.data');
    return viewRootLNode;
}
/**
 * Adds a LView or a LContainer to the end of the current view tree.
 *
 * This structure will be used to traverse through nested views to remove listeners
 * and call onDestroy callbacks.
 *
 * @param currentView The view where LView or LContainer should be added
 * @param hostIndex Index of the view's host node in data[]
 * @param state The LView or LContainer to add to the view tree
 * @returns The state passed in
 */
export function addToViewTree(currentView, hostIndex, state) {
    // TODO(kara): move next and tail properties off of LView
    if (currentView.tail) {
        currentView.tail.next = state;
    }
    else if (firstTemplatePass) {
        currentView.tView.childIndex = hostIndex;
    }
    currentView.tail = state;
    return state;
}
///////////////////////////////
//// Change detection
///////////////////////////////
/** If node is an OnPush component, marks its LView dirty. */
export function markDirtyIfOnPush(node) {
    // Because data flows down the component tree, ancestors do not need to be marked dirty
    if (node.data && !(node.data.flags & 2 /* CheckAlways */)) {
        node.data.flags |= 4 /* Dirty */;
    }
}
/**
 * Wraps an event listener so its host view and its ancestor views will be marked dirty
 * whenever the event fires. Necessary to support OnPush components.
 */
export function wrapListenerWithDirtyLogic(view, listenerFn) {
    return function (e) {
        markViewDirty(view);
        return listenerFn(e);
    };
}
/**
 * Wraps an event listener so its host view and its ancestor views will be marked dirty
 * whenever the event fires. Also wraps with preventDefault behavior.
 */
export function wrapListenerWithDirtyAndDefault(view, listenerFn) {
    return function wrapListenerIn_markViewDirty(e) {
        markViewDirty(view);
        if (listenerFn(e) === false) {
            e.preventDefault();
            // Necessary for legacy browsers that don't support preventDefault (e.g. IE)
            e.returnValue = false;
        }
    };
}
/** Marks current view and all ancestors dirty */
export function markViewDirty(view) {
    let currentView = view;
    while (currentView.parent != null) {
        currentView.flags |= 4 /* Dirty */;
        currentView = currentView.parent;
    }
    currentView.flags |= 4 /* Dirty */;
    ngDevMode && assertNotNull(currentView.context, 'rootContext');
    scheduleTick(currentView.context);
}
/**
 * Used to schedule change detection on the whole application.
 *
 * Unlike `tick`, `scheduleTick` coalesces multiple calls into one change detection run.
 * It is usually called indirectly by calling `markDirty` when the view needs to be
 * re-rendered.
 *
 * Typically `scheduleTick` uses `requestAnimationFrame` to coalesce multiple
 * `scheduleTick` requests. The scheduling function can be overridden in
 * `renderComponent`'s `scheduler` option.
 */
export function scheduleTick(rootContext) {
    if (rootContext.clean == _CLEAN_PROMISE) {
        let res;
        rootContext.clean = new Promise((r) => res = r);
        rootContext.scheduler(() => {
            tick(rootContext.component);
            res(null);
            rootContext.clean = _CLEAN_PROMISE;
        });
    }
}
/**
 * Used to perform change detection on the whole application.
 *
 * This is equivalent to `detectChanges`, but invoked on root component. Additionally, `tick`
 * executes lifecycle hooks and conditionally checks components based on their
 * `ChangeDetectionStrategy` and dirtiness.
 *
 * The preferred way to trigger change detection is to call `markDirty`. `markDirty` internally
 * schedules `tick` using a scheduler in order to coalesce multiple `markDirty` calls into a
 * single change detection run. By default, the scheduler is `requestAnimationFrame`, but can
 * be changed when calling `renderComponent` and providing the `scheduler` option.
 */
export function tick(component) {
    const rootView = getRootView(component);
    const rootComponent = rootView.context.component;
    const hostNode = _getComponentHostLElementNode(rootComponent);
    ngDevMode && assertNotNull(hostNode.data, 'Component host node should be attached to an LView');
    renderComponentOrTemplate(hostNode, rootView, rootComponent);
}
/**
 * Retrieve the root view from any component by walking the parent `LView` until
 * reaching the root `LView`.
 *
 * @param component any component
 */
export function getRootView(component) {
    ngDevMode && assertNotNull(component, 'component');
    const lElementNode = _getComponentHostLElementNode(component);
    let lView = lElementNode.view;
    while (lView.parent) {
        lView = lView.parent;
    }
    return lView;
}
/**
 * Synchronously perform change detection on a component (and possibly its sub-components).
 *
 * This function triggers change detection in a synchronous way on a component. There should
 * be very little reason to call this function directly since a preferred way to do change
 * detection is to {@link markDirty} the component and wait for the scheduler to call this method
 * at some future point in time. This is because a single user action often results in many
 * components being invalidated and calling change detection on each component synchronously
 * would be inefficient. It is better to wait until all components are marked as dirty and
 * then perform single change detection across all of the components
 *
 * @param component The component which the change detection should be performed on.
 */
export function detectChanges(component) {
    const hostNode = _getComponentHostLElementNode(component);
    ngDevMode && assertNotNull(hostNode.data, 'Component host node should be attached to an LView');
    const componentIndex = hostNode.tNode.flags >> 13 /* DirectiveStartingIndexShift */;
    const def = hostNode.view.tView.directives[componentIndex];
    detectChangesInternal(hostNode.data, hostNode, def, component);
}
/**
 * Checks the change detector and its children, and throws if any changes are detected.
 *
 * This is used in development mode to verify that running change detection doesn't
 * introduce other changes.
 */
export function checkNoChanges(component) {
    checkNoChangesMode = true;
    try {
        detectChanges(component);
    }
    finally {
        checkNoChangesMode = false;
    }
}
/** Checks the view of the component provided. Does not gate on dirty checks or execute doCheck. */
export function detectChangesInternal(hostView, hostNode, def, component) {
    const oldView = enterView(hostView, hostNode);
    const template = def.template;
    try {
        template(getRenderFlags(hostView), component);
        refreshView();
    }
    finally {
        leaveView(oldView);
    }
}
/**
 * Mark the component as dirty (needing change detection).
 *
 * Marking a component dirty will schedule a change detection on this
 * component at some point in the future. Marking an already dirty
 * component as dirty is a noop. Only one outstanding change detection
 * can be scheduled per component tree. (Two components bootstrapped with
 * separate `renderComponent` will have separate schedulers)
 *
 * When the root component is bootstrapped with `renderComponent`, a scheduler
 * can be provided.
 *
 * @param component Component to mark as dirty.
 */
export function markDirty(component) {
    ngDevMode && assertNotNull(component, 'component');
    const lElementNode = _getComponentHostLElementNode(component);
    markViewDirty(lElementNode.view);
}
/** A special value which designates that a value has not changed. */
export const NO_CHANGE = {};
/**
 *  Initializes the binding start index. Will get inlined.
 *
 *  This function must be called before any binding related function is called
 *  (ie `bind()`, `interpolationX()`, `pureFunctionX()`)
 */
function initBindings() {
    ngDevMode && assertEqual(currentView.bindingIndex, -1, 'Binding index should not yet be set ' + currentView.bindingIndex);
    if (currentView.tView.bindingStartIndex === -1) {
        currentView.tView.bindingStartIndex = data.length;
    }
    currentView.bindingIndex = currentView.tView.bindingStartIndex;
}
/**
 * Creates a single value binding.
 *
 * @param value Value to diff
 */
export function bind(value) {
    return bindingUpdated(value) ? value : NO_CHANGE;
}
/**
 * Reserves slots for pure functions (`pureFunctionX` instructions)
 *
 * Bindings for pure functions are stored after the LNodes in the data array but before the binding.
 *
 *  ----------------------------------------------------------------------------
 *  |  LNodes ... | pure function bindings | regular bindings / interpolations |
 *  ----------------------------------------------------------------------------
 *                                         ^
 *                                         TView.bindingStartIndex
 *
 * Pure function instructions are given an offset from TView.bindingStartIndex.
 * Subtracting the offset from TView.bindingStartIndex gives the first index where the bindings
 * are stored.
 *
 * NOTE: reserveSlots instructions are only ever allowed at the very end of the creation block
 */
export function reserveSlots(numSlots) {
    // Init the slots with a unique `NO_CHANGE` value so that the first change is always detected
    // whether it happens or not during the first change detection pass - pure functions checks
    // might be skipped when short-circuited.
    data.length += numSlots;
    data.fill(NO_CHANGE, -numSlots);
    // We need to initialize the binding in case a `pureFunctionX` kind of binding instruction is
    // called first in the update section.
    initBindings();
}
/**
 * Sets up the binding index before executing any `pureFunctionX` instructions.
 *
 * The index must be restored after the pure function is executed
 *
 * {@link reserveSlots}
 */
export function moveBindingIndexToReservedSlot(offset) {
    const currentSlot = currentView.bindingIndex;
    currentView.bindingIndex = currentView.tView.bindingStartIndex - offset;
    return currentSlot;
}
/**
 * Restores the binding index to the given value.
 *
 * This function is typically used to restore the index after a `pureFunctionX` has
 * been executed.
 */
export function restoreBindingIndex(index) {
    currentView.bindingIndex = index;
}
/**
 * Create interpolation bindings with a variable number of expressions.
 *
 * If there are 1 to 8 expressions `interpolation1()` to `interpolation8()` should be used instead.
 * Those are faster because there is no need to create an array of expressions and iterate over it.
 *
 * `values`:
 * - has static text at even indexes,
 * - has evaluated expressions at odd indexes.
 *
 * Returns the concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 */
export function interpolationV(values) {
    ngDevMode && assertLessThan(2, values.length, 'should have at least 3 values');
    ngDevMode && assertEqual(values.length % 2, 1, 'should have an odd number of values');
    let different = false;
    for (let i = 1; i < values.length; i += 2) {
        // Check if bindings (odd indexes) have changed
        bindingUpdated(values[i]) && (different = true);
    }
    if (!different) {
        return NO_CHANGE;
    }
    // Build the updated content
    let content = values[0];
    for (let i = 1; i < values.length; i += 2) {
        content += stringify(values[i]) + values[i + 1];
    }
    return content;
}
/**
 * Creates an interpolation binding with 1 expression.
 *
 * @param prefix static value used for concatenation only.
 * @param v0 value checked for change.
 * @param suffix static value used for concatenation only.
 */
export function interpolation1(prefix, v0, suffix) {
    const different = bindingUpdated(v0);
    return different ? prefix + stringify(v0) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 2 expressions. */
export function interpolation2(prefix, v0, i0, v1, suffix) {
    const different = bindingUpdated2(v0, v1);
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + suffix : NO_CHANGE;
}
/** Creates an interpolation bindings with 3 expressions. */
export function interpolation3(prefix, v0, i0, v1, i1, v2, suffix) {
    let different = bindingUpdated2(v0, v1);
    different = bindingUpdated(v2) || different;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + suffix :
        NO_CHANGE;
}
/** Create an interpolation binding with 4 expressions. */
export function interpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    const different = bindingUpdated4(v0, v1, v2, v3);
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) +
            suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 5 expressions. */
export function interpolation5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    let different = bindingUpdated4(v0, v1, v2, v3);
    different = bindingUpdated(v4) || different;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 6 expressions. */
export function interpolation6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
    let different = bindingUpdated4(v0, v1, v2, v3);
    different = bindingUpdated2(v4, v5) || different;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 7 expressions. */
export function interpolation7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
    let different = bindingUpdated4(v0, v1, v2, v3);
    different = bindingUpdated2(v4, v5) || different;
    different = bindingUpdated(v6) || different;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + i5 + stringify(v6) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 8 expressions. */
export function interpolation8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
    let different = bindingUpdated4(v0, v1, v2, v3);
    different = bindingUpdated4(v4, v5, v6, v7) || different;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + i5 + stringify(v6) + i6 + stringify(v7) + suffix :
        NO_CHANGE;
}
/** Store a value in the `data` at a given `index`. */
export function store(index, value) {
    // We don't store any static data for local variables, so the first time
    // we see the template, we should store as null to avoid a sparse array
    if (index >= tData.length) {
        tData[index] = null;
    }
    data[index] = value;
}
/** Retrieves a value from the `data`. */
export function load(index) {
    ngDevMode && assertDataInRange(index);
    return data[index];
}
/** Retrieves a value from the `directives` array. */
export function loadDirective(index) {
    ngDevMode && assertNotNull(directives, 'Directives array should be defined if reading a dir.');
    ngDevMode && assertDataInRange(index, directives);
    return directives[index];
}
/** Gets the current binding value and increments the binding index. */
export function consumeBinding() {
    ngDevMode && assertDataInRange(currentView.bindingIndex);
    ngDevMode &&
        assertNotEqual(data[currentView.bindingIndex], NO_CHANGE, 'Stored value should never be NO_CHANGE.');
    return data[currentView.bindingIndex++];
}
/** Updates binding if changed, then returns whether it was updated. */
export function bindingUpdated(value) {
    ngDevMode && assertNotEqual(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    if (currentView.bindingIndex === -1)
        initBindings();
    if (currentView.bindingIndex >= data.length) {
        data[currentView.bindingIndex++] = value;
    }
    else if (isDifferent(data[currentView.bindingIndex], value)) {
        throwErrorIfNoChangesMode(creationMode, checkNoChangesMode, data[currentView.bindingIndex], value);
        data[currentView.bindingIndex++] = value;
    }
    else {
        currentView.bindingIndex++;
        return false;
    }
    return true;
}
/** Updates binding if changed, then returns the latest value. */
export function checkAndUpdateBinding(value) {
    bindingUpdated(value);
    return value;
}
/** Updates 2 bindings if changed, then returns whether either was updated. */
export function bindingUpdated2(exp1, exp2) {
    const different = bindingUpdated(exp1);
    return bindingUpdated(exp2) || different;
}
/** Updates 4 bindings if changed, then returns whether any was updated. */
export function bindingUpdated4(exp1, exp2, exp3, exp4) {
    const different = bindingUpdated2(exp1, exp2);
    return bindingUpdated2(exp3, exp4) || different;
}
export function getTView() {
    return currentView.tView;
}
export function getDirectiveInstance(instanceOrArray) {
    // Directives with content queries store an array in directives[directiveIndex]
    // with the instance as the first index
    return Array.isArray(instanceOrArray) ? instanceOrArray[0] : instanceOrArray;
}
export function assertPreviousIsParent() {
    assertEqual(isParent, true, 'previousOrParentNode should be a parent');
}
function assertHasParent() {
    assertNotNull(getParentLNode(previousOrParentNode), 'previousOrParentNode should have a parent');
}
function assertDataInRange(index, arr) {
    if (arr == null)
        arr = data;
    assertLessThan(index, arr ? arr.length : 0, 'index expected to be a valid data index');
}
function assertDataNext(index, arr) {
    if (arr == null)
        arr = data;
    assertEqual(arr.length, index, `index ${index} expected to be at the end of arr (length ${arr.length})`);
}
/**
 * On the first template pass, the reserved slots should be set `NO_CHANGE`.
 *
 * If not, they might not have been actually reserved.
 */
export function assertReservedSlotInitialized(slotOffset, numSlots) {
    if (firstTemplatePass) {
        const startIndex = currentView.tView.bindingStartIndex - slotOffset;
        for (let i = 0; i < numSlots; i++) {
            assertEqual(data[startIndex + i], NO_CHANGE, 'The reserved slots should be set to `NO_CHANGE` on first template pass');
        }
    }
}
export function _getComponentHostLElementNode(component) {
    ngDevMode && assertNotNull(component, 'expecting component got null');
    const lElementNode = component[NG_HOST_SYMBOL];
    ngDevMode && assertNotNull(component, 'object is not a component');
    return lElementNode;
}
export const CLEAN_PROMISE = _CLEAN_PROMISE;
export const ROOT_DIRECTIVE_INDICES = _ROOT_DIRECTIVE_INDICES;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRzVHLE9BQU8sRUFBK0IsdUJBQXVCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUs5RixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQzdDLE9BQU8sRUFBQyxXQUFXLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBRSxjQUFjLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDOUwsT0FBTyxFQUFDLDBCQUEwQixFQUFFLHFCQUFxQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFMUYsT0FBTyxFQUFvRSxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ25KLE9BQU8sRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRTVGLE9BQU8sRUFBQywwQkFBMEIsRUFBRSx5QkFBeUIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUc1Rzs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFDO0FBRWhEOzs7R0FHRztBQUNILE1BQU0sY0FBYyxHQUFH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Q0FBQztTQUMvRTtLQUNGO0FBQ0gsQ0FBQztBQUVELE1BQU0sd0NBQTJDLFNBQVk7SUFDM0QsU0FBUyxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUUsOEJBQThCLENBQUMsQ0FBQztJQUN0RSxNQUFNLFlBQVksR0FBSSxTQUFpQixDQUFDLGNBQWMsQ0FBaUIsQ0FBQztJQUN4RSxTQUFTLElBQUksYUFBYSxDQUFDLFNBQVMsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO0lBQ25FLE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7QUFFRCxNQUFNLENBQUMsTUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDO0FBQzVDLE1BQU0sQ0FBQyxNQUFNLHNCQUFzQixHQUFHLHVCQUF1QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgJy4vbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge2Fzc2VydEVxdWFsLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90RXF1YWwsIGFzc2VydE5vdE51bGwsIGFzc2VydE51bGwsIGFzc2VydFNhbWV9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TENvbnRhaW5lcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0xJbmplY3Rvcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7Q3NzU2VsZWN0b3JMaXN0LCBMUHJvamVjdGlvbiwgTkdfUFJPSkVDVF9BU19BVFRSX05BTUV9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge0N1cnJlbnRNYXRjaGVzTGlzdCwgTFZpZXcsIExWaWV3RmxhZ3MsIFJvb3RDb250ZXh0LCBURGF0YSwgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgVE5vZGVUeXBlLCBUTm9kZUZsYWdzLCBMUHJvamVjdGlvbk5vZGUsIExUZXh0Tm9kZSwgTFZpZXdOb2RlLCBUTm9kZSwgVENvbnRhaW5lck5vZGUsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIFByb3BlcnR5QWxpYXNlcywgUHJvcGVydHlBbGlhc1ZhbHVlLCBURWxlbWVudE5vZGUsfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2Fzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGluc2VydFZpZXcsIGFwcGVuZFByb2plY3RlZE5vZGUsIHJlbW92ZVZpZXcsIGNhbkluc2VydE5hdGl2ZU5vZGUsIGNyZWF0ZVRleHROb2RlLCBnZXROZXh0TE5vZGUsIGdldENoaWxkTE5vZGUsIGdldFBhcmVudExOb2RlLCBnZXRMVmlld0NoaWxkfSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7aXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QsIG1hdGNoaW5nU2VsZWN0b3JJbmRleH0gZnJvbSAnLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3QsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIFBpcGVEZWZMaXN0LCBQaXBlRGVmTGlzdE9yRmFjdG9yeSwgUmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7UkVsZW1lbnQsIFJUZXh0LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIFByb2NlZHVyYWxSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtpc0RpZmZlcmVudCwgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtleGVjdXRlSG9va3MsIHF1ZXVlTGlmZWN5Y2xlSG9va3MsIHF1ZXVlSW5pdEhvb2tzLCBleGVjdXRlSW5pdEhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5pbXBvcnQge3Rocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yLCB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlLCB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3J9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuXG4vKipcbiAqIERpcmVjdGl2ZSAoRCkgc2V0cyBhIHByb3BlcnR5IG9uIGFsbCBjb21wb25lbnQgaW5zdGFuY2VzIHVzaW5nIHRoaXMgY29uc3RhbnQgYXMgYSBrZXkgYW5kIHRoZVxuICogY29tcG9uZW50J3MgaG9zdCBub2RlIChMRWxlbWVudCkgYXMgdGhlIHZhbHVlLiBUaGlzIGlzIHVzZWQgaW4gbWV0aG9kcyBsaWtlIGRldGVjdENoYW5nZXMgdG9cbiAqIGZhY2lsaXRhdGUganVtcGluZyBmcm9tIGFuIGluc3RhbmNlIHRvIHRoZSBob3N0IG5vZGUuXG4gKi9cbmV4cG9ydCBjb25zdCBOR19IT1NUX1NZTUJPTCA9ICdfX25nSG9zdExOb2RlX18nO1xuXG4vKipcbiAqIEEgcGVybWFuZW50IG1hcmtlciBwcm9taXNlIHdoaWNoIHNpZ25pZmllcyB0aGF0IHRoZSBjdXJyZW50IENEIHRyZWUgaXNcbiAqIGNsZWFuLlxuICovXG5jb25zdCBfQ0xFQU5fUFJPTUlTRSA9IFByb21pc2UucmVzb2x2ZShudWxsKTtcblxuLyoqXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZSBiZWZvcmUgd3JpdGluZyBpdCBpbnRvIHRoZSByZW5kZXJlci5cbiAqL1xuZXhwb3J0IHR5cGUgU2FuaXRpemVyRm4gPSAodmFsdWU6IGFueSkgPT4gc3RyaW5nO1xuXG4vKipcbiAqIERpcmVjdGl2ZSBhbmQgZWxlbWVudCBpbmRpY2VzIGZvciB0b3AtbGV2ZWwgZGlyZWN0aXZlLlxuICpcbiAqIFNhdmVkIGhlcmUgdG8gYXZvaWQgcmUtaW5zdGFudGlhdGluZyBhbiBhcnJheSBvbiBldmVyeSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqL1xuZXhwb3J0IGNvbnN0IF9ST09UX0RJUkVDVElWRV9JTkRJQ0VTID0gWzAsIDBdO1xuXG4vKipcbiAqIFRva2VuIHNldCBpbiBjdXJyZW50TWF0Y2hlcyB3aGlsZSBkZXBlbmRlbmNpZXMgYXJlIGJlaW5nIHJlc29sdmVkLlxuICpcbiAqIElmIHdlIHZpc2l0IGEgZGlyZWN0aXZlIHRoYXQgaGFzIGEgdmFsdWUgc2V0IHRvIENJUkNVTEFSLCB3ZSBrbm93IHdlJ3ZlXG4gKiBhbHJlYWR5IHNlZW4gaXQsIGFuZCB0aHVzIGhhdmUgYSBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICovXG5leHBvcnQgY29uc3QgQ0lSQ1VMQVIgPSAnX19DSVJDVUxBUl9fJztcblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IGdldHMgc2V0IGJlZm9yZSBlbnRlcmluZyBhIHRlbXBsYXRlLlxuICpcbiAqIFRoaXMgcmVuZGVyZXIgY2FuIGJlIG9uZSBvZiB0d28gdmFyaWV0aWVzIG9mIFJlbmRlcmVyMzpcbiAqXG4gKiAtIE9iamVjdGVkT3JpZW50ZWRSZW5kZXJlcjNcbiAqXG4gKiBUaGlzIGlzIHRoZSBuYXRpdmUgYnJvd3NlciBBUEkgc3R5bGUsIGUuZy4gb3BlcmF0aW9ucyBhcmUgbWV0aG9kcyBvbiBpbmRpdmlkdWFsIG9iamVjdHNcbiAqIGxpa2UgSFRNTEVsZW1lbnQuIFdpdGggdGhpcyBzdHlsZSwgbm8gYWRkaXRpb25hbCBjb2RlIGlzIG5lZWRlZCBhcyBhIGZhY2FkZSAocmVkdWNpbmcgcGF5bG9hZFxuICogc2l6ZSkuXG4gKlxuICogLSBQcm9jZWR1cmFsUmVuZGVyZXIzXG4gKlxuICogSW4gbm9uLW5hdGl2ZSBicm93c2VyIGVudmlyb25tZW50cyAoZS5nLiBwbGF0Zm9ybXMgc3VjaCBhcyB3ZWItd29ya2VycyksIHRoaXMgaXMgdGhlIGZhY2FkZVxuICogdGhhdCBlbmFibGVzIGVsZW1lbnQgbWFuaXB1bGF0aW9uLiBUaGlzIGFsc28gZmFjaWxpdGF0ZXMgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aFxuICogUmVuZGVyZXIyLlxuICovXG5sZXQgcmVuZGVyZXI6IFJlbmRlcmVyMztcbmxldCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTM7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZW5kZXJlcigpOiBSZW5kZXJlcjMge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbiAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHJlbmRlcmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFNhbml0aXplcigpOiBTYW5pdGl6ZXJ8bnVsbCB7XG4gIHJldHVybiBjdXJyZW50VmlldyAmJiBjdXJyZW50Vmlldy5zYW5pdGl6ZXI7XG59XG5cbi8qKiBVc2VkIHRvIHNldCB0aGUgcGFyZW50IHByb3BlcnR5IHdoZW4gbm9kZXMgYXJlIGNyZWF0ZWQuICovXG5sZXQgcHJldmlvdXNPclBhcmVudE5vZGU6IExOb2RlO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKTogTE5vZGUge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbiAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHByZXZpb3VzT3JQYXJlbnROb2RlO1xufVxuXG4vKipcbiAqIElmIGBpc1BhcmVudGAgaXM6XG4gKiAgLSBgdHJ1ZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnROb2RlYCBwb2ludHMgdG8gYSBwYXJlbnQgbm9kZS5cbiAqICAtIGBmYWxzZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnROb2RlYCBwb2ludHMgdG8gcHJldmlvdXMgbm9kZSAoc2libGluZykuXG4gKi9cbmxldCBpc1BhcmVudDogYm9vbGVhbjtcblxuLyoqXG4gKiBTdGF0aWMgZGF0YSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBpbnN0YW5jZS1zcGVjaWZpYyBkYXRhIGFycmF5IG9uIGFuIExWaWV3LlxuICpcbiAqIEVhY2ggbm9kZSdzIHN0YXRpYyBkYXRhIGlzIHN0b3JlZCBpbiB0RGF0YSBhdCB0aGUgc2FtZSBpbmRleCB0aGF0IGl0J3Mgc3RvcmVkXG4gKiBpbiB0aGUgZGF0YSBhcnJheS4gQW55IG5vZGVzIHRoYXQgZG8gbm90IGhhdmUgc3RhdGljIGRhdGEgc3RvcmUgYSBudWxsIHZhbHVlIGluXG4gKiB0RGF0YSB0byBhdm9pZCBhIHNwYXJzZSBhcnJheS5cbiAqL1xubGV0IHREYXRhOiBURGF0YTtcblxuLyoqXG4gKiBTdGF0ZSBvZiB0aGUgY3VycmVudCB2aWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBOT1RFOiB3ZSBjaGVhdCBoZXJlIGFuZCBpbml0aWFsaXplIGl0IHRvIGBudWxsYCBldmVuIHRob3VnaHQgdGhlIHR5cGUgZG9lcyBub3RcbiAqIGNvbnRhaW4gYG51bGxgLiBUaGlzIGlzIGJlY2F1c2Ugd2UgZXhwZWN0IHRoaXMgdmFsdWUgdG8gYmUgbm90IGBudWxsYCBhcyBzb29uXG4gKiBhcyB3ZSBlbnRlciB0aGUgdmlldy4gRGVjbGFyaW5nIHRoZSB0eXBlIGFzIGBudWxsYCB3b3VsZCByZXF1aXJlIHVzIHRvIHBsYWNlIGAhYFxuICogaW4gbW9zdCBpbnN0cnVjdGlvbnMgc2luY2UgdGhleSBhbGwgYXNzdW1lIHRoYXQgYGN1cnJlbnRWaWV3YCBpcyBkZWZpbmVkLlxuICovXG5sZXQgY3VycmVudFZpZXc6IExWaWV3ID0gbnVsbCAhO1xuXG5sZXQgY3VycmVudFF1ZXJpZXM6IExRdWVyaWVzfG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50UXVlcmllcyhRdWVyeVR5cGU6IHtuZXcgKCk6IExRdWVyaWVzfSk6IExRdWVyaWVzIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb24gKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjdXJyZW50UXVlcmllcyB8fCAoY3VycmVudFF1ZXJpZXMgPSBuZXcgUXVlcnlUeXBlKCkpO1xufVxuXG4vKipcbiAqIFRoaXMgcHJvcGVydHkgZ2V0cyBzZXQgYmVmb3JlIGVudGVyaW5nIGEgdGVtcGxhdGUuXG4gKi9cbmxldCBjcmVhdGlvbk1vZGU6IGJvb2xlYW47XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDcmVhdGlvbk1vZGUoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29uIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY3JlYXRpb25Nb2RlO1xufVxuXG4vKipcbiAqIEFuIGFycmF5IG9mIG5vZGVzICh0ZXh0LCBlbGVtZW50LCBjb250YWluZXIsIGV0YyksIHBpcGVzLCB0aGVpciBiaW5kaW5ncywgYW5kXG4gKiBhbnkgbG9jYWwgdmFyaWFibGVzIHRoYXQgbmVlZCB0byBiZSBzdG9yZWQgYmV0d2VlbiBpbnZvY2F0aW9ucy5cbiAqL1xubGV0IGRhdGE6IGFueVtdO1xuXG4vKipcbiAqIEFuIGFycmF5IG9mIGRpcmVjdGl2ZSBpbnN0YW5jZXMgaW4gdGhlIGN1cnJlbnQgdmlldy5cbiAqXG4gKiBUaGVzZSBtdXN0IGJlIHN0b3JlZCBzZXBhcmF0ZWx5IGZyb20gTE5vZGVzIGJlY2F1c2UgdGhlaXIgcHJlc2VuY2UgaXNcbiAqIHVua25vd24gYXQgY29tcGlsZS10aW1lIGFuZCB0aHVzIHNwYWNlIGNhbm5vdCBiZSByZXNlcnZlZCBpbiBkYXRhW10uXG4gKi9cbmxldCBkaXJlY3RpdmVzOiBhbnlbXXxudWxsO1xuXG4vKipcbiAqIFdoZW4gYSB2aWV3IGlzIGRlc3Ryb3llZCwgbGlzdGVuZXJzIG5lZWQgdG8gYmUgcmVsZWFzZWQgYW5kIG91dHB1dHMgbmVlZCB0byBiZVxuICogdW5zdWJzY3JpYmVkLiBUaGlzIGNsZWFudXAgYXJyYXkgc3RvcmVzIGJvdGggbGlzdGVuZXIgZGF0YSAoaW4gY2h1bmtzIG9mIDQpXG4gKiBhbmQgb3V0cHV0IGRhdGEgKGluIGNodW5rcyBvZiAyKSBmb3IgYSBwYXJ0aWN1bGFyIHZpZXcuIENvbWJpbmluZyB0aGUgYXJyYXlzXG4gKiBzYXZlcyBvbiBtZW1vcnkgKDcwIGJ5dGVzIHBlciBhcnJheSkgYW5kIG9uIGEgZmV3IGJ5dGVzIG9mIGNvZGUgc2l6ZSAoZm9yIHR3b1xuICogc2VwYXJhdGUgZm9yIGxvb3BzKS5cbiAqXG4gKiBJZiBpdCdzIGEgbGlzdGVuZXIgYmVpbmcgc3RvcmVkOlxuICogMXN0IGluZGV4IGlzOiBldmVudCBuYW1lIHRvIHJlbW92ZVxuICogMm5kIGluZGV4IGlzOiBuYXRpdmUgZWxlbWVudFxuICogM3JkIGluZGV4IGlzOiBsaXN0ZW5lciBmdW5jdGlvblxuICogNHRoIGluZGV4IGlzOiB1c2VDYXB0dXJlIGJvb2xlYW5cbiAqXG4gKiBJZiBpdCdzIGFuIG91dHB1dCBzdWJzY3JpcHRpb246XG4gKiAxc3QgaW5kZXggaXM6IHVuc3Vic2NyaWJlIGZ1bmN0aW9uXG4gKiAybmQgaW5kZXggaXM6IGNvbnRleHQgZm9yIGZ1bmN0aW9uXG4gKi9cbmxldCBjbGVhbnVwOiBhbnlbXXxudWxsO1xuXG4vKipcbiAqIEluIHRoaXMgbW9kZSwgYW55IGNoYW5nZXMgaW4gYmluZGluZ3Mgd2lsbCB0aHJvdyBhbiBFeHByZXNzaW9uQ2hhbmdlZEFmdGVyQ2hlY2tlZCBlcnJvci5cbiAqXG4gKiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBDaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpLlxuICovXG5sZXQgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG5cbi8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHRoZSBjdXJyZW50IHZpZXcgaGFzIGJlZW4gcHJvY2Vzc2VkLiAqL1xubGV0IGZpcnN0VGVtcGxhdGVQYXNzID0gdHJ1ZTtcblxuY29uc3QgZW51bSBCaW5kaW5nRGlyZWN0aW9uIHtcbiAgSW5wdXQsXG4gIE91dHB1dCxcbn1cblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IHN0YXRlIHdpdGggYSBuZXcgc3RhdGUuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIHN0YXRlIGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIHN0YXRlIGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBob3N0IEVsZW1lbnQgdG8gd2hpY2ggdGhlIFZpZXcgaXMgYSBjaGlsZCBvZlxuICogQHJldHVybnMgdGhlIHByZXZpb3VzIHN0YXRlO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJWaWV3KG5ld1ZpZXc6IExWaWV3LCBob3N0OiBMRWxlbWVudE5vZGUgfCBMVmlld05vZGUgfCBudWxsKTogTFZpZXcge1xuICBjb25zdCBvbGRWaWV3OiBMVmlldyA9IGN1cnJlbnRWaWV3O1xuICBkYXRhID0gbmV3VmlldyAmJiBuZXdWaWV3LmRhdGE7XG4gIGRpcmVjdGl2ZXMgPSBuZXdWaWV3ICYmIG5ld1ZpZXcuZGlyZWN0aXZlcztcbiAgdERhdGEgPSBuZXdWaWV3ICYmIG5ld1ZpZXcudFZpZXcuZGF0YTtcbiAgY3JlYXRpb25Nb2RlID0gbmV3VmlldyAmJiAobmV3Vmlldy5mbGFncyAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlKSA9PT0gTFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gIGZpcnN0VGVtcGxhdGVQYXNzID0gbmV3VmlldyAmJiBuZXdWaWV3LnRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzO1xuXG4gIGNsZWFudXAgPSBuZXdWaWV3ICYmIG5ld1ZpZXcuY2xlYW51cDtcbiAgcmVuZGVyZXIgPSBuZXdWaWV3ICYmIG5ld1ZpZXcucmVuZGVyZXI7XG5cbiAgaWYgKGhvc3QgIT0gbnVsbCkge1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gaG9zdDtcbiAgICBpc1BhcmVudCA9IHRydWU7XG4gIH1cblxuICBjdXJyZW50VmlldyA9IG5ld1ZpZXc7XG4gIGN1cnJlbnRRdWVyaWVzID0gbmV3VmlldyAmJiBuZXdWaWV3LnF1ZXJpZXM7XG5cbiAgcmV0dXJuIG9sZFZpZXc7XG59XG5cbi8qKlxuICogVXNlZCBpbiBsaWV1IG9mIGVudGVyVmlldyB0byBtYWtlIGl0IGNsZWFyIHdoZW4gd2UgYXJlIGV4aXRpbmcgYSBjaGlsZCB2aWV3LiBUaGlzIG1ha2VzXG4gKiB0aGUgZGlyZWN0aW9uIG9mIHRyYXZlcnNhbCAodXAgb3IgZG93biB0aGUgdmlldyB0cmVlKSBhIGJpdCBjbGVhcmVyLlxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBzdGF0ZSB0byBiZWNvbWUgYWN0aXZlXG4gKiBAcGFyYW0gY3JlYXRpb25Pbmx5IEFuIG9wdGlvbmFsIGJvb2xlYW4gdG8gaW5kaWNhdGUgdGhhdCB0aGUgdmlldyB3YXMgcHJvY2Vzc2VkIGluIGNyZWF0aW9uIG1vZGVcbiAqIG9ubHksIGkuZS4gdGhlIGZpcnN0IHVwZGF0ZSB3aWxsIGJlIGRvbmUgbGF0ZXIuIE9ubHkgcG9zc2libGUgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZVZpZXcobmV3VmlldzogTFZpZXcsIGNyZWF0aW9uT25seT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKCFjcmVhdGlvbk9ubHkpIHtcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgZXhlY3V0ZUhvb2tzKFxuICAgICAgICAgIGRpcmVjdGl2ZXMgISwgY3VycmVudFZpZXcudFZpZXcudmlld0hvb2tzLCBjdXJyZW50Vmlldy50Vmlldy52aWV3Q2hlY2tIb29rcyxcbiAgICAgICAgICBjcmVhdGlvbk1vZGUpO1xuICAgIH1cbiAgICAvLyBWaWV3cyBhcmUgY2xlYW4gYW5kIGluIHVwZGF0ZSBtb2RlIGFmdGVyIGJlaW5nIGNoZWNrZWQsIHNvIHRoZXNlIGJpdHMgYXJlIGNsZWFyZWRcbiAgICBjdXJyZW50Vmlldy5mbGFncyAmPSB+KExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5EaXJ0eSk7XG4gIH1cbiAgY3VycmVudFZpZXcuZmxhZ3MgfD0gTFZpZXdGbGFncy5SdW5Jbml0O1xuICBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXggPSAtMTtcbiAgZW50ZXJWaWV3KG5ld1ZpZXcsIG51bGwpO1xufVxuXG4vKipcbiAqIFJlZnJlc2hlcyB0aGUgdmlldywgZXhlY3V0aW5nIHRoZSBmb2xsb3dpbmcgc3RlcHMgaW4gdGhhdCBvcmRlcjpcbiAqIHRyaWdnZXJzIGluaXQgaG9va3MsIHJlZnJlc2hlcyBkeW5hbWljIGNoaWxkcmVuLCB0cmlnZ2VycyBjb250ZW50IGhvb2tzLCBzZXRzIGhvc3QgYmluZGluZ3MsXG4gKiByZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cy5cbiAqIE5vdGU6IHZpZXcgaG9va3MgYXJlIHRyaWdnZXJlZCBsYXRlciB3aGVuIGxlYXZpbmcgdGhlIHZpZXcuXG4gKiAqL1xuZnVuY3Rpb24gcmVmcmVzaFZpZXcoKSB7XG4gIGNvbnN0IHRWaWV3ID0gY3VycmVudFZpZXcudFZpZXc7XG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgZXhlY3V0ZUluaXRIb29rcyhjdXJyZW50VmlldywgdFZpZXcsIGNyZWF0aW9uTW9kZSk7XG4gIH1cbiAgcmVmcmVzaER5bmFtaWNDaGlsZHJlbigpO1xuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGV4ZWN1dGVIb29rcyhkaXJlY3RpdmVzICEsIHRWaWV3LmNvbnRlbnRIb29rcywgdFZpZXcuY29udGVudENoZWNrSG9va3MsIGNyZWF0aW9uTW9kZSk7XG4gIH1cblxuICAvLyBUaGlzIG5lZWRzIHRvIGJlIHNldCBiZWZvcmUgY2hpbGRyZW4gYXJlIHByb2Nlc3NlZCB0byBzdXBwb3J0IHJlY3Vyc2l2ZSBjb21wb25lbnRzXG4gIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzID0gZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcblxuICBzZXRIb3N0QmluZGluZ3ModFZpZXcuaG9zdEJpbmRpbmdzKTtcbiAgcmVmcmVzaENoaWxkQ29tcG9uZW50cyh0Vmlldy5jb21wb25lbnRzKTtcbn1cblxuLyoqIFNldHMgdGhlIGhvc3QgYmluZGluZ3MgZm9yIHRoZSBjdXJyZW50IHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SG9zdEJpbmRpbmdzKGJpbmRpbmdzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGJpbmRpbmdzICE9IG51bGwpIHtcbiAgICBjb25zdCBkZWZzID0gY3VycmVudFZpZXcudFZpZXcuZGlyZWN0aXZlcyAhO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmluZGluZ3MubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGRpckluZGV4ID0gYmluZGluZ3NbaV07XG4gICAgICBjb25zdCBkZWYgPSBkZWZzW2RpckluZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGRlZi5ob3N0QmluZGluZ3MgJiYgZGVmLmhvc3RCaW5kaW5ncyhkaXJJbmRleCwgYmluZGluZ3NbaSArIDFdKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlZnJlc2hlcyBjaGlsZCBjb21wb25lbnRzIGluIHRoZSBjdXJyZW50IHZpZXcuICovXG5mdW5jdGlvbiByZWZyZXNoQ2hpbGRDb21wb25lbnRzKGNvbXBvbmVudHM6IG51bWJlcltdIHwgbnVsbCk6IHZvaWQge1xuICBpZiAoY29tcG9uZW50cyAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb21wb25lbnRSZWZyZXNoKGNvbXBvbmVudHNbaV0sIGNvbXBvbmVudHNbaSArIDFdKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVJbml0QW5kQ29udGVudEhvb2tzKCk6IHZvaWQge1xuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGNvbnN0IHRWaWV3ID0gY3VycmVudFZpZXcudFZpZXc7XG4gICAgZXhlY3V0ZUluaXRIb29rcyhjdXJyZW50VmlldywgdFZpZXcsIGNyZWF0aW9uTW9kZSk7XG4gICAgZXhlY3V0ZUhvb2tzKGRpcmVjdGl2ZXMgISwgdFZpZXcuY29udGVudEhvb2tzLCB0Vmlldy5jb250ZW50Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTFZpZXc8VD4oXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgdFZpZXc6IFRWaWV3LCB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8VD58IG51bGwsIGNvbnRleHQ6IFQgfCBudWxsLFxuICAgIGZsYWdzOiBMVmlld0ZsYWdzLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsKTogTFZpZXcge1xuICBjb25zdCBuZXdWaWV3ID0ge1xuICAgIHBhcmVudDogY3VycmVudFZpZXcsXG4gICAgZmxhZ3M6IGZsYWdzIHwgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkF0dGFjaGVkIHwgTFZpZXdGbGFncy5SdW5Jbml0LFxuICAgIG5vZGU6IG51bGwgISwgIC8vIHVudGlsIHdlIGluaXRpYWxpemUgaXQgaW4gY3JlYXRlTm9kZS5cbiAgICBkYXRhOiBbXSxcbiAgICBkaXJlY3RpdmVzOiBudWxsLFxuICAgIHRWaWV3OiB0VmlldyxcbiAgICBjbGVhbnVwOiBudWxsLFxuICAgIHJlbmRlcmVyOiByZW5kZXJlcixcbiAgICB0YWlsOiBudWxsLFxuICAgIG5leHQ6IG51bGwsXG4gICAgYmluZGluZ0luZGV4OiAtMSxcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXG4gICAgY29udGV4dDogY29udGV4dCxcbiAgICBxdWVyaWVzOiBudWxsLFxuICAgIGluamVjdG9yOiBjdXJyZW50VmlldyAmJiBjdXJyZW50Vmlldy5pbmplY3RvcixcbiAgICBzYW5pdGl6ZXI6IHNhbml0aXplciB8fCBudWxsXG4gIH07XG5cbiAgcmV0dXJuIG5ld1ZpZXc7XG59XG5cbi8qKlxuICogQ3JlYXRpb24gb2YgTE5vZGUgb2JqZWN0IGlzIGV4dHJhY3RlZCB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHNvIHdlIGFsd2F5cyBjcmVhdGUgTE5vZGUgb2JqZWN0XG4gKiB3aXRoIHRoZSBzYW1lIHNoYXBlXG4gKiAoc2FtZSBwcm9wZXJ0aWVzIGFzc2lnbmVkIGluIHRoZSBzYW1lIG9yZGVyKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlT2JqZWN0KFxuICAgIHR5cGU6IFROb2RlVHlwZSwgY3VycmVudFZpZXc6IExWaWV3LCBwYXJlbnQ6IExOb2RlIHwgbnVsbCxcbiAgICBuYXRpdmU6IFJUZXh0IHwgUkVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkLCBzdGF0ZTogYW55LFxuICAgIHF1ZXJpZXM6IExRdWVyaWVzIHwgbnVsbCk6IExFbGVtZW50Tm9kZSZMVGV4dE5vZGUmTFZpZXdOb2RlJkxDb250YWluZXJOb2RlJkxQcm9qZWN0aW9uTm9kZSB7XG4gIHJldHVybiB7XG4gICAgbmF0aXZlOiBuYXRpdmUgYXMgYW55LFxuICAgIHZpZXc6IGN1cnJlbnRWaWV3LFxuICAgIG5vZGVJbmplY3RvcjogcGFyZW50ID8gcGFyZW50Lm5vZGVJbmplY3RvciA6IG51bGwsXG4gICAgZGF0YTogc3RhdGUsXG4gICAgcXVlcmllczogcXVlcmllcyxcbiAgICB0Tm9kZTogbnVsbCAhLFxuICAgIHBOZXh0T3JQYXJlbnQ6IG51bGwsXG4gICAgZHluYW1pY0xDb250YWluZXJOb2RlOiBudWxsXG4gIH07XG59XG5cbi8qKlxuICogQSBjb21tb24gd2F5IG9mIGNyZWF0aW5nIHRoZSBMTm9kZSB0byBtYWtlIHN1cmUgdGhhdCBhbGwgb2YgdGhlbSBoYXZlIHNhbWUgc2hhcGUgdG9cbiAqIGtlZXAgdGhlIGV4ZWN1dGlvbiBjb2RlIG1vbm9tb3JwaGljIGFuZCBmYXN0LlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIExOb2RlIHNob3VsZCBiZSBzYXZlZCAobnVsbCBpZiB2aWV3LCBzaW5jZSB0aGV5IGFyZSBub3RcbiAqIHNhdmVkKVxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgTE5vZGUgdG8gY3JlYXRlXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgZWxlbWVudCBmb3IgdGhpcyBMTm9kZSwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIG5hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBhc3NvY2lhdGVkIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgQW55IGF0dHJzIGZvciB0aGUgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBkYXRhIEFueSBkYXRhIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIHRoZSBMTm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZTogUkVsZW1lbnQgfCBSVGV4dCB8IG51bGwsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbFZpZXc/OiBMVmlldyB8IG51bGwpOiBMRWxlbWVudE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLlZpZXcsIG5hdGl2ZTogbnVsbCwgbmFtZTogbnVsbCwgYXR0cnM6IG51bGwsXG4gICAgbFZpZXc6IExWaWV3KTogTFZpZXdOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsIG5hdGl2ZTogdW5kZWZpbmVkLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsIGxDb250YWluZXI6IExDb250YWluZXIpOiBMQ29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZShcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbmF0aXZlOiBudWxsLCBuYW1lOiBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLFxuICAgIGxQcm9qZWN0aW9uOiBMUHJvamVjdGlvbik6IExQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZShcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hdGl2ZTogUlRleHQgfCBSRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgc3RhdGU/OiBudWxsIHwgTFZpZXcgfCBMQ29udGFpbmVyIHxcbiAgICAgICAgTFByb2plY3Rpb24pOiBMRWxlbWVudE5vZGUmTFRleHROb2RlJkxWaWV3Tm9kZSZMQ29udGFpbmVyTm9kZSZMUHJvamVjdGlvbk5vZGUge1xuICBjb25zdCBwYXJlbnQgPSBpc1BhcmVudCA/IHByZXZpb3VzT3JQYXJlbnROb2RlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c09yUGFyZW50Tm9kZSAmJiBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkgIWFzIExOb2RlO1xuICAvLyBQYXJlbnRzIGNhbm5vdCBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyBiZWNhdXNlIGNvbXBvbmVudHMgd2lsbCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlcyxcbiAgLy8gc28gaXQncyBvbmx5IHNldCBpZiB0aGUgdmlldyBpcyB0aGUgc2FtZS5cbiAgY29uc3QgdFBhcmVudCA9XG4gICAgICBwYXJlbnQgJiYgcGFyZW50LnZpZXcgPT09IGN1cnJlbnRWaWV3ID8gcGFyZW50LnROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIDogbnVsbDtcbiAgbGV0IHF1ZXJpZXMgPVxuICAgICAgKGlzUGFyZW50ID8gY3VycmVudFF1ZXJpZXMgOiBwcmV2aW91c09yUGFyZW50Tm9kZSAmJiBwcmV2aW91c09yUGFyZW50Tm9kZS5xdWVyaWVzKSB8fFxuICAgICAgcGFyZW50ICYmIHBhcmVudC5xdWVyaWVzICYmIHBhcmVudC5xdWVyaWVzLmNoaWxkKCk7XG4gIGNvbnN0IGlzU3RhdGUgPSBzdGF0ZSAhPSBudWxsO1xuICBjb25zdCBub2RlID1cbiAgICAgIGNyZWF0ZUxOb2RlT2JqZWN0KHR5cGUsIGN1cnJlbnRWaWV3LCBwYXJlbnQsIG5hdGl2ZSwgaXNTdGF0ZSA/IHN0YXRlIGFzIGFueSA6IG51bGwsIHF1ZXJpZXMpO1xuXG4gIGlmIChpbmRleCA9PT0gLTEgfHwgdHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBWaWV3IG5vZGVzIGFyZSBub3Qgc3RvcmVkIGluIGRhdGEgYmVjYXVzZSB0aGV5IGNhbiBiZSBhZGRlZCAvIHJlbW92ZWQgYXQgcnVudGltZSAod2hpY2hcbiAgICAvLyB3b3VsZCBjYXVzZSBpbmRpY2VzIHRvIGNoYW5nZSkuIFRoZWlyIFROb2RlcyBhcmUgaW5zdGVhZCBzdG9yZWQgaW4gVFZpZXcubm9kZS5cbiAgICBub2RlLnROb2RlID0gKHN0YXRlIGFzIExWaWV3KS50Vmlldy5ub2RlIHx8IGNyZWF0ZVROb2RlKHR5cGUsIGluZGV4LCBudWxsLCBudWxsLCB0UGFyZW50LCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGlzIGlzIGFuIGVsZW1lbnQgb3IgY29udGFpbmVyIG9yIHByb2plY3Rpb24gbm9kZVxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhTmV4dChpbmRleCk7XG4gICAgZGF0YVtpbmRleF0gPSBub2RlO1xuXG4gICAgLy8gRXZlcnkgbm9kZSBhZGRzIGEgdmFsdWUgdG8gdGhlIHN0YXRpYyBkYXRhIGFycmF5IHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gICAgaWYgKGluZGV4ID49IHREYXRhLmxlbmd0aCkge1xuICAgICAgY29uc3QgdE5vZGUgPSB0RGF0YVtpbmRleF0gPSBjcmVhdGVUTm9kZSh0eXBlLCBpbmRleCwgbmFtZSwgYXR0cnMsIHRQYXJlbnQsIG51bGwpO1xuICAgICAgaWYgKCFpc1BhcmVudCAmJiBwcmV2aW91c09yUGFyZW50Tm9kZSkge1xuICAgICAgICBjb25zdCBwcmV2aW91c1ROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG4gICAgICAgIHByZXZpb3VzVE5vZGUubmV4dCA9IHROb2RlO1xuICAgICAgICBpZiAocHJldmlvdXNUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSkgcHJldmlvdXNUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgICB9XG4gICAgfVxuICAgIG5vZGUudE5vZGUgPSB0RGF0YVtpbmRleF0gYXMgVE5vZGU7XG5cbiAgICAvLyBOb3cgbGluayBvdXJzZWx2ZXMgaW50byB0aGUgdHJlZS5cbiAgICBpZiAoaXNQYXJlbnQpIHtcbiAgICAgIGN1cnJlbnRRdWVyaWVzID0gbnVsbDtcbiAgICAgIGlmIChwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5jaGlsZCA9PSBudWxsICYmIHByZXZpb3VzT3JQYXJlbnROb2RlLnZpZXcgPT09IGN1cnJlbnRWaWV3IHx8XG4gICAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgVmlldy5cbiAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuY2hpbGQgPSBub2RlLnROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFZpZXcgbm9kZXMgYW5kIGhvc3QgZWxlbWVudHMgbmVlZCB0byBzZXQgdGhlaXIgaG9zdCBub2RlIChjb21wb25lbnRzIHNldCBob3N0IG5vZGVzIGxhdGVyKVxuICBpZiAoKHR5cGUgJiBUTm9kZVR5cGUuVmlld09yRWxlbWVudCkgPT09IFROb2RlVHlwZS5WaWV3T3JFbGVtZW50ICYmIGlzU3RhdGUpIHtcbiAgICAvLyBCaXQgb2YgYSBoYWNrIHRvIGJ1c3QgdGhyb3VnaCB0aGUgcmVhZG9ubHkgYmVjYXVzZSB0aGVyZSBpcyBhIGNpcmN1bGFyIGRlcCBiZXR3ZWVuXG4gICAgLy8gTFZpZXcgYW5kIExOb2RlLlxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROdWxsKChzdGF0ZSBhcyBMVmlldykubm9kZSwgJ0xWaWV3Lm5vZGUgc2hvdWxkIG5vdCBoYXZlIGJlZW4gaW5pdGlhbGl6ZWQnKTtcbiAgICAoc3RhdGUgYXN7bm9kZTogTE5vZGV9KS5ub2RlID0gbm9kZTtcbiAgICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIChzdGF0ZSBhcyBMVmlldykudFZpZXcubm9kZSA9IG5vZGUudE5vZGU7XG4gIH1cblxuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IG5vZGU7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgcmV0dXJuIG5vZGU7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gUmVuZGVyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlc2V0cyB0aGUgYXBwbGljYXRpb24gc3RhdGUuXG4gKi9cbmZ1bmN0aW9uIHJlc2V0QXBwbGljYXRpb25TdGF0ZSgpIHtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBudWxsICE7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBob3N0Tm9kZSBFeGlzdGluZyBub2RlIHRvIHJlbmRlciBpbnRvLlxuICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlIGZ1bmN0aW9uIHdpdGggdGhlIGluc3RydWN0aW9ucy5cbiAqIEBwYXJhbSBjb250ZXh0IHRvIHBhc3MgaW50byB0aGUgdGVtcGxhdGUuXG4gKiBAcGFyYW0gcHJvdmlkZWRSZW5kZXJlckZhY3RvcnkgcmVuZGVyZXIgZmFjdG9yeSB0byB1c2VcbiAqIEBwYXJhbSBob3N0IFRoZSBob3N0IGVsZW1lbnQgbm9kZSB0byB1c2VcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIG1hdGNoaW5nXG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIG1hdGNoaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUZW1wbGF0ZTxUPihcbiAgICBob3N0Tm9kZTogUkVsZW1lbnQsIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgY29udGV4dDogVCxcbiAgICBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgaG9zdDogTEVsZW1lbnROb2RlIHwgbnVsbCxcbiAgICBkaXJlY3RpdmVzPzogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzPzogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMRWxlbWVudE5vZGUge1xuICBpZiAoaG9zdCA9PSBudWxsKSB7XG4gICAgcmVzZXRBcHBsaWNhdGlvblN0YXRlKCk7XG4gICAgcmVuZGVyZXJGYWN0b3J5ID0gcHJvdmlkZWRSZW5kZXJlckZhY3Rvcnk7XG4gICAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KHRlbXBsYXRlLCBkaXJlY3RpdmVzIHx8IG51bGwsIHBpcGVzIHx8IG51bGwpO1xuICAgIGhvc3QgPSBjcmVhdGVMTm9kZShcbiAgICAgICAgLTEsIFROb2RlVHlwZS5FbGVtZW50LCBob3N0Tm9kZSwgbnVsbCwgbnVsbCxcbiAgICAgICAgY3JlYXRlTFZpZXcoXG4gICAgICAgICAgICBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKSwgdFZpZXcsIG51bGwsIHt9LFxuICAgICAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgc2FuaXRpemVyKSk7XG4gIH1cbiAgY29uc3QgaG9zdFZpZXcgPSBob3N0LmRhdGEgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoaG9zdFZpZXcsICdIb3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXcgZGVmaW5lZCBpbiBob3N0LmRhdGEuJyk7XG4gIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdCwgaG9zdFZpZXcsIGNvbnRleHQsIHRlbXBsYXRlKTtcbiAgcmV0dXJuIGhvc3Q7XG59XG5cbi8qKlxuICogVXNlZCBmb3IgcmVuZGVyaW5nIGVtYmVkZGVkIHZpZXdzIChlLmcuIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MpXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBtdXN0IHN0b3JlL3JldHJpZXZlIHRoZWlyIFRWaWV3cyBkaWZmZXJlbnRseSBmcm9tIGNvbXBvbmVudCB2aWV3c1xuICogYmVjYXVzZSB0aGVpciB0ZW1wbGF0ZSBmdW5jdGlvbnMgYXJlIG5lc3RlZCBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb25zIG9mIHRoZWlyIGhvc3RzLCBjcmVhdGluZ1xuICogY2xvc3VyZXMuIElmIHRoZWlyIGhvc3QgdGVtcGxhdGUgaGFwcGVucyB0byBiZSBhbiBlbWJlZGRlZCB0ZW1wbGF0ZSBpbiBhIGxvb3AgKGUuZy4gbmdGb3IgaW5zaWRlXG4gKiBhbiBuZ0ZvciksIHRoZSBuZXN0aW5nIHdvdWxkIG1lYW4gd2UnZCBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24sIHNvIHdlXG4gKiBjYW4ndCBzdG9yZSBUVmlld3MgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIGl0c2VsZiAoYXMgd2UgZG8gZm9yIGNvbXBzKS4gSW5zdGVhZCwgd2Ugc3RvcmUgdGhlXG4gKiBUVmlldyBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBvbiB0aGVpciBob3N0IFROb2RlLCB3aGljaCBvbmx5IGhhcyBvbmUgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJFbWJlZGRlZFRlbXBsYXRlPFQ+KFxuICAgIHZpZXdOb2RlOiBMVmlld05vZGUgfCBudWxsLCB0VmlldzogVFZpZXcsIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgY29udGV4dDogVCxcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBxdWVyaWVzPzogTFF1ZXJpZXMgfCBudWxsKTogTFZpZXdOb2RlIHtcbiAgY29uc3QgX2lzUGFyZW50ID0gaXNQYXJlbnQ7XG4gIGNvbnN0IF9wcmV2aW91c09yUGFyZW50Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlO1xuICBsZXQgb2xkVmlldzogTFZpZXc7XG4gIGxldCByZjogUmVuZGVyRmxhZ3MgPSBSZW5kZXJGbGFncy5VcGRhdGU7XG4gIHRyeSB7XG4gICAgaXNQYXJlbnQgPSB0cnVlO1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gbnVsbCAhO1xuXG4gICAgaWYgKHZpZXdOb2RlID09IG51bGwpIHtcbiAgICAgIGNvbnN0IGxWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICAgICAgcmVuZGVyZXIsIHRWaWV3LCB0ZW1wbGF0ZSwgY29udGV4dCwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgZ2V0Q3VycmVudFNhbml0aXplcigpKTtcblxuICAgICAgaWYgKHF1ZXJpZXMpIHtcbiAgICAgICAgbFZpZXcucXVlcmllcyA9IHF1ZXJpZXMuY3JlYXRlVmlldygpO1xuICAgICAgfVxuXG4gICAgICB2aWV3Tm9kZSA9IGNyZWF0ZUxOb2RlKC0xLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgbFZpZXcpO1xuICAgICAgcmYgPSBSZW5kZXJGbGFncy5DcmVhdGU7XG4gICAgfVxuICAgIG9sZFZpZXcgPSBlbnRlclZpZXcodmlld05vZGUuZGF0YSwgdmlld05vZGUpO1xuICAgIHRlbXBsYXRlKHJmLCBjb250ZXh0KTtcbiAgICBpZiAocmYgJiBSZW5kZXJGbGFncy5VcGRhdGUpIHtcbiAgICAgIHJlZnJlc2hWaWV3KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZpZXdOb2RlLmRhdGEudFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgPSBmaXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICAvLyByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKCkgaXMgY2FsbGVkIHR3aWNlIGluIGZhY3QsIG9uY2UgZm9yIGNyZWF0aW9uIG9ubHkgYW5kIHRoZW4gb25jZSBmb3JcbiAgICAvLyB1cGRhdGUuIFdoZW4gZm9yIGNyZWF0aW9uIG9ubHksIGxlYXZlVmlldygpIG11c3Qgbm90IHRyaWdnZXIgdmlldyBob29rcywgbm9yIGNsZWFuIGZsYWdzLlxuICAgIGNvbnN0IGlzQ3JlYXRpb25Pbmx5ID0gKHJmICYgUmVuZGVyRmxhZ3MuQ3JlYXRlKSA9PT0gUmVuZGVyRmxhZ3MuQ3JlYXRlO1xuICAgIGxlYXZlVmlldyhvbGRWaWV3ICEsIGlzQ3JlYXRpb25Pbmx5KTtcbiAgICBpc1BhcmVudCA9IF9pc1BhcmVudDtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IF9wcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgfVxuICByZXR1cm4gdmlld05vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlPFQ+KFxuICAgIG5vZGU6IExFbGVtZW50Tm9kZSwgaG9zdFZpZXc6IExWaWV3LCBjb21wb25lbnRPckNvbnRleHQ6IFQsIHRlbXBsYXRlPzogQ29tcG9uZW50VGVtcGxhdGU8VD4pIHtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0Vmlldywgbm9kZSk7XG4gIHRyeSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSkge1xuICAgICAgdGVtcGxhdGUoZ2V0UmVuZGVyRmxhZ3MoaG9zdFZpZXcpLCBjb21wb25lbnRPckNvbnRleHQgISk7XG4gICAgICByZWZyZXNoVmlldygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpO1xuXG4gICAgICAvLyBFbGVtZW50IHdhcyBzdG9yZWQgYXQgMCBpbiBkYXRhIGFuZCBkaXJlY3RpdmUgd2FzIHN0b3JlZCBhdCAwIGluIGRpcmVjdGl2ZXNcbiAgICAgIC8vIGluIHJlbmRlckNvbXBvbmVudCgpXG4gICAgICBzZXRIb3N0QmluZGluZ3MoX1JPT1RfRElSRUNUSVZFX0lORElDRVMpO1xuICAgICAgY29tcG9uZW50UmVmcmVzaCgwLCAwKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gb2YgcmVuZGVyaW5nIGZsYWdzIGRlcGVuZGluZyBvbiB3aGVuIHRoZVxuICogdGVtcGxhdGUgaXMgaW4gY3JlYXRpb24gbW9kZSBvciB1cGRhdGUgbW9kZS4gQnkgZGVmYXVsdCwgdGhlIHVwZGF0ZSBibG9jayBpcyBydW4gd2l0aCB0aGVcbiAqIGNyZWF0aW9uIGJsb2NrIHdoZW4gdGhlIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZS4gT3RoZXJ3aXNlLCB0aGUgdXBkYXRlIGJsb2NrIGlzIHJ1blxuICogYWxvbmUuXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBkbyBOT1QgdXNlIHRoaXMgY29uZmlndXJhdGlvbiAodXBkYXRlIGJsb2NrIGFuZCBjcmVhdGUgYmxvY2sgYXJlXG4gKiBhbHdheXMgcnVuIHNlcGFyYXRlbHkpLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJGbGFncyh2aWV3OiBMVmlldyk6IFJlbmRlckZsYWdzIHtcbiAgcmV0dXJuIHZpZXcuZmxhZ3MgJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSA/IFJlbmRlckZsYWdzLkNyZWF0ZSB8IFJlbmRlckZsYWdzLlVwZGF0ZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlIERPTSBlbGVtZW50LiBUaGUgaW5zdHJ1Y3Rpb24gbXVzdCBsYXRlciBiZSBmb2xsb3dlZCBieSBgZWxlbWVudEVuZCgpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgRE9NIE5vZGVcbiAqIEBwYXJhbSBhdHRycyBTdGF0aWNhbGx5IGJvdW5kIHNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHdyaXR0ZW4gaW50byB0aGUgRE9NIGVsZW1lbnQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBBdHRyaWJ1dGVzIGFuZCBsb2NhbFJlZnMgYXJlIHBhc3NlZCBhcyBhbiBhcnJheSBvZiBzdHJpbmdzIHdoZXJlIGVsZW1lbnRzIHdpdGggYW4gZXZlbiBpbmRleFxuICogaG9sZCBhbiBhdHRyaWJ1dGUgbmFtZSBhbmQgZWxlbWVudHMgd2l0aCBhbiBvZGQgaW5kZXggaG9sZCBhbiBhdHRyaWJ1dGUgdmFsdWUsIGV4LjpcbiAqIFsnaWQnLCAnd2FybmluZzUnLCAnY2xhc3MnLCAnYWxlcnQnXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogUkVsZW1lbnQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCwgLTEsICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUVsZW1lbnQrKztcbiAgY29uc3QgbmF0aXZlOiBSRWxlbWVudCA9IHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQobmFtZSk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCAtIDEpO1xuXG4gIGNvbnN0IG5vZGU6IExFbGVtZW50Tm9kZSA9XG4gICAgICBjcmVhdGVMTm9kZShpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZSAhLCBuYW1lLCBhdHRycyB8fCBudWxsLCBudWxsKTtcblxuICBpZiAoYXR0cnMpIHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcbiAgYXBwZW5kQ2hpbGQoZ2V0UGFyZW50TE5vZGUobm9kZSksIG5hdGl2ZSwgY3VycmVudFZpZXcpO1xuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKGxvY2FsUmVmcyk7XG4gIHJldHVybiBuYXRpdmU7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RpdmUgaW5zdGFuY2VzIGFuZCBwb3B1bGF0ZXMgbG9jYWwgcmVmcy5cbiAqXG4gKiBAcGFyYW0gbG9jYWxSZWZzIExvY2FsIHJlZnMgb2YgdGhlIGN1cnJlbnQgbm9kZVxuICovXG5mdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCkge1xuICBjb25zdCBub2RlID0gcHJldmlvdXNPclBhcmVudE5vZGU7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdFRlbXBsYXRlUGFzcysrO1xuICAgIGNhY2hlTWF0Y2hpbmdEaXJlY3RpdmVzRm9yTm9kZShub2RlLnROb2RlLCBjdXJyZW50Vmlldy50VmlldywgbG9jYWxSZWZzIHx8IG51bGwpO1xuICB9IGVsc2Uge1xuICAgIGluc3RhbnRpYXRlRGlyZWN0aXZlc0RpcmVjdGx5KCk7XG4gIH1cbiAgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKCk7XG59XG5cbi8qKlxuICogT24gZmlyc3QgdGVtcGxhdGUgcGFzcywgd2UgbWF0Y2ggZWFjaCBub2RlIGFnYWluc3QgYXZhaWxhYmxlIGRpcmVjdGl2ZSBzZWxlY3RvcnMgYW5kIHNhdmVcbiAqIHRoZSByZXN1bHRpbmcgZGVmcyBpbiB0aGUgY29ycmVjdCBpbnN0YW50aWF0aW9uIG9yZGVyIGZvciBzdWJzZXF1ZW50IGNoYW5nZSBkZXRlY3Rpb24gcnVuc1xuICogKHNvIGRlcGVuZGVuY2llcyBhcmUgYWx3YXlzIGNyZWF0ZWQgYmVmb3JlIHRoZSBkaXJlY3RpdmVzIHRoYXQgaW5qZWN0IHRoZW0pLlxuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nRGlyZWN0aXZlc0Zvck5vZGUoXG4gICAgdE5vZGU6IFROb2RlLCB0VmlldzogVFZpZXcsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIC8vIFBsZWFzZSBtYWtlIHN1cmUgdG8gaGF2ZSBleHBsaWNpdCB0eXBlIGZvciBgZXhwb3J0c01hcGAuIEluZmVycmVkIHR5cGUgdHJpZ2dlcnMgYnVnIGluIHRzaWNrbGUuXG4gIGNvbnN0IGV4cG9ydHNNYXA6ICh7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpID0gbG9jYWxSZWZzID8geycnOiAtMX0gOiBudWxsO1xuICBjb25zdCBtYXRjaGVzID0gdFZpZXcuY3VycmVudE1hdGNoZXMgPSBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0Tm9kZSk7XG4gIGlmIChtYXRjaGVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkZWYgPSBtYXRjaGVzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgY29uc3QgdmFsdWVJbmRleCA9IGkgKyAxO1xuICAgICAgcmVzb2x2ZURpcmVjdGl2ZShkZWYsIHZhbHVlSW5kZXgsIG1hdGNoZXMsIHRWaWV3KTtcbiAgICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAobWF0Y2hlc1t2YWx1ZUluZGV4XSBhcyBudW1iZXIsIGRlZiwgZXhwb3J0c01hcCk7XG4gICAgfVxuICB9XG4gIGlmIChleHBvcnRzTWFwKSBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyh0Tm9kZSwgbG9jYWxSZWZzLCBleHBvcnRzTWFwKTtcbn1cblxuLyoqIE1hdGNoZXMgdGhlIGN1cnJlbnQgbm9kZSBhZ2FpbnN0IGFsbCBhdmFpbGFibGUgc2VsZWN0b3JzLiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZU1hdGNoZXModE5vZGU6IFROb2RlKTogQ3VycmVudE1hdGNoZXNMaXN0fG51bGwge1xuICBjb25zdCByZWdpc3RyeSA9IGN1cnJlbnRWaWV3LnRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5O1xuICBsZXQgbWF0Y2hlczogYW55W118bnVsbCA9IG51bGw7XG4gIGlmIChyZWdpc3RyeSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVnaXN0cnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHJlZ2lzdHJ5W2ldO1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEpKSB7XG4gICAgICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KS50ZW1wbGF0ZSkge1xuICAgICAgICAgIGlmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpIHRocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcih0Tm9kZSk7XG4gICAgICAgICAgdE5vZGUuZmxhZ3MgPSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWYuZGlQdWJsaWMpIGRlZi5kaVB1YmxpYyhkZWYpO1xuICAgICAgICAobWF0Y2hlcyB8fCAobWF0Y2hlcyA9IFtdKSkucHVzaChkZWYsIG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0Y2hlcyBhcyBDdXJyZW50TWF0Y2hlc0xpc3Q7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRGlyZWN0aXZlKFxuICAgIGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIHZhbHVlSW5kZXg6IG51bWJlciwgbWF0Y2hlczogQ3VycmVudE1hdGNoZXNMaXN0LCB0VmlldzogVFZpZXcpOiBhbnkge1xuICBpZiAobWF0Y2hlc1t2YWx1ZUluZGV4XSA9PT0gbnVsbCkge1xuICAgIG1hdGNoZXNbdmFsdWVJbmRleF0gPSBDSVJDVUxBUjtcbiAgICBjb25zdCBpbnN0YW5jZSA9IGRlZi5mYWN0b3J5KCk7XG4gICAgKHRWaWV3LmRpcmVjdGl2ZXMgfHwgKHRWaWV3LmRpcmVjdGl2ZXMgPSBbXSkpLnB1c2goZGVmKTtcbiAgICByZXR1cm4gZGlyZWN0aXZlQ3JlYXRlKG1hdGNoZXNbdmFsdWVJbmRleF0gPSB0Vmlldy5kaXJlY3RpdmVzICEubGVuZ3RoIC0gMSwgaW5zdGFuY2UsIGRlZik7XG4gIH0gZWxzZSBpZiAobWF0Y2hlc1t2YWx1ZUluZGV4XSA9PT0gQ0lSQ1VMQVIpIHtcbiAgICAvLyBJZiB3ZSByZXZpc2l0IHRoaXMgZGlyZWN0aXZlIGJlZm9yZSBpdCdzIHJlc29sdmVkLCB3ZSBrbm93IGl0J3MgY2lyY3VsYXJcbiAgICB0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvcihkZWYudHlwZSk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBTdG9yZXMgaW5kZXggb2YgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciB2aWV3IHJlZnJlc2ggZHVyaW5nIENELiAqL1xuZnVuY3Rpb24gcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrKGRpckluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgKGN1cnJlbnRWaWV3LnRWaWV3LmNvbXBvbmVudHMgfHwgKGN1cnJlbnRWaWV3LnRWaWV3LmNvbXBvbmVudHMgPSBbXG4gICAgIF0pKS5wdXNoKGRpckluZGV4LCBkYXRhLmxlbmd0aCAtIDEpO1xuICB9XG59XG5cbi8qKiBTdG9yZXMgaW5kZXggb2YgZGlyZWN0aXZlIGFuZCBob3N0IGVsZW1lbnQgc28gaXQgd2lsbCBiZSBxdWV1ZWQgZm9yIGJpbmRpbmcgcmVmcmVzaCBkdXJpbmcgQ0QuXG4gKi9cbmZ1bmN0aW9uIHF1ZXVlSG9zdEJpbmRpbmdGb3JDaGVjayhkaXJJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgKGN1cnJlbnRWaWV3LnRWaWV3Lmhvc3RCaW5kaW5ncyB8fCAoY3VycmVudFZpZXcudFZpZXcuaG9zdEJpbmRpbmdzID0gW1xuICAgXSkpLnB1c2goZGlySW5kZXgsIGRhdGEubGVuZ3RoIC0gMSk7XG59XG5cbi8qKiBTZXRzIHRoZSBjb250ZXh0IGZvciBhIENoYW5nZURldGVjdG9yUmVmIHRvIHRoZSBnaXZlbiBpbnN0YW5jZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKFxuICAgIGluamVjdG9yOiBMSW5qZWN0b3IgfCBudWxsLCBpbnN0YW5jZTogYW55LCB2aWV3OiBMVmlldyk6IHZvaWQge1xuICBpZiAoaW5qZWN0b3IgJiYgaW5qZWN0b3IuY2hhbmdlRGV0ZWN0b3JSZWYgIT0gbnVsbCkge1xuICAgIChpbmplY3Rvci5jaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3UmVmPGFueT4pLl9zZXRDb21wb25lbnRDb250ZXh0KHZpZXcsIGluc3RhbmNlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnQodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSA9PT0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGluc3RhbnRpYXRlcyB0aGUgZ2l2ZW4gZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gaW5zdGFudGlhdGVEaXJlY3RpdmVzRGlyZWN0bHkoKSB7XG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcblxuICBpZiAoY291bnQgPiAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IHREaXJlY3RpdmVzID0gY3VycmVudFZpZXcudFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZjogRGlyZWN0aXZlRGVmPGFueT4gPSB0RGlyZWN0aXZlc1tpXTtcbiAgICAgIGRpcmVjdGl2ZUNyZWF0ZShpLCBkZWYuZmFjdG9yeSgpLCBkZWYpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQ2FjaGVzIGxvY2FsIG5hbWVzIGFuZCB0aGVpciBtYXRjaGluZyBkaXJlY3RpdmUgaW5kaWNlcyBmb3IgcXVlcnkgYW5kIHRlbXBsYXRlIGxvb2t1cHMuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyhcbiAgICB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsLCBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSk6IHZvaWQge1xuICBpZiAobG9jYWxSZWZzKSB7XG4gICAgY29uc3QgbG9jYWxOYW1lczogKHN0cmluZyB8IG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPSBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBFeHBvcnQgb2YgbmFtZSAnJHtsb2NhbFJlZnNbaSArIDFdfScgbm90IGZvdW5kIWApO1xuICAgICAgbG9jYWxOYW1lcy5wdXNoKGxvY2FsUmVmc1tpXSwgaW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkcyB1cCBhbiBleHBvcnQgbWFwIGFzIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQsIHNvIGxvY2FsIHJlZnMgY2FuIGJlIHF1aWNrbHkgbWFwcGVkXG4gKiB0byB0aGVpciBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuICovXG5mdW5jdGlvbiBzYXZlTmFtZVRvRXhwb3J0TWFwKFxuICAgIGluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+LFxuICAgIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzXSA9IGluZGV4O1xuICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KS50ZW1wbGF0ZSkgZXhwb3J0c01hcFsnJ10gPSBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIGRhdGFbXSBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IGFyZSBsb2FkZWQgaW4gdGhlIHRlbXBsYXRlIHdpdGggbG9hZCgpLlxuICovXG5mdW5jdGlvbiBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEoKTogdm9pZCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluZGV4ID09PSAtMSA/IHByZXZpb3VzT3JQYXJlbnROb2RlLm5hdGl2ZSA6IGRpcmVjdGl2ZXMgIVtpbmRleF07XG4gICAgICBkYXRhLnB1c2godmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gdGVtcGxhdGUgVGhlIHRlbXBsYXRlIGZyb20gd2hpY2ggdG8gZ2V0IHN0YXRpYyBkYXRhXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBEaXJlY3RpdmUgZGVmcyB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiBUVmlld1xuICogQHBhcmFtIHBpcGVzIFBpcGUgZGVmcyB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiBUVmlld1xuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8YW55PiwgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCk6IFRWaWV3IHtcbiAgLy8gVE9ETyhtaXNrbyk6IHJlYWRpbmcgYG5nUHJpdmF0ZURhdGFgIGhlcmUgaXMgcHJvYmxlbWF0aWMgZm9yIHR3byByZWFzb25zXG4gIC8vIDEuIEl0IGlzIGEgbWVnYW1vcnBoaWMgY2FsbCBvbiBlYWNoIGludm9jYXRpb24uXG4gIC8vIDIuIEZvciBuZXN0ZWQgZW1iZWRkZWQgdmlld3MgKG5nRm9yIGluc2lkZSBuZ0ZvcikgdGhlIHRlbXBsYXRlIGluc3RhbmNlIGlzIHBlclxuICAvLyAgICBvdXRlciB0ZW1wbGF0ZSBpbnZvY2F0aW9uLCB3aGljaCBtZWFucyB0aGF0IG5vIHN1Y2ggcHJvcGVydHkgd2lsbCBleGlzdFxuICAvLyBDb3JyZWN0IHNvbHV0aW9uIGlzIHRvIG9ubHkgcHV0IGBuZ1ByaXZhdGVEYXRhYCBvbiB0aGUgQ29tcG9uZW50IHRlbXBsYXRlXG4gIC8vIGFuZCBub3Qgb24gZW1iZWRkZWQgdGVtcGxhdGVzLlxuXG4gIHJldHVybiB0ZW1wbGF0ZS5uZ1ByaXZhdGVEYXRhIHx8XG4gICAgICAodGVtcGxhdGUubmdQcml2YXRlRGF0YSA9IGNyZWF0ZVRWaWV3KC0xLCBkaXJlY3RpdmVzLCBwaXBlcykgYXMgbmV2ZXIpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBUVmlldyBpbnN0YW5jZVxuICpcbiAqIEBwYXJhbSB2aWV3SW5kZXggVGhlIHZpZXdCbG9ja0lkIGZvciBpbmxpbmUgdmlld3MsIG9yIC0xIGlmIGl0J3MgYSBjb21wb25lbnQvZHluYW1pY1xuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVFZpZXcoXG4gICAgdmlld0luZGV4OiBudW1iZXIsIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgcmV0dXJuIHtcbiAgICBpZDogdmlld0luZGV4LFxuICAgIG5vZGU6IG51bGwgISxcbiAgICBkYXRhOiBbXSxcbiAgICBjaGlsZEluZGV4OiAtMSwgICAgICAgICAvLyBDaGlsZHJlbiBzZXQgaW4gYWRkVG9WaWV3VHJlZSgpLCBpZiBhbnlcbiAgICBiaW5kaW5nU3RhcnRJbmRleDogLTEsICAvLyBTZXQgaW4gaW5pdEJpbmRpbmdzKClcbiAgICBkaXJlY3RpdmVzOiBudWxsLFxuICAgIGZpcnN0VGVtcGxhdGVQYXNzOiB0cnVlLFxuICAgIGluaXRIb29rczogbnVsbCxcbiAgICBjaGVja0hvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRIb29rczogbnVsbCxcbiAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgdmlld0NoZWNrSG9va3M6IG51bGwsXG4gICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgIHBpcGVEZXN0cm95SG9va3M6IG51bGwsXG4gICAgaG9zdEJpbmRpbmdzOiBudWxsLFxuICAgIGNvbXBvbmVudHM6IG51bGwsXG4gICAgZGlyZWN0aXZlUmVnaXN0cnk6IHR5cGVvZiBkaXJlY3RpdmVzID09PSAnZnVuY3Rpb24nID8gZGlyZWN0aXZlcygpIDogZGlyZWN0aXZlcyxcbiAgICBwaXBlUmVnaXN0cnk6IHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcyxcbiAgICBjdXJyZW50TWF0Y2hlczogbnVsbFxuICB9O1xufVxuXG5mdW5jdGlvbiBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlOiBSRWxlbWVudCwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogdm9pZCB7XG4gIGNvbnN0IGlzUHJvYyA9IGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU0VMRUNUX09OTFkpIGJyZWFrO1xuICAgIGlmIChhdHRyTmFtZSAhPT0gTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpIHtcbiAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpICsgMV07XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgICBpc1Byb2MgP1xuICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKVxuICAgICAgICAgICAgICAuc2V0QXR0cmlidXRlKG5hdGl2ZSwgYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZykgOlxuICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZyk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvcih0ZXh0OiBzdHJpbmcsIHRva2VuOiBhbnkpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihgUmVuZGVyZXI6ICR7dGV4dH0gWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG59XG5cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBob3N0IG5hdGl2ZSBlbGVtZW50LCB1c2VkIGZvciBib290c3RyYXBwaW5nIGV4aXN0aW5nIG5vZGVzIGludG8gcmVuZGVyaW5nIHBpcGVsaW5lLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50T3JTZWxlY3RvciBSZW5kZXIgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3IgdG8gbG9jYXRlIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9jYXRlSG9zdEVsZW1lbnQoXG4gICAgZmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgZWxlbWVudE9yU2VsZWN0b3I6IFJFbGVtZW50IHwgc3RyaW5nKTogUkVsZW1lbnR8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSgtMSk7XG4gIHJlbmRlcmVyRmFjdG9yeSA9IGZhY3Rvcnk7XG4gIGNvbnN0IGRlZmF1bHRSZW5kZXJlciA9IGZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG4gIGNvbnN0IHJOb2RlID0gdHlwZW9mIGVsZW1lbnRPclNlbGVjdG9yID09PSAnc3RyaW5nJyA/XG4gICAgICAoaXNQcm9jZWR1cmFsUmVuZGVyZXIoZGVmYXVsdFJlbmRlcmVyKSA/XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5zZWxlY3RSb290RWxlbWVudChlbGVtZW50T3JTZWxlY3RvcikgOlxuICAgICAgICAgICBkZWZhdWx0UmVuZGVyZXIucXVlcnlTZWxlY3RvcihlbGVtZW50T3JTZWxlY3RvcikpIDpcbiAgICAgIGVsZW1lbnRPclNlbGVjdG9yO1xuICBpZiAobmdEZXZNb2RlICYmICFyTm9kZSkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIHdpdGggc2VsZWN0b3Igbm90IGZvdW5kOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoJ0hvc3Qgbm9kZSBpcyByZXF1aXJlZDonLCBlbGVtZW50T3JTZWxlY3Rvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiByTm9kZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBob3N0IExOb2RlLlxuICpcbiAqIEBwYXJhbSByTm9kZSBSZW5kZXIgaG9zdCBlbGVtZW50LlxuICogQHBhcmFtIGRlZiBDb21wb25lbnREZWZcbiAqXG4gKiBAcmV0dXJucyBMRWxlbWVudE5vZGUgY3JlYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaG9zdEVsZW1lbnQoXG4gICAgdGFnOiBzdHJpbmcsIHJOb2RlOiBSRWxlbWVudCB8IG51bGwsIGRlZjogQ29tcG9uZW50RGVmPGFueT4sXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExFbGVtZW50Tm9kZSB7XG4gIHJlc2V0QXBwbGljYXRpb25TdGF0ZSgpO1xuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGUoXG4gICAgICAwLCBUTm9kZVR5cGUuRWxlbWVudCwgck5vZGUsIG51bGwsIG51bGwsXG4gICAgICBjcmVhdGVMVmlldyhcbiAgICAgICAgICByZW5kZXJlciwgZ2V0T3JDcmVhdGVUVmlldyhkZWYudGVtcGxhdGUsIGRlZi5kaXJlY3RpdmVEZWZzLCBkZWYucGlwZURlZnMpLCBudWxsLCBudWxsLFxuICAgICAgICAgIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgc2FuaXRpemVyKSk7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbm9kZS50Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG4gICAgaWYgKGRlZi5kaVB1YmxpYykgZGVmLmRpUHVibGljKGRlZik7XG4gICAgY3VycmVudFZpZXcudFZpZXcuZGlyZWN0aXZlcyA9IFtkZWZdO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59XG5cblxuLyoqXG4gKiBBZGRzIGFuIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBjdXJyZW50IG5vZGUuXG4gKlxuICogSWYgYW4gb3V0cHV0IGV4aXN0cyBvbiBvbmUgb2YgdGhlIG5vZGUncyBkaXJlY3RpdmVzLCBpdCBhbHNvIHN1YnNjcmliZXMgdG8gdGhlIG91dHB1dFxuICogYW5kIHNhdmVzIHRoZSBzdWJzY3JpcHRpb24gZm9yIGxhdGVyIGNsZWFudXAuXG4gKlxuICogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudFxuICogQHBhcmFtIGxpc3RlbmVyRm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIGV2ZW50IGVtaXRzXG4gKiBAcGFyYW0gdXNlQ2FwdHVyZSBXaGV0aGVyIG9yIG5vdCB0byB1c2UgY2FwdHVyZSBpbiBldmVudCBsaXN0ZW5lci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgY29uc3Qgbm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlO1xuICBjb25zdCBuYXRpdmUgPSBub2RlLm5hdGl2ZSBhcyBSRWxlbWVudDtcblxuICAvLyBJbiBvcmRlciB0byBtYXRjaCBjdXJyZW50IGJlaGF2aW9yLCBuYXRpdmUgRE9NIGV2ZW50IGxpc3RlbmVycyBtdXN0IGJlIGFkZGVkIGZvciBhbGxcbiAgLy8gZXZlbnRzIChpbmNsdWRpbmcgb3V0cHV0cykuXG4gIGNvbnN0IGNsZWFudXBGbnMgPSBjbGVhbnVwIHx8IChjbGVhbnVwID0gY3VycmVudFZpZXcuY2xlYW51cCA9IFtdKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIGNvbnN0IHdyYXBwZWRMaXN0ZW5lciA9IHdyYXBMaXN0ZW5lcldpdGhEaXJ0eUxvZ2ljKGN1cnJlbnRWaWV3LCBsaXN0ZW5lckZuKTtcbiAgICBjb25zdCBjbGVhbnVwRm4gPSByZW5kZXJlci5saXN0ZW4obmF0aXZlLCBldmVudE5hbWUsIHdyYXBwZWRMaXN0ZW5lcik7XG4gICAgY2xlYW51cEZucy5wdXNoKGNsZWFudXBGbiwgbnVsbCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgd3JhcHBlZExpc3RlbmVyID0gd3JhcExpc3RlbmVyV2l0aERpcnR5QW5kRGVmYXVsdChjdXJyZW50VmlldywgbGlzdGVuZXJGbik7XG4gICAgbmF0aXZlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCB3cmFwcGVkTGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgIGNsZWFudXBGbnMucHVzaChldmVudE5hbWUsIG5hdGl2ZSwgd3JhcHBlZExpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgfVxuXG4gIGxldCB0Tm9kZTogVE5vZGV8bnVsbCA9IG5vZGUudE5vZGU7XG4gIGlmICh0Tm9kZS5vdXRwdXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBpZiB3ZSBjcmVhdGUgVE5vZGUgaGVyZSwgaW5wdXRzIG11c3QgYmUgdW5kZWZpbmVkIHNvIHdlIGtub3cgdGhleSBzdGlsbCBuZWVkIHRvIGJlXG4gICAgLy8gY2hlY2tlZFxuICAgIHROb2RlLm91dHB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhub2RlLnROb2RlLmZsYWdzLCBCaW5kaW5nRGlyZWN0aW9uLk91dHB1dCk7XG4gIH1cblxuICBjb25zdCBvdXRwdXRzID0gdE5vZGUub3V0cHV0cztcbiAgbGV0IG91dHB1dERhdGE6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmIChvdXRwdXRzICYmIChvdXRwdXREYXRhID0gb3V0cHV0c1tldmVudE5hbWVdKSkge1xuICAgIGNyZWF0ZU91dHB1dChvdXRwdXREYXRhLCBsaXN0ZW5lckZuKTtcbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggdGhlIG91dHB1dHMgYXNzb2NpYXRlZCB3aXRoIGEgcGFydGljdWxhciBldmVudCBuYW1lIGFuZCBzdWJzY3JpYmVzIHRvXG4gKiBlYWNoIG91dHB1dC5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlT3V0cHV0KG91dHB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgbGlzdGVuZXI6IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0cHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShvdXRwdXRzW2ldIGFzIG51bWJlciwgZGlyZWN0aXZlcyAhKTtcbiAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBkaXJlY3RpdmVzICFbb3V0cHV0c1tpXSBhcyBudW1iZXJdW291dHB1dHNbaSArIDFdXS5zdWJzY3JpYmUobGlzdGVuZXIpO1xuICAgIGNsZWFudXAgIS5wdXNoKHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSwgc3Vic2NyaXB0aW9uKTtcbiAgfVxufVxuXG4vKiogTWFyayB0aGUgZW5kIG9mIHRoZSBlbGVtZW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRFbmQoKSB7XG4gIGlmIChpc1BhcmVudCkge1xuICAgIGlzUGFyZW50ID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudCgpO1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpIGFzIExFbGVtZW50Tm9kZTtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgY29uc3QgcXVlcmllcyA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnF1ZXJpZXM7XG4gIHF1ZXJpZXMgJiYgcXVlcmllcy5hZGROb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKTtcbiAgcXVldWVMaWZlY3ljbGVIb29rcyhwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5mbGFncywgY3VycmVudFZpZXcpO1xufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHZhbHVlIG9mIHJlbW92ZXMgYW4gYXR0cmlidXRlIG9uIGFuIEVsZW1lbnQuXG4gKlxuICogQHBhcmFtIG51bWJlciBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB2YWx1ZSB2YWx1ZSBUaGUgYXR0cmlidXRlIGlzIHJlbW92ZWQgd2hlbiB2YWx1ZSBpcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAuXG4gKiAgICAgICAgICAgICAgICAgIE90aGVyd2lzZSB0aGUgYXR0cmlidXRlIHZhbHVlIGlzIHNldCB0byB0aGUgc3RyaW5naWZpZWQgdmFsdWUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEF0dHJpYnV0ZShcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIHNhbml0aXplcj86IFNhbml0aXplckZuKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgZWxlbWVudDogTEVsZW1lbnROb2RlID0gZGF0YVtpbmRleF07XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZShlbGVtZW50Lm5hdGl2ZSwgbmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5uYXRpdmUucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgICBjb25zdCBzdHJWYWx1ZSA9IHNhbml0aXplciA9PSBudWxsID8gc3RyaW5naWZ5KHZhbHVlKSA6IHNhbml0aXplcih2YWx1ZSk7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudC5uYXRpdmUsIG5hbWUsIHN0clZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50Lm5hdGl2ZS5zZXRBdHRyaWJ1dGUobmFtZSwgc3RyVmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIHByb3BlcnR5IG9uIGFuIEVsZW1lbnQuXG4gKlxuICogSWYgdGhlIHByb3BlcnR5IG5hbWUgYWxzbyBleGlzdHMgYXMgYW4gaW5wdXQgcHJvcGVydHkgb24gb25lIG9mIHRoZSBlbGVtZW50J3MgZGlyZWN0aXZlcyxcbiAqIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4gKiBiZSBjb25kdWN0ZWQgYXQgcnVudGltZSBzbyBjaGlsZCBjb21wb25lbnRzIHRoYXQgYWRkIG5ldyBASW5wdXRzIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRQcm9wZXJ0eTxUPihcbiAgICBpbmRleDogbnVtYmVyLCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlID09PSBOT19DSEFOR0UpIHJldHVybjtcbiAgY29uc3Qgbm9kZSA9IGRhdGFbaW5kZXhdIGFzIExFbGVtZW50Tm9kZTtcbiAgY29uc3QgdE5vZGUgPSBub2RlLnROb2RlO1xuICAvLyBpZiB0Tm9kZS5pbnB1dHMgaXMgdW5kZWZpbmVkLCBhIGxpc3RlbmVyIGhhcyBjcmVhdGVkIG91dHB1dHMsIGJ1dCBpbnB1dHMgaGF2ZW4ndFxuICAvLyB5ZXQgYmVlbiBjaGVja2VkXG4gIGlmICh0Tm9kZSAmJiB0Tm9kZS5pbnB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIG1hcmsgaW5wdXRzIGFzIGNoZWNrZWRcbiAgICB0Tm9kZS5pbnB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhub2RlLnROb2RlLmZsYWdzLCBCaW5kaW5nRGlyZWN0aW9uLklucHV0KTtcbiAgfVxuXG4gIGNvbnN0IGlucHV0RGF0YSA9IHROb2RlICYmIHROb2RlLmlucHV0cztcbiAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKGlucHV0RGF0YSAmJiAoZGF0YVZhbHVlID0gaW5wdXREYXRhW3Byb3BOYW1lXSkpIHtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICBtYXJrRGlydHlJZk9uUHVzaChub2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIHNhbml0aXplciBpcyBvbmx5IGFkZGVkIHdoZW4gdGhlIGNvbXBpbGVyIGRldGVybWluZXMgdGhhdCB0aGUgcHJvcGVydHlcbiAgICAvLyBpcyByaXNreSwgc28gc2FuaXRpemF0aW9uIGNhbiBiZSBkb25lIHdpdGhvdXQgZnVydGhlciBjaGVja3MuXG4gICAgdmFsdWUgPSBzYW5pdGl6ZXIgIT0gbnVsbCA/IChzYW5pdGl6ZXIodmFsdWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICBjb25zdCBuYXRpdmUgPSBub2RlLm5hdGl2ZTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0UHJvcGVydHkrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRQcm9wZXJ0eShuYXRpdmUsIHByb3BOYW1lLCB2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChuYXRpdmUuc2V0UHJvcGVydHkgPyBuYXRpdmUuc2V0UHJvcGVydHkocHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChuYXRpdmUgYXMgYW55KVtwcm9wTmFtZV0gPSB2YWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgVE5vZGUgb2JqZWN0IGZyb20gdGhlIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiB0aGUgbm9kZVxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgVE5vZGUgaW4gVFZpZXcuZGF0YVxuICogQHBhcmFtIHRhZ05hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJpYnV0ZXMgZGVmaW5lZCBvbiB0aGlzIG5vZGVcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCBvZiB0aGlzIG5vZGVcbiAqIEBwYXJhbSB0Vmlld3MgQW55IFRWaWV3cyBhdHRhY2hlZCB0byB0aGlzIG5vZGVcbiAqIEByZXR1cm5zIHRoZSBUTm9kZSBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHR5cGU6IFROb2RlVHlwZSwgaW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCxcbiAgICBwYXJlbnQ6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgbnVsbCwgdFZpZXdzOiBUVmlld1tdIHwgbnVsbCk6IFROb2RlIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50Tm9kZSsrO1xuICByZXR1cm4ge1xuICAgIHR5cGU6IHR5cGUsXG4gICAgaW5kZXg6IGluZGV4LFxuICAgIGZsYWdzOiAwLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgYXR0cnM6IGF0dHJzLFxuICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgIGlucHV0czogdW5kZWZpbmVkLFxuICAgIG91dHB1dHM6IHVuZGVmaW5lZCxcbiAgICB0Vmlld3M6IHRWaWV3cyxcbiAgICBuZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogcGFyZW50LFxuICAgIGR5bmFtaWNDb250YWluZXJOb2RlOiBudWxsXG4gIH07XG59XG5cbi8qKlxuICogR2l2ZW4gYSBsaXN0IG9mIGRpcmVjdGl2ZSBpbmRpY2VzIGFuZCBtaW5pZmllZCBpbnB1dCBuYW1lcywgc2V0cyB0aGVcbiAqIGlucHV0IHByb3BlcnRpZXMgb24gdGhlIGNvcnJlc3BvbmRpbmcgZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkoaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5wdXRzW2ldIGFzIG51bWJlciwgZGlyZWN0aXZlcyAhKTtcbiAgICBkaXJlY3RpdmVzICFbaW5wdXRzW2ldIGFzIG51bWJlcl1baW5wdXRzW2kgKyAxXV0gPSB2YWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnNvbGlkYXRlcyBhbGwgaW5wdXRzIG9yIG91dHB1dHMgb2YgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBsb2dpY2FsIG5vZGUuXG4gKlxuICogQHBhcmFtIG51bWJlciBsTm9kZUZsYWdzIGxvZ2ljYWwgbm9kZSBmbGFnc1xuICogQHBhcmFtIERpcmVjdGlvbiBkaXJlY3Rpb24gd2hldGhlciB0byBjb25zaWRlciBpbnB1dHMgb3Igb3V0cHV0c1xuICogQHJldHVybnMgUHJvcGVydHlBbGlhc2VzfG51bGwgYWdncmVnYXRlIG9mIGFsbCBwcm9wZXJ0aWVzIGlmIGFueSwgYG51bGxgIG90aGVyd2lzZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICB0Tm9kZUZsYWdzOiBUTm9kZUZsYWdzLCBkaXJlY3Rpb246IEJpbmRpbmdEaXJlY3Rpb24pOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICBsZXQgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG5cbiAgaWYgKGNvdW50ID4gMCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IGlzSW5wdXQgPSBkaXJlY3Rpb24gPT09IEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQ7XG4gICAgY29uc3QgZGVmcyA9IGN1cnJlbnRWaWV3LnRWaWV3LmRpcmVjdGl2ZXMgITtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgY29uc3QgcHJvcGVydHlBbGlhc01hcDoge1twdWJsaWNOYW1lOiBzdHJpbmddOiBzdHJpbmd9ID1cbiAgICAgICAgICBpc0lucHV0ID8gZGlyZWN0aXZlRGVmLmlucHV0cyA6IGRpcmVjdGl2ZURlZi5vdXRwdXRzO1xuICAgICAgZm9yIChsZXQgcHVibGljTmFtZSBpbiBwcm9wZXJ0eUFsaWFzTWFwKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0eUFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICAgICAgcHJvcFN0b3JlID0gcHJvcFN0b3JlIHx8IHt9O1xuICAgICAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IHByb3BlcnR5QWxpYXNNYXBbcHVibGljTmFtZV07XG4gICAgICAgICAgY29uc3QgaGFzUHJvcGVydHkgPSBwcm9wU3RvcmUuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSk7XG4gICAgICAgICAgaGFzUHJvcGVydHkgPyBwcm9wU3RvcmVbcHVibGljTmFtZV0ucHVzaChpLCBpbnRlcm5hbE5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIChwcm9wU3RvcmVbcHVibGljTmFtZV0gPSBbaSwgaW50ZXJuYWxOYW1lXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByb3BTdG9yZTtcbn1cblxuLyoqXG4gKiBBZGQgb3IgcmVtb3ZlIGEgY2xhc3MgaW4gYSBgY2xhc3NMaXN0YCBvbiBhIERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBbY2xhc3MuZm9vXT1cImV4cFwiIGNhc2VcbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIGNsYXNzTmFtZSBOYW1lIG9mIGNsYXNzIHRvIHRvZ2dsZS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00sIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBBIHZhbHVlIGluZGljYXRpbmcgaWYgYSBnaXZlbiBjbGFzcyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDbGFzc05hbWVkPFQ+KGluZGV4OiBudW1iZXIsIGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IGxFbGVtZW50ID0gZGF0YVtpbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZENsYXNzKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hZGRDbGFzcyhsRWxlbWVudC5uYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbEVsZW1lbnQubmF0aXZlLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUNsYXNzKGxFbGVtZW50Lm5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsRWxlbWVudC5uYXRpdmUuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldCB0aGUgYGNsYXNzTmFtZWAgcHJvcGVydHkgb24gYSBET00gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtjbGFzc109XCJleHBcImAgdXNhZ2UuXG4gKlxuICogYGVsZW1lbnRDbGFzc2AgaW5zdHJ1Y3Rpb24gd3JpdGVzIHRoZSB2YWx1ZSB0byB0aGUgXCJlbGVtZW50J3NcIiBgY2xhc3NOYW1lYCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgaW5kaWNhdGluZyBhIHNldCBvZiBjbGFzc2VzIHdoaWNoIHNob3VsZCBiZSBhcHBsaWVkLiBUaGUgbWV0aG9kIG92ZXJyaWRlc1xuICogICBhbnkgZXhpc3RpbmcgY2xhc3Nlcy4gVGhlIHZhbHVlIGlzIHN0cmluZ2lmaWVkIChgdG9TdHJpbmdgKSBiZWZvcmUgaXQgaXMgYXBwbGllZCB0byB0aGVcbiAqICAgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDbGFzczxUPihpbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIC8vIFRPRE86IFRoaXMgaXMgYSBuYWl2ZSBpbXBsZW1lbnRhdGlvbiB3aGljaCBzaW1wbHkgd3JpdGVzIHZhbHVlIHRvIHRoZSBgY2xhc3NOYW1lYC4gSW4gdGhlXG4gICAgLy8gZnV0dXJlXG4gICAgLy8gd2Ugd2lsbCBhZGQgbG9naWMgaGVyZSB3aGljaCB3b3VsZCB3b3JrIHdpdGggdGhlIGFuaW1hdGlvbiBjb2RlLlxuICAgIGNvbnN0IGxFbGVtZW50OiBMRWxlbWVudE5vZGUgPSBkYXRhW2luZGV4XTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0Q2xhc3NOYW1lKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0UHJvcGVydHkobEVsZW1lbnQubmF0aXZlLCAnY2xhc3NOYW1lJywgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsRWxlbWVudC5uYXRpdmVbJ2NsYXNzTmFtZSddID0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIGdpdmVuIHN0eWxlIG9uIGFuIEVsZW1lbnQuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IHRvIGNoYW5nZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHN0eWxlTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChudWxsIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHRyYW5zZm9ybSB0aGUgdmFsdWUgdHlwaWNhbGx5IHVzZWQgZm9yXG4gKiAgICAgICAgc2FuaXRpemF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlTmFtZWQ8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgc3R5bGVOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzdWZmaXg/OiBzdHJpbmcpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsZU5hbWVkPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxlTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsZU5hbWVkPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxlTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSxcbiAgICBzdWZmaXhPclNhbml0aXplcj86IHN0cmluZyB8IFNhbml0aXplckZuKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgbEVsZW1lbnQ6IExFbGVtZW50Tm9kZSA9IGRhdGFbaW5kZXhdO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIucmVtb3ZlU3R5bGUobEVsZW1lbnQubmF0aXZlLCBzdHlsZU5hbWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICBsRWxlbWVudC5uYXRpdmVbJ3N0eWxlJ10ucmVtb3ZlUHJvcGVydHkoc3R5bGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHN0clZhbHVlID1cbiAgICAgICAgICB0eXBlb2Ygc3VmZml4T3JTYW5pdGl6ZXIgPT0gJ2Z1bmN0aW9uJyA/IHN1ZmZpeE9yU2FuaXRpemVyKHZhbHVlKSA6IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICBpZiAodHlwZW9mIHN1ZmZpeE9yU2FuaXRpemVyID09ICdzdHJpbmcnKSBzdHJWYWx1ZSA9IHN0clZhbHVlICsgc3VmZml4T3JTYW5pdGl6ZXI7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIuc2V0U3R5bGUobEVsZW1lbnQubmF0aXZlLCBzdHlsZU5hbWUsIHN0clZhbHVlLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgICAgbEVsZW1lbnQubmF0aXZlWydzdHlsZSddLnNldFByb3BlcnR5KHN0eWxlTmFtZSwgc3RyVmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldCB0aGUgYHN0eWxlYCBwcm9wZXJ0eSBvbiBhIERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB1c2FnZS5cbiAqXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB2YWx1ZSBBIHZhbHVlIGluZGljYXRpbmcgaWYgYSBnaXZlbiBzdHlsZSBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZC5cbiAqICAgVGhlIGV4cGVjdGVkIHNoYXBlIG9mIGB2YWx1ZWAgaXMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIHN0eWxlIG5hbWVzIGFuZCB0aGUgdmFsdWVzXG4gKiAgIGFyZSB0aGVpciBjb3JyZXNwb25kaW5nIHZhbHVlcyB0byBzZXQuIElmIHZhbHVlIGlzIGZhbHN5LCB0aGVuIHRoZSBzdHlsZSBpcyByZW1vdmVkLiBBbiBhYnNlbmNlXG4gKiAgIG9mIHN0eWxlIGRvZXMgbm90IGNhdXNlIHRoYXQgc3R5bGUgdG8gYmUgcmVtb3ZlZC4gYE5PX0NIQU5HRWAgaW1wbGllcyB0aGF0IG5vIHVwZGF0ZSBzaG91bGQgYmVcbiAqICAgcGVyZm9ybWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHZhbHVlOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIC8vIFRPRE86IFRoaXMgaXMgYSBuYWl2ZSBpbXBsZW1lbnRhdGlvbiB3aGljaCBzaW1wbHkgd3JpdGVzIHZhbHVlIHRvIHRoZSBgc3R5bGVgLiBJbiB0aGUgZnV0dXJlXG4gICAgLy8gd2Ugd2lsbCBhZGQgbG9naWMgaGVyZSB3aGljaCB3b3VsZCB3b3JrIHdpdGggdGhlIGFuaW1hdGlvbiBjb2RlLlxuICAgIGNvbnN0IGxFbGVtZW50ID0gZGF0YVtpbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgcmVuZGVyZXIuc2V0UHJvcGVydHkobEVsZW1lbnQubmF0aXZlLCAnc3R5bGUnLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0eWxlID0gbEVsZW1lbnQubmF0aXZlWydzdHlsZSddO1xuICAgICAgZm9yIChsZXQgaSA9IDAsIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlTmFtZTogc3RyaW5nID0ga2V5c1tpXTtcbiAgICAgICAgY29uc3Qgc3R5bGVWYWx1ZTogYW55ID0gKHZhbHVlIGFzIGFueSlbc3R5bGVOYW1lXTtcbiAgICAgICAgaWYgKHN0eWxlVmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuICAgICAgICAgIHN0eWxlLnJlbW92ZVByb3BlcnR5KHN0eWxlTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG4gICAgICAgICAgc3R5bGUuc2V0UHJvcGVydHkoc3R5bGVOYW1lLCBzdHlsZVZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVGV4dFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgc3RhdGljIHRleHQgbm9kZVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byB3cml0ZS4gVGhpcyB2YWx1ZSB3aWxsIGJlIHN0cmluZ2lmaWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dChpbmRleDogbnVtYmVyLCB2YWx1ZT86IGFueSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCwgLTEsICd0ZXh0IG5vZGVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgY29uc3QgdGV4dE5vZGUgPSBjcmVhdGVUZXh0Tm9kZSh2YWx1ZSwgcmVuZGVyZXIpO1xuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGUoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCB0ZXh0Tm9kZSwgbnVsbCwgbnVsbCk7XG5cbiAgLy8gVGV4dCBub2RlcyBhcmUgc2VsZiBjbG9zaW5nLlxuICBpc1BhcmVudCA9IGZhbHNlO1xuICBhcHBlbmRDaGlsZChnZXRQYXJlbnRMTm9kZShub2RlKSwgdGV4dE5vZGUsIGN1cnJlbnRWaWV3KTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgdGV4dCBub2RlIHdpdGggYmluZGluZ1xuICogQmluZGluZ3Mgc2hvdWxkIGJlIGhhbmRsZWQgZXh0ZXJuYWxseSB3aXRoIHRoZSBwcm9wZXIgaW50ZXJwb2xhdGlvbigxLTgpIG1ldGhvZFxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqIEBwYXJhbSB2YWx1ZSBTdHJpbmdpZmllZCB2YWx1ZSB0byB3cml0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHRCaW5kaW5nPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4KTtcbiAgICBjb25zdCBleGlzdGluZ05vZGUgPSBkYXRhW2luZGV4XSBhcyBMVGV4dE5vZGU7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoZXhpc3RpbmdOb2RlLCAnTE5vZGUgc2hvdWxkIGV4aXN0Jyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoZXhpc3RpbmdOb2RlLm5hdGl2ZSwgJ25hdGl2ZSBlbGVtZW50IHNob3VsZCBleGlzdCcpO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0VmFsdWUoZXhpc3RpbmdOb2RlLm5hdGl2ZSwgc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nTm9kZS5uYXRpdmUudGV4dENvbnRlbnQgPSBzdHJpbmdpZnkodmFsdWUpO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIERpcmVjdGl2ZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgYSBkaXJlY3RpdmUuXG4gKlxuICogTk9URTogZGlyZWN0aXZlcyBjYW4gYmUgY3JlYXRlZCBpbiBvcmRlciBvdGhlciB0aGFuIHRoZSBpbmRleCBvcmRlci4gVGhleSBjYW4gYWxzb1xuICogICAgICAgYmUgcmV0cmlldmVkIGJlZm9yZSB0aGV5IGFyZSBjcmVhdGVkIGluIHdoaWNoIGNhc2UgdGhlIHZhbHVlIHdpbGwgYmUgbnVsbC5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlIFRoZSBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKiBAcGFyYW0gZGlyZWN0aXZlRGVmIERpcmVjdGl2ZURlZiBvYmplY3Qgd2hpY2ggY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHRlbXBsYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlQ3JlYXRlPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZTogVCwgZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8VD58IENvbXBvbmVudERlZjxUPik6IFQge1xuICBjb25zdCBpbnN0YW5jZSA9IGJhc2VEaXJlY3RpdmVDcmVhdGUoaW5kZXgsIGRpcmVjdGl2ZSwgZGlyZWN0aXZlRGVmKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZSwgJ3ByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlJyk7XG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG5cbiAgY29uc3QgaXNDb21wb25lbnQgPSAoZGlyZWN0aXZlRGVmIGFzIENvbXBvbmVudERlZjxUPikudGVtcGxhdGU7XG4gIGlmIChpc0NvbXBvbmVudCkge1xuICAgIGFkZENvbXBvbmVudExvZ2ljKGluZGV4LCBkaXJlY3RpdmUsIGRpcmVjdGl2ZURlZiBhcyBDb21wb25lbnREZWY8VD4pO1xuICB9XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gSW5pdCBob29rcyBhcmUgcXVldWVkIG5vdyBzbyBuZ09uSW5pdCBpcyBjYWxsZWQgaW4gaG9zdCBjb21wb25lbnRzIGJlZm9yZVxuICAgIC8vIGFueSBwcm9qZWN0ZWQgY29tcG9uZW50cy5cbiAgICBxdWV1ZUluaXRIb29rcyhpbmRleCwgZGlyZWN0aXZlRGVmLm9uSW5pdCwgZGlyZWN0aXZlRGVmLmRvQ2hlY2ssIGN1cnJlbnRWaWV3LnRWaWV3KTtcblxuICAgIGlmIChkaXJlY3RpdmVEZWYuaG9zdEJpbmRpbmdzKSBxdWV1ZUhvc3RCaW5kaW5nRm9yQ2hlY2soaW5kZXgpO1xuICB9XG5cbiAgaWYgKHROb2RlICYmIHROb2RlLmF0dHJzKSB7XG4gICAgc2V0SW5wdXRzRnJvbUF0dHJzKGluZGV4LCBpbnN0YW5jZSwgZGlyZWN0aXZlRGVmLmlucHV0cywgdE5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihpbmRleDogbnVtYmVyLCBpbnN0YW5jZTogVCwgZGVmOiBDb21wb25lbnREZWY8VD4pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KGRlZi50ZW1wbGF0ZSwgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcyk7XG5cbiAgLy8gT25seSBjb21wb25lbnQgdmlld3Mgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSB2aWV3IHRyZWUgZGlyZWN0bHkuIEVtYmVkZGVkIHZpZXdzIGFyZVxuICAvLyBhY2Nlc3NlZCB0aHJvdWdoIHRoZWlyIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGV5IG1heSBiZSByZW1vdmVkIC8gcmUtYWRkZWQgbGF0ZXIuXG4gIGNvbnN0IGhvc3RWaWV3ID0gYWRkVG9WaWV3VHJlZShcbiAgICAgIGN1cnJlbnRWaWV3LCBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5pbmRleCBhcyBudW1iZXIsXG4gICAgICBjcmVhdGVMVmlldyhcbiAgICAgICAgICByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIocHJldmlvdXNPclBhcmVudE5vZGUubmF0aXZlIGFzIFJFbGVtZW50LCBkZWYucmVuZGVyZXJUeXBlKSxcbiAgICAgICAgICB0VmlldywgbnVsbCwgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLFxuICAgICAgICAgIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSkpO1xuXG4gIC8vIFdlIG5lZWQgdG8gc2V0IHRoZSBob3N0IG5vZGUvZGF0YSBoZXJlIGJlY2F1c2Ugd2hlbiB0aGUgY29tcG9uZW50IExOb2RlIHdhcyBjcmVhdGVkLFxuICAvLyB3ZSBkaWRuJ3QgeWV0IGtub3cgaXQgd2FzIGEgY29tcG9uZW50IChqdXN0IGFuIGVsZW1lbnQpLlxuICAocHJldmlvdXNPclBhcmVudE5vZGUgYXN7ZGF0YTogTFZpZXd9KS5kYXRhID0gaG9zdFZpZXc7XG4gIChob3N0VmlldyBhc3tub2RlOiBMTm9kZX0pLm5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB0Vmlldy5ub2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG5cbiAgaW5pdENoYW5nZURldGVjdG9ySWZFeGlzdGluZyhwcmV2aW91c09yUGFyZW50Tm9kZS5ub2RlSW5qZWN0b3IsIGluc3RhbmNlLCBob3N0Vmlldyk7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2soaW5kZXgpO1xufVxuXG4vKipcbiAqIEEgbGlnaHRlciB2ZXJzaW9uIG9mIGRpcmVjdGl2ZUNyZWF0ZSgpIHRoYXQgaXMgdXNlZCBmb3IgdGhlIHJvb3QgY29tcG9uZW50XG4gKlxuICogVGhpcyB2ZXJzaW9uIGRvZXMgbm90IGNvbnRhaW4gZmVhdHVyZXMgdGhhdCB3ZSBkb24ndCBhbHJlYWR5IHN1cHBvcnQgYXQgcm9vdCBpblxuICogY3VycmVudCBBbmd1bGFyLiBFeGFtcGxlOiBsb2NhbCByZWZzIGFuZCBpbnB1dHMgb24gcm9vdCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlRGlyZWN0aXZlQ3JlYXRlPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZTogVCwgZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8VD58IENvbXBvbmVudERlZjxUPik6IFQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCwgLTEsICdkaXJlY3RpdmVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoXG4gICAgICBkaXJlY3RpdmUsIE5HX0hPU1RfU1lNQk9MLCB7ZW51bWVyYWJsZTogZmFsc2UsIHZhbHVlOiBwcmV2aW91c09yUGFyZW50Tm9kZX0pO1xuXG4gIGlmIChkaXJlY3RpdmVzID09IG51bGwpIGN1cnJlbnRWaWV3LmRpcmVjdGl2ZXMgPSBkaXJlY3RpdmVzID0gW107XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFOZXh0KGluZGV4LCBkaXJlY3RpdmVzKTtcbiAgZGlyZWN0aXZlc1tpbmRleF0gPSBkaXJlY3RpdmU7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3QgZmxhZ3MgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5mbGFncztcbiAgICBpZiAoKGZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2spID09PSAwKSB7XG4gICAgICAvLyBXaGVuIHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgY3JlYXRlZDpcbiAgICAgIC8vIC0gc2F2ZSB0aGUgaW5kZXgsXG4gICAgICAvLyAtIHNldCB0aGUgbnVtYmVyIG9mIGRpcmVjdGl2ZXMgdG8gMVxuICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuZmxhZ3MgPVxuICAgICAgICAgIGluZGV4IDw8IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0IHwgZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50IHwgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT25seSBuZWVkIHRvIGJ1bXAgdGhlIHNpemUgd2hlbiBzdWJzZXF1ZW50IGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWRcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaywgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2ssXG4gICAgICAgICAgICAgICAgICAgICAgICdSZWFjaGVkIHRoZSBtYXggbnVtYmVyIG9mIGRpcmVjdGl2ZXMnKTtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzKys7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGRpUHVibGljID0gZGlyZWN0aXZlRGVmICEuZGlQdWJsaWM7XG4gICAgaWYgKGRpUHVibGljKSBkaVB1YmxpYyhkaXJlY3RpdmVEZWYgISk7XG4gIH1cblxuICBpZiAoZGlyZWN0aXZlRGVmICEuYXR0cmlidXRlcyAhPSBudWxsICYmIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLnR5cGUgPT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBzZXRVcEF0dHJpYnV0ZXMoXG4gICAgICAgIChwcmV2aW91c09yUGFyZW50Tm9kZSBhcyBMRWxlbWVudE5vZGUpLm5hdGl2ZSwgZGlyZWN0aXZlRGVmICEuYXR0cmlidXRlcyBhcyBzdHJpbmdbXSk7XG4gIH1cblxuICByZXR1cm4gZGlyZWN0aXZlO1xufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBsZXQgaW5pdGlhbElucHV0RGF0YSA9IHROb2RlLmluaXRpYWxJbnB1dHMgYXMgSW5pdGlhbElucHV0RGF0YSB8IHVuZGVmaW5lZDtcbiAgaWYgKGluaXRpYWxJbnB1dERhdGEgPT09IHVuZGVmaW5lZCB8fCBkaXJlY3RpdmVJbmRleCA+PSBpbml0aWFsSW5wdXREYXRhLmxlbmd0aCkge1xuICAgIGluaXRpYWxJbnB1dERhdGEgPSBnZW5lcmF0ZUluaXRpYWxJbnB1dHMoZGlyZWN0aXZlSW5kZXgsIGlucHV0cywgdE5vZGUpO1xuICB9XG5cbiAgY29uc3QgaW5pdGlhbElucHV0czogSW5pdGlhbElucHV0c3xudWxsID0gaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF07XG4gIGlmIChpbml0aWFsSW5wdXRzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsSW5wdXRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAoaW5zdGFuY2UgYXMgYW55KVtpbml0aWFsSW5wdXRzW2ldXSA9IGluaXRpYWxJbnB1dHNbaSArIDFdO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBpbml0aWFsSW5wdXREYXRhIGZvciBhIG5vZGUgYW5kIHN0b3JlcyBpdCBpbiB0aGUgdGVtcGxhdGUncyBzdGF0aWMgc3RvcmFnZVxuICogc28gc3Vic2VxdWVudCB0ZW1wbGF0ZSBpbnZvY2F0aW9ucyBkb24ndCBoYXZlIHRvIHJlY2FsY3VsYXRlIGl0LlxuICpcbiAqIGluaXRpYWxJbnB1dERhdGEgaXMgYW4gYXJyYXkgY29udGFpbmluZyB2YWx1ZXMgdGhhdCBuZWVkIHRvIGJlIHNldCBhcyBpbnB1dCBwcm9wZXJ0aWVzXG4gKiBmb3IgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUsIGJ1dCBvbmx5IG9uY2Ugb24gY3JlYXRpb24uIFdlIG5lZWQgdGhpcyBhcnJheSB0byBzdXBwb3J0XG4gKiB0aGUgY2FzZSB3aGVyZSB5b3Ugc2V0IGFuIEBJbnB1dCBwcm9wZXJ0eSBvZiBhIGRpcmVjdGl2ZSB1c2luZyBhdHRyaWJ1dGUtbGlrZSBzeW50YXguXG4gKiBlLmcuIGlmIHlvdSBoYXZlIGEgYG5hbWVgIEBJbnB1dCwgeW91IGNhbiBzZXQgaXQgb25jZSBsaWtlIHRoaXM6XG4gKlxuICogPG15LWNvbXBvbmVudCBuYW1lPVwiQmVzc1wiPjwvbXktY29tcG9uZW50PlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCB0byBzdG9yZSB0aGUgaW5pdGlhbCBpbnB1dCBkYXRhXG4gKiBAcGFyYW0gaW5wdXRzIFRoZSBsaXN0IG9mIGlucHV0cyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIG9uIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUluaXRpYWxJbnB1dHMoXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5wdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgdE5vZGU6IFROb2RlKTogSW5pdGlhbElucHV0RGF0YSB7XG4gIGNvbnN0IGluaXRpYWxJbnB1dERhdGE6IEluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIHx8ICh0Tm9kZS5pbml0aWFsSW5wdXRzID0gW10pO1xuICBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSA9IG51bGw7XG5cbiAgY29uc3QgYXR0cnMgPSB0Tm9kZS5hdHRycyAhO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICBjb25zdCBtaW5pZmllZElucHV0TmFtZSA9IGlucHV0c1thdHRyTmFtZV07XG4gICAgY29uc3QgYXR0clZhbHVlID0gYXR0cnNbaSArIDFdO1xuXG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU0VMRUNUX09OTFkpIGJyZWFrO1xuICAgIGlmIChtaW5pZmllZElucHV0TmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBpbnB1dHNUb1N0b3JlOiBJbml0aWFsSW5wdXRzID1cbiAgICAgICAgICBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSB8fCAoaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBbXSk7XG4gICAgICBpbnB1dHNUb1N0b3JlLnB1c2gobWluaWZpZWRJbnB1dE5hbWUsIGF0dHJWYWx1ZSBhcyBzdHJpbmcpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gaW5pdGlhbElucHV0RGF0YTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVmlld0NvbnRhaW5lciAmIFZpZXdcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhIExDb250YWluZXIsIGVpdGhlciBmcm9tIGEgY29udGFpbmVyIGluc3RydWN0aW9uLCBvciBmb3IgYSBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEBwYXJhbSBwYXJlbnRMTm9kZSB0aGUgTE5vZGUgaW4gd2hpY2ggdGhlIGNvbnRhaW5lcidzIGNvbnRlbnQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBwYXJlbnQgdmlldyBvZiB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIHRlbXBsYXRlIE9wdGlvbmFsIHRoZSBpbmxpbmUgdGVtcGxhdGUgKG5nLXRlbXBsYXRlIGluc3RydWN0aW9uIGNhc2UpXG4gKiBAcGFyYW0gaXNGb3JWaWV3Q29udGFpbmVyUmVmIE9wdGlvbmFsIGEgZmxhZyBpbmRpY2F0aW5nIHRoZSBWaWV3Q29udGFpbmVyUmVmIGNhc2VcbiAqIEByZXR1cm5zIExDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxDb250YWluZXIoXG4gICAgcGFyZW50TE5vZGU6IExOb2RlLCBjdXJyZW50VmlldzogTFZpZXcsIHRlbXBsYXRlPzogQ29tcG9uZW50VGVtcGxhdGU8YW55PixcbiAgICBpc0ZvclZpZXdDb250YWluZXJSZWY/OiBib29sZWFuKTogTENvbnRhaW5lciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKHBhcmVudExOb2RlLCAnY29udGFpbmVycyBzaG91bGQgaGF2ZSBhIHBhcmVudCcpO1xuICByZXR1cm4gPExDb250YWluZXI+e1xuICAgIHZpZXdzOiBbXSxcbiAgICBuZXh0SW5kZXg6IGlzRm9yVmlld0NvbnRhaW5lclJlZiA/IG51bGwgOiAwLFxuICAgIC8vIElmIHRoZSBkaXJlY3QgcGFyZW50IG9mIHRoZSBjb250YWluZXIgaXMgYSB2aWV3LCBpdHMgdmlld3Mgd2lsbCBuZWVkIHRvIGJlIGFkZGVkXG4gICAgLy8gdGhyb3VnaCBpbnNlcnRWaWV3KCkgd2hlbiBpdHMgcGFyZW50IHZpZXcgaXMgYmVpbmcgaW5zZXJ0ZWQ6XG4gICAgcmVuZGVyUGFyZW50OiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudExOb2RlLCBjdXJyZW50VmlldykgPyBwYXJlbnRMTm9kZSA6IG51bGwsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlID09IG51bGwgPyBudWxsIDogdGVtcGxhdGUsXG4gICAgbmV4dDogbnVsbCxcbiAgICBwYXJlbnQ6IGN1cnJlbnRWaWV3LFxuICAgIHF1ZXJpZXM6IG51bGxcbiAgfTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXJOb2RlLlxuICpcbiAqIE9ubHkgYExWaWV3Tm9kZXNgIGNhbiBnbyBpbnRvIGBMQ29udGFpbmVyTm9kZXNgLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHRlbXBsYXRlIE9wdGlvbmFsIGlubGluZSB0ZW1wbGF0ZVxuICogQHBhcmFtIHRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJzIGF0dGFjaGVkIHRvIHRoZSBjb250YWluZXIsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyKFxuICAgIGluZGV4OiBudW1iZXIsIHRlbXBsYXRlPzogQ29tcG9uZW50VGVtcGxhdGU8YW55PiwgdGFnTmFtZT86IHN0cmluZyB8IG51bGwsIGF0dHJzPzogVEF0dHJpYnV0ZXMsXG4gICAgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgY3VycmVudFZpZXcuYmluZGluZ0luZGV4LCAtMSwgJ2NvbnRhaW5lciBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgY29uc3QgY3VycmVudFBhcmVudCA9IGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudE5vZGUgOiBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkgITtcbiAgY29uc3QgbENvbnRhaW5lciA9IGNyZWF0ZUxDb250YWluZXIoY3VycmVudFBhcmVudCwgY3VycmVudFZpZXcsIHRlbXBsYXRlKTtcblxuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGUoXG4gICAgICBpbmRleCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgdW5kZWZpbmVkLCB0YWdOYW1lIHx8IG51bGwsIGF0dHJzIHx8IG51bGwsIGxDb250YWluZXIpO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcyAmJiB0ZW1wbGF0ZSA9PSBudWxsKSBub2RlLnROb2RlLnRWaWV3cyA9IFtdO1xuXG4gIC8vIENvbnRhaW5lcnMgYXJlIGFkZGVkIHRvIHRoZSBjdXJyZW50IHZpZXcgdHJlZSBpbnN0ZWFkIG9mIHRoZWlyIGVtYmVkZGVkIHZpZXdzXG4gIC8vIGJlY2F1c2Ugdmlld3MgY2FuIGJlIHJlbW92ZWQgYW5kIHJlLWluc2VydGVkLlxuICBhZGRUb1ZpZXdUcmVlKGN1cnJlbnRWaWV3LCBpbmRleCwgbm9kZS5kYXRhKTtcblxuICBjb25zdCBxdWVyaWVzID0gbm9kZS5xdWVyaWVzO1xuICBpZiAocXVlcmllcykge1xuICAgIC8vIHByZXBhcmUgcGxhY2UgZm9yIG1hdGNoaW5nIG5vZGVzIGZyb20gdmlld3MgaW5zZXJ0ZWQgaW50byBhIGdpdmVuIGNvbnRhaW5lclxuICAgIGxDb250YWluZXIucXVlcmllcyA9IHF1ZXJpZXMuY29udGFpbmVyKCk7XG4gIH1cblxuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKGxvY2FsUmVmcyk7XG5cbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgaWYgKHF1ZXJpZXMpIHtcbiAgICAvLyBjaGVjayBpZiBhIGdpdmVuIGNvbnRhaW5lciBub2RlIG1hdGNoZXNcbiAgICBxdWVyaWVzLmFkZE5vZGUobm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIGEgY29udGFpbmVyIHVwIHRvIHJlY2VpdmUgdmlld3MuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoU3RhcnQoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXgpO1xuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IGRhdGFbaW5kZXhdIGFzIExOb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBpc1BhcmVudCA9IHRydWU7XG4gIChwcmV2aW91c09yUGFyZW50Tm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YS5uZXh0SW5kZXggPSAwO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U2FtZShcbiAgICAgICAgICAgICAgICAgICAocHJldmlvdXNPclBhcmVudE5vZGUgYXMgTENvbnRhaW5lck5vZGUpLm5hdGl2ZSwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgIGB0aGUgY29udGFpbmVyJ3MgbmF0aXZlIGVsZW1lbnQgc2hvdWxkIG5vdCBoYXZlIGJlZW4gc2V0IHlldC5gKTtcblxuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIC8vIFdlIG5lZWQgdG8gZXhlY3V0ZSBpbml0IGhvb2tzIGhlcmUgc28gbmdPbkluaXQgaG9va3MgYXJlIGNhbGxlZCBpbiB0b3AgbGV2ZWwgdmlld3NcbiAgICAvLyBiZWZvcmUgdGhleSBhcmUgY2FsbGVkIGluIGVtYmVkZGVkIHZpZXdzIChmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkpLlxuICAgIGV4ZWN1dGVJbml0SG9va3MoY3VycmVudFZpZXcsIGN1cnJlbnRWaWV3LnRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICB9XG59XG5cbi8qKlxuICogTWFya3MgdGhlIGVuZCBvZiB0aGUgTENvbnRhaW5lck5vZGUuXG4gKlxuICogTWFya2luZyB0aGUgZW5kIG9mIExDb250YWluZXJOb2RlIGlzIHRoZSB0aW1lIHdoZW4gdG8gY2hpbGQgVmlld3MgZ2V0IGluc2VydGVkIG9yIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoRW5kKCk6IHZvaWQge1xuICBpZiAoaXNQYXJlbnQpIHtcbiAgICBpc1BhcmVudCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoKTtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IGdldFBhcmVudExOb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSAhO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGNvbnRhaW5lciA9IHByZXZpb3VzT3JQYXJlbnROb2RlIGFzIExDb250YWluZXJOb2RlO1xuICBjb250YWluZXIubmF0aXZlID0gdW5kZWZpbmVkO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgbmV4dEluZGV4ID0gY29udGFpbmVyLmRhdGEubmV4dEluZGV4ICE7XG5cbiAgLy8gcmVtb3ZlIGV4dHJhIHZpZXdzIGF0IHRoZSBlbmQgb2YgdGhlIGNvbnRhaW5lclxuICB3aGlsZSAobmV4dEluZGV4IDwgY29udGFpbmVyLmRhdGEudmlld3MubGVuZ3RoKSB7XG4gICAgcmVtb3ZlVmlldyhjb250YWluZXIsIG5leHRJbmRleCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVmcmVzaER5bmFtaWNDaGlsZHJlbigpIHtcbiAgZm9yIChsZXQgY3VycmVudCA9IGdldExWaWV3Q2hpbGQoY3VycmVudFZpZXcpOyBjdXJyZW50ICE9PSBudWxsOyBjdXJyZW50ID0gY3VycmVudC5uZXh0KSB7XG4gICAgLy8gTm90ZTogY3VycmVudCBjYW4gYmUgYSBMVmlldyBvciBhIExDb250YWluZXIsIGJ1dCBoZXJlIHdlIGFyZSBvbmx5IGludGVyZXN0ZWQgaW4gTENvbnRhaW5lci5cbiAgICAvLyBUaGUgZGlzdGluY3Rpb24gaXMgbWFkZSBiZWNhdXNlIG5leHRJbmRleCBhbmQgdmlld3MgZG8gbm90IGV4aXN0IG9uIExWaWV3LlxuICAgIGlmIChpc0xDb250YWluZXIoY3VycmVudCkpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGN1cnJlbnQgYXMgTENvbnRhaW5lcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGFpbmVyLnZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGxWaWV3Tm9kZSA9IGNvbnRhaW5lci52aWV3c1tpXTtcbiAgICAgICAgLy8gVGhlIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGFyZSBub3QgbmVlZGVkIGhlcmUgYXMgYW4gZXhpc3RpbmcgdmlldyBpcyBvbmx5IGJlaW5nIHJlZnJlc2hlZC5cbiAgICAgICAgY29uc3QgZHluYW1pY1ZpZXcgPSBsVmlld05vZGUuZGF0YTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoZHluYW1pY1ZpZXcudFZpZXcsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKFxuICAgICAgICAgICAgbFZpZXdOb2RlLCBkeW5hbWljVmlldy50VmlldywgZHluYW1pY1ZpZXcudGVtcGxhdGUgISwgZHluYW1pY1ZpZXcuY29udGV4dCAhLCByZW5kZXJlcik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzTENvbnRhaW5lcihub2RlOiBMVmlldyB8IExDb250YWluZXIpOiBub2RlIGlzIExDb250YWluZXIge1xuICByZXR1cm4gKG5vZGUgYXMgTENvbnRhaW5lcikubmV4dEluZGV4ID09IG51bGwgJiYgKG5vZGUgYXMgTENvbnRhaW5lcikudmlld3MgIT0gbnVsbDtcbn1cblxuLyoqXG4gKiBMb29rcyBmb3IgYSB2aWV3IHdpdGggYSBnaXZlbiB2aWV3IGJsb2NrIGlkIGluc2lkZSBhIHByb3ZpZGVkIExDb250YWluZXIuXG4gKiBSZW1vdmVzIHZpZXdzIHRoYXQgbmVlZCB0byBiZSBkZWxldGVkIGluIHRoZSBwcm9jZXNzLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXJOb2RlIHdoZXJlIHRvIHNlYXJjaCBmb3Igdmlld3NcbiAqIEBwYXJhbSBzdGFydElkeCBzdGFydGluZyBpbmRleCBpbiB0aGUgdmlld3MgYXJyYXkgdG8gc2VhcmNoIGZyb21cbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBleGFjdCB2aWV3IGJsb2NrIGlkIHRvIGxvb2sgZm9yXG4gKiBAcmV0dXJucyBpbmRleCBvZiBhIGZvdW5kIHZpZXcgb3IgLTEgaWYgbm90IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIHNjYW5Gb3JWaWV3KFxuICAgIGNvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlLCBzdGFydElkeDogbnVtYmVyLCB2aWV3QmxvY2tJZDogbnVtYmVyKTogTFZpZXdOb2RlfG51bGwge1xuICBjb25zdCB2aWV3cyA9IGNvbnRhaW5lck5vZGUuZGF0YS52aWV3cztcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SWR4OyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB2aWV3QXRQb3NpdGlvbklkID0gdmlld3NbaV0uZGF0YS50Vmlldy5pZDtcbiAgICBpZiAodmlld0F0UG9zaXRpb25JZCA9PT0gdmlld0Jsb2NrSWQpIHtcbiAgICAgIHJldHVybiB2aWV3c1tpXTtcbiAgICB9IGVsc2UgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPCB2aWV3QmxvY2tJZCkge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHRoYXQgc2hvdWxkIG5vdCBiZSBhdCB0aGlzIHBvc2l0aW9uIC0gcmVtb3ZlXG4gICAgICByZW1vdmVWaWV3KGNvbnRhaW5lck5vZGUsIGkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmb3VuZCBhIHZpZXcgd2l0aCBpZCBncmVhdGVyIHRoYW4gdGhlIG9uZSB3ZSBhcmUgc2VhcmNoaW5nIGZvclxuICAgICAgLy8gd2hpY2ggbWVhbnMgdGhhdCByZXF1aXJlZCB2aWV3IGRvZXNuJ3QgZXhpc3QgYW5kIGNhbid0IGJlIGZvdW5kIGF0XG4gICAgICAvLyBsYXRlciBwb3NpdGlvbnMgaW4gdGhlIHZpZXdzIGFycmF5IC0gc3RvcCB0aGUgc2VhcmNoIGhlcmVcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgc3RhcnQgb2YgYW4gZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlld0Jsb2NrSWQgVGhlIElEIG9mIHRoaXMgdmlld1xuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBpbiBjcmVhdGlvbiBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbWJlZGRlZFZpZXdTdGFydCh2aWV3QmxvY2tJZDogbnVtYmVyKTogUmVuZGVyRmxhZ3Mge1xuICBjb25zdCBjb250YWluZXIgPVxuICAgICAgKGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudE5vZGUgOiBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkpIGFzIExDb250YWluZXJOb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgbENvbnRhaW5lciA9IGNvbnRhaW5lci5kYXRhO1xuICBsZXQgdmlld05vZGU6IExWaWV3Tm9kZXxudWxsID0gc2NhbkZvclZpZXcoY29udGFpbmVyLCBsQ29udGFpbmVyLm5leHRJbmRleCAhLCB2aWV3QmxvY2tJZCk7XG5cbiAgaWYgKHZpZXdOb2RlKSB7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSB2aWV3Tm9kZTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBpc1BhcmVudCA9IHRydWU7XG4gICAgZW50ZXJWaWV3KHZpZXdOb2RlLmRhdGEsIHZpZXdOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXaGVuIHdlIGNyZWF0ZSBhIG5ldyBMVmlldywgd2UgYWx3YXlzIHJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgIGNvbnN0IG5ld1ZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgICAgcmVuZGVyZXIsIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3QmxvY2tJZCwgY29udGFpbmVyKSwgbnVsbCwgbnVsbCxcbiAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgZ2V0Q3VycmVudFNhbml0aXplcigpKTtcblxuICAgIGlmIChsQ29udGFpbmVyLnF1ZXJpZXMpIHtcbiAgICAgIG5ld1ZpZXcucXVlcmllcyA9IGxDb250YWluZXIucXVlcmllcy5jcmVhdGVWaWV3KCk7XG4gICAgfVxuXG4gICAgZW50ZXJWaWV3KFxuICAgICAgICBuZXdWaWV3LCB2aWV3Tm9kZSA9IGNyZWF0ZUxOb2RlKHZpZXdCbG9ja0lkLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgbmV3VmlldykpO1xuICB9XG4gIHJldHVybiBnZXRSZW5kZXJGbGFncyh2aWV3Tm9kZS5kYXRhKTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgY29udGFpbmVyIGluIHdoaWNoIHRvIGxvb2sgZm9yIHRoZSB2aWV3J3Mgc3RhdGljIGRhdGFcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3SW5kZXg6IG51bWJlciwgcGFyZW50OiBMQ29udGFpbmVyTm9kZSk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHBhcmVudCwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGNvbnRhaW5lclRWaWV3cyA9IChwYXJlbnQgIS50Tm9kZSBhcyBUQ29udGFpbmVyTm9kZSkudFZpZXdzIGFzIFRWaWV3W107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGNvbnRhaW5lclRWaWV3cywgJ1RWaWV3IGV4cGVjdGVkJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChBcnJheS5pc0FycmF5KGNvbnRhaW5lclRWaWV3cyksIHRydWUsICdUVmlld3Mgc2hvdWxkIGJlIGluIGFuIGFycmF5Jyk7XG4gIGlmICh2aWV3SW5kZXggPj0gY29udGFpbmVyVFZpZXdzLmxlbmd0aCB8fCBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9PSBudWxsKSB7XG4gICAgY29uc3QgdFZpZXcgPSBjdXJyZW50Vmlldy50VmlldztcbiAgICBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9XG4gICAgICAgIGNyZWF0ZVRWaWV3KHZpZXdJbmRleCwgdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksIHRWaWV3LnBpcGVSZWdpc3RyeSk7XG4gIH1cbiAgcmV0dXJuIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdO1xufVxuXG4vKiogTWFya3MgdGhlIGVuZCBvZiBhbiBlbWJlZGRlZCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtYmVkZGVkVmlld0VuZCgpOiB2b2lkIHtcbiAgcmVmcmVzaFZpZXcoKTtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgY29uc3Qgdmlld05vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZSA9IGN1cnJlbnRWaWV3Lm5vZGUgYXMgTFZpZXdOb2RlO1xuICBjb25zdCBjb250YWluZXJOb2RlID0gZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpIGFzIExDb250YWluZXJOb2RlO1xuICBpZiAoY29udGFpbmVyTm9kZSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZSh2aWV3Tm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXJOb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gY29udGFpbmVyTm9kZS5kYXRhO1xuXG4gICAgaWYgKGNyZWF0aW9uTW9kZSkge1xuICAgICAgLy8gV2hlbiBwcm9qZWN0ZWQgbm9kZXMgYXJlIGdvaW5nIHRvIGJlIGluc2VydGVkLCB0aGUgcmVuZGVyUGFyZW50IG9mIHRoZSBkeW5hbWljIGNvbnRhaW5lclxuICAgICAgLy8gdXNlZCBieSB0aGUgVmlld0NvbnRhaW5lclJlZiBtdXN0IGJlIHNldC5cbiAgICAgIHNldFJlbmRlclBhcmVudEluUHJvamVjdGVkTm9kZXMobENvbnRhaW5lci5yZW5kZXJQYXJlbnQsIHZpZXdOb2RlKTtcbiAgICAgIC8vIGl0IGlzIGEgbmV3IHZpZXcsIGluc2VydCBpdCBpbnRvIGNvbGxlY3Rpb24gb2Ygdmlld3MgZm9yIGEgZ2l2ZW4gY29udGFpbmVyXG4gICAgICBpbnNlcnRWaWV3KGNvbnRhaW5lck5vZGUsIHZpZXdOb2RlLCBsQ29udGFpbmVyLm5leHRJbmRleCAhKTtcbiAgICB9XG5cbiAgICBsQ29udGFpbmVyLm5leHRJbmRleCAhKys7XG4gIH1cbiAgbGVhdmVWaWV3KGN1cnJlbnRWaWV3ICEucGFyZW50ICEpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNQYXJlbnQsIGZhbHNlLCAnaXNQYXJlbnQnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG59XG5cbi8qKlxuICogRm9yIG5vZGVzIHdoaWNoIGFyZSBwcm9qZWN0ZWQgaW5zaWRlIGFuIGVtYmVkZGVkIHZpZXcsIHRoaXMgZnVuY3Rpb24gc2V0cyB0aGUgcmVuZGVyUGFyZW50XG4gKiBvZiB0aGVpciBkeW5hbWljIExDb250YWluZXJOb2RlLlxuICogQHBhcmFtIHJlbmRlclBhcmVudCB0aGUgcmVuZGVyUGFyZW50IG9mIHRoZSBMQ29udGFpbmVyIHdoaWNoIGNvbnRhaW5zIHRoZSBlbWJlZGRlZCB2aWV3LlxuICogQHBhcmFtIHZpZXdOb2RlIHRoZSBlbWJlZGRlZCB2aWV3LlxuICovXG5mdW5jdGlvbiBzZXRSZW5kZXJQYXJlbnRJblByb2plY3RlZE5vZGVzKFxuICAgIHJlbmRlclBhcmVudDogTEVsZW1lbnROb2RlIHwgbnVsbCwgdmlld05vZGU6IExWaWV3Tm9kZSk6IHZvaWQge1xuICBpZiAocmVuZGVyUGFyZW50ICE9IG51bGwpIHtcbiAgICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IGdldENoaWxkTE5vZGUodmlld05vZGUpO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICBsZXQgbm9kZVRvUHJvamVjdDogTE5vZGV8bnVsbCA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS5oZWFkO1xuICAgICAgICBjb25zdCBsYXN0Tm9kZVRvUHJvamVjdCA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS50YWlsO1xuICAgICAgICB3aGlsZSAobm9kZVRvUHJvamVjdCkge1xuICAgICAgICAgIGlmIChub2RlVG9Qcm9qZWN0LmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgICAgICAgICAgbm9kZVRvUHJvamVjdC5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YS5yZW5kZXJQYXJlbnQgPSByZW5kZXJQYXJlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5vZGVUb1Byb2plY3QgPSBub2RlVG9Qcm9qZWN0ID09PSBsYXN0Tm9kZVRvUHJvamVjdCA/IG51bGwgOiBub2RlVG9Qcm9qZWN0LnBOZXh0T3JQYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG5vZGUgPSBnZXROZXh0TE5vZGUobm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4XG4gKiBAcGFyYW0gZWxlbWVudEluZGV4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRSZWZyZXNoPFQ+KGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGVsZW1lbnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShlbGVtZW50SW5kZXgpO1xuICBjb25zdCBlbGVtZW50ID0gZGF0YSAhW2VsZW1lbnRJbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChlbGVtZW50LmRhdGEsIGBDb21wb25lbnQncyBob3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXcgYXR0YWNoZWQuYCk7XG4gIGNvbnN0IGhvc3RWaWV3ID0gZWxlbWVudC5kYXRhICE7XG5cbiAgLy8gT25seSBhdHRhY2hlZCBDaGVja0Fsd2F5cyBjb21wb25lbnRzIG9yIGF0dGFjaGVkLCBkaXJ0eSBPblB1c2ggY29tcG9uZW50cyBzaG91bGQgYmUgY2hlY2tlZFxuICBpZiAodmlld0F0dGFjaGVkKGhvc3RWaWV3KSAmJiBob3N0Vmlldy5mbGFncyAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoZGlyZWN0aXZlSW5kZXgsIGRpcmVjdGl2ZXMgISk7XG4gICAgY29uc3QgZGVmID0gY3VycmVudFZpZXcudFZpZXcuZGlyZWN0aXZlcyAhW2RpcmVjdGl2ZUluZGV4XSBhcyBDb21wb25lbnREZWY8VD47XG5cbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoXG4gICAgICAgIGhvc3RWaWV3LCBlbGVtZW50LCBkZWYsIGdldERpcmVjdGl2ZUluc3RhbmNlKGRpcmVjdGl2ZXMgIVtkaXJlY3RpdmVJbmRleF0pKTtcbiAgfVxufVxuXG4vKiogUmV0dXJucyBhIGJvb2xlYW4gZm9yIHdoZXRoZXIgdGhlIHZpZXcgaXMgYXR0YWNoZWQgKi9cbmZ1bmN0aW9uIHZpZXdBdHRhY2hlZCh2aWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHZpZXcuZmxhZ3MgJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSA9PT0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBJbnN0cnVjdGlvbiB0byBkaXN0cmlidXRlIHByb2plY3RhYmxlIG5vZGVzIGFtb25nIDxuZy1jb250ZW50PiBvY2N1cnJlbmNlcyBpbiBhIGdpdmVuIHRlbXBsYXRlLlxuICogSXQgdGFrZXMgYWxsIHRoZSBzZWxlY3RvcnMgZnJvbSB0aGUgZW50aXJlIGNvbXBvbmVudCdzIHRlbXBsYXRlIGFuZCBkZWNpZGVzIHdoZXJlXG4gKiBlYWNoIHByb2plY3RlZCBub2RlIGJlbG9uZ3MgKGl0IHJlLWRpc3RyaWJ1dGVzIG5vZGVzIGFtb25nIFwiYnVja2V0c1wiIHdoZXJlIGVhY2ggXCJidWNrZXRcIiBpc1xuICogYmFja2VkIGJ5IGEgc2VsZWN0b3IpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmVxdWlyZXMgQ1NTIHNlbGVjdG9ycyB0byBiZSBwcm92aWRlZCBpbiAyIGZvcm1zOiBwYXJzZWQgKGJ5IGEgY29tcGlsZXIpIGFuZCB0ZXh0LFxuICogdW4tcGFyc2VkIGZvcm0uXG4gKlxuICogVGhlIHBhcnNlZCBmb3JtIGlzIG5lZWRlZCBmb3IgZWZmaWNpZW50IG1hdGNoaW5nIG9mIGEgbm9kZSBhZ2FpbnN0IGEgZ2l2ZW4gQ1NTIHNlbGVjdG9yLlxuICogVGhlIHVuLXBhcnNlZCwgdGV4dHVhbCBmb3JtIGlzIG5lZWRlZCBmb3Igc3VwcG9ydCBvZiB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlLlxuICpcbiAqIEhhdmluZyBhIENTUyBzZWxlY3RvciBpbiAyIGRpZmZlcmVudCBmb3JtYXRzIGlzIG5vdCBpZGVhbCwgYnV0IGFsdGVybmF0aXZlcyBoYXZlIGV2ZW4gbW9yZVxuICogZHJhd2JhY2tzOlxuICogLSBoYXZpbmcgb25seSBhIHRleHR1YWwgZm9ybSB3b3VsZCByZXF1aXJlIHJ1bnRpbWUgcGFyc2luZyBvZiBDU1Mgc2VsZWN0b3JzO1xuICogLSB3ZSBjYW4ndCBoYXZlIG9ubHkgYSBwYXJzZWQgYXMgd2UgY2FuJ3QgcmUtY29uc3RydWN0IHRleHR1YWwgZm9ybSBmcm9tIGl0IChhcyBlbnRlcmVkIGJ5IGFcbiAqIHRlbXBsYXRlIGF1dGhvcikuXG4gKlxuICogQHBhcmFtIHNlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgcGFyc2VkIENTUyBzZWxlY3RvcnNcbiAqIEBwYXJhbSByYXdTZWxlY3RvcnMgQSBjb2xsZWN0aW9uIG9mIENTUyBzZWxlY3RvcnMgaW4gdGhlIHJhdywgdW4tcGFyc2VkIGZvcm1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb25EZWYoXG4gICAgaW5kZXg6IG51bWJlciwgc2VsZWN0b3JzPzogQ3NzU2VsZWN0b3JMaXN0W10sIHRleHRTZWxlY3RvcnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBub09mTm9kZUJ1Y2tldHMgPSBzZWxlY3RvcnMgPyBzZWxlY3RvcnMubGVuZ3RoICsgMSA6IDE7XG4gIGNvbnN0IGRpc3RyaWJ1dGVkTm9kZXMgPSBuZXcgQXJyYXk8TE5vZGVbXT4obm9PZk5vZGVCdWNrZXRzKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBub09mTm9kZUJ1Y2tldHM7IGkrKykge1xuICAgIGRpc3RyaWJ1dGVkTm9kZXNbaV0gPSBbXTtcbiAgfVxuXG4gIGNvbnN0IGNvbXBvbmVudE5vZGU6IExFbGVtZW50Tm9kZSA9IGZpbmRDb21wb25lbnRIb3N0KGN1cnJlbnRWaWV3KTtcbiAgbGV0IGNvbXBvbmVudENoaWxkOiBMTm9kZXxudWxsID0gZ2V0Q2hpbGRMTm9kZShjb21wb25lbnROb2RlKTtcblxuICB3aGlsZSAoY29tcG9uZW50Q2hpbGQgIT09IG51bGwpIHtcbiAgICAvLyBleGVjdXRlIHNlbGVjdG9yIG1hdGNoaW5nIGxvZ2ljIGlmIGFuZCBvbmx5IGlmOlxuICAgIC8vIC0gdGhlcmUgYXJlIHNlbGVjdG9ycyBkZWZpbmVkXG4gICAgLy8gLSBhIG5vZGUgaGFzIGEgdGFnIG5hbWUgLyBhdHRyaWJ1dGVzIHRoYXQgY2FuIGJlIG1hdGNoZWRcbiAgICBpZiAoc2VsZWN0b3JzICYmIGNvbXBvbmVudENoaWxkLnROb2RlKSB7XG4gICAgICBjb25zdCBtYXRjaGVkSWR4ID0gbWF0Y2hpbmdTZWxlY3RvckluZGV4KGNvbXBvbmVudENoaWxkLnROb2RlLCBzZWxlY3RvcnMsIHRleHRTZWxlY3RvcnMgISk7XG4gICAgICBkaXN0cmlidXRlZE5vZGVzW21hdGNoZWRJZHhdLnB1c2goY29tcG9uZW50Q2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkaXN0cmlidXRlZE5vZGVzWzBdLnB1c2goY29tcG9uZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudENoaWxkID0gZ2V0TmV4dExOb2RlKGNvbXBvbmVudENoaWxkKTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhTmV4dChpbmRleCk7XG4gIGRhdGFbaW5kZXhdID0gZGlzdHJpYnV0ZWROb2Rlcztcbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBsaW5rZWQgbGlzdCBvZiBhIHByb2plY3Rpb24gbm9kZSwgYnkgYXBwZW5kaW5nIGFub3RoZXIgbGlua2VkIGxpc3QuXG4gKlxuICogQHBhcmFtIHByb2plY3Rpb25Ob2RlIFByb2plY3Rpb24gbm9kZSB3aG9zZSBwcm9qZWN0ZWQgbm9kZXMgbGlua2VkIGxpc3QgaGFzIHRvIGJlIHVwZGF0ZWRcbiAqIEBwYXJhbSBhcHBlbmRlZEZpcnN0IEZpcnN0IG5vZGUgb2YgdGhlIGxpbmtlZCBsaXN0IHRvIGFwcGVuZC5cbiAqIEBwYXJhbSBhcHBlbmRlZExhc3QgTGFzdCBub2RlIG9mIHRoZSBsaW5rZWQgbGlzdCB0byBhcHBlbmQuXG4gKi9cbmZ1bmN0aW9uIGFwcGVuZFRvUHJvamVjdGlvbk5vZGUoXG4gICAgcHJvamVjdGlvbk5vZGU6IExQcm9qZWN0aW9uTm9kZSxcbiAgICBhcHBlbmRlZEZpcnN0OiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSB8IG51bGwsXG4gICAgYXBwZW5kZWRMYXN0OiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSB8IG51bGwpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICEhYXBwZW5kZWRGaXJzdCwgISFhcHBlbmRlZExhc3QsXG4gICAgICAgICAgICAgICAgICAgJ2FwcGVuZGVkRmlyc3QgY2FuIGJlIG51bGwgaWYgYW5kIG9ubHkgaWYgYXBwZW5kZWRMYXN0IGlzIGFsc28gbnVsbCcpO1xuICBpZiAoIWFwcGVuZGVkTGFzdCkge1xuICAgIC8vIG5vdGhpbmcgdG8gYXBwZW5kXG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHByb2plY3Rpb25Ob2RlRGF0YSA9IHByb2plY3Rpb25Ob2RlLmRhdGE7XG4gIGlmIChwcm9qZWN0aW9uTm9kZURhdGEudGFpbCkge1xuICAgIHByb2plY3Rpb25Ob2RlRGF0YS50YWlsLnBOZXh0T3JQYXJlbnQgPSBhcHBlbmRlZEZpcnN0O1xuICB9IGVsc2Uge1xuICAgIHByb2plY3Rpb25Ob2RlRGF0YS5oZWFkID0gYXBwZW5kZWRGaXJzdDtcbiAgfVxuICBwcm9qZWN0aW9uTm9kZURhdGEudGFpbCA9IGFwcGVuZGVkTGFzdDtcbiAgYXBwZW5kZWRMYXN0LnBOZXh0T3JQYXJlbnQgPSBwcm9qZWN0aW9uTm9kZTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIHByZXZpb3VzbHkgcmUtZGlzdHJpYnV0ZWQgcHJvamVjdGVkIG5vZGVzLiBUaGlzIGluc3RydWN0aW9uIG11c3QgYmUgcHJlY2VkZWQgYnkgYSBjYWxsXG4gKiB0byB0aGUgcHJvamVjdGlvbkRlZiBpbnN0cnVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4XG4gKiBAcGFyYW0gbG9jYWxJbmRleCAtIGluZGV4IHVuZGVyIHdoaWNoIGRpc3RyaWJ1dGlvbiBvZiBwcm9qZWN0ZWQgbm9kZXMgd2FzIG1lbW9yaXplZFxuICogQHBhcmFtIHNlbGVjdG9ySW5kZXg6XG4gKiAgICAgICAgLSAwIHdoZW4gdGhlIHNlbGVjdG9yIGlzIGAqYCAob3IgdW5zcGVjaWZpZWQgYXMgdGhpcyBpcyB0aGUgZGVmYXVsdCB2YWx1ZSksXG4gKiAgICAgICAgLSAxIGJhc2VkIGluZGV4IG9mIHRoZSBzZWxlY3RvciBmcm9tIHRoZSB7QGxpbmsgcHJvamVjdGlvbkRlZn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb24oXG4gICAgbm9kZUluZGV4OiBudW1iZXIsIGxvY2FsSW5kZXg6IG51bWJlciwgc2VsZWN0b3JJbmRleDogbnVtYmVyID0gMCwgYXR0cnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGUoXG4gICAgICBub2RlSW5kZXgsIFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBudWxsLCBudWxsLCBhdHRycyB8fCBudWxsLCB7aGVhZDogbnVsbCwgdGFpbDogbnVsbH0pO1xuXG4gIC8vIGA8bmctY29udGVudD5gIGhhcyBubyBjb250ZW50XG4gIGlzUGFyZW50ID0gZmFsc2U7XG5cbiAgLy8gcmUtZGlzdHJpYnV0aW9uIG9mIHByb2plY3RhYmxlIG5vZGVzIGlzIG1lbW9yaXplZCBvbiBhIGNvbXBvbmVudCdzIHZpZXcgbGV2ZWxcbiAgY29uc3QgY29tcG9uZW50Tm9kZSA9IGZpbmRDb21wb25lbnRIb3N0KGN1cnJlbnRWaWV3KTtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBjb21wb25lbnROb2RlLmRhdGEgITtcbiAgY29uc3Qgbm9kZXNGb3JTZWxlY3RvciA9IGNvbXBvbmVudExWaWV3LmRhdGEgIVtsb2NhbEluZGV4XVtzZWxlY3RvckluZGV4XTtcblxuICAvLyBidWlsZCB0aGUgbGlua2VkIGxpc3Qgb2YgcHJvamVjdGVkIG5vZGVzOlxuICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzRm9yU2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlVG9Qcm9qZWN0ID0gbm9kZXNGb3JTZWxlY3RvcltpXTtcbiAgICBpZiAobm9kZVRvUHJvamVjdC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgLy8gUmVwcm9qZWN0aW5nIGEgcHJvamVjdGlvbiAtPiBhcHBlbmQgdGhlIGxpc3Qgb2YgcHJldmlvdXNseSBwcm9qZWN0ZWQgbm9kZXNcbiAgICAgIGNvbnN0IHByZXZpb3VzbHlQcm9qZWN0ZWQgPSAobm9kZVRvUHJvamVjdCBhcyBMUHJvamVjdGlvbk5vZGUpLmRhdGE7XG4gICAgICBhcHBlbmRUb1Byb2plY3Rpb25Ob2RlKG5vZGUsIHByZXZpb3VzbHlQcm9qZWN0ZWQuaGVhZCwgcHJldmlvdXNseVByb2plY3RlZC50YWlsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUHJvamVjdGluZyBhIHNpbmdsZSBub2RlXG4gICAgICBhcHBlbmRUb1Byb2plY3Rpb25Ob2RlKFxuICAgICAgICAgIG5vZGUsIG5vZGVUb1Byb2plY3QgYXMgTFRleHROb2RlIHwgTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGUsXG4gICAgICAgICAgbm9kZVRvUHJvamVjdCBhcyBMVGV4dE5vZGUgfCBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY3VycmVudFBhcmVudCA9IGdldFBhcmVudExOb2RlKG5vZGUpO1xuICBpZiAoY2FuSW5zZXJ0TmF0aXZlTm9kZShjdXJyZW50UGFyZW50LCBjdXJyZW50VmlldykpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY3VycmVudFBhcmVudCwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgIC8vIHByb2Nlc3MgZWFjaCBub2RlIGluIHRoZSBsaXN0IG9mIHByb2plY3RlZCBub2RlczpcbiAgICBsZXQgbm9kZVRvUHJvamVjdDogTE5vZGV8bnVsbCA9IG5vZGUuZGF0YS5oZWFkO1xuICAgIGNvbnN0IGxhc3ROb2RlVG9Qcm9qZWN0ID0gbm9kZS5kYXRhLnRhaWw7XG4gICAgd2hpbGUgKG5vZGVUb1Byb2plY3QpIHtcbiAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgICAgICAgbm9kZVRvUHJvamVjdCBhcyBMVGV4dE5vZGUgfCBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSwgY3VycmVudFBhcmVudCBhcyBMRWxlbWVudE5vZGUsXG4gICAgICAgICAgY3VycmVudFZpZXcpO1xuICAgICAgbm9kZVRvUHJvamVjdCA9IG5vZGVUb1Byb2plY3QgPT09IGxhc3ROb2RlVG9Qcm9qZWN0ID8gbnVsbCA6IG5vZGVUb1Byb2plY3QucE5leHRPclBhcmVudDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHaXZlbiBhIGN1cnJlbnQgdmlldywgZmluZHMgdGhlIG5lYXJlc3QgY29tcG9uZW50J3MgaG9zdCAoTEVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBMVmlldyBmb3Igd2hpY2ggd2Ugd2FudCBhIGhvc3QgZWxlbWVudCBub2RlXG4gKiBAcmV0dXJucyBUaGUgaG9zdCBub2RlXG4gKi9cbmZ1bmN0aW9uIGZpbmRDb21wb25lbnRIb3N0KGxWaWV3OiBMVmlldyk6IExFbGVtZW50Tm9kZSB7XG4gIGxldCB2aWV3Um9vdExOb2RlID0gbFZpZXcubm9kZTtcbiAgd2hpbGUgKHZpZXdSb290TE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChsVmlldy5wYXJlbnQsICdsVmlldy5wYXJlbnQnKTtcbiAgICBsVmlldyA9IGxWaWV3LnBhcmVudCAhO1xuICAgIHZpZXdSb290TE5vZGUgPSBsVmlldy5ub2RlO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHZpZXdSb290TE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwodmlld1Jvb3RMTm9kZS5kYXRhLCAnbm9kZS5kYXRhJyk7XG5cbiAgcmV0dXJuIHZpZXdSb290TE5vZGUgYXMgTEVsZW1lbnROb2RlO1xufVxuXG4vKipcbiAqIEFkZHMgYSBMVmlldyBvciBhIExDb250YWluZXIgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB2aWV3IHRyZWUuXG4gKlxuICogVGhpcyBzdHJ1Y3R1cmUgd2lsbCBiZSB1c2VkIHRvIHRyYXZlcnNlIHRocm91Z2ggbmVzdGVkIHZpZXdzIHRvIHJlbW92ZSBsaXN0ZW5lcnNcbiAqIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSB2aWV3IHdoZXJlIExWaWV3IG9yIExDb250YWluZXIgc2hvdWxkIGJlIGFkZGVkXG4gKiBAcGFyYW0gaG9zdEluZGV4IEluZGV4IG9mIHRoZSB2aWV3J3MgaG9zdCBub2RlIGluIGRhdGFbXVxuICogQHBhcmFtIHN0YXRlIFRoZSBMVmlldyBvciBMQ29udGFpbmVyIHRvIGFkZCB0byB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgc3RhdGUgcGFzc2VkIGluXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRUb1ZpZXdUcmVlPFQgZXh0ZW5kcyBMVmlld3xMQ29udGFpbmVyPihcbiAgICBjdXJyZW50VmlldzogTFZpZXcsIGhvc3RJbmRleDogbnVtYmVyLCBzdGF0ZTogVCk6IFQge1xuICAvLyBUT0RPKGthcmEpOiBtb3ZlIG5leHQgYW5kIHRhaWwgcHJvcGVydGllcyBvZmYgb2YgTFZpZXdcbiAgaWYgKGN1cnJlbnRWaWV3LnRhaWwpIHtcbiAgICBjdXJyZW50Vmlldy50YWlsLm5leHQgPSBzdGF0ZTtcbiAgfSBlbHNlIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGN1cnJlbnRWaWV3LnRWaWV3LmNoaWxkSW5kZXggPSBob3N0SW5kZXg7XG4gIH1cbiAgY3VycmVudFZpZXcudGFpbCA9IHN0YXRlO1xuICByZXR1cm4gc3RhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQ2hhbmdlIGRldGVjdGlvblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKiogSWYgbm9kZSBpcyBhbiBPblB1c2ggY29tcG9uZW50LCBtYXJrcyBpdHMgTFZpZXcgZGlydHkuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya0RpcnR5SWZPblB1c2gobm9kZTogTEVsZW1lbnROb2RlKTogdm9pZCB7XG4gIC8vIEJlY2F1c2UgZGF0YSBmbG93cyBkb3duIHRoZSBjb21wb25lbnQgdHJlZSwgYW5jZXN0b3JzIGRvIG5vdCBuZWVkIHRvIGJlIG1hcmtlZCBkaXJ0eVxuICBpZiAobm9kZS5kYXRhICYmICEobm9kZS5kYXRhLmZsYWdzICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykpIHtcbiAgICBub2RlLmRhdGEuZmxhZ3MgfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgfVxufVxuXG4vKipcbiAqIFdyYXBzIGFuIGV2ZW50IGxpc3RlbmVyIHNvIGl0cyBob3N0IHZpZXcgYW5kIGl0cyBhbmNlc3RvciB2aWV3cyB3aWxsIGJlIG1hcmtlZCBkaXJ0eVxuICogd2hlbmV2ZXIgdGhlIGV2ZW50IGZpcmVzLiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBPblB1c2ggY29tcG9uZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyYXBMaXN0ZW5lcldpdGhEaXJ0eUxvZ2ljKHZpZXc6IExWaWV3LCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55KTogKGU6IEV2ZW50KSA9PlxuICAgIGFueSB7XG4gIHJldHVybiBmdW5jdGlvbihlOiBhbnkpIHtcbiAgICBtYXJrVmlld0RpcnR5KHZpZXcpO1xuICAgIHJldHVybiBsaXN0ZW5lckZuKGUpO1xuICB9O1xufVxuXG4vKipcbiAqIFdyYXBzIGFuIGV2ZW50IGxpc3RlbmVyIHNvIGl0cyBob3N0IHZpZXcgYW5kIGl0cyBhbmNlc3RvciB2aWV3cyB3aWxsIGJlIG1hcmtlZCBkaXJ0eVxuICogd2hlbmV2ZXIgdGhlIGV2ZW50IGZpcmVzLiBBbHNvIHdyYXBzIHdpdGggcHJldmVudERlZmF1bHQgYmVoYXZpb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cmFwTGlzdGVuZXJXaXRoRGlydHlBbmREZWZhdWx0KFxuICAgIHZpZXc6IExWaWV3LCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55KTogRXZlbnRMaXN0ZW5lciB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwTGlzdGVuZXJJbl9tYXJrVmlld0RpcnR5KGU6IEV2ZW50KSB7XG4gICAgbWFya1ZpZXdEaXJ0eSh2aWV3KTtcbiAgICBpZiAobGlzdGVuZXJGbihlKSA9PT0gZmFsc2UpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIC8vIE5lY2Vzc2FyeSBmb3IgbGVnYWN5IGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBwcmV2ZW50RGVmYXVsdCAoZS5nLiBJRSlcbiAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICB9XG4gIH07XG59XG5cbi8qKiBNYXJrcyBjdXJyZW50IHZpZXcgYW5kIGFsbCBhbmNlc3RvcnMgZGlydHkgKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrVmlld0RpcnR5KHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGxldCBjdXJyZW50VmlldzogTFZpZXd8bnVsbCA9IHZpZXc7XG5cbiAgd2hpbGUgKGN1cnJlbnRWaWV3LnBhcmVudCAhPSBudWxsKSB7XG4gICAgY3VycmVudFZpZXcuZmxhZ3MgfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgICBjdXJyZW50VmlldyA9IGN1cnJlbnRWaWV3LnBhcmVudDtcbiAgfVxuICBjdXJyZW50Vmlldy5mbGFncyB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGN1cnJlbnRWaWV3ICEuY29udGV4dCwgJ3Jvb3RDb250ZXh0Jyk7XG4gIHNjaGVkdWxlVGljayhjdXJyZW50VmlldyAhLmNvbnRleHQgYXMgUm9vdENvbnRleHQpO1xufVxuXG5cbi8qKlxuICogVXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSB3aG9sZSBhcHBsaWNhdGlvbi5cbiAqXG4gKiBVbmxpa2UgYHRpY2tgLCBgc2NoZWR1bGVUaWNrYCBjb2FsZXNjZXMgbXVsdGlwbGUgY2FsbHMgaW50byBvbmUgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gKiBJdCBpcyB1c3VhbGx5IGNhbGxlZCBpbmRpcmVjdGx5IGJ5IGNhbGxpbmcgYG1hcmtEaXJ0eWAgd2hlbiB0aGUgdmlldyBuZWVkcyB0byBiZVxuICogcmUtcmVuZGVyZWQuXG4gKlxuICogVHlwaWNhbGx5IGBzY2hlZHVsZVRpY2tgIHVzZXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgdG8gY29hbGVzY2UgbXVsdGlwbGVcbiAqIGBzY2hlZHVsZVRpY2tgIHJlcXVlc3RzLiBUaGUgc2NoZWR1bGluZyBmdW5jdGlvbiBjYW4gYmUgb3ZlcnJpZGRlbiBpblxuICogYHJlbmRlckNvbXBvbmVudGAncyBgc2NoZWR1bGVyYCBvcHRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2hlZHVsZVRpY2s8VD4ocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGlmIChyb290Q29udGV4dC5jbGVhbiA9PSBfQ0xFQU5fUFJPTUlTRSkge1xuICAgIGxldCByZXM6IG51bGx8KCh2YWw6IG51bGwpID0+IHZvaWQpO1xuICAgIHJvb3RDb250ZXh0LmNsZWFuID0gbmV3IFByb21pc2U8bnVsbD4oKHIpID0+IHJlcyA9IHIpO1xuICAgIHJvb3RDb250ZXh0LnNjaGVkdWxlcigoKSA9PiB7XG4gICAgICB0aWNrKHJvb3RDb250ZXh0LmNvbXBvbmVudCk7XG4gICAgICByZXMgIShudWxsKTtcbiAgICAgIHJvb3RDb250ZXh0LmNsZWFuID0gX0NMRUFOX1BST01JU0U7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIGBkZXRlY3RDaGFuZ2VzYCwgYnV0IGludm9rZWQgb24gcm9vdCBjb21wb25lbnQuIEFkZGl0aW9uYWxseSwgYHRpY2tgXG4gKiBleGVjdXRlcyBsaWZlY3ljbGUgaG9va3MgYW5kIGNvbmRpdGlvbmFsbHkgY2hlY2tzIGNvbXBvbmVudHMgYmFzZWQgb24gdGhlaXJcbiAqIGBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneWAgYW5kIGRpcnRpbmVzcy5cbiAqXG4gKiBUaGUgcHJlZmVycmVkIHdheSB0byB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gaXMgdG8gY2FsbCBgbWFya0RpcnR5YC4gYG1hcmtEaXJ0eWAgaW50ZXJuYWxseVxuICogc2NoZWR1bGVzIGB0aWNrYCB1c2luZyBhIHNjaGVkdWxlciBpbiBvcmRlciB0byBjb2FsZXNjZSBtdWx0aXBsZSBgbWFya0RpcnR5YCBjYWxscyBpbnRvIGFcbiAqIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi4gQnkgZGVmYXVsdCwgdGhlIHNjaGVkdWxlciBpcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCwgYnV0IGNhblxuICogYmUgY2hhbmdlZCB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgYW5kIHByb3ZpZGluZyB0aGUgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGljazxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3Qgcm9vdFZpZXcgPSBnZXRSb290Vmlldyhjb21wb25lbnQpO1xuICBjb25zdCByb290Q29tcG9uZW50ID0gKHJvb3RWaWV3LmNvbnRleHQgYXMgUm9vdENvbnRleHQpLmNvbXBvbmVudDtcbiAgY29uc3QgaG9zdE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShyb290Q29tcG9uZW50KTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChob3N0Tm9kZS5kYXRhLCAnQ29tcG9uZW50IGhvc3Qgbm9kZSBzaG91bGQgYmUgYXR0YWNoZWQgdG8gYW4gTFZpZXcnKTtcbiAgcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZShob3N0Tm9kZSwgcm9vdFZpZXcsIHJvb3RDb21wb25lbnQpO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IHZpZXcgZnJvbSBhbnkgY29tcG9uZW50IGJ5IHdhbGtpbmcgdGhlIHBhcmVudCBgTFZpZXdgIHVudGlsXG4gKiByZWFjaGluZyB0aGUgcm9vdCBgTFZpZXdgLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgYW55IGNvbXBvbmVudFxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Vmlldyhjb21wb25lbnQ6IGFueSk6IExWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoY29tcG9uZW50LCAnY29tcG9uZW50Jyk7XG4gIGNvbnN0IGxFbGVtZW50Tm9kZSA9IF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlKGNvbXBvbmVudCk7XG4gIGxldCBsVmlldyA9IGxFbGVtZW50Tm9kZS52aWV3O1xuICB3aGlsZSAobFZpZXcucGFyZW50KSB7XG4gICAgbFZpZXcgPSBsVmlldy5wYXJlbnQ7XG4gIH1cbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGEgY29tcG9uZW50IChhbmQgcG9zc2libHkgaXRzIHN1Yi1jb21wb25lbnRzKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRyaWdnZXJzIGNoYW5nZSBkZXRlY3Rpb24gaW4gYSBzeW5jaHJvbm91cyB3YXkgb24gYSBjb21wb25lbnQuIFRoZXJlIHNob3VsZFxuICogYmUgdmVyeSBsaXR0bGUgcmVhc29uIHRvIGNhbGwgdGhpcyBmdW5jdGlvbiBkaXJlY3RseSBzaW5jZSBhIHByZWZlcnJlZCB3YXkgdG8gZG8gY2hhbmdlXG4gKiBkZXRlY3Rpb24gaXMgdG8ge0BsaW5rIG1hcmtEaXJ0eX0gdGhlIGNvbXBvbmVudCBhbmQgd2FpdCBmb3IgdGhlIHNjaGVkdWxlciB0byBjYWxsIHRoaXMgbWV0aG9kXG4gKiBhdCBzb21lIGZ1dHVyZSBwb2ludCBpbiB0aW1lLiBUaGlzIGlzIGJlY2F1c2UgYSBzaW5nbGUgdXNlciBhY3Rpb24gb2Z0ZW4gcmVzdWx0cyBpbiBtYW55XG4gKiBjb21wb25lbnRzIGJlaW5nIGludmFsaWRhdGVkIGFuZCBjYWxsaW5nIGNoYW5nZSBkZXRlY3Rpb24gb24gZWFjaCBjb21wb25lbnQgc3luY2hyb25vdXNseVxuICogd291bGQgYmUgaW5lZmZpY2llbnQuIEl0IGlzIGJldHRlciB0byB3YWl0IHVudGlsIGFsbCBjb21wb25lbnRzIGFyZSBtYXJrZWQgYXMgZGlydHkgYW5kXG4gKiB0aGVuIHBlcmZvcm0gc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24gYWNyb3NzIGFsbCBvZiB0aGUgY29tcG9uZW50c1xuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlczxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3QgaG9zdE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShjb21wb25lbnQpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChob3N0Tm9kZS5kYXRhLCAnQ29tcG9uZW50IGhvc3Qgbm9kZSBzaG91bGQgYmUgYXR0YWNoZWQgdG8gYW4gTFZpZXcnKTtcbiAgY29uc3QgY29tcG9uZW50SW5kZXggPSBob3N0Tm9kZS50Tm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgY29uc3QgZGVmID0gaG9zdE5vZGUudmlldy50Vmlldy5kaXJlY3RpdmVzICFbY29tcG9uZW50SW5kZXhdIGFzIENvbXBvbmVudERlZjxUPjtcbiAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKGhvc3ROb2RlLmRhdGEgYXMgTFZpZXcsIGhvc3ROb2RlLCBkZWYsIGNvbXBvbmVudCk7XG59XG5cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBhbmQgaXRzIGNoaWxkcmVuLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZSBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlczxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY2hlY2tOb0NoYW5nZXNNb2RlID0gdHJ1ZTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzKGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG4gIH1cbn1cblxuLyoqIENoZWNrcyB0aGUgdmlldyBvZiB0aGUgY29tcG9uZW50IHByb3ZpZGVkLiBEb2VzIG5vdCBnYXRlIG9uIGRpcnR5IGNoZWNrcyBvciBleGVjdXRlIGRvQ2hlY2suICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0ludGVybmFsPFQ+KFxuICAgIGhvc3RWaWV3OiBMVmlldywgaG9zdE5vZGU6IExFbGVtZW50Tm9kZSwgZGVmOiBDb21wb25lbnREZWY8VD4sIGNvbXBvbmVudDogVCkge1xuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KGhvc3RWaWV3LCBob3N0Tm9kZSk7XG4gIGNvbnN0IHRlbXBsYXRlID0gZGVmLnRlbXBsYXRlO1xuXG4gIHRyeSB7XG4gICAgdGVtcGxhdGUoZ2V0UmVuZGVyRmxhZ3MoaG9zdFZpZXcpLCBjb21wb25lbnQpO1xuICAgIHJlZnJlc2hWaWV3KCk7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cblxuLyoqXG4gKiBNYXJrIHRoZSBjb21wb25lbnQgYXMgZGlydHkgKG5lZWRpbmcgY2hhbmdlIGRldGVjdGlvbikuXG4gKlxuICogTWFya2luZyBhIGNvbXBvbmVudCBkaXJ0eSB3aWxsIHNjaGVkdWxlIGEgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGlzXG4gKiBjb21wb25lbnQgYXQgc29tZSBwb2ludCBpbiB0aGUgZnV0dXJlLiBNYXJraW5nIGFuIGFscmVhZHkgZGlydHlcbiAqIGNvbXBvbmVudCBhcyBkaXJ0eSBpcyBhIG5vb3AuIE9ubHkgb25lIG91dHN0YW5kaW5nIGNoYW5nZSBkZXRlY3Rpb25cbiAqIGNhbiBiZSBzY2hlZHVsZWQgcGVyIGNvbXBvbmVudCB0cmVlLiAoVHdvIGNvbXBvbmVudHMgYm9vdHN0cmFwcGVkIHdpdGhcbiAqIHNlcGFyYXRlIGByZW5kZXJDb21wb25lbnRgIHdpbGwgaGF2ZSBzZXBhcmF0ZSBzY2hlZHVsZXJzKVxuICpcbiAqIFdoZW4gdGhlIHJvb3QgY29tcG9uZW50IGlzIGJvb3RzdHJhcHBlZCB3aXRoIGByZW5kZXJDb21wb25lbnRgLCBhIHNjaGVkdWxlclxuICogY2FuIGJlIHByb3ZpZGVkLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgQ29tcG9uZW50IHRvIG1hcmsgYXMgZGlydHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrRGlydHk8VD4oY29tcG9uZW50OiBUKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGNvbXBvbmVudCwgJ2NvbXBvbmVudCcpO1xuICBjb25zdCBsRWxlbWVudE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShjb21wb25lbnQpO1xuICBtYXJrVmlld0RpcnR5KGxFbGVtZW50Tm9kZS52aWV3KTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBCaW5kaW5ncyAmIGludGVycG9sYXRpb25zXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBpbnRlcmZhY2UgTk9fQ0hBTkdFIHtcbiAgLy8gVGhpcyBpcyBhIGJyYW5kIHRoYXQgZW5zdXJlcyB0aGF0IHRoaXMgdHlwZSBjYW4gbmV2ZXIgbWF0Y2ggYW55dGhpbmcgZWxzZVxuICBicmFuZDogJ05PX0NIQU5HRSc7XG59XG5cbi8qKiBBIHNwZWNpYWwgdmFsdWUgd2hpY2ggZGVzaWduYXRlcyB0aGF0IGEgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLiAqL1xuZXhwb3J0IGNvbnN0IE5PX0NIQU5HRSA9IHt9IGFzIE5PX0NIQU5HRTtcblxuLyoqXG4gKiAgSW5pdGlhbGl6ZXMgdGhlIGJpbmRpbmcgc3RhcnQgaW5kZXguIFdpbGwgZ2V0IGlubGluZWQuXG4gKlxuICogIFRoaXMgZnVuY3Rpb24gbXVzdCBiZSBjYWxsZWQgYmVmb3JlIGFueSBiaW5kaW5nIHJlbGF0ZWQgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiAgKGllIGBiaW5kKClgLCBgaW50ZXJwb2xhdGlvblgoKWAsIGBwdXJlRnVuY3Rpb25YKClgKVxuICovXG5mdW5jdGlvbiBpbml0QmluZGluZ3MoKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXgsIC0xLFxuICAgICAgICAgICAgICAgICAgICdCaW5kaW5nIGluZGV4IHNob3VsZCBub3QgeWV0IGJlIHNldCAnICsgY3VycmVudFZpZXcuYmluZGluZ0luZGV4KTtcbiAgaWYgKGN1cnJlbnRWaWV3LnRWaWV3LmJpbmRpbmdTdGFydEluZGV4ID09PSAtMSkge1xuICAgIGN1cnJlbnRWaWV3LnRWaWV3LmJpbmRpbmdTdGFydEluZGV4ID0gZGF0YS5sZW5ndGg7XG4gIH1cbiAgY3VycmVudFZpZXcuYmluZGluZ0luZGV4ID0gY3VycmVudFZpZXcudFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNpbmdsZSB2YWx1ZSBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBkaWZmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kPFQ+KHZhbHVlOiBUKTogVHxOT19DSEFOR0Uge1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQodmFsdWUpID8gdmFsdWUgOiBOT19DSEFOR0U7XG59XG5cbi8qKlxuICogUmVzZXJ2ZXMgc2xvdHMgZm9yIHB1cmUgZnVuY3Rpb25zIChgcHVyZUZ1bmN0aW9uWGAgaW5zdHJ1Y3Rpb25zKVxuICpcbiAqIEJpbmRpbmdzIGZvciBwdXJlIGZ1bmN0aW9ucyBhcmUgc3RvcmVkIGFmdGVyIHRoZSBMTm9kZXMgaW4gdGhlIGRhdGEgYXJyYXkgYnV0IGJlZm9yZSB0aGUgYmluZGluZy5cbiAqXG4gKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIHwgIExOb2RlcyAuLi4gfCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIHwgcmVndWxhciBiaW5kaW5ncyAvIGludGVycG9sYXRpb25zIHxcbiAqICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4XG4gKlxuICogUHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgYXJlIGdpdmVuIGFuIG9mZnNldCBmcm9tIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4LlxuICogU3VidHJhY3RpbmcgdGhlIG9mZnNldCBmcm9tIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4IGdpdmVzIHRoZSBmaXJzdCBpbmRleCB3aGVyZSB0aGUgYmluZGluZ3NcbiAqIGFyZSBzdG9yZWQuXG4gKlxuICogTk9URTogcmVzZXJ2ZVNsb3RzIGluc3RydWN0aW9ucyBhcmUgb25seSBldmVyIGFsbG93ZWQgYXQgdGhlIHZlcnkgZW5kIG9mIHRoZSBjcmVhdGlvbiBibG9ja1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXJ2ZVNsb3RzKG51bVNsb3RzOiBudW1iZXIpIHtcbiAgLy8gSW5pdCB0aGUgc2xvdHMgd2l0aCBhIHVuaXF1ZSBgTk9fQ0hBTkdFYCB2YWx1ZSBzbyB0aGF0IHRoZSBmaXJzdCBjaGFuZ2UgaXMgYWx3YXlzIGRldGVjdGVkXG4gIC8vIHdoZXRoZXIgaXQgaGFwcGVucyBvciBub3QgZHVyaW5nIHRoZSBmaXJzdCBjaGFuZ2UgZGV0ZWN0aW9uIHBhc3MgLSBwdXJlIGZ1bmN0aW9ucyBjaGVja3NcbiAgLy8gbWlnaHQgYmUgc2tpcHBlZCB3aGVuIHNob3J0LWNpcmN1aXRlZC5cbiAgZGF0YS5sZW5ndGggKz0gbnVtU2xvdHM7XG4gIGRhdGEuZmlsbChOT19DSEFOR0UsIC1udW1TbG90cyk7XG4gIC8vIFdlIG5lZWQgdG8gaW5pdGlhbGl6ZSB0aGUgYmluZGluZyBpbiBjYXNlIGEgYHB1cmVGdW5jdGlvblhgIGtpbmQgb2YgYmluZGluZyBpbnN0cnVjdGlvbiBpc1xuICAvLyBjYWxsZWQgZmlyc3QgaW4gdGhlIHVwZGF0ZSBzZWN0aW9uLlxuICBpbml0QmluZGluZ3MoKTtcbn1cblxuLyoqXG4gKiBTZXRzIHVwIHRoZSBiaW5kaW5nIGluZGV4IGJlZm9yZSBleGVjdXRpbmcgYW55IGBwdXJlRnVuY3Rpb25YYCBpbnN0cnVjdGlvbnMuXG4gKlxuICogVGhlIGluZGV4IG11c3QgYmUgcmVzdG9yZWQgYWZ0ZXIgdGhlIHB1cmUgZnVuY3Rpb24gaXMgZXhlY3V0ZWRcbiAqXG4gKiB7QGxpbmsgcmVzZXJ2ZVNsb3RzfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbW92ZUJpbmRpbmdJbmRleFRvUmVzZXJ2ZWRTbG90KG9mZnNldDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgY3VycmVudFNsb3QgPSBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXg7XG4gIGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCA9IGN1cnJlbnRWaWV3LnRWaWV3LmJpbmRpbmdTdGFydEluZGV4IC0gb2Zmc2V0O1xuICByZXR1cm4gY3VycmVudFNsb3Q7XG59XG5cbi8qKlxuICogUmVzdG9yZXMgdGhlIGJpbmRpbmcgaW5kZXggdG8gdGhlIGdpdmVuIHZhbHVlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgdHlwaWNhbGx5IHVzZWQgdG8gcmVzdG9yZSB0aGUgaW5kZXggYWZ0ZXIgYSBgcHVyZUZ1bmN0aW9uWGAgaGFzXG4gKiBiZWVuIGV4ZWN1dGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzdG9yZUJpbmRpbmdJbmRleChpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCA9IGluZGV4O1xufVxuXG4vKipcbiAqIENyZWF0ZSBpbnRlcnBvbGF0aW9uIGJpbmRpbmdzIHdpdGggYSB2YXJpYWJsZSBudW1iZXIgb2YgZXhwcmVzc2lvbnMuXG4gKlxuICogSWYgdGhlcmUgYXJlIDEgdG8gOCBleHByZXNzaW9ucyBgaW50ZXJwb2xhdGlvbjEoKWAgdG8gYGludGVycG9sYXRpb244KClgIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuXG4gKiBUaG9zZSBhcmUgZmFzdGVyIGJlY2F1c2UgdGhlcmUgaXMgbm8gbmVlZCB0byBjcmVhdGUgYW4gYXJyYXkgb2YgZXhwcmVzc2lvbnMgYW5kIGl0ZXJhdGUgb3ZlciBpdC5cbiAqXG4gKiBgdmFsdWVzYDpcbiAqIC0gaGFzIHN0YXRpYyB0ZXh0IGF0IGV2ZW4gaW5kZXhlcyxcbiAqIC0gaGFzIGV2YWx1YXRlZCBleHByZXNzaW9ucyBhdCBvZGQgaW5kZXhlcy5cbiAqXG4gKiBSZXR1cm5zIHRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvblYodmFsdWVzOiBhbnlbXSk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4oMiwgdmFsdWVzLmxlbmd0aCwgJ3Nob3VsZCBoYXZlIGF0IGxlYXN0IDMgdmFsdWVzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh2YWx1ZXMubGVuZ3RoICUgMiwgMSwgJ3Nob3VsZCBoYXZlIGFuIG9kZCBudW1iZXIgb2YgdmFsdWVzJyk7XG5cbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgLy8gQ2hlY2sgaWYgYmluZGluZ3MgKG9kZCBpbmRleGVzKSBoYXZlIGNoYW5nZWRcbiAgICBiaW5kaW5nVXBkYXRlZCh2YWx1ZXNbaV0pICYmIChkaWZmZXJlbnQgPSB0cnVlKTtcbiAgfVxuXG4gIGlmICghZGlmZmVyZW50KSB7XG4gICAgcmV0dXJuIE5PX0NIQU5HRTtcbiAgfVxuXG4gIC8vIEJ1aWxkIHRoZSB1cGRhdGVkIGNvbnRlbnRcbiAgbGV0IGNvbnRlbnQgPSB2YWx1ZXNbMF07XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29udGVudCArPSBzdHJpbmdpZnkodmFsdWVzW2ldKSArIHZhbHVlc1tpICsgMV07XG4gIH1cblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDEgZXhwcmVzc2lvbi5cbiAqXG4gKiBAcGFyYW0gcHJlZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBzdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjEocHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHYwKTtcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMiBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHYwLCB2MSk7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBzdWZmaXggOiBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZ3Mgd2l0aCAzIGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24zKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHYwLCB2MSk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHYyKSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBzdWZmaXggOlxuICAgICAgICAgICAgICAgICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDQgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjQoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHYwLCB2MSwgdjIsIHYzKTtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgK1xuICAgICAgICAgIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDUgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjUoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHY0KSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA2IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb242KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA3IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb243KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHY2KSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBpNSArIHN0cmluZ2lmeSh2NikgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA4IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb244KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIGk2OiBzdHJpbmcsIHY3OiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2NCwgdjUsIHY2LCB2NykgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgaTUgKyBzdHJpbmdpZnkodjYpICsgaTYgKyBzdHJpbmdpZnkodjcpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIFN0b3JlIGEgdmFsdWUgaW4gdGhlIGBkYXRhYCBhdCBhIGdpdmVuIGBpbmRleGAuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmU8VD4oaW5kZXg6IG51bWJlciwgdmFsdWU6IFQpOiB2b2lkIHtcbiAgLy8gV2UgZG9uJ3Qgc3RvcmUgYW55IHN0YXRpYyBkYXRhIGZvciBsb2NhbCB2YXJpYWJsZXMsIHNvIHRoZSBmaXJzdCB0aW1lXG4gIC8vIHdlIHNlZSB0aGUgdGVtcGxhdGUsIHdlIHNob3VsZCBzdG9yZSBhcyBudWxsIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gIGlmIChpbmRleCA+PSB0RGF0YS5sZW5ndGgpIHtcbiAgICB0RGF0YVtpbmRleF0gPSBudWxsO1xuICB9XG4gIGRhdGFbaW5kZXhdID0gdmFsdWU7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIHRoZSBgZGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZDxUPihpbmRleDogbnVtYmVyKTogVCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCk7XG4gIHJldHVybiBkYXRhW2luZGV4XTtcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gdGhlIGBkaXJlY3RpdmVzYCBhcnJheS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRGlyZWN0aXZlPFQ+KGluZGV4OiBudW1iZXIpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoZGlyZWN0aXZlcywgJ0RpcmVjdGl2ZXMgYXJyYXkgc2hvdWxkIGJlIGRlZmluZWQgaWYgcmVhZGluZyBhIGRpci4nKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4LCBkaXJlY3RpdmVzICEpO1xuICByZXR1cm4gZGlyZWN0aXZlcyAhW2luZGV4XTtcbn1cblxuLyoqIEdldHMgdGhlIGN1cnJlbnQgYmluZGluZyB2YWx1ZSBhbmQgaW5jcmVtZW50cyB0aGUgYmluZGluZyBpbmRleC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lQmluZGluZygpOiBhbnkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoY3VycmVudFZpZXcuYmluZGluZ0luZGV4KTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleF0sIE5PX0NIQU5HRSwgJ1N0b3JlZCB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICByZXR1cm4gZGF0YVtjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXgrK107XG59XG5cbi8qKiBVcGRhdGVzIGJpbmRpbmcgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgaXQgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwodmFsdWUsIE5PX0NIQU5HRSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIGlmIChjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXggPT09IC0xKSBpbml0QmluZGluZ3MoKTtcblxuICBpZiAoY3VycmVudFZpZXcuYmluZGluZ0luZGV4ID49IGRhdGEubGVuZ3RoKSB7XG4gICAgZGF0YVtjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXgrK10gPSB2YWx1ZTtcbiAgfSBlbHNlIGlmIChpc0RpZmZlcmVudChkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleF0sIHZhbHVlKSkge1xuICAgIHRocm93RXJyb3JJZk5vQ2hhbmdlc01vZGUoXG4gICAgICAgIGNyZWF0aW9uTW9kZSwgY2hlY2tOb0NoYW5nZXNNb2RlLCBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleF0sIHZhbHVlKTtcbiAgICBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCsrXSA9IHZhbHVlO1xuICB9IGVsc2Uge1xuICAgIGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCsrO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqIFVwZGF0ZXMgYmluZGluZyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgdGhlIGxhdGVzdCB2YWx1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmFsdWU6IGFueSk6IGFueSB7XG4gIGJpbmRpbmdVcGRhdGVkKHZhbHVlKTtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKiogVXBkYXRlcyAyIGJpbmRpbmdzIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGVpdGhlciB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZDIoZXhwMTogYW55LCBleHAyOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQoZXhwMSk7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZChleHAyKSB8fCBkaWZmZXJlbnQ7XG59XG5cbi8qKiBVcGRhdGVzIDQgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgYW55IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkNChleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55LCBleHA0OiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKGV4cDEsIGV4cDIpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQyKGV4cDMsIGV4cDQpIHx8IGRpZmZlcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRWaWV3KCk6IFRWaWV3IHtcbiAgcmV0dXJuIGN1cnJlbnRWaWV3LnRWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlSW5zdGFuY2U8VD4oaW5zdGFuY2VPckFycmF5OiBUIHwgW1RdKTogVCB7XG4gIC8vIERpcmVjdGl2ZXMgd2l0aCBjb250ZW50IHF1ZXJpZXMgc3RvcmUgYW4gYXJyYXkgaW4gZGlyZWN0aXZlc1tkaXJlY3RpdmVJbmRleF1cbiAgLy8gd2l0aCB0aGUgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IGluZGV4XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGluc3RhbmNlT3JBcnJheSkgPyBpbnN0YW5jZU9yQXJyYXlbMF0gOiBpbnN0YW5jZU9yQXJyYXk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCkge1xuICBhc3NlcnRFcXVhbChpc1BhcmVudCwgdHJ1ZSwgJ3ByZXZpb3VzT3JQYXJlbnROb2RlIHNob3VsZCBiZSBhIHBhcmVudCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRIYXNQYXJlbnQoKSB7XG4gIGFzc2VydE5vdE51bGwoZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpLCAncHJldmlvdXNPclBhcmVudE5vZGUgc2hvdWxkIGhhdmUgYSBwYXJlbnQnKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSBkYXRhO1xuICBhc3NlcnRMZXNzVGhhbihpbmRleCwgYXJyID8gYXJyLmxlbmd0aCA6IDAsICdpbmRleCBleHBlY3RlZCB0byBiZSBhIHZhbGlkIGRhdGEgaW5kZXgnKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RGF0YU5leHQoaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSBkYXRhO1xuICBhc3NlcnRFcXVhbChcbiAgICAgIGFyci5sZW5ndGgsIGluZGV4LCBgaW5kZXggJHtpbmRleH0gZXhwZWN0ZWQgdG8gYmUgYXQgdGhlIGVuZCBvZiBhcnIgKGxlbmd0aCAke2Fyci5sZW5ndGh9KWApO1xufVxuXG4vKipcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgcmVzZXJ2ZWQgc2xvdHMgc2hvdWxkIGJlIHNldCBgTk9fQ0hBTkdFYC5cbiAqXG4gKiBJZiBub3QsIHRoZXkgbWlnaHQgbm90IGhhdmUgYmVlbiBhY3R1YWxseSByZXNlcnZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFJlc2VydmVkU2xvdEluaXRpYWxpemVkKHNsb3RPZmZzZXQ6IG51bWJlciwgbnVtU2xvdHM6IG51bWJlcikge1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBzdGFydEluZGV4ID0gY3VycmVudFZpZXcudFZpZXcuYmluZGluZ1N0YXJ0SW5kZXggLSBzbG90T2Zmc2V0O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtU2xvdHM7IGkrKykge1xuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgZGF0YVtzdGFydEluZGV4ICsgaV0sIE5PX0NIQU5HRSxcbiAgICAgICAgICAnVGhlIHJlc2VydmVkIHNsb3RzIHNob3VsZCBiZSBzZXQgdG8gYE5PX0NIQU5HRWAgb24gZmlyc3QgdGVtcGxhdGUgcGFzcycpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGU8VD4oY29tcG9uZW50OiBUKTogTEVsZW1lbnROb2RlIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoY29tcG9uZW50LCAnZXhwZWN0aW5nIGNvbXBvbmVudCBnb3QgbnVsbCcpO1xuICBjb25zdCBsRWxlbWVudE5vZGUgPSAoY29tcG9uZW50IGFzIGFueSlbTkdfSE9TVF9TWU1CT0xdIGFzIExFbGVtZW50Tm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoY29tcG9uZW50LCAnb2JqZWN0IGlzIG5vdCBhIGNvbXBvbmVudCcpO1xuICByZXR1cm4gbEVsZW1lbnROb2RlO1xufVxuXG5leHBvcnQgY29uc3QgQ0xFQU5fUFJPTUlTRSA9IF9DTEVBTl9QUk9NSVNFO1xuZXhwb3J0IGNvbnN0IFJPT1RfRElSRUNUSVZFX0lORElDRVMgPSBfUk9PVF9ESVJFQ1RJVkVfSU5ESUNFUztcbiJdfQ==