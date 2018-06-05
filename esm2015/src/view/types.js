/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// unsupported: template constraints.
/**
 * Factory for ViewDefinitions/NgModuleDefinitions.
 * We use a function so we can reexeute it in case an error happens and use the given logger
 * function to log the error from the definition of the node, which is shown in all browser
 * logs.
 * @record
 * @template D
 */
export function DefinitionFactory() { }
function DefinitionFactory_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (logger: NodeLogger): D;
    */
}
/**
 * Function to call console.error at the right source location. This is an indirection
 * via another function as browser will log the location that actually called
 * `console.error`.
 * @record
 */
export function NodeLogger() { }
function NodeLogger_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (): () => void;
    */
}
// unsupported: template constraints.
/**
 * @record
 * @template DF
 */
export function Definition() { }
function Definition_tsickle_Closure_declarations() {
    /** @type {?} */
    Definition.prototype.factory;
}
/**
 * @record
 */
export function NgModuleDefinition() { }
function NgModuleDefinition_tsickle_Closure_declarations() {
    /** @type {?} */
    NgModuleDefinition.prototype.providers;
    /** @type {?} */
    NgModuleDefinition.prototype.providersByKey;
    /** @type {?} */
    NgModuleDefinition.prototype.modules;
    /** @type {?} */
    NgModuleDefinition.prototype.isRoot;
}
/**
 * @record
 */
export function NgModuleDefinitionFactory() { }
function NgModuleDefinitionFactory_tsickle_Closure_declarations() {
}
/**
 * @record
 */
export function ViewDefinition() { }
function ViewDefinition_tsickle_Closure_declarations() {
    /** @type {?} */
    ViewDefinition.prototype.flags;
    /** @type {?} */
    ViewDefinition.prototype.updateDirectives;
    /** @type {?} */
    ViewDefinition.prototype.updateRenderer;
    /** @type {?} */
    ViewDefinition.prototype.handleEvent;
    /**
     * Order: Depth first.
     * Especially providers are before elements / anchors.
     * @type {?}
     */
    ViewDefinition.prototype.nodes;
    /**
     * aggregated NodeFlags for all nodes *
     * @type {?}
     */
    ViewDefinition.prototype.nodeFlags;
    /** @type {?} */
    ViewDefinition.prototype.rootNodeFlags;
    /** @type {?} */
    ViewDefinition.prototype.lastRenderRootNode;
    /** @type {?} */
    ViewDefinition.prototype.bindingCount;
    /** @type {?} */
    ViewDefinition.prototype.outputCount;
    /**
     * Binary or of all query ids that are matched by one of the nodes.
     * This includes query ids from templates as well.
     * Used as a bloom filter.
     * @type {?}
     */
    ViewDefinition.prototype.nodeMatchedQueries;
}
/**
 * @record
 */
export function ViewDefinitionFactory() { }
function ViewDefinitionFactory_tsickle_Closure_declarations() {
}
/**
 * @record
 */
export function ViewUpdateFn() { }
function ViewUpdateFn_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (check: NodeCheckFn, view: ViewData): void;
    */
}
/**
 * @record
 */
export function NodeCheckFn() { }
function NodeCheckFn_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (view: ViewData, nodeIndex: number, argStyle: ArgumentType.Dynamic, values: any[]): any;
    */
    /* TODO: handle strange member:
    (view: ViewData, nodeIndex: number, argStyle: ArgumentType.Inline, v0?: any, v1?: any, v2?: any,
       v3?: any, v4?: any, v5?: any, v6?: any, v7?: any, v8?: any, v9?: any): any;
    */
}
/** @enum {number} */
const ArgumentType = { Inline: 0, Dynamic: 1, };
export { ArgumentType };
/**
 * @record
 */
export function ViewHandleEventFn() { }
function ViewHandleEventFn_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (view: ViewData, nodeIndex: number, eventName: string, event: any): boolean;
    */
}
/** @enum {number} */
const ViewFlags = {
    None: 0,
    OnPush: 2,
};
export { ViewFlags };
/**
 * A node definition in the view.
 *
 * Note: We use one type for all nodes so that loops that loop over all nodes
 * of a ViewDefinition stay monomorphic!
 * @record
 */
export function NodeDef() { }
function NodeDef_tsickle_Closure_declarations() {
    /** @type {?} */
    NodeDef.prototype.flags;
    /** @type {?} */
    NodeDef.prototype.nodeIndex;
    /** @type {?} */
    NodeDef.prototype.checkIndex;
    /** @type {?} */
    NodeDef.prototype.parent;
    /** @type {?} */
    NodeDef.prototype.renderParent;
    /**
     * this is checked against NgContentDef.index to find matched nodes
     * @type {?}
     */
    NodeDef.prototype.ngContentIndex;
    /**
     * number of transitive children
     * @type {?}
     */
    NodeDef.prototype.childCount;
    /**
     * aggregated NodeFlags for all transitive children (does not include self) *
     * @type {?}
     */
    NodeDef.prototype.childFlags;
    /**
     * aggregated NodeFlags for all direct children (does not include self) *
     * @type {?}
     */
    NodeDef.prototype.directChildFlags;
    /** @type {?} */
    NodeDef.prototype.bindingIndex;
    /** @type {?} */
    NodeDef.prototype.bindings;
    /** @type {?} */
    NodeDef.prototype.bindingFlags;
    /** @type {?} */
    NodeDef.prototype.outputIndex;
    /** @type {?} */
    NodeDef.prototype.outputs;
    /**
     * references that the user placed on the element
     * @type {?}
     */
    NodeDef.prototype.references;
    /**
     * ids and value types of all queries that are matched by this node.
     * @type {?}
     */
    NodeDef.prototype.matchedQueries;
    /**
     * Binary or of all matched query ids of this node.
     * @type {?}
     */
    NodeDef.prototype.matchedQueryIds;
    /**
     * Binary or of all query ids that are matched by one of the children.
     * This includes query ids from templates as well.
     * Used as a bloom filter.
     * @type {?}
     */
    NodeDef.prototype.childMatchedQueries;
    /** @type {?} */
    NodeDef.prototype.element;
    /** @type {?} */
    NodeDef.prototype.provider;
    /** @type {?} */
    NodeDef.prototype.text;
    /** @type {?} */
    NodeDef.prototype.query;
    /** @type {?} */
    NodeDef.prototype.ngContent;
}
/** @enum {number} */
const NodeFlags = {
    None: 0,
    TypeElement: 1,
    TypeText: 2,
    ProjectedTemplate: 4,
    CatRenderNode: 3,
    TypeNgContent: 8,
    TypePipe: 16,
    TypePureArray: 32,
    TypePureObject: 64,
    TypePurePipe: 128,
    CatPureExpression: 224,
    TypeValueProvider: 256,
    TypeClassProvider: 512,
    TypeFactoryProvider: 1024,
    TypeUseExistingProvider: 2048,
    LazyProvider: 4096,
    PrivateProvider: 8192,
    TypeDirective: 16384,
    Component: 32768,
    CatProviderNoDirective: 3840,
    CatProvider: 20224,
    OnInit: 65536,
    OnDestroy: 131072,
    DoCheck: 262144,
    OnChanges: 524288,
    AfterContentInit: 1048576,
    AfterContentChecked: 2097152,
    AfterViewInit: 4194304,
    AfterViewChecked: 8388608,
    EmbeddedViews: 16777216,
    ComponentView: 33554432,
    TypeContentQuery: 67108864,
    TypeViewQuery: 134217728,
    StaticQuery: 268435456,
    DynamicQuery: 536870912,
    TypeNgModule: 1073741824,
    CatQuery: 201326592,
    // mutually exclusive values...
    Types: 201347067,
};
export { NodeFlags };
/**
 * @record
 */
export function BindingDef() { }
function BindingDef_tsickle_Closure_declarations() {
    /** @type {?} */
    BindingDef.prototype.flags;
    /** @type {?} */
    BindingDef.prototype.ns;
    /** @type {?} */
    BindingDef.prototype.name;
    /** @type {?} */
    BindingDef.prototype.nonMinifiedName;
    /** @type {?} */
    BindingDef.prototype.securityContext;
    /** @type {?} */
    BindingDef.prototype.suffix;
}
/** @enum {number} */
const BindingFlags = {
    TypeElementAttribute: 1,
    TypeElementClass: 2,
    TypeElementStyle: 4,
    TypeProperty: 8,
    SyntheticProperty: 16,
    SyntheticHostProperty: 32,
    CatSyntheticProperty: 48,
    // mutually exclusive values...
    Types: 15,
};
export { BindingFlags };
/**
 * @record
 */
export function OutputDef() { }
function OutputDef_tsickle_Closure_declarations() {
    /** @type {?} */
    OutputDef.prototype.type;
    /** @type {?} */
    OutputDef.prototype.target;
    /** @type {?} */
    OutputDef.prototype.eventName;
    /** @type {?} */
    OutputDef.prototype.propName;
}
/** @enum {number} */
const OutputType = { ElementOutput: 0, DirectiveOutput: 1, };
export { OutputType };
/** @enum {number} */
const QueryValueType = {
    ElementRef: 0,
    RenderElement: 1,
    TemplateRef: 2,
    ViewContainerRef: 3,
    Provider: 4,
};
export { QueryValueType };
/**
 * @record
 */
export function ElementDef() { }
function ElementDef_tsickle_Closure_declarations() {
    /** @type {?} */
    ElementDef.prototype.name;
    /** @type {?} */
    ElementDef.prototype.ns;
    /**
     * ns, name, value
     * @type {?}
     */
    ElementDef.prototype.attrs;
    /** @type {?} */
    ElementDef.prototype.template;
    /** @type {?} */
    ElementDef.prototype.componentProvider;
    /** @type {?} */
    ElementDef.prototype.componentRendererType;
    /** @type {?} */
    ElementDef.prototype.componentView;
    /**
     * visible public providers for DI in the view,
     * as see from this element. This does not include private providers.
     * @type {?}
     */
    ElementDef.prototype.publicProviders;
    /**
     * same as visiblePublicProviders, but also includes private providers
     * that are located on this element.
     * @type {?}
     */
    ElementDef.prototype.allProviders;
    /** @type {?} */
    ElementDef.prototype.handleEvent;
}
/**
 * @record
 */
export function ElementHandleEventFn() { }
function ElementHandleEventFn_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (view: ViewData, eventName: string, event: any): boolean;
    */
}
/**
 * @record
 */
export function ProviderDef() { }
function ProviderDef_tsickle_Closure_declarations() {
    /** @type {?} */
    ProviderDef.prototype.token;
    /** @type {?} */
    ProviderDef.prototype.value;
    /** @type {?} */
    ProviderDef.prototype.deps;
}
/**
 * @record
 */
export function NgModuleProviderDef() { }
function NgModuleProviderDef_tsickle_Closure_declarations() {
    /** @type {?} */
    NgModuleProviderDef.prototype.flags;
    /** @type {?} */
    NgModuleProviderDef.prototype.index;
    /** @type {?} */
    NgModuleProviderDef.prototype.token;
    /** @type {?} */
    NgModuleProviderDef.prototype.value;
    /** @type {?} */
    NgModuleProviderDef.prototype.deps;
}
/**
 * @record
 */
export function DepDef() { }
function DepDef_tsickle_Closure_declarations() {
    /** @type {?} */
    DepDef.prototype.flags;
    /** @type {?} */
    DepDef.prototype.token;
    /** @type {?} */
    DepDef.prototype.tokenKey;
}
/** @enum {number} */
const DepFlags = {
    None: 0,
    SkipSelf: 1,
    Optional: 2,
    Self: 4,
    Value: 8,
};
export { DepFlags };
/**
 * @record
 */
export function TextDef() { }
function TextDef_tsickle_Closure_declarations() {
    /** @type {?} */
    TextDef.prototype.prefix;
}
/**
 * @record
 */
export function QueryDef() { }
function QueryDef_tsickle_Closure_declarations() {
    /** @type {?} */
    QueryDef.prototype.id;
    /** @type {?} */
    QueryDef.prototype.filterId;
    /** @type {?} */
    QueryDef.prototype.bindings;
}
/**
 * @record
 */
export function QueryBindingDef() { }
function QueryBindingDef_tsickle_Closure_declarations() {
    /** @type {?} */
    QueryBindingDef.prototype.propName;
    /** @type {?} */
    QueryBindingDef.prototype.bindingType;
}
/** @enum {number} */
const QueryBindingType = { First: 0, All: 1, };
export { QueryBindingType };
/**
 * @record
 */
export function NgContentDef() { }
function NgContentDef_tsickle_Closure_declarations() {
    /**
     * this index is checked against NodeDef.ngContentIndex to find the nodes
     * that are matched by this ng-content.
     * Note that a NodeDef with an ng-content can be reprojected, i.e.
     * have a ngContentIndex on its own.
     * @type {?}
     */
    NgContentDef.prototype.index;
}
/**
 * @record
 */
export function NgModuleData() { }
function NgModuleData_tsickle_Closure_declarations() {
    /** @type {?} */
    NgModuleData.prototype._def;
    /** @type {?} */
    NgModuleData.prototype._parent;
    /** @type {?} */
    NgModuleData.prototype._providers;
}
/**
 * View instance data.
 * Attention: Adding fields to this is performance sensitive!
 * @record
 */
export function ViewData() { }
function ViewData_tsickle_Closure_declarations() {
    /** @type {?} */
    ViewData.prototype.def;
    /** @type {?} */
    ViewData.prototype.root;
    /** @type {?} */
    ViewData.prototype.renderer;
    /** @type {?} */
    ViewData.prototype.parentNodeDef;
    /** @type {?} */
    ViewData.prototype.parent;
    /** @type {?} */
    ViewData.prototype.viewContainerParent;
    /** @type {?} */
    ViewData.prototype.component;
    /** @type {?} */
    ViewData.prototype.context;
    /** @type {?} */
    ViewData.prototype.nodes;
    /** @type {?} */
    ViewData.prototype.state;
    /** @type {?} */
    ViewData.prototype.oldValues;
    /** @type {?} */
    ViewData.prototype.disposables;
    /** @type {?} */
    ViewData.prototype.initIndex;
}
/** @enum {number} */
const ViewState = {
    BeforeFirstCheck: 1,
    FirstCheck: 2,
    Attached: 4,
    ChecksEnabled: 8,
    IsProjectedView: 16,
    CheckProjectedView: 32,
    CheckProjectedViews: 64,
    Destroyed: 128,
    // InitState Uses 3 bits
    InitState_Mask: 1792,
    InitState_BeforeInit: 0,
    InitState_CallingOnInit: 256,
    InitState_CallingAfterContentInit: 512,
    InitState_CallingAfterViewInit: 768,
    InitState_AfterInit: 1024,
    CatDetectChanges: 12,
    CatInit: 13,
};
export { ViewState };
/**
 * @param {?} view
 * @param {?} priorInitState
 * @param {?} newInitState
 * @return {?}
 */
export function shiftInitState(view, priorInitState, newInitState) {
    // Only update the InitState if we are currently in the prior state.
    // For example, only move into CallingInit if we are in BeforeInit. Only
    // move into CallingContentInit if we are in CallingInit. Normally this will
    // always be true because of how checkCycle is called in checkAndUpdateView.
    // However, if checkAndUpdateView is called recursively or if an exception is
    // thrown while checkAndUpdateView is running, checkAndUpdateView starts over
    // from the beginning. This ensures the state is monotonically increasing,
    // terminating in the AfterInit state, which ensures the Init methods are called
    // at least once and only once.
    const /** @type {?} */ state = view.state;
    const /** @type {?} */ initState = state & 1792 /* InitState_Mask */;
    if (initState === priorInitState) {
        view.state = (state & ~1792 /* InitState_Mask */) | newInitState;
        view.initIndex = -1;
        return true;
    }
    return initState === newInitState;
}
/**
 * @param {?} view
 * @param {?} initState
 * @param {?} index
 * @return {?}
 */
export function shouldCallLifecycleInitHook(view, initState, index) {
    if ((view.state & 1792 /* InitState_Mask */) === initState && view.initIndex <= index) {
        view.initIndex = index + 1;
        return true;
    }
    return false;
}
/**
 * @record
 */
export function DisposableFn() { }
function DisposableFn_tsickle_Closure_declarations() {
    /* TODO: handle strange member:
    (): void;
    */
}
/**
 * Node instance data.
 *
 * We have a separate type per NodeType to save memory
 * (TextData | ElementData | ProviderData | PureExpressionData | QueryList<any>)
 *
 * To keep our code monomorphic,
 * we prohibit using `NodeData` directly but enforce the use of accessors (`asElementData`, ...).
 * This way, no usage site can get a `NodeData` from view.nodes and then use it for different
 * purposes.
 */
export class NodeData {
}
function NodeData_tsickle_Closure_declarations() {
    /** @type {?} */
    NodeData.prototype.__brand;
}
/**
 * Data for an instantiated NodeType.Text.
 *
 * Attention: Adding fields to this is performance sensitive!
 * @record
 */
export function TextData() { }
function TextData_tsickle_Closure_declarations() {
    /** @type {?} */
    TextData.prototype.renderText;
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asTextData(view, index) {
    return /** @type {?} */ (view.nodes[index]);
}
/**
 * Data for an instantiated NodeType.Element.
 *
 * Attention: Adding fields to this is performance sensitive!
 * @record
 */
export function ElementData() { }
function ElementData_tsickle_Closure_declarations() {
    /** @type {?} */
    ElementData.prototype.renderElement;
    /** @type {?} */
    ElementData.prototype.componentView;
    /** @type {?} */
    ElementData.prototype.viewContainer;
    /** @type {?} */
    ElementData.prototype.template;
}
/**
 * @record
 */
export function ViewContainerData() { }
function ViewContainerData_tsickle_Closure_declarations() {
    /** @type {?} */
    ViewContainerData.prototype._embeddedViews;
}
/**
 * @record
 */
export function TemplateData() { }
function TemplateData_tsickle_Closure_declarations() {
    /** @type {?} */
    TemplateData.prototype._projectedViews;
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asElementData(view, index) {
    return /** @type {?} */ (view.nodes[index]);
}
/**
 * Data for an instantiated NodeType.Provider.
 *
 * Attention: Adding fields to this is performance sensitive!
 * @record
 */
export function ProviderData() { }
function ProviderData_tsickle_Closure_declarations() {
    /** @type {?} */
    ProviderData.prototype.instance;
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asProviderData(view, index) {
    return /** @type {?} */ (view.nodes[index]);
}
/**
 * Data for an instantiated NodeType.PureExpression.
 *
 * Attention: Adding fields to this is performance sensitive!
 * @record
 */
export function PureExpressionData() { }
function PureExpressionData_tsickle_Closure_declarations() {
    /** @type {?} */
    PureExpressionData.prototype.value;
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asPureExpressionData(view, index) {
    return /** @type {?} */ (view.nodes[index]);
}
/**
 * Accessor for view.nodes, enforcing that every usage site stays monomorphic.
 * @param {?} view
 * @param {?} index
 * @return {?}
 */
export function asQueryList(view, index) {
    return /** @type {?} */ (view.nodes[index]);
}
/**
 * @record
 */
export function RootData() { }
function RootData_tsickle_Closure_declarations() {
    /** @type {?} */
    RootData.prototype.injector;
    /** @type {?} */
    RootData.prototype.ngModule;
    /** @type {?} */
    RootData.prototype.projectableNodes;
    /** @type {?} */
    RootData.prototype.selectorOrNode;
    /** @type {?} */
    RootData.prototype.renderer;
    /** @type {?} */
    RootData.prototype.rendererFactory;
    /** @type {?} */
    RootData.prototype.errorHandler;
    /** @type {?} */
    RootData.prototype.sanitizer;
}
/**
 * @abstract
 */
export class DebugContext {
}
function DebugContext_tsickle_Closure_declarations() {
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.view = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.nodeIndex = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.injector = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.component = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.providerTokens = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.references = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.context = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.componentRenderElement = function () { };
    /**
     * @abstract
     * @return {?}
     */
    DebugContext.prototype.renderNode = function () { };
    /**
     * @abstract
     * @param {?} console
     * @param {...?} values
     * @return {?}
     */
    DebugContext.prototype.logError = function (console, values) { };
}
/** @enum {number} */
const CheckType = { CheckAndUpdate: 0, CheckNoChanges: 1, };
export { CheckType };
/**
 * @record
 */
export function ProviderOverride() { }
function ProviderOverride_tsickle_Closure_declarations() {
    /** @type {?} */
    ProviderOverride.prototype.token;
    /** @type {?} */
    ProviderOverride.prototype.flags;
    /** @type {?} */
    ProviderOverride.prototype.value;
    /** @type {?} */
    ProviderOverride.prototype.deps;
    /** @type {?} */
    ProviderOverride.prototype.deprecatedBehavior;
}
/**
 * This object is used to prevent cycles in the source files and to have a place where
 * debug mode can hook it. It is lazily filled when `isDevMode` is known.
 */
export const /** @type {?} */ Services = {
    setCurrentNode: /** @type {?} */ ((undefined)),
    createRootView: /** @type {?} */ ((undefined)),
    createEmbeddedView: /** @type {?} */ ((undefined)),
    createComponentView: /** @type {?} */ ((undefined)),
    createNgModuleRef: /** @type {?} */ ((undefined)),
    overrideProvider: /** @type {?} */ ((undefined)),
    overrideComponentView: /** @type {?} */ ((undefined)),
    clearOverrides: /** @type {?} */ ((undefined)),
    checkAndUpdateView: /** @type {?} */ ((undefined)),
    checkNoChangesView: /** @type {?} */ ((undefined)),
    destroyView: /** @type {?} */ ((undefined)),
    resolveDep: /** @type {?} */ ((undefined)),
    createDebugContext: /** @type {?} */ ((undefined)),
    handleEvent: /** @type {?} */ ((undefined)),
    updateDirectives: /** @type {?} */ ((undefined)),
    updateRenderer: /** @type {?} */ ((undefined)),
    dirtyParentQueries: /** @type {?} */ ((undefined)),
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3R5cGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd1lBLE1BQU0seUJBQ0YsSUFBYyxFQUFFLGNBQXlCLEVBQUUsWUFBdUI7Ozs7Ozs7Ozs7SUFVcEUsdUJBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDekIsdUJBQU0sU0FBUyxHQUFHLEtBQUssNEJBQTJCLENBQUM7SUFDbkQsSUFBSSxTQUFTLEtBQUssY0FBYyxFQUFFO1FBQ2hDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxLQUFLLEdBQUcsMEJBQXlCLENBQUMsR0FBRyxZQUFZLENBQUM7UUFDaEUsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNwQixPQUFPLElBQUksQ0FBQztLQUNiO0lBQ0QsT0FBTyxTQUFTLEtBQUssWUFBWSxDQUFDO0NBQ25DOzs7Ozs7O0FBSUQsTUFBTSxzQ0FDRixJQUFjLEVBQUUsU0FBb0IsRUFBRSxLQUFhO0lBQ3JELElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyw0QkFBMkIsQ0FBQyxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLEtBQUssRUFBRTtRQUNwRixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDM0IsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE9BQU8sS0FBSyxDQUFDO0NBQ2Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWVELE1BQU07Q0FBeUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZL0MsTUFBTSxxQkFBcUIsSUFBYyxFQUFFLEtBQWE7SUFDdEQseUJBQVksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBQztDQUMvQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtDRCxNQUFNLHdCQUF3QixJQUFjLEVBQUUsS0FBYTtJQUN6RCx5QkFBWSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFDO0NBQy9COzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLHlCQUF5QixJQUFjLEVBQUUsS0FBYTtJQUMxRCx5QkFBWSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFDO0NBQy9COzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLCtCQUErQixJQUFjLEVBQUUsS0FBYTtJQUNoRSx5QkFBWSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFDO0NBQy9COzs7Ozs7O0FBS0QsTUFBTSxzQkFBc0IsSUFBYyxFQUFFLEtBQWE7SUFDdkQseUJBQVksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBQztDQUMvQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFhRCxNQUFNO0NBV0w7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWdERCxNQUFNLENBQUMsdUJBQU0sUUFBUSxHQUFhO0lBQ2hDLGNBQWMscUJBQUUsU0FBUyxFQUFFO0lBQzNCLGNBQWMscUJBQUUsU0FBUyxFQUFFO0lBQzNCLGtCQUFrQixxQkFBRSxTQUFTLEVBQUU7SUFDL0IsbUJBQW1CLHFCQUFFLFNBQVMsRUFBRTtJQUNoQyxpQkFBaUIscUJBQUUsU0FBUyxFQUFFO0lBQzlCLGdCQUFnQixxQkFBRSxTQUFTLEVBQUU7SUFDN0IscUJBQXFCLHFCQUFFLFNBQVMsRUFBRTtJQUNsQyxjQUFjLHFCQUFFLFNBQVMsRUFBRTtJQUMzQixrQkFBa0IscUJBQUUsU0FBUyxFQUFFO0lBQy9CLGtCQUFrQixxQkFBRSxTQUFTLEVBQUU7SUFDL0IsV0FBVyxxQkFBRSxTQUFTLEVBQUU7SUFDeEIsVUFBVSxxQkFBRSxTQUFTLEVBQUU7SUFDdkIsa0JBQWtCLHFCQUFFLFNBQVMsRUFBRTtJQUMvQixXQUFXLHFCQUFFLFNBQVMsRUFBRTtJQUN4QixnQkFBZ0IscUJBQUUsU0FBUyxFQUFFO0lBQzdCLGNBQWMscUJBQUUsU0FBUyxFQUFFO0lBQzNCLGtCQUFrQixxQkFBRSxTQUFTLEVBQUU7Q0FDaEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5fSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtOZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXIvcXVlcnlfbGlzdCc7XG5pbXBvcnQge1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge1JlbmRlcmVyMiwgUmVuZGVyZXJGYWN0b3J5MiwgUmVuZGVyZXJUeXBlMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge1Nhbml0aXplciwgU2VjdXJpdHlDb250ZXh0fSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBEZWZzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8qKlxuICogRmFjdG9yeSBmb3IgVmlld0RlZmluaXRpb25zL05nTW9kdWxlRGVmaW5pdGlvbnMuXG4gKiBXZSB1c2UgYSBmdW5jdGlvbiBzbyB3ZSBjYW4gcmVleGV1dGUgaXQgaW4gY2FzZSBhbiBlcnJvciBoYXBwZW5zIGFuZCB1c2UgdGhlIGdpdmVuIGxvZ2dlclxuICogZnVuY3Rpb24gdG8gbG9nIHRoZSBlcnJvciBmcm9tIHRoZSBkZWZpbml0aW9uIG9mIHRoZSBub2RlLCB3aGljaCBpcyBzaG93biBpbiBhbGwgYnJvd3NlclxuICogbG9ncy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBEZWZpbml0aW9uRmFjdG9yeTxEIGV4dGVuZHMgRGVmaW5pdGlvbjxhbnk+PiB7IChsb2dnZXI6IE5vZGVMb2dnZXIpOiBEOyB9XG5cbi8qKlxuICogRnVuY3Rpb24gdG8gY2FsbCBjb25zb2xlLmVycm9yIGF0IHRoZSByaWdodCBzb3VyY2UgbG9jYXRpb24uIFRoaXMgaXMgYW4gaW5kaXJlY3Rpb25cbiAqIHZpYSBhbm90aGVyIGZ1bmN0aW9uIGFzIGJyb3dzZXIgd2lsbCBsb2cgdGhlIGxvY2F0aW9uIHRoYXQgYWN0dWFsbHkgY2FsbGVkXG4gKiBgY29uc29sZS5lcnJvcmAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTm9kZUxvZ2dlciB7ICgpOiAoKSA9PiB2b2lkOyB9XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGVmaW5pdGlvbjxERiBleHRlbmRzIERlZmluaXRpb25GYWN0b3J5PGFueT4+IHsgZmFjdG9yeTogREZ8bnVsbDsgfVxuXG5leHBvcnQgaW50ZXJmYWNlIE5nTW9kdWxlRGVmaW5pdGlvbiBleHRlbmRzIERlZmluaXRpb248TmdNb2R1bGVEZWZpbml0aW9uRmFjdG9yeT4ge1xuICBwcm92aWRlcnM6IE5nTW9kdWxlUHJvdmlkZXJEZWZbXTtcbiAgcHJvdmlkZXJzQnlLZXk6IHtbdG9rZW5LZXk6IHN0cmluZ106IE5nTW9kdWxlUHJvdmlkZXJEZWZ9O1xuICBtb2R1bGVzOiBhbnlbXTtcbiAgaXNSb290OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5nTW9kdWxlRGVmaW5pdGlvbkZhY3RvcnkgZXh0ZW5kcyBEZWZpbml0aW9uRmFjdG9yeTxOZ01vZHVsZURlZmluaXRpb24+IHt9XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmlld0RlZmluaXRpb24gZXh0ZW5kcyBEZWZpbml0aW9uPFZpZXdEZWZpbml0aW9uRmFjdG9yeT4ge1xuICBmbGFnczogVmlld0ZsYWdzO1xuICB1cGRhdGVEaXJlY3RpdmVzOiBWaWV3VXBkYXRlRm47XG4gIHVwZGF0ZVJlbmRlcmVyOiBWaWV3VXBkYXRlRm47XG4gIGhhbmRsZUV2ZW50OiBWaWV3SGFuZGxlRXZlbnRGbjtcbiAgLyoqXG4gICAqIE9yZGVyOiBEZXB0aCBmaXJzdC5cbiAgICogRXNwZWNpYWxseSBwcm92aWRlcnMgYXJlIGJlZm9yZSBlbGVtZW50cyAvIGFuY2hvcnMuXG4gICAqL1xuICBub2RlczogTm9kZURlZltdO1xuICAvKiogYWdncmVnYXRlZCBOb2RlRmxhZ3MgZm9yIGFsbCBub2RlcyAqKi9cbiAgbm9kZUZsYWdzOiBOb2RlRmxhZ3M7XG4gIHJvb3ROb2RlRmxhZ3M6IE5vZGVGbGFncztcbiAgbGFzdFJlbmRlclJvb3ROb2RlOiBOb2RlRGVmfG51bGw7XG4gIGJpbmRpbmdDb3VudDogbnVtYmVyO1xuICBvdXRwdXRDb3VudDogbnVtYmVyO1xuICAvKipcbiAgICogQmluYXJ5IG9yIG9mIGFsbCBxdWVyeSBpZHMgdGhhdCBhcmUgbWF0Y2hlZCBieSBvbmUgb2YgdGhlIG5vZGVzLlxuICAgKiBUaGlzIGluY2x1ZGVzIHF1ZXJ5IGlkcyBmcm9tIHRlbXBsYXRlcyBhcyB3ZWxsLlxuICAgKiBVc2VkIGFzIGEgYmxvb20gZmlsdGVyLlxuICAgKi9cbiAgbm9kZU1hdGNoZWRRdWVyaWVzOiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmlld0RlZmluaXRpb25GYWN0b3J5IGV4dGVuZHMgRGVmaW5pdGlvbkZhY3Rvcnk8Vmlld0RlZmluaXRpb24+IHt9XG5cblxuZXhwb3J0IGludGVyZmFjZSBWaWV3VXBkYXRlRm4geyAoY2hlY2s6IE5vZGVDaGVja0ZuLCB2aWV3OiBWaWV3RGF0YSk6IHZvaWQ7IH1cblxuLy8gaGVscGVyIGZ1bmN0aW9ucyB0byBjcmVhdGUgYW4gb3ZlcmxvYWRlZCBmdW5jdGlvbiB0eXBlLlxuZXhwb3J0IGludGVyZmFjZSBOb2RlQ2hlY2tGbiB7XG4gICh2aWV3OiBWaWV3RGF0YSwgbm9kZUluZGV4OiBudW1iZXIsIGFyZ1N0eWxlOiBBcmd1bWVudFR5cGUuRHluYW1pYywgdmFsdWVzOiBhbnlbXSk6IGFueTtcblxuICAodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLklubGluZSwgdjA/OiBhbnksIHYxPzogYW55LCB2Mj86IGFueSxcbiAgIHYzPzogYW55LCB2ND86IGFueSwgdjU/OiBhbnksIHY2PzogYW55LCB2Nz86IGFueSwgdjg/OiBhbnksIHY5PzogYW55KTogYW55O1xufVxuXG5leHBvcnQgY29uc3QgZW51bSBBcmd1bWVudFR5cGUge0lubGluZSA9IDAsIER5bmFtaWMgPSAxfVxuXG5leHBvcnQgaW50ZXJmYWNlIFZpZXdIYW5kbGVFdmVudEZuIHtcbiAgKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlciwgZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50OiBhbnkpOiBib29sZWFuO1xufVxuXG4vKipcbiAqIEJpdG1hc2sgZm9yIFZpZXdEZWZpbml0aW9uLmZsYWdzLlxuICovXG5leHBvcnQgY29uc3QgZW51bSBWaWV3RmxhZ3Mge1xuICBOb25lID0gMCxcbiAgT25QdXNoID0gMSA8PCAxLFxufVxuXG4vKipcbiAqIEEgbm9kZSBkZWZpbml0aW9uIGluIHRoZSB2aWV3LlxuICpcbiAqIE5vdGU6IFdlIHVzZSBvbmUgdHlwZSBmb3IgYWxsIG5vZGVzIHNvIHRoYXQgbG9vcHMgdGhhdCBsb29wIG92ZXIgYWxsIG5vZGVzXG4gKiBvZiBhIFZpZXdEZWZpbml0aW9uIHN0YXkgbW9ub21vcnBoaWMhXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgTm9kZURlZiB7XG4gIGZsYWdzOiBOb2RlRmxhZ3M7XG4gIC8vIEluZGV4IG9mIHRoZSBub2RlIGluIHZpZXcgZGF0YSBhbmQgdmlldyBkZWZpbml0aW9uICh0aG9zZSBhcmUgdGhlIHNhbWUpXG4gIG5vZGVJbmRleDogbnVtYmVyO1xuICAvLyBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgY2hlY2sgZnVuY3Rpb25zXG4gIC8vIERpZmZlciBmcm9tIG5vZGVJbmRleCB3aGVuIG5vZGVzIGFyZSBhZGRlZCBvciByZW1vdmVkIGF0IHJ1bnRpbWUgKGllIGFmdGVyIGNvbXBpbGF0aW9uKVxuICBjaGVja0luZGV4OiBudW1iZXI7XG4gIHBhcmVudDogTm9kZURlZnxudWxsO1xuICByZW5kZXJQYXJlbnQ6IE5vZGVEZWZ8bnVsbDtcbiAgLyoqIHRoaXMgaXMgY2hlY2tlZCBhZ2FpbnN0IE5nQ29udGVudERlZi5pbmRleCB0byBmaW5kIG1hdGNoZWQgbm9kZXMgKi9cbiAgbmdDb250ZW50SW5kZXg6IG51bWJlcnxudWxsO1xuICAvKiogbnVtYmVyIG9mIHRyYW5zaXRpdmUgY2hpbGRyZW4gKi9cbiAgY2hpbGRDb3VudDogbnVtYmVyO1xuICAvKiogYWdncmVnYXRlZCBOb2RlRmxhZ3MgZm9yIGFsbCB0cmFuc2l0aXZlIGNoaWxkcmVuIChkb2VzIG5vdCBpbmNsdWRlIHNlbGYpICoqL1xuICBjaGlsZEZsYWdzOiBOb2RlRmxhZ3M7XG4gIC8qKiBhZ2dyZWdhdGVkIE5vZGVGbGFncyBmb3IgYWxsIGRpcmVjdCBjaGlsZHJlbiAoZG9lcyBub3QgaW5jbHVkZSBzZWxmKSAqKi9cbiAgZGlyZWN0Q2hpbGRGbGFnczogTm9kZUZsYWdzO1xuXG4gIGJpbmRpbmdJbmRleDogbnVtYmVyO1xuICBiaW5kaW5nczogQmluZGluZ0RlZltdO1xuICBiaW5kaW5nRmxhZ3M6IEJpbmRpbmdGbGFncztcbiAgb3V0cHV0SW5kZXg6IG51bWJlcjtcbiAgb3V0cHV0czogT3V0cHV0RGVmW107XG4gIC8qKlxuICAgKiByZWZlcmVuY2VzIHRoYXQgdGhlIHVzZXIgcGxhY2VkIG9uIHRoZSBlbGVtZW50XG4gICAqL1xuICByZWZlcmVuY2VzOiB7W3JlZklkOiBzdHJpbmddOiBRdWVyeVZhbHVlVHlwZX07XG4gIC8qKlxuICAgKiBpZHMgYW5kIHZhbHVlIHR5cGVzIG9mIGFsbCBxdWVyaWVzIHRoYXQgYXJlIG1hdGNoZWQgYnkgdGhpcyBub2RlLlxuICAgKi9cbiAgbWF0Y2hlZFF1ZXJpZXM6IHtbcXVlcnlJZDogbnVtYmVyXTogUXVlcnlWYWx1ZVR5cGV9O1xuICAvKiogQmluYXJ5IG9yIG9mIGFsbCBtYXRjaGVkIHF1ZXJ5IGlkcyBvZiB0aGlzIG5vZGUuICovXG4gIG1hdGNoZWRRdWVyeUlkczogbnVtYmVyO1xuICAvKipcbiAgICogQmluYXJ5IG9yIG9mIGFsbCBxdWVyeSBpZHMgdGhhdCBhcmUgbWF0Y2hlZCBieSBvbmUgb2YgdGhlIGNoaWxkcmVuLlxuICAgKiBUaGlzIGluY2x1ZGVzIHF1ZXJ5IGlkcyBmcm9tIHRlbXBsYXRlcyBhcyB3ZWxsLlxuICAgKiBVc2VkIGFzIGEgYmxvb20gZmlsdGVyLlxuICAgKi9cbiAgY2hpbGRNYXRjaGVkUXVlcmllczogbnVtYmVyO1xuICBlbGVtZW50OiBFbGVtZW50RGVmfG51bGw7XG4gIHByb3ZpZGVyOiBQcm92aWRlckRlZnxudWxsO1xuICB0ZXh0OiBUZXh0RGVmfG51bGw7XG4gIHF1ZXJ5OiBRdWVyeURlZnxudWxsO1xuICBuZ0NvbnRlbnQ6IE5nQ29udGVudERlZnxudWxsO1xufVxuXG4vKipcbiAqIEJpdG1hc2sgZm9yIE5vZGVEZWYuZmxhZ3MuXG4gKiBOYW1pbmcgY29udmVudGlvbjpcbiAqIC0gYFR5cGUuLi5gOiBmbGFncyB0aGF0IGFyZSBtdXR1YWxseSBleGNsdXNpdmVcbiAqIC0gYENhdC4uLmA6IHVuaW9uIG9mIG11bHRpcGxlIGBUeXBlLi4uYCAoc2hvcnQgZm9yIGNhdGVnb3J5KS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gTm9kZUZsYWdzIHtcbiAgTm9uZSA9IDAsXG4gIFR5cGVFbGVtZW50ID0gMSA8PCAwLFxuICBUeXBlVGV4dCA9IDEgPDwgMSxcbiAgUHJvamVjdGVkVGVtcGxhdGUgPSAxIDw8IDIsXG4gIENhdFJlbmRlck5vZGUgPSBUeXBlRWxlbWVudCB8IFR5cGVUZXh0LFxuICBUeXBlTmdDb250ZW50ID0gMSA8PCAzLFxuICBUeXBlUGlwZSA9IDEgPDwgNCxcbiAgVHlwZVB1cmVBcnJheSA9IDEgPDwgNSxcbiAgVHlwZVB1cmVPYmplY3QgPSAxIDw8IDYsXG4gIFR5cGVQdXJlUGlwZSA9IDEgPDwgNyxcbiAgQ2F0UHVyZUV4cHJlc3Npb24gPSBUeXBlUHVyZUFycmF5IHwgVHlwZVB1cmVPYmplY3QgfCBUeXBlUHVyZVBpcGUsXG4gIFR5cGVWYWx1ZVByb3ZpZGVyID0gMSA8PCA4LFxuICBUeXBlQ2xhc3NQcm92aWRlciA9IDEgPDwgOSxcbiAgVHlwZUZhY3RvcnlQcm92aWRlciA9IDEgPDwgMTAsXG4gIFR5cGVVc2VFeGlzdGluZ1Byb3ZpZGVyID0gMSA8PCAxMSxcbiAgTGF6eVByb3ZpZGVyID0gMSA8PCAxMixcbiAgUHJpdmF0ZVByb3ZpZGVyID0gMSA8PCAxMyxcbiAgVHlwZURpcmVjdGl2ZSA9IDEgPDwgMTQsXG4gIENvbXBvbmVudCA9IDEgPDwgMTUsXG4gIENhdFByb3ZpZGVyTm9EaXJlY3RpdmUgPVxuICAgICAgVHlwZVZhbHVlUHJvdmlkZXIgfCBUeXBlQ2xhc3NQcm92aWRlciB8IFR5cGVGYWN0b3J5UHJvdmlkZXIgfCBUeXBlVXNlRXhpc3RpbmdQcm92aWRlcixcbiAgQ2F0UHJvdmlkZXIgPSBDYXRQcm92aWRlck5vRGlyZWN0aXZlIHwgVHlwZURpcmVjdGl2ZSxcbiAgT25Jbml0ID0gMSA8PCAxNixcbiAgT25EZXN0cm95ID0gMSA8PCAxNyxcbiAgRG9DaGVjayA9IDEgPDwgMTgsXG4gIE9uQ2hhbmdlcyA9IDEgPDwgMTksXG4gIEFmdGVyQ29udGVudEluaXQgPSAxIDw8IDIwLFxuICBBZnRlckNvbnRlbnRDaGVja2VkID0gMSA8PCAyMSxcbiAgQWZ0ZXJWaWV3SW5pdCA9IDEgPDwgMjIsXG4gIEFmdGVyVmlld0NoZWNrZWQgPSAxIDw8IDIzLFxuICBFbWJlZGRlZFZpZXdzID0gMSA8PCAyNCxcbiAgQ29tcG9uZW50VmlldyA9IDEgPDwgMjUsXG4gIFR5cGVDb250ZW50UXVlcnkgPSAxIDw8IDI2LFxuICBUeXBlVmlld1F1ZXJ5ID0gMSA8PCAyNyxcbiAgU3RhdGljUXVlcnkgPSAxIDw8IDI4LFxuICBEeW5hbWljUXVlcnkgPSAxIDw8IDI5LFxuICBUeXBlTmdNb2R1bGUgPSAxIDw8IDMwLFxuICBDYXRRdWVyeSA9IFR5cGVDb250ZW50UXVlcnkgfCBUeXBlVmlld1F1ZXJ5LFxuXG4gIC8vIG11dHVhbGx5IGV4Y2x1c2l2ZSB2YWx1ZXMuLi5cbiAgVHlwZXMgPSBDYXRSZW5kZXJOb2RlIHwgVHlwZU5nQ29udGVudCB8IFR5cGVQaXBlIHwgQ2F0UHVyZUV4cHJlc3Npb24gfCBDYXRQcm92aWRlciB8IENhdFF1ZXJ5XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmluZGluZ0RlZiB7XG4gIGZsYWdzOiBCaW5kaW5nRmxhZ3M7XG4gIG5zOiBzdHJpbmd8bnVsbDtcbiAgbmFtZTogc3RyaW5nfG51bGw7XG4gIG5vbk1pbmlmaWVkTmFtZTogc3RyaW5nfG51bGw7XG4gIHNlY3VyaXR5Q29udGV4dDogU2VjdXJpdHlDb250ZXh0fG51bGw7XG4gIHN1ZmZpeDogc3RyaW5nfG51bGw7XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEJpbmRpbmdGbGFncyB7XG4gIFR5cGVFbGVtZW50QXR0cmlidXRlID0gMSA8PCAwLFxuICBUeXBlRWxlbWVudENsYXNzID0gMSA8PCAxLFxuICBUeXBlRWxlbWVudFN0eWxlID0gMSA8PCAyLFxuICBUeXBlUHJvcGVydHkgPSAxIDw8IDMsXG4gIFN5bnRoZXRpY1Byb3BlcnR5ID0gMSA8PCA0LFxuICBTeW50aGV0aWNIb3N0UHJvcGVydHkgPSAxIDw8IDUsXG4gIENhdFN5bnRoZXRpY1Byb3BlcnR5ID0gU3ludGhldGljUHJvcGVydHkgfCBTeW50aGV0aWNIb3N0UHJvcGVydHksXG5cbiAgLy8gbXV0dWFsbHkgZXhjbHVzaXZlIHZhbHVlcy4uLlxuICBUeXBlcyA9IFR5cGVFbGVtZW50QXR0cmlidXRlIHwgVHlwZUVsZW1lbnRDbGFzcyB8IFR5cGVFbGVtZW50U3R5bGUgfCBUeXBlUHJvcGVydHlcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPdXRwdXREZWYge1xuICB0eXBlOiBPdXRwdXRUeXBlO1xuICB0YXJnZXQ6ICd3aW5kb3cnfCdkb2N1bWVudCd8J2JvZHknfCdjb21wb25lbnQnfG51bGw7XG4gIGV2ZW50TmFtZTogc3RyaW5nO1xuICBwcm9wTmFtZTogc3RyaW5nfG51bGw7XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIE91dHB1dFR5cGUge0VsZW1lbnRPdXRwdXQsIERpcmVjdGl2ZU91dHB1dH1cblxuZXhwb3J0IGNvbnN0IGVudW0gUXVlcnlWYWx1ZVR5cGUge1xuICBFbGVtZW50UmVmID0gMCxcbiAgUmVuZGVyRWxlbWVudCA9IDEsXG4gIFRlbXBsYXRlUmVmID0gMixcbiAgVmlld0NvbnRhaW5lclJlZiA9IDMsXG4gIFByb3ZpZGVyID0gNFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVsZW1lbnREZWYge1xuICAvLyBzZXQgdG8gbnVsbCBmb3IgYDxuZy1jb250YWluZXI+YFxuICBuYW1lOiBzdHJpbmd8bnVsbDtcbiAgbnM6IHN0cmluZ3xudWxsO1xuICAvKiogbnMsIG5hbWUsIHZhbHVlICovXG4gIGF0dHJzOiBbc3RyaW5nLCBzdHJpbmcsIHN0cmluZ11bXXxudWxsO1xuICB0ZW1wbGF0ZTogVmlld0RlZmluaXRpb258bnVsbDtcbiAgY29tcG9uZW50UHJvdmlkZXI6IE5vZGVEZWZ8bnVsbDtcbiAgY29tcG9uZW50UmVuZGVyZXJUeXBlOiBSZW5kZXJlclR5cGUyfG51bGw7XG4gIC8vIGNsb3N1cmUgdG8gYWxsb3cgcmVjdXJzaXZlIGNvbXBvbmVudHNcbiAgY29tcG9uZW50VmlldzogVmlld0RlZmluaXRpb25GYWN0b3J5fG51bGw7XG4gIC8qKlxuICAgKiB2aXNpYmxlIHB1YmxpYyBwcm92aWRlcnMgZm9yIERJIGluIHRoZSB2aWV3LFxuICAgKiBhcyBzZWUgZnJvbSB0aGlzIGVsZW1lbnQuIFRoaXMgZG9lcyBub3QgaW5jbHVkZSBwcml2YXRlIHByb3ZpZGVycy5cbiAgICovXG4gIHB1YmxpY1Byb3ZpZGVyczoge1t0b2tlbktleTogc3RyaW5nXTogTm9kZURlZn18bnVsbDtcbiAgLyoqXG4gICAqIHNhbWUgYXMgdmlzaWJsZVB1YmxpY1Byb3ZpZGVycywgYnV0IGFsc28gaW5jbHVkZXMgcHJpdmF0ZSBwcm92aWRlcnNcbiAgICogdGhhdCBhcmUgbG9jYXRlZCBvbiB0aGlzIGVsZW1lbnQuXG4gICAqL1xuICBhbGxQcm92aWRlcnM6IHtbdG9rZW5LZXk6IHN0cmluZ106IE5vZGVEZWZ9fG51bGw7XG4gIGhhbmRsZUV2ZW50OiBFbGVtZW50SGFuZGxlRXZlbnRGbnxudWxsO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVsZW1lbnRIYW5kbGVFdmVudEZuIHsgKHZpZXc6IFZpZXdEYXRhLCBldmVudE5hbWU6IHN0cmluZywgZXZlbnQ6IGFueSk6IGJvb2xlYW47IH1cblxuZXhwb3J0IGludGVyZmFjZSBQcm92aWRlckRlZiB7XG4gIHRva2VuOiBhbnk7XG4gIHZhbHVlOiBhbnk7XG4gIGRlcHM6IERlcERlZltdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE5nTW9kdWxlUHJvdmlkZXJEZWYge1xuICBmbGFnczogTm9kZUZsYWdzO1xuICBpbmRleDogbnVtYmVyO1xuICB0b2tlbjogYW55O1xuICB2YWx1ZTogYW55O1xuICBkZXBzOiBEZXBEZWZbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEZXBEZWYge1xuICBmbGFnczogRGVwRmxhZ3M7XG4gIHRva2VuOiBhbnk7XG4gIHRva2VuS2V5OiBzdHJpbmc7XG59XG5cbi8qKlxuICogQml0bWFzayBmb3IgREkgZmxhZ3NcbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gRGVwRmxhZ3Mge1xuICBOb25lID0gMCxcbiAgU2tpcFNlbGYgPSAxIDw8IDAsXG4gIE9wdGlvbmFsID0gMSA8PCAxLFxuICBTZWxmID0gMSA8PCAyLFxuICBWYWx1ZSA9IDEgPDwgMyxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUZXh0RGVmIHsgcHJlZml4OiBzdHJpbmc7IH1cblxuZXhwb3J0IGludGVyZmFjZSBRdWVyeURlZiB7XG4gIGlkOiBudW1iZXI7XG4gIC8vIHZhcmlhbnQgb2YgdGhlIGlkIHRoYXQgY2FuIGJlIHVzZWQgdG8gY2hlY2sgYWdhaW5zdCBOb2RlRGVmLm1hdGNoZWRRdWVyeUlkcywgLi4uXG4gIGZpbHRlcklkOiBudW1iZXI7XG4gIGJpbmRpbmdzOiBRdWVyeUJpbmRpbmdEZWZbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBRdWVyeUJpbmRpbmdEZWYge1xuICBwcm9wTmFtZTogc3RyaW5nO1xuICBiaW5kaW5nVHlwZTogUXVlcnlCaW5kaW5nVHlwZTtcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gUXVlcnlCaW5kaW5nVHlwZSB7Rmlyc3QgPSAwLCBBbGwgPSAxfVxuXG5leHBvcnQgaW50ZXJmYWNlIE5nQ29udGVudERlZiB7XG4gIC8qKlxuICAgKiB0aGlzIGluZGV4IGlzIGNoZWNrZWQgYWdhaW5zdCBOb2RlRGVmLm5nQ29udGVudEluZGV4IHRvIGZpbmQgdGhlIG5vZGVzXG4gICAqIHRoYXQgYXJlIG1hdGNoZWQgYnkgdGhpcyBuZy1jb250ZW50LlxuICAgKiBOb3RlIHRoYXQgYSBOb2RlRGVmIHdpdGggYW4gbmctY29udGVudCBjYW4gYmUgcmVwcm9qZWN0ZWQsIGkuZS5cbiAgICogaGF2ZSBhIG5nQ29udGVudEluZGV4IG9uIGl0cyBvd24uXG4gICAqL1xuICBpbmRleDogbnVtYmVyO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBEYXRhXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBpbnRlcmZhY2UgTmdNb2R1bGVEYXRhIGV4dGVuZHMgSW5qZWN0b3IsIE5nTW9kdWxlUmVmPGFueT4ge1xuICAvLyBOb3RlOiB3ZSBhcmUgdXNpbmcgdGhlIHByZWZpeCBfIGFzIE5nTW9kdWxlRGF0YSBpcyBhbiBOZ01vZHVsZVJlZiBhbmQgdGhlcmVmb3JlIGRpcmVjdGx5XG4gIC8vIGV4cG9zZWQgdG8gdGhlIHVzZXIuXG4gIF9kZWY6IE5nTW9kdWxlRGVmaW5pdGlvbjtcbiAgX3BhcmVudDogSW5qZWN0b3I7XG4gIF9wcm92aWRlcnM6IGFueVtdO1xufVxuXG4vKipcbiAqIFZpZXcgaW5zdGFuY2UgZGF0YS5cbiAqIEF0dGVudGlvbjogQWRkaW5nIGZpZWxkcyB0byB0aGlzIGlzIHBlcmZvcm1hbmNlIHNlbnNpdGl2ZSFcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBWaWV3RGF0YSB7XG4gIGRlZjogVmlld0RlZmluaXRpb247XG4gIHJvb3Q6IFJvb3REYXRhO1xuICByZW5kZXJlcjogUmVuZGVyZXIyO1xuICAvLyBpbmRleCBvZiBjb21wb25lbnQgcHJvdmlkZXIgLyBhbmNob3IuXG4gIHBhcmVudE5vZGVEZWY6IE5vZGVEZWZ8bnVsbDtcbiAgcGFyZW50OiBWaWV3RGF0YXxudWxsO1xuICB2aWV3Q29udGFpbmVyUGFyZW50OiBWaWV3RGF0YXxudWxsO1xuICBjb21wb25lbnQ6IGFueTtcbiAgY29udGV4dDogYW55O1xuICAvLyBBdHRlbnRpb246IE5ldmVyIGxvb3Agb3ZlciB0aGlzLCBhcyB0aGlzIHdpbGxcbiAgLy8gY3JlYXRlIGEgcG9seW1vcnBoaWMgdXNhZ2Ugc2l0ZS5cbiAgLy8gSW5zdGVhZDogQWx3YXlzIGxvb3Agb3ZlciBWaWV3RGVmaW5pdGlvbi5ub2RlcyxcbiAgLy8gYW5kIGNhbGwgdGhlIHJpZ2h0IGFjY2Vzc29yIChlLmcuIGBlbGVtZW50RGF0YWApIGJhc2VkIG9uXG4gIC8vIHRoZSBOb2RlVHlwZS5cbiAgbm9kZXM6IHtba2V5OiBudW1iZXJdOiBOb2RlRGF0YX07XG4gIHN0YXRlOiBWaWV3U3RhdGU7XG4gIG9sZFZhbHVlczogYW55W107XG4gIGRpc3Bvc2FibGVzOiBEaXNwb3NhYmxlRm5bXXxudWxsO1xuICBpbml0SW5kZXg6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBCaXRtYXNrIG9mIHN0YXRlc1xuICovXG5leHBvcnQgY29uc3QgZW51bSBWaWV3U3RhdGUge1xuICBCZWZvcmVGaXJzdENoZWNrID0gMSA8PCAwLFxuICBGaXJzdENoZWNrID0gMSA8PCAxLFxuICBBdHRhY2hlZCA9IDEgPDwgMixcbiAgQ2hlY2tzRW5hYmxlZCA9IDEgPDwgMyxcbiAgSXNQcm9qZWN0ZWRWaWV3ID0gMSA8PCA0LFxuICBDaGVja1Byb2plY3RlZFZpZXcgPSAxIDw8IDUsXG4gIENoZWNrUHJvamVjdGVkVmlld3MgPSAxIDw8IDYsXG4gIERlc3Ryb3llZCA9IDEgPDwgNyxcblxuICAvLyBJbml0U3RhdGUgVXNlcyAzIGJpdHNcbiAgSW5pdFN0YXRlX01hc2sgPSA3IDw8IDgsXG4gIEluaXRTdGF0ZV9CZWZvcmVJbml0ID0gMCA8PCA4LFxuICBJbml0U3RhdGVfQ2FsbGluZ09uSW5pdCA9IDEgPDwgOCxcbiAgSW5pdFN0YXRlX0NhbGxpbmdBZnRlckNvbnRlbnRJbml0ID0gMiA8PCA4LFxuICBJbml0U3RhdGVfQ2FsbGluZ0FmdGVyVmlld0luaXQgPSAzIDw8IDgsXG4gIEluaXRTdGF0ZV9BZnRlckluaXQgPSA0IDw8IDgsXG5cbiAgQ2F0RGV0ZWN0Q2hhbmdlcyA9IEF0dGFjaGVkIHwgQ2hlY2tzRW5hYmxlZCxcbiAgQ2F0SW5pdCA9IEJlZm9yZUZpcnN0Q2hlY2sgfCBDYXREZXRlY3RDaGFuZ2VzIHwgSW5pdFN0YXRlX0JlZm9yZUluaXRcbn1cblxuLy8gQ2FsbGVkIGJlZm9yZSBlYWNoIGN5Y2xlIG9mIGEgdmlldydzIGNoZWNrIHRvIGRldGVjdCB3aGV0aGVyIHRoaXMgaXMgaW4gdGhlXG4vLyBpbml0U3RhdGUgZm9yIHdoaWNoIHdlIG5lZWQgdG8gY2FsbCBuZ09uSW5pdCwgbmdBZnRlckNvbnRlbnRJbml0IG9yIG5nQWZ0ZXJWaWV3SW5pdFxuLy8gbGlmZWN5Y2xlIG1ldGhvZHMuIFJldHVybnMgdHJ1ZSBpZiB0aGlzIGNoZWNrIGN5Y2xlIHNob3VsZCBjYWxsIGxpZmVjeWNsZVxuLy8gbWV0aG9kcy5cbmV4cG9ydCBmdW5jdGlvbiBzaGlmdEluaXRTdGF0ZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgcHJpb3JJbml0U3RhdGU6IFZpZXdTdGF0ZSwgbmV3SW5pdFN0YXRlOiBWaWV3U3RhdGUpOiBib29sZWFuIHtcbiAgLy8gT25seSB1cGRhdGUgdGhlIEluaXRTdGF0ZSBpZiB3ZSBhcmUgY3VycmVudGx5IGluIHRoZSBwcmlvciBzdGF0ZS5cbiAgLy8gRm9yIGV4YW1wbGUsIG9ubHkgbW92ZSBpbnRvIENhbGxpbmdJbml0IGlmIHdlIGFyZSBpbiBCZWZvcmVJbml0LiBPbmx5XG4gIC8vIG1vdmUgaW50byBDYWxsaW5nQ29udGVudEluaXQgaWYgd2UgYXJlIGluIENhbGxpbmdJbml0LiBOb3JtYWxseSB0aGlzIHdpbGxcbiAgLy8gYWx3YXlzIGJlIHRydWUgYmVjYXVzZSBvZiBob3cgY2hlY2tDeWNsZSBpcyBjYWxsZWQgaW4gY2hlY2tBbmRVcGRhdGVWaWV3LlxuICAvLyBIb3dldmVyLCBpZiBjaGVja0FuZFVwZGF0ZVZpZXcgaXMgY2FsbGVkIHJlY3Vyc2l2ZWx5IG9yIGlmIGFuIGV4Y2VwdGlvbiBpc1xuICAvLyB0aHJvd24gd2hpbGUgY2hlY2tBbmRVcGRhdGVWaWV3IGlzIHJ1bm5pbmcsIGNoZWNrQW5kVXBkYXRlVmlldyBzdGFydHMgb3ZlclxuICAvLyBmcm9tIHRoZSBiZWdpbm5pbmcuIFRoaXMgZW5zdXJlcyB0aGUgc3RhdGUgaXMgbW9ub3RvbmljYWxseSBpbmNyZWFzaW5nLFxuICAvLyB0ZXJtaW5hdGluZyBpbiB0aGUgQWZ0ZXJJbml0IHN0YXRlLCB3aGljaCBlbnN1cmVzIHRoZSBJbml0IG1ldGhvZHMgYXJlIGNhbGxlZFxuICAvLyBhdCBsZWFzdCBvbmNlIGFuZCBvbmx5IG9uY2UuXG4gIGNvbnN0IHN0YXRlID0gdmlldy5zdGF0ZTtcbiAgY29uc3QgaW5pdFN0YXRlID0gc3RhdGUgJiBWaWV3U3RhdGUuSW5pdFN0YXRlX01hc2s7XG4gIGlmIChpbml0U3RhdGUgPT09IHByaW9ySW5pdFN0YXRlKSB7XG4gICAgdmlldy5zdGF0ZSA9IChzdGF0ZSAmIH5WaWV3U3RhdGUuSW5pdFN0YXRlX01hc2spIHwgbmV3SW5pdFN0YXRlO1xuICAgIHZpZXcuaW5pdEluZGV4ID0gLTE7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGluaXRTdGF0ZSA9PT0gbmV3SW5pdFN0YXRlO1xufVxuXG4vLyBSZXR1cm5zIHRydWUgaWYgdGhlIGxpZmVjeWNsZSBpbml0IG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIGZvciB0aGUgbm9kZSB3aXRoXG4vLyB0aGUgZ2l2ZW4gaW5pdCBpbmRleC5cbmV4cG9ydCBmdW5jdGlvbiBzaG91bGRDYWxsTGlmZWN5Y2xlSW5pdEhvb2soXG4gICAgdmlldzogVmlld0RhdGEsIGluaXRTdGF0ZTogVmlld1N0YXRlLCBpbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGlmICgodmlldy5zdGF0ZSAmIFZpZXdTdGF0ZS5Jbml0U3RhdGVfTWFzaykgPT09IGluaXRTdGF0ZSAmJiB2aWV3LmluaXRJbmRleCA8PSBpbmRleCkge1xuICAgIHZpZXcuaW5pdEluZGV4ID0gaW5kZXggKyAxO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEaXNwb3NhYmxlRm4geyAoKTogdm9pZDsgfVxuXG4vKipcbiAqIE5vZGUgaW5zdGFuY2UgZGF0YS5cbiAqXG4gKiBXZSBoYXZlIGEgc2VwYXJhdGUgdHlwZSBwZXIgTm9kZVR5cGUgdG8gc2F2ZSBtZW1vcnlcbiAqIChUZXh0RGF0YSB8IEVsZW1lbnREYXRhIHwgUHJvdmlkZXJEYXRhIHwgUHVyZUV4cHJlc3Npb25EYXRhIHwgUXVlcnlMaXN0PGFueT4pXG4gKlxuICogVG8ga2VlcCBvdXIgY29kZSBtb25vbW9ycGhpYyxcbiAqIHdlIHByb2hpYml0IHVzaW5nIGBOb2RlRGF0YWAgZGlyZWN0bHkgYnV0IGVuZm9yY2UgdGhlIHVzZSBvZiBhY2Nlc3NvcnMgKGBhc0VsZW1lbnREYXRhYCwgLi4uKS5cbiAqIFRoaXMgd2F5LCBubyB1c2FnZSBzaXRlIGNhbiBnZXQgYSBgTm9kZURhdGFgIGZyb20gdmlldy5ub2RlcyBhbmQgdGhlbiB1c2UgaXQgZm9yIGRpZmZlcmVudFxuICogcHVycG9zZXMuXG4gKi9cbmV4cG9ydCBjbGFzcyBOb2RlRGF0YSB7IHByaXZhdGUgX19icmFuZDogYW55OyB9XG5cbi8qKlxuICogRGF0YSBmb3IgYW4gaW5zdGFudGlhdGVkIE5vZGVUeXBlLlRleHQuXG4gKlxuICogQXR0ZW50aW9uOiBBZGRpbmcgZmllbGRzIHRvIHRoaXMgaXMgcGVyZm9ybWFuY2Ugc2Vuc2l0aXZlIVxuICovXG5leHBvcnQgaW50ZXJmYWNlIFRleHREYXRhIHsgcmVuZGVyVGV4dDogYW55OyB9XG5cbi8qKlxuICogQWNjZXNzb3IgZm9yIHZpZXcubm9kZXMsIGVuZm9yY2luZyB0aGF0IGV2ZXJ5IHVzYWdlIHNpdGUgc3RheXMgbW9ub21vcnBoaWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc1RleHREYXRhKHZpZXc6IFZpZXdEYXRhLCBpbmRleDogbnVtYmVyKTogVGV4dERhdGEge1xuICByZXR1cm4gPGFueT52aWV3Lm5vZGVzW2luZGV4XTtcbn1cblxuLyoqXG4gKiBEYXRhIGZvciBhbiBpbnN0YW50aWF0ZWQgTm9kZVR5cGUuRWxlbWVudC5cbiAqXG4gKiBBdHRlbnRpb246IEFkZGluZyBmaWVsZHMgdG8gdGhpcyBpcyBwZXJmb3JtYW5jZSBzZW5zaXRpdmUhXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRWxlbWVudERhdGEge1xuICByZW5kZXJFbGVtZW50OiBhbnk7XG4gIGNvbXBvbmVudFZpZXc6IFZpZXdEYXRhO1xuICB2aWV3Q29udGFpbmVyOiBWaWV3Q29udGFpbmVyRGF0YXxudWxsO1xuICB0ZW1wbGF0ZTogVGVtcGxhdGVEYXRhO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZpZXdDb250YWluZXJEYXRhIGV4dGVuZHMgVmlld0NvbnRhaW5lclJlZiB7XG4gIC8vIE5vdGU6IHdlIGFyZSB1c2luZyB0aGUgcHJlZml4IF8gYXMgVmlld0NvbnRhaW5lckRhdGEgaXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCB0aGVyZWZvcmVcbiAgLy8gZGlyZWN0bHlcbiAgLy8gZXhwb3NlZCB0byB0aGUgdXNlci5cbiAgX2VtYmVkZGVkVmlld3M6IFZpZXdEYXRhW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVtcGxhdGVEYXRhIGV4dGVuZHMgVGVtcGxhdGVSZWY8YW55PiB7XG4gIC8vIHZpZXdzIHRoYXQgaGF2ZSBiZWVuIGNyZWF0ZWQgZnJvbSB0aGUgdGVtcGxhdGVcbiAgLy8gb2YgdGhpcyBlbGVtZW50LFxuICAvLyBidXQgaW5zZXJ0ZWQgaW50byB0aGUgZW1iZWRkZWRWaWV3cyBvZiBhbm90aGVyIGVsZW1lbnQuXG4gIC8vIEJ5IGRlZmF1bHQsIHRoaXMgaXMgdW5kZWZpbmVkLlxuICAvLyBOb3RlOiB3ZSBhcmUgdXNpbmcgdGhlIHByZWZpeCBfIGFzIFRlbXBsYXRlRGF0YSBpcyBhIFRlbXBsYXRlUmVmIGFuZCB0aGVyZWZvcmUgZGlyZWN0bHlcbiAgLy8gZXhwb3NlZCB0byB0aGUgdXNlci5cbiAgX3Byb2plY3RlZFZpZXdzOiBWaWV3RGF0YVtdO1xufVxuXG4vKipcbiAqIEFjY2Vzc29yIGZvciB2aWV3Lm5vZGVzLCBlbmZvcmNpbmcgdGhhdCBldmVyeSB1c2FnZSBzaXRlIHN0YXlzIG1vbm9tb3JwaGljLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNFbGVtZW50RGF0YSh2aWV3OiBWaWV3RGF0YSwgaW5kZXg6IG51bWJlcik6IEVsZW1lbnREYXRhIHtcbiAgcmV0dXJuIDxhbnk+dmlldy5ub2Rlc1tpbmRleF07XG59XG5cbi8qKlxuICogRGF0YSBmb3IgYW4gaW5zdGFudGlhdGVkIE5vZGVUeXBlLlByb3ZpZGVyLlxuICpcbiAqIEF0dGVudGlvbjogQWRkaW5nIGZpZWxkcyB0byB0aGlzIGlzIHBlcmZvcm1hbmNlIHNlbnNpdGl2ZSFcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBQcm92aWRlckRhdGEgeyBpbnN0YW5jZTogYW55OyB9XG5cbi8qKlxuICogQWNjZXNzb3IgZm9yIHZpZXcubm9kZXMsIGVuZm9yY2luZyB0aGF0IGV2ZXJ5IHVzYWdlIHNpdGUgc3RheXMgbW9ub21vcnBoaWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc1Byb3ZpZGVyRGF0YSh2aWV3OiBWaWV3RGF0YSwgaW5kZXg6IG51bWJlcik6IFByb3ZpZGVyRGF0YSB7XG4gIHJldHVybiA8YW55PnZpZXcubm9kZXNbaW5kZXhdO1xufVxuXG4vKipcbiAqIERhdGEgZm9yIGFuIGluc3RhbnRpYXRlZCBOb2RlVHlwZS5QdXJlRXhwcmVzc2lvbi5cbiAqXG4gKiBBdHRlbnRpb246IEFkZGluZyBmaWVsZHMgdG8gdGhpcyBpcyBwZXJmb3JtYW5jZSBzZW5zaXRpdmUhXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUHVyZUV4cHJlc3Npb25EYXRhIHsgdmFsdWU6IGFueTsgfVxuXG4vKipcbiAqIEFjY2Vzc29yIGZvciB2aWV3Lm5vZGVzLCBlbmZvcmNpbmcgdGhhdCBldmVyeSB1c2FnZSBzaXRlIHN0YXlzIG1vbm9tb3JwaGljLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNQdXJlRXhwcmVzc2lvbkRhdGEodmlldzogVmlld0RhdGEsIGluZGV4OiBudW1iZXIpOiBQdXJlRXhwcmVzc2lvbkRhdGEge1xuICByZXR1cm4gPGFueT52aWV3Lm5vZGVzW2luZGV4XTtcbn1cblxuLyoqXG4gKiBBY2Nlc3NvciBmb3Igdmlldy5ub2RlcywgZW5mb3JjaW5nIHRoYXQgZXZlcnkgdXNhZ2Ugc2l0ZSBzdGF5cyBtb25vbW9ycGhpYy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzUXVlcnlMaXN0KHZpZXc6IFZpZXdEYXRhLCBpbmRleDogbnVtYmVyKTogUXVlcnlMaXN0PGFueT4ge1xuICByZXR1cm4gPGFueT52aWV3Lm5vZGVzW2luZGV4XTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSb290RGF0YSB7XG4gIGluamVjdG9yOiBJbmplY3RvcjtcbiAgbmdNb2R1bGU6IE5nTW9kdWxlUmVmPGFueT47XG4gIHByb2plY3RhYmxlTm9kZXM6IGFueVtdW107XG4gIHNlbGVjdG9yT3JOb2RlOiBhbnk7XG4gIHJlbmRlcmVyOiBSZW5kZXJlcjI7XG4gIHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MjtcbiAgZXJyb3JIYW5kbGVyOiBFcnJvckhhbmRsZXI7XG4gIHNhbml0aXplcjogU2FuaXRpemVyO1xufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgRGVidWdDb250ZXh0IHtcbiAgYWJzdHJhY3QgZ2V0IHZpZXcoKTogVmlld0RhdGE7XG4gIGFic3RyYWN0IGdldCBub2RlSW5kZXgoKTogbnVtYmVyfG51bGw7XG4gIGFic3RyYWN0IGdldCBpbmplY3RvcigpOiBJbmplY3RvcjtcbiAgYWJzdHJhY3QgZ2V0IGNvbXBvbmVudCgpOiBhbnk7XG4gIGFic3RyYWN0IGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXTtcbiAgYWJzdHJhY3QgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX07XG4gIGFic3RyYWN0IGdldCBjb250ZXh0KCk6IGFueTtcbiAgYWJzdHJhY3QgZ2V0IGNvbXBvbmVudFJlbmRlckVsZW1lbnQoKTogYW55O1xuICBhYnN0cmFjdCBnZXQgcmVuZGVyTm9kZSgpOiBhbnk7XG4gIGFic3RyYWN0IGxvZ0Vycm9yKGNvbnNvbGU6IENvbnNvbGUsIC4uLnZhbHVlczogYW55W10pOiB2b2lkO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBPdGhlclxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgY29uc3QgZW51bSBDaGVja1R5cGUge0NoZWNrQW5kVXBkYXRlLCBDaGVja05vQ2hhbmdlc31cblxuZXhwb3J0IGludGVyZmFjZSBQcm92aWRlck92ZXJyaWRlIHtcbiAgdG9rZW46IGFueTtcbiAgZmxhZ3M6IE5vZGVGbGFncztcbiAgdmFsdWU6IGFueTtcbiAgZGVwczogKFtEZXBGbGFncywgYW55XXxhbnkpW107XG4gIGRlcHJlY2F0ZWRCZWhhdmlvcjogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXJ2aWNlcyB7XG4gIHNldEN1cnJlbnROb2RlKHZpZXc6IFZpZXdEYXRhLCBub2RlSW5kZXg6IG51bWJlcik6IHZvaWQ7XG4gIGNyZWF0ZVJvb3RWaWV3KFxuICAgICAgaW5qZWN0b3I6IEluamVjdG9yLCBwcm9qZWN0YWJsZU5vZGVzOiBhbnlbXVtdLCByb290U2VsZWN0b3JPck5vZGU6IHN0cmluZ3xhbnksXG4gICAgICBkZWY6IFZpZXdEZWZpbml0aW9uLCBuZ01vZHVsZTogTmdNb2R1bGVSZWY8YW55PiwgY29udGV4dD86IGFueSk6IFZpZXdEYXRhO1xuICBjcmVhdGVFbWJlZGRlZFZpZXcocGFyZW50OiBWaWV3RGF0YSwgYW5jaG9yRGVmOiBOb2RlRGVmLCB2aWV3RGVmOiBWaWV3RGVmaW5pdGlvbiwgY29udGV4dD86IGFueSk6XG4gICAgICBWaWV3RGF0YTtcbiAgY3JlYXRlQ29tcG9uZW50VmlldyhcbiAgICAgIHBhcmVudFZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCB2aWV3RGVmOiBWaWV3RGVmaW5pdGlvbiwgaG9zdEVsZW1lbnQ6IGFueSk6IFZpZXdEYXRhO1xuICBjcmVhdGVOZ01vZHVsZVJlZihcbiAgICAgIG1vZHVsZVR5cGU6IFR5cGU8YW55PiwgcGFyZW50OiBJbmplY3RvciwgYm9vdHN0cmFwQ29tcG9uZW50czogVHlwZTxhbnk+W10sXG4gICAgICBkZWY6IE5nTW9kdWxlRGVmaW5pdGlvbik6IE5nTW9kdWxlUmVmPGFueT47XG4gIG92ZXJyaWRlUHJvdmlkZXIob3ZlcnJpZGU6IFByb3ZpZGVyT3ZlcnJpZGUpOiB2b2lkO1xuICBvdmVycmlkZUNvbXBvbmVudFZpZXcoY29tcFR5cGU6IFR5cGU8YW55PiwgY29tcEZhY3Rvcnk6IENvbXBvbmVudEZhY3Rvcnk8YW55Pik6IHZvaWQ7XG4gIGNsZWFyT3ZlcnJpZGVzKCk6IHZvaWQ7XG4gIGNoZWNrQW5kVXBkYXRlVmlldyh2aWV3OiBWaWV3RGF0YSk6IHZvaWQ7XG4gIGNoZWNrTm9DaGFuZ2VzVmlldyh2aWV3OiBWaWV3RGF0YSk6IHZvaWQ7XG4gIGRlc3Ryb3lWaWV3KHZpZXc6IFZpZXdEYXRhKTogdm9pZDtcbiAgcmVzb2x2ZURlcChcbiAgICAgIHZpZXc6IFZpZXdEYXRhLCBlbERlZjogTm9kZURlZnxudWxsLCBhbGxvd1ByaXZhdGVTZXJ2aWNlczogYm9vbGVhbiwgZGVwRGVmOiBEZXBEZWYsXG4gICAgICBub3RGb3VuZFZhbHVlPzogYW55KTogYW55O1xuICBjcmVhdGVEZWJ1Z0NvbnRleHQodmlldzogVmlld0RhdGEsIG5vZGVJbmRleDogbnVtYmVyKTogRGVidWdDb250ZXh0O1xuICBoYW5kbGVFdmVudDogVmlld0hhbmRsZUV2ZW50Rm47XG4gIHVwZGF0ZURpcmVjdGl2ZXM6ICh2aWV3OiBWaWV3RGF0YSwgY2hlY2tUeXBlOiBDaGVja1R5cGUpID0+IHZvaWQ7XG4gIHVwZGF0ZVJlbmRlcmVyOiAodmlldzogVmlld0RhdGEsIGNoZWNrVHlwZTogQ2hlY2tUeXBlKSA9PiB2b2lkO1xuICBkaXJ0eVBhcmVudFF1ZXJpZXM6ICh2aWV3OiBWaWV3RGF0YSkgPT4gdm9pZDtcbn1cblxuLyoqXG4gKiBUaGlzIG9iamVjdCBpcyB1c2VkIHRvIHByZXZlbnQgY3ljbGVzIGluIHRoZSBzb3VyY2UgZmlsZXMgYW5kIHRvIGhhdmUgYSBwbGFjZSB3aGVyZVxuICogZGVidWcgbW9kZSBjYW4gaG9vayBpdC4gSXQgaXMgbGF6aWx5IGZpbGxlZCB3aGVuIGBpc0Rldk1vZGVgIGlzIGtub3duLlxuICovXG5leHBvcnQgY29uc3QgU2VydmljZXM6IFNlcnZpY2VzID0ge1xuICBzZXRDdXJyZW50Tm9kZTogdW5kZWZpbmVkICEsXG4gIGNyZWF0ZVJvb3RWaWV3OiB1bmRlZmluZWQgISxcbiAgY3JlYXRlRW1iZWRkZWRWaWV3OiB1bmRlZmluZWQgISxcbiAgY3JlYXRlQ29tcG9uZW50VmlldzogdW5kZWZpbmVkICEsXG4gIGNyZWF0ZU5nTW9kdWxlUmVmOiB1bmRlZmluZWQgISxcbiAgb3ZlcnJpZGVQcm92aWRlcjogdW5kZWZpbmVkICEsXG4gIG92ZXJyaWRlQ29tcG9uZW50VmlldzogdW5kZWZpbmVkICEsXG4gIGNsZWFyT3ZlcnJpZGVzOiB1bmRlZmluZWQgISxcbiAgY2hlY2tBbmRVcGRhdGVWaWV3OiB1bmRlZmluZWQgISxcbiAgY2hlY2tOb0NoYW5nZXNWaWV3OiB1bmRlZmluZWQgISxcbiAgZGVzdHJveVZpZXc6IHVuZGVmaW5lZCAhLFxuICByZXNvbHZlRGVwOiB1bmRlZmluZWQgISxcbiAgY3JlYXRlRGVidWdDb250ZXh0OiB1bmRlZmluZWQgISxcbiAgaGFuZGxlRXZlbnQ6IHVuZGVmaW5lZCAhLFxuICB1cGRhdGVEaXJlY3RpdmVzOiB1bmRlZmluZWQgISxcbiAgdXBkYXRlUmVuZGVyZXI6IHVuZGVmaW5lZCAhLFxuICBkaXJ0eVBhcmVudFF1ZXJpZXM6IHVuZGVmaW5lZCAhLFxufTtcbiJdfQ==