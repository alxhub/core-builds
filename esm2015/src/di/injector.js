/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { stringify } from '../util';
import { defineInjectable } from './defs';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { Inject, Optional, Self, SkipSelf } from './metadata';
export const SOURCE = '__source';
const _THROW_IF_NOT_FOUND = new Object();
export const THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
/**
 * An InjectionToken that gets the current `Injector` for `createInjector()`-style injectors.
 *
 * Requesting this token instead of `Injector` allows `StaticInjector` to be tree-shaken from a
 * project.
 *
 * @experimental
 */
export const INJECTOR = new InjectionToken('INJECTOR');
export class NullInjector {
    get(token, notFoundValue = _THROW_IF_NOT_FOUND) {
        if (notFoundValue === _THROW_IF_NOT_FOUND) {
            throw new Error(`NullInjectorError: No provider for ${stringify(token)}!`);
        }
        return notFoundValue;
    }
}
/**
 * @usageNotes
 * ```
 * const injector: Injector = ...;
 * injector.get(...);
 * ```
 *
 * @description
 *
 * Concrete injectors implement this interface.
 *
 * For more details, see the {@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
 *
 * ### Example
 *
 * {@example core/di/ts/injector_spec.ts region='Injector'}
 *
 * `Injector` returns itself when given `Injector` as a token:
 * {@example core/di/ts/injector_spec.ts region='injectInjector'}
 *
 *
 */
export class Injector {
    /**
     * Create a new Injector which is configure using `StaticProvider`s.
     *
     * ### Example
     *
     * {@example core/di/ts/provider_spec.ts region='ConstructorProvider'}
     */
    static create(options, parent) {
        if (Array.isArray(options)) {
            return new StaticInjector(options, parent);
        }
        else {
            return new StaticInjector(options.providers, options.parent, options.name || null);
        }
    }
}
Injector.THROW_IF_NOT_FOUND = _THROW_IF_NOT_FOUND;
Injector.NULL = new NullInjector();
Injector.ngInjectableDef = defineInjectable({
    providedIn: 'any',
    factory: () => inject(INJECTOR),
});
const IDENT = function (value) {
    return value;
};
const EMPTY = [];
const CIRCULAR = IDENT;
const MULTI_PROVIDER_FN = function () {
    return Array.prototype.slice.call(arguments);
};
const GET_PROPERTY_NAME = {};
export const USE_VALUE = getClosureSafeProperty({ provide: String, useValue: GET_PROPERTY_NAME });
const NG_TOKEN_PATH = 'ngTokenPath';
const NG_TEMP_TOKEN_PATH = 'ngTempTokenPath';
const NULL_INJECTOR = Injector.NULL;
const NEW_LINE = /\n/gm;
const NO_NEW_LINE = 'ɵ';
export class StaticInjector {
    constructor(providers, parent = NULL_INJECTOR, source = null) {
        this.parent = parent;
        this.source = source;
        const records = this._records = new Map();
        records.set(Injector, { token: Injector, fn: IDENT, deps: EMPTY, value: this, useNew: false });
        records.set(INJECTOR, { token: INJECTOR, fn: IDENT, deps: EMPTY, value: this, useNew: false });
        recursivelyProcessProviders(records, providers);
    }
    get(token, notFoundValue, flags = 0 /* Default */) {
        const record = this._records.get(token);
        try {
            return tryResolveToken(token, record, this._records, this.parent, notFoundValue, flags);
        }
        catch (e) {
            const tokenPath = e[NG_TEMP_TOKEN_PATH];
            if (token[SOURCE]) {
                tokenPath.unshift(token[SOURCE]);
            }
            e.message = formatError('\n' + e.message, tokenPath, this.source);
            e[NG_TOKEN_PATH] = tokenPath;
            e[NG_TEMP_TOKEN_PATH] = null;
            throw e;
        }
    }
    toString() {
        const tokens = [], records = this._records;
        records.forEach((v, token) => tokens.push(stringify(token)));
        return `StaticInjector[${tokens.join(', ')}]`;
    }
}
function resolveProvider(provider) {
    const deps = computeDeps(provider);
    let fn = IDENT;
    let value = EMPTY;
    let useNew = false;
    let provide = resolveForwardRef(provider.provide);
    if (USE_VALUE in provider) {
        // We need to use USE_VALUE in provider since provider.useValue could be defined as undefined.
        value = provider.useValue;
    }
    else if (provider.useFactory) {
        fn = provider.useFactory;
    }
    else if (provider.useExisting) {
        // Just use IDENT
    }
    else if (provider.useClass) {
        useNew = true;
        fn = resolveForwardRef(provider.useClass);
    }
    else if (typeof provide == 'function') {
        useNew = true;
        fn = provide;
    }
    else {
        throw staticError('StaticProvider does not have [useValue|useFactory|useExisting|useClass] or [provide] is not newable', provider);
    }
    return { deps, fn, useNew, value };
}
function multiProviderMixError(token) {
    return staticError('Cannot mix multi providers and regular providers', token);
}
function recursivelyProcessProviders(records, provider) {
    if (provider) {
        provider = resolveForwardRef(provider);
        if (provider instanceof Array) {
            // if we have an array recurse into the array
            for (let i = 0; i < provider.length; i++) {
                recursivelyProcessProviders(records, provider[i]);
            }
        }
        else if (typeof provider === 'function') {
            // Functions were supported in ReflectiveInjector, but are not here. For safety give useful
            // error messages
            throw staticError('Function/Class not supported', provider);
        }
        else if (provider && typeof provider === 'object' && provider.provide) {
            // At this point we have what looks like a provider: {provide: ?, ....}
            let token = resolveForwardRef(provider.provide);
            const resolvedProvider = resolveProvider(provider);
            if (provider.multi === true) {
                // This is a multi provider.
                let multiProvider = records.get(token);
                if (multiProvider) {
                    if (multiProvider.fn !== MULTI_PROVIDER_FN) {
                        throw multiProviderMixError(token);
                    }
                }
                else {
                    // Create a placeholder factory which will look up the constituents of the multi provider.
                    records.set(token, multiProvider = {
                        token: provider.provide,
                        deps: [],
                        useNew: false,
                        fn: MULTI_PROVIDER_FN,
                        value: EMPTY
                    });
                }
                // Treat the provider as the token.
                token = provider;
                multiProvider.deps.push({ token, options: 6 /* Default */ });
            }
            const record = records.get(token);
            if (record && record.fn == MULTI_PROVIDER_FN) {
                throw multiProviderMixError(token);
            }
            records.set(token, resolvedProvider);
        }
        else {
            throw staticError('Unexpected provider', provider);
        }
    }
}
function tryResolveToken(token, record, records, parent, notFoundValue, flags) {
    try {
        return resolveToken(token, record, records, parent, notFoundValue, flags);
    }
    catch (e) {
        // ensure that 'e' is of type Error.
        if (!(e instanceof Error)) {
            e = new Error(e);
        }
        const path = e[NG_TEMP_TOKEN_PATH] = e[NG_TEMP_TOKEN_PATH] || [];
        path.unshift(token);
        if (record && record.value == CIRCULAR) {
            // Reset the Circular flag.
            record.value = EMPTY;
        }
        throw e;
    }
}
function resolveToken(token, record, records, parent, notFoundValue, flags) {
    let value;
    if (record && !(flags & 4 /* SkipSelf */)) {
        // If we don't have a record, this implies that we don't own the provider hence don't know how
        // to resolve it.
        value = record.value;
        if (value == CIRCULAR) {
            throw Error(NO_NEW_LINE + 'Circular dependency');
        }
        else if (value === EMPTY) {
            record.value = CIRCULAR;
            let obj = undefined;
            let useNew = record.useNew;
            let fn = record.fn;
            let depRecords = record.deps;
            let deps = EMPTY;
            if (depRecords.length) {
                deps = [];
                for (let i = 0; i < depRecords.length; i++) {
                    const depRecord = depRecords[i];
                    const options = depRecord.options;
                    const childRecord = options & 2 /* CheckSelf */ ? records.get(depRecord.token) : undefined;
                    deps.push(tryResolveToken(
                    // Current Token to resolve
                    depRecord.token, 
                    // A record which describes how to resolve the token.
                    // If undefined, this means we don't have such a record
                    childRecord, 
                    // Other records we know about.
                    records, 
                    // If we don't know how to resolve dependency and we should not check parent for it,
                    // than pass in Null injector.
                    !childRecord && !(options & 4 /* CheckParent */) ? NULL_INJECTOR : parent, options & 1 /* Optional */ ? null : Injector.THROW_IF_NOT_FOUND, 0 /* Default */));
                }
            }
            record.value = value = useNew ? new fn(...deps) : fn.apply(obj, deps);
        }
    }
    else if (!(flags & 2 /* Self */)) {
        value = parent.get(token, notFoundValue, 0 /* Default */);
    }
    return value;
}
function computeDeps(provider) {
    let deps = EMPTY;
    const providerDeps = provider.deps;
    if (providerDeps && providerDeps.length) {
        deps = [];
        for (let i = 0; i < providerDeps.length; i++) {
            let options = 6 /* Default */;
            let token = resolveForwardRef(providerDeps[i]);
            if (token instanceof Array) {
                for (let j = 0, annotations = token; j < annotations.length; j++) {
                    const annotation = annotations[j];
                    if (annotation instanceof Optional || annotation == Optional) {
                        options = options | 1 /* Optional */;
                    }
                    else if (annotation instanceof SkipSelf || annotation == SkipSelf) {
                        options = options & ~2 /* CheckSelf */;
                    }
                    else if (annotation instanceof Self || annotation == Self) {
                        options = options & ~4 /* CheckParent */;
                    }
                    else if (annotation instanceof Inject) {
                        token = annotation.token;
                    }
                    else {
                        token = resolveForwardRef(annotation);
                    }
                }
            }
            deps.push({ token, options });
        }
    }
    else if (provider.useExisting) {
        const token = resolveForwardRef(provider.useExisting);
        deps = [{ token, options: 6 /* Default */ }];
    }
    else if (!providerDeps && !(USE_VALUE in provider)) {
        // useValue & useExisting are the only ones which are exempt from deps all others need it.
        throw staticError('\'deps\' required', provider);
    }
    return deps;
}
function formatError(text, obj, source = null) {
    text = text && text.charAt(0) === '\n' && text.charAt(1) == NO_NEW_LINE ? text.substr(2) : text;
    let context = stringify(obj);
    if (obj instanceof Array) {
        context = obj.map(stringify).join(' -> ');
    }
    else if (typeof obj === 'object') {
        let parts = [];
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                let value = obj[key];
                parts.push(key + ':' + (typeof value === 'string' ? JSON.stringify(value) : stringify(value)));
            }
        }
        context = `{${parts.join(', ')}}`;
    }
    return `StaticInjectorError${source ? '(' + source + ')' : ''}[${context}]: ${text.replace(NEW_LINE, '\n  ')}`;
}
function staticError(text, obj) {
    return new Error(formatError(text, obj));
}
function getClosureSafeProperty(objWithPropertyToExtract) {
    for (let key in objWithPropertyToExtract) {
        if (objWithPropertyToExtract[key] === GET_PROPERTY_NAME) {
            return key;
        }
    }
    throw Error('!prop');
}
/**
 * Current injector value used by `inject`.
 * - `undefined`: it is an error to call `inject`
 * - `null`: `inject` can be called but there is no injector (limp-mode).
 * - Injector instance: Use the injector for resolution.
 */
let _currentInjector = undefined;
export function setCurrentInjector(injector) {
    const former = _currentInjector;
    _currentInjector = injector;
    return former;
}
export function inject(token, flags = 0 /* Default */) {
    if (_currentInjector === undefined) {
        throw new Error(`inject() must be called from an injection context`);
    }
    else if (_currentInjector === null) {
        const injectableDef = token.ngInjectableDef;
        if (injectableDef && injectableDef.providedIn == 'root') {
            return injectableDef.value === undefined ? injectableDef.value = injectableDef.factory() :
                injectableDef.value;
        }
        if (flags & 8 /* Optional */)
            return null;
        throw new Error(`Injector: NOT_FOUND [${stringify(token)}]`);
    }
    else {
        return _currentInjector.get(token, flags & 8 /* Optional */ ? null : undefined, flags);
    }
}
export function injectArgs(types) {
    const args = [];
    for (let i = 0; i < types.length; i++) {
        const arg = types[i];
        if (Array.isArray(arg)) {
            if (arg.length === 0) {
                throw new Error('Arguments array must have arguments.');
            }
            let type = undefined;
            let flags = 0 /* Default */;
            for (let j = 0; j < arg.length; j++) {
                const meta = arg[j];
                if (meta instanceof Optional || meta.__proto__.ngMetadataName === 'Optional') {
                    flags |= 8 /* Optional */;
                }
                else if (meta instanceof SkipSelf || meta.__proto__.ngMetadataName === 'SkipSelf') {
                    flags |= 4 /* SkipSelf */;
                }
                else if (meta instanceof Self || meta.__proto__.ngMetadataName === 'Self') {
                    flags |= 2 /* Self */;
                }
                else if (meta instanceof Inject) {
                    type = meta.token;
                }
                else {
                    type = meta;
                }
            }
            args.push(inject(type, flags));
        }
        else {
            args.push(inject(arg));
        }
    }
    return args;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5qZWN0b3IuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9pbmplY3Rvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRWxDLE9BQU8sRUFBZ0IsZ0JBQWdCLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDdkQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ2hELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRzVELE1BQU0sQ0FBQyxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUM7QUFDakMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQ3pDLE1BQU0sQ0FBQyxNQUFNLGtCQUFrQixHQUFHLG1CQUFtQixDQUFDO0FBRXREOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLENBQUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxjQUFjLENBQVcsVUFBVSxDQUFDLENBQUM7QUFFakUsTUFBTTtJQUNKLEdBQUcsQ0FBQyxLQUFVLEVBQUUsZ0JBQXFCLG1CQUFtQjtRQUN0RCxJQUFJLGFBQWEsS0FBSyxtQkFBbUIsRUFBRTtZQUN6QyxNQUFNLElBQUksS0FBSyxDQUFDLHNDQUFzQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzVFO1FBQ0QsT0FBTyxhQUFhLENBQUM7SUFDdkIsQ0FBQztDQUNGO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFCRztBQUNILE1BQU07SUF5Qko7Ozs7OztPQU1HO0lBQ0gsTUFBTSxDQUFDLE1BQU0sQ0FDVCxPQUF5RixFQUN6RixNQUFpQjtRQUNu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QUFVLEVBQUU7b0JBQ25GLEtBQUssb0JBQXdCLENBQUM7aUJBQy9CO3FCQUFNLElBQUksSUFBSSxZQUFZLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLGNBQWMsS0FBSyxNQUFNLEVBQUU7b0JBQzNFLEtBQUssZ0JBQW9CLENBQUM7aUJBQzNCO3FCQUFNLElBQUksSUFBSSxZQUFZLE1BQU0sRUFBRTtvQkFDakMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7aUJBQ25CO3FCQUFNO29CQUNMLElBQUksR0FBRyxJQUFJLENBQUM7aUJBQ2I7YUFDRjtZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQ2xDO2FBQU07WUFDTCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ3hCO0tBQ0Y7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7SW5qZWN0YWJsZURlZiwgZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi9kZWZzJztcbmltcG9ydCB7cmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4vZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3QsIE9wdGlvbmFsLCBTZWxmLCBTa2lwU2VsZn0gZnJvbSAnLi9tZXRhZGF0YSc7XG5pbXBvcnQge0NvbnN0cnVjdG9yUHJvdmlkZXIsIEV4aXN0aW5nUHJvdmlkZXIsIEZhY3RvcnlQcm92aWRlciwgU3RhdGljQ2xhc3NQcm92aWRlciwgU3RhdGljUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vcHJvdmlkZXInO1xuXG5leHBvcnQgY29uc3QgU09VUkNFID0gJ19fc291cmNlJztcbmNvbnN0IF9USFJPV19JRl9OT1RfRk9VTkQgPSBuZXcgT2JqZWN0KCk7XG5leHBvcnQgY29uc3QgVEhST1dfSUZfTk9UX0ZPVU5EID0gX1RIUk9XX0lGX05PVF9GT1VORDtcblxuLyoqXG4gKiBBbiBJbmplY3Rpb25Ub2tlbiB0aGF0IGdldHMgdGhlIGN1cnJlbnQgYEluamVjdG9yYCBmb3IgYGNyZWF0ZUluamVjdG9yKClgLXN0eWxlIGluamVjdG9ycy5cbiAqXG4gKiBSZXF1ZXN0aW5nIHRoaXMgdG9rZW4gaW5zdGVhZCBvZiBgSW5qZWN0b3JgIGFsbG93cyBgU3RhdGljSW5qZWN0b3JgIHRvIGJlIHRyZWUtc2hha2VuIGZyb20gYVxuICogcHJvamVjdC5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBjb25zdCBJTkpFQ1RPUiA9IG5ldyBJbmplY3Rpb25Ub2tlbjxJbmplY3Rvcj4oJ0lOSkVDVE9SJyk7XG5cbmV4cG9ydCBjbGFzcyBOdWxsSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlOiBhbnkgPSBfVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgICBpZiAobm90Rm91bmRWYWx1ZSA9PT0gX1RIUk9XX0lGX05PVF9GT1VORCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBOdWxsSW5qZWN0b3JFcnJvcjogTm8gcHJvdmlkZXIgZm9yICR7c3RyaW5naWZ5KHRva2VuKX0hYCk7XG4gICAgfVxuICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogQHVzYWdlTm90ZXNcbiAqIGBgYFxuICogY29uc3QgaW5qZWN0b3I6IEluamVjdG9yID0gLi4uO1xuICogaW5qZWN0b3IuZ2V0KC4uLik7XG4gKiBgYGBcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBDb25jcmV0ZSBpbmplY3RvcnMgaW1wbGVtZW50IHRoaXMgaW50ZXJmYWNlLlxuICpcbiAqIEZvciBtb3JlIGRldGFpbHMsIHNlZSB0aGUge0BsaW5rRG9jcyBndWlkZS9kZXBlbmRlbmN5LWluamVjdGlvbiBcIkRlcGVuZGVuY3kgSW5qZWN0aW9uIEd1aWRlXCJ9LlxuICpcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J0luamVjdG9yJ31cbiAqXG4gKiBgSW5qZWN0b3JgIHJldHVybnMgaXRzZWxmIHdoZW4gZ2l2ZW4gYEluamVjdG9yYCBhcyBhIHRva2VuOlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J2luamVjdEluamVjdG9yJ31cbiAqXG4gKlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgSW5qZWN0b3Ige1xuICBzdGF0aWMgVEhST1dfSUZfTk9UX0ZPVU5EID0gX1RIUk9XX0lGX05PVF9GT1VORDtcbiAgc3RhdGljIE5VTEw6IEluamVjdG9yID0gbmV3IE51bGxJbmplY3RvcigpO1xuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYW4gaW5zdGFuY2UgZnJvbSB0aGUgaW5qZWN0b3IgYmFzZWQgb24gdGhlIHByb3ZpZGVkIHRva2VuLlxuICAgKiBJZiBub3QgZm91bmQ6XG4gICAqIC0gVGhyb3dzIGFuIGVycm9yIGlmIG5vIGBub3RGb3VuZFZhbHVlYCB0aGF0IGlzIG5vdCBlcXVhbCB0b1xuICAgKiBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQgaXMgZ2l2ZW5cbiAgICogLSBSZXR1cm5zIHRoZSBgbm90Rm91bmRWYWx1ZWAgb3RoZXJ3aXNlXG4gICAqL1xuICBhYnN0cmFjdCBnZXQ8VD4odG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVDtcbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIGZyb20gdjQuMC4wIHVzZSBUeXBlPFQ+IG9yIEluamVjdGlvblRva2VuPFQ+XG4gICAqIEBzdXBwcmVzcyB7ZHVwbGljYXRlfVxuICAgKi9cbiAgYWJzdHJhY3QgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG5cbiAgLyoqXG4gICAqIEBkZXByZWNhdGVkIGZyb20gdjUgdXNlIHRoZSBuZXcgc2lnbmF0dXJlIEluamVjdG9yLmNyZWF0ZShvcHRpb25zKVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZShwcm92aWRlcnM6IFN0YXRpY1Byb3ZpZGVyW10sIHBhcmVudD86IEluamVjdG9yKTogSW5qZWN0b3I7XG5cbiAgc3RhdGljIGNyZWF0ZShvcHRpb25zOiB7cHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ/OiBJbmplY3RvciwgbmFtZT86IHN0cmluZ30pOiBJbmplY3RvcjtcblxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IEluamVjdG9yIHdoaWNoIGlzIGNvbmZpZ3VyZSB1c2luZyBgU3RhdGljUHJvdmlkZXJgcy5cbiAgICpcbiAgICogIyMjIEV4YW1wbGVcbiAgICpcbiAgICoge0BleGFtcGxlIGNvcmUvZGkvdHMvcHJvdmlkZXJfc3BlYy50cyByZWdpb249J0NvbnN0cnVjdG9yUHJvdmlkZXInfVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZShcbiAgICAgIG9wdGlvbnM6IFN0YXRpY1Byb3ZpZGVyW118e3Byb3ZpZGVyczogU3RhdGljUHJvdmlkZXJbXSwgcGFyZW50PzogSW5qZWN0b3IsIG5hbWU/OiBzdHJpbmd9LFxuICAgICAgcGFyZW50PzogSW5qZWN0b3IpOiBJbmplY3RvciB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICAgIHJldHVybiBuZXcgU3RhdGljSW5qZWN0b3Iob3B0aW9ucywgcGFyZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG5ldyBTdGF0aWNJbmplY3RvcihvcHRpb25zLnByb3ZpZGVycywgb3B0aW9ucy5wYXJlbnQsIG9wdGlvbnMubmFtZSB8fCBudWxsKTtcbiAgICB9XG4gIH1cblxuICBzdGF0aWMgbmdJbmplY3RhYmxlRGVmID0gZGVmaW5lSW5qZWN0YWJsZSh7XG4gICAgcHJvdmlkZWRJbjogJ2FueScgYXMgYW55LFxuICAgIGZhY3Rvcnk6ICgpID0+IGluamVjdChJTkpFQ1RPUiksXG4gIH0pO1xufVxuXG5cblxuY29uc3QgSURFTlQgPSBmdW5jdGlvbjxUPih2YWx1ZTogVCk6IFQge1xuICByZXR1cm4gdmFsdWU7XG59O1xuY29uc3QgRU1QVFkgPSA8YW55W10+W107XG5jb25zdCBDSVJDVUxBUiA9IElERU5UO1xuY29uc3QgTVVMVElfUFJPVklERVJfRk4gPSBmdW5jdGlvbigpOiBhbnlbXSB7XG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xufTtcbmNvbnN0IEdFVF9QUk9QRVJUWV9OQU1FID0ge30gYXMgYW55O1xuZXhwb3J0IGNvbnN0IFVTRV9WQUxVRSA9XG4gICAgZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxWYWx1ZVByb3ZpZGVyPih7cHJvdmlkZTogU3RyaW5nLCB1c2VWYWx1ZTogR0VUX1BST1BFUlRZX05BTUV9KTtcbmNvbnN0IE5HX1RPS0VOX1BBVEggPSAnbmdUb2tlblBhdGgnO1xuY29uc3QgTkdfVEVNUF9UT0tFTl9QQVRIID0gJ25nVGVtcFRva2VuUGF0aCc7XG5jb25zdCBlbnVtIE9wdGlvbkZsYWdzIHtcbiAgT3B0aW9uYWwgPSAxIDw8IDAsXG4gIENoZWNrU2VsZiA9IDEgPDwgMSxcbiAgQ2hlY2tQYXJlbnQgPSAxIDw8IDIsXG4gIERlZmF1bHQgPSBDaGVja1NlbGYgfCBDaGVja1BhcmVudFxufVxuY29uc3QgTlVMTF9JTkpFQ1RPUiA9IEluamVjdG9yLk5VTEw7XG5jb25zdCBORVdfTElORSA9IC9cXG4vZ207XG5jb25zdCBOT19ORVdfTElORSA9ICfJtSc7XG5cbmV4cG9ydCBjbGFzcyBTdGF0aWNJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgcmVhZG9ubHkgcGFyZW50OiBJbmplY3RvcjtcbiAgcmVhZG9ubHkgc291cmNlOiBzdHJpbmd8bnVsbDtcblxuICBwcml2YXRlIF9yZWNvcmRzOiBNYXA8YW55LCBSZWNvcmQ+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJvdmlkZXJzOiBTdGF0aWNQcm92aWRlcltdLCBwYXJlbnQ6IEluamVjdG9yID0gTlVMTF9JTkpFQ1RPUiwgc291cmNlOiBzdHJpbmd8bnVsbCA9IG51bGwpIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICBjb25zdCByZWNvcmRzID0gdGhpcy5fcmVjb3JkcyA9IG5ldyBNYXA8YW55LCBSZWNvcmQ+KCk7XG4gICAgcmVjb3Jkcy5zZXQoXG4gICAgICAgIEluamVjdG9yLCA8UmVjb3JkPnt0b2tlbjogSW5qZWN0b3IsIGZuOiBJREVOVCwgZGVwczogRU1QVFksIHZhbHVlOiB0aGlzLCB1c2VOZXc6IGZhbHNlfSk7XG4gICAgcmVjb3Jkcy5zZXQoXG4gICAgICAgIElOSkVDVE9SLCA8UmVjb3JkPnt0b2tlbjogSU5KRUNUT1IsIGZuOiBJREVOVCwgZGVwczogRU1QVFksIHZhbHVlOiB0aGlzLCB1c2VOZXc6IGZhbHNlfSk7XG4gICAgcmVjdXJzaXZlbHlQcm9jZXNzUHJvdmlkZXJzKHJlY29yZHMsIHByb3ZpZGVycyk7XG4gIH1cblxuICBnZXQ8VD4odG9rZW46IFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIG5vdEZvdW5kVmFsdWU/OiBULCBmbGFncz86IEluamVjdEZsYWdzKTogVDtcbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnk7XG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55LCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogYW55IHtcbiAgICBjb25zdCByZWNvcmQgPSB0aGlzLl9yZWNvcmRzLmdldCh0b2tlbik7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiB0cnlSZXNvbHZlVG9rZW4odG9rZW4sIHJlY29yZCwgdGhpcy5fcmVjb3JkcywgdGhpcy5wYXJlbnQsIG5vdEZvdW5kVmFsdWUsIGZsYWdzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBjb25zdCB0b2tlblBhdGg6IGFueVtdID0gZVtOR19URU1QX1RPS0VOX1BBVEhdO1xuICAgICAgaWYgKHRva2VuW1NPVVJDRV0pIHtcbiAgICAgICAgdG9rZW5QYXRoLnVuc2hpZnQodG9rZW5bU09VUkNFXSk7XG4gICAgICB9XG4gICAgICBlLm1lc3NhZ2UgPSBmb3JtYXRFcnJvcignXFxuJyArIGUubWVzc2FnZSwgdG9rZW5QYXRoLCB0aGlzLnNvdXJjZSk7XG4gICAgICBlW05HX1RPS0VOX1BBVEhdID0gdG9rZW5QYXRoO1xuICAgICAgZVtOR19URU1QX1RPS0VOX1BBVEhdID0gbnVsbDtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICB9XG5cbiAgdG9TdHJpbmcoKSB7XG4gICAgY29uc3QgdG9rZW5zID0gPHN0cmluZ1tdPltdLCByZWNvcmRzID0gdGhpcy5fcmVjb3JkcztcbiAgICByZWNvcmRzLmZvckVhY2goKHYsIHRva2VuKSA9PiB0b2tlbnMucHVzaChzdHJpbmdpZnkodG9rZW4pKSk7XG4gICAgcmV0dXJuIGBTdGF0aWNJbmplY3Rvclske3Rva2Vucy5qb2luKCcsICcpfV1gO1xuICB9XG59XG5cbnR5cGUgU3VwcG9ydGVkUHJvdmlkZXIgPVxuICAgIFZhbHVlUHJvdmlkZXIgfCBFeGlzdGluZ1Byb3ZpZGVyIHwgU3RhdGljQ2xhc3NQcm92aWRlciB8IENvbnN0cnVjdG9yUHJvdmlkZXIgfCBGYWN0b3J5UHJvdmlkZXI7XG5cbmludGVyZmFjZSBSZWNvcmQge1xuICBmbjogRnVuY3Rpb247XG4gIHVzZU5ldzogYm9vbGVhbjtcbiAgZGVwczogRGVwZW5kZW5jeVJlY29yZFtdO1xuICB2YWx1ZTogYW55O1xufVxuXG5pbnRlcmZhY2UgRGVwZW5kZW5jeVJlY29yZCB7XG4gIHRva2VuOiBhbnk7XG4gIG9wdGlvbnM6IG51bWJlcjtcbn1cblxudHlwZSBUb2tlblBhdGggPSBBcnJheTxhbnk+O1xuXG5mdW5jdGlvbiByZXNvbHZlUHJvdmlkZXIocHJvdmlkZXI6IFN1cHBvcnRlZFByb3ZpZGVyKTogUmVjb3JkIHtcbiAgY29uc3QgZGVwcyA9IGNvbXB1dGVEZXBzKHByb3ZpZGVyKTtcbiAgbGV0IGZuOiBGdW5jdGlvbiA9IElERU5UO1xuICBsZXQgdmFsdWU6IGFueSA9IEVNUFRZO1xuICBsZXQgdXNlTmV3OiBib29sZWFuID0gZmFsc2U7XG4gIGxldCBwcm92aWRlID0gcmVzb2x2ZUZvcndhcmRSZWYocHJvdmlkZXIucHJvdmlkZSk7XG4gIGlmIChVU0VfVkFMVUUgaW4gcHJvdmlkZXIpIHtcbiAgICAvLyBXZSBuZWVkIHRvIHVzZSBVU0VfVkFMVUUgaW4gcHJvdmlkZXIgc2luY2UgcHJvdmlkZXIudXNlVmFsdWUgY291bGQgYmUgZGVmaW5lZCBhcyB1bmRlZmluZWQuXG4gICAgdmFsdWUgPSAocHJvdmlkZXIgYXMgVmFsdWVQcm92aWRlcikudXNlVmFsdWU7XG4gIH0gZWxzZSBpZiAoKHByb3ZpZGVyIGFzIEZhY3RvcnlQcm92aWRlcikudXNlRmFjdG9yeSkge1xuICAgIGZuID0gKHByb3ZpZGVyIGFzIEZhY3RvcnlQcm92aWRlcikudXNlRmFjdG9yeTtcbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpIHtcbiAgICAvLyBKdXN0IHVzZSBJREVOVFxuICB9IGVsc2UgaWYgKChwcm92aWRlciBhcyBTdGF0aWNDbGFzc1Byb3ZpZGVyKS51c2VDbGFzcykge1xuICAgIHVzZU5ldyA9IHRydWU7XG4gICAgZm4gPSByZXNvbHZlRm9yd2FyZFJlZigocHJvdmlkZXIgYXMgU3RhdGljQ2xhc3NQcm92aWRlcikudXNlQ2xhc3MpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBwcm92aWRlID09ICdmdW5jdGlvbicpIHtcbiAgICB1c2VOZXcgPSB0cnVlO1xuICAgIGZuID0gcHJvdmlkZTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBzdGF0aWNFcnJvcihcbiAgICAgICAgJ1N0YXRpY1Byb3ZpZGVyIGRvZXMgbm90IGhhdmUgW3VzZVZhbHVlfHVzZUZhY3Rvcnl8dXNlRXhpc3Rpbmd8dXNlQ2xhc3NdIG9yIFtwcm92aWRlXSBpcyBub3QgbmV3YWJsZScsXG4gICAgICAgIHByb3ZpZGVyKTtcbiAgfVxuICByZXR1cm4ge2RlcHMsIGZuLCB1c2VOZXcsIHZhbHVlfTtcbn1cblxuZnVuY3Rpb24gbXVsdGlQcm92aWRlck1peEVycm9yKHRva2VuOiBhbnkpIHtcbiAgcmV0dXJuIHN0YXRpY0Vycm9yKCdDYW5ub3QgbWl4IG11bHRpIHByb3ZpZGVycyBhbmQgcmVndWxhciBwcm92aWRlcnMnLCB0b2tlbik7XG59XG5cbmZ1bmN0aW9uIHJlY3Vyc2l2ZWx5UHJvY2Vzc1Byb3ZpZGVycyhyZWNvcmRzOiBNYXA8YW55LCBSZWNvcmQ+LCBwcm92aWRlcjogU3RhdGljUHJvdmlkZXIpIHtcbiAgaWYgKHByb3ZpZGVyKSB7XG4gICAgcHJvdmlkZXIgPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlcik7XG4gICAgaWYgKHByb3ZpZGVyIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIC8vIGlmIHdlIGhhdmUgYW4gYXJyYXkgcmVjdXJzZSBpbnRvIHRoZSBhcnJheVxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlci5sZW5ndGg7IGkrKykge1xuICAgICAgICByZWN1cnNpdmVseVByb2Nlc3NQcm92aWRlcnMocmVjb3JkcywgcHJvdmlkZXJbaV0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHByb3ZpZGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBGdW5jdGlvbnMgd2VyZSBzdXBwb3J0ZWQgaW4gUmVmbGVjdGl2ZUluamVjdG9yLCBidXQgYXJlIG5vdCBoZXJlLiBGb3Igc2FmZXR5IGdpdmUgdXNlZnVsXG4gICAgICAvLyBlcnJvciBtZXNzYWdlc1xuICAgICAgdGhyb3cgc3RhdGljRXJyb3IoJ0Z1bmN0aW9uL0NsYXNzIG5vdCBzdXBwb3J0ZWQnLCBwcm92aWRlcik7XG4gICAgfSBlbHNlIGlmIChwcm92aWRlciAmJiB0eXBlb2YgcHJvdmlkZXIgPT09ICdvYmplY3QnICYmIHByb3ZpZGVyLnByb3ZpZGUpIHtcbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQgd2UgaGF2ZSB3aGF0IGxvb2tzIGxpa2UgYSBwcm92aWRlcjoge3Byb3ZpZGU6ID8sIC4uLi59XG4gICAgICBsZXQgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZihwcm92aWRlci5wcm92aWRlKTtcbiAgICAgIGNvbnN0IHJlc29sdmVkUHJvdmlkZXIgPSByZXNvbHZlUHJvdmlkZXIocHJvdmlkZXIpO1xuICAgICAgaWYgKHByb3ZpZGVyLm11bHRpID09PSB0cnVlKSB7XG4gICAgICAgIC8vIFRoaXMgaXMgYSBtdWx0aSBwcm92aWRlci5cbiAgICAgICAgbGV0IG11bHRpUHJvdmlkZXI6IFJlY29yZHx1bmRlZmluZWQgPSByZWNvcmRzLmdldCh0b2tlbik7XG4gICAgICAgIGlmIChtdWx0aVByb3ZpZGVyKSB7XG4gICAgICAgICAgaWYgKG11bHRpUHJvdmlkZXIuZm4gIT09IE1VTFRJX1BST1ZJREVSX0ZOKSB7XG4gICAgICAgICAgICB0aHJvdyBtdWx0aVByb3ZpZGVyTWl4RXJyb3IodG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBDcmVhdGUgYSBwbGFjZWhvbGRlciBmYWN0b3J5IHdoaWNoIHdpbGwgbG9vayB1cCB0aGUgY29uc3RpdHVlbnRzIG9mIHRoZSBtdWx0aSBwcm92aWRlci5cbiAgICAgICAgICByZWNvcmRzLnNldCh0b2tlbiwgbXVsdGlQcm92aWRlciA9IDxSZWNvcmQ+e1xuICAgICAgICAgICAgdG9rZW46IHByb3ZpZGVyLnByb3ZpZGUsXG4gICAgICAgICAgICBkZXBzOiBbXSxcbiAgICAgICAgICAgIHVzZU5ldzogZmFsc2UsXG4gICAgICAgICAgICBmbjogTVVMVElfUFJPVklERVJfRk4sXG4gICAgICAgICAgICB2YWx1ZTogRU1QVFlcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyBUcmVhdCB0aGUgcHJvdmlkZXIgYXMgdGhlIHRva2VuLlxuICAgICAgICB0b2tlbiA9IHByb3ZpZGVyO1xuICAgICAgICBtdWx0aVByb3ZpZGVyLmRlcHMucHVzaCh7dG9rZW4sIG9wdGlvbnM6IE9wdGlvbkZsYWdzLkRlZmF1bHR9KTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlY29yZCA9IHJlY29yZHMuZ2V0KHRva2VuKTtcbiAgICAgIGlmIChyZWNvcmQgJiYgcmVjb3JkLmZuID09IE1VTFRJX1BST1ZJREVSX0ZOKSB7XG4gICAgICAgIHRocm93IG11bHRpUHJvdmlkZXJNaXhFcnJvcih0b2tlbik7XG4gICAgICB9XG4gICAgICByZWNvcmRzLnNldCh0b2tlbiwgcmVzb2x2ZWRQcm92aWRlcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHN0YXRpY0Vycm9yKCdVbmV4cGVjdGVkIHByb3ZpZGVyJywgcHJvdmlkZXIpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB0cnlSZXNvbHZlVG9rZW4oXG4gICAgdG9rZW46IGFueSwgcmVjb3JkOiBSZWNvcmQgfCB1bmRlZmluZWQsIHJlY29yZHM6IE1hcDxhbnksIFJlY29yZD4sIHBhcmVudDogSW5qZWN0b3IsXG4gICAgbm90Rm91bmRWYWx1ZTogYW55LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBhbnkge1xuICB0cnkge1xuICAgIHJldHVybiByZXNvbHZlVG9rZW4odG9rZW4sIHJlY29yZCwgcmVjb3JkcywgcGFyZW50LCBub3RGb3VuZFZhbHVlLCBmbGFncyk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBlbnN1cmUgdGhhdCAnZScgaXMgb2YgdHlwZSBFcnJvci5cbiAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpKSB7XG4gICAgICBlID0gbmV3IEVycm9yKGUpO1xuICAgIH1cbiAgICBjb25zdCBwYXRoOiBhbnlbXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXSA9IGVbTkdfVEVNUF9UT0tFTl9QQVRIXSB8fCBbXTtcbiAgICBwYXRoLnVuc2hpZnQodG9rZW4pO1xuICAgIGlmIChyZWNvcmQgJiYgcmVjb3JkLnZhbHVlID09IENJUkNVTEFSKSB7XG4gICAgICAvLyBSZXNldCB0aGUgQ2lyY3VsYXIgZmxhZy5cbiAgICAgIHJlY29yZC52YWx1ZSA9IEVNUFRZO1xuICAgIH1cbiAgICB0aHJvdyBlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlc29sdmVUb2tlbihcbiAgICB0b2tlbjogYW55LCByZWNvcmQ6IFJlY29yZCB8IHVuZGVmaW5lZCwgcmVjb3JkczogTWFwPGFueSwgUmVjb3JkPiwgcGFyZW50OiBJbmplY3RvcixcbiAgICBub3RGb3VuZFZhbHVlOiBhbnksIGZsYWdzOiBJbmplY3RGbGFncyk6IGFueSB7XG4gIGxldCB2YWx1ZTtcbiAgaWYgKHJlY29yZCAmJiAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYpKSB7XG4gICAgLy8gSWYgd2UgZG9uJ3QgaGF2ZSBhIHJlY29yZCwgdGhpcyBpbXBsaWVzIHRoYXQgd2UgZG9uJ3Qgb3duIHRoZSBwcm92aWRlciBoZW5jZSBkb24ndCBrbm93IGhvd1xuICAgIC8vIHRvIHJlc29sdmUgaXQuXG4gICAgdmFsdWUgPSByZWNvcmQudmFsdWU7XG4gICAgaWYgKHZhbHVlID09IENJUkNVTEFSKSB7XG4gICAgICB0aHJvdyBFcnJvcihOT19ORVdfTElORSArICdDaXJjdWxhciBkZXBlbmRlbmN5Jyk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gRU1QVFkpIHtcbiAgICAgIHJlY29yZC52YWx1ZSA9IENJUkNVTEFSO1xuICAgICAgbGV0IG9iaiA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCB1c2VOZXcgPSByZWNvcmQudXNlTmV3O1xuICAgICAgbGV0IGZuID0gcmVjb3JkLmZuO1xuICAgICAgbGV0IGRlcFJlY29yZHMgPSByZWNvcmQuZGVwcztcbiAgICAgIGxldCBkZXBzID0gRU1QVFk7XG4gICAgICBpZiAoZGVwUmVjb3Jkcy5sZW5ndGgpIHtcbiAgICAgICAgZGVwcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlcFJlY29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBkZXBSZWNvcmQ6IERlcGVuZGVuY3lSZWNvcmQgPSBkZXBSZWNvcmRzW2ldO1xuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBkZXBSZWNvcmQub3B0aW9ucztcbiAgICAgICAgICBjb25zdCBjaGlsZFJlY29yZCA9XG4gICAgICAgICAgICAgIG9wdGlvbnMgJiBPcHRpb25GbGFncy5DaGVja1NlbGYgPyByZWNvcmRzLmdldChkZXBSZWNvcmQudG9rZW4pIDogdW5kZWZpbmVkO1xuICAgICAgICAgIGRlcHMucHVzaCh0cnlSZXNvbHZlVG9rZW4oXG4gICAgICAgICAgICAgIC8vIEN1cnJlbnQgVG9rZW4gdG8gcmVzb2x2ZVxuICAgICAgICAgICAgICBkZXBSZWNvcmQudG9rZW4sXG4gICAgICAgICAgICAgIC8vIEEgcmVjb3JkIHdoaWNoIGRlc2NyaWJlcyBob3cgdG8gcmVzb2x2ZSB0aGUgdG9rZW4uXG4gICAgICAgICAgICAgIC8vIElmIHVuZGVmaW5lZCwgdGhpcyBtZWFucyB3ZSBkb24ndCBoYXZlIHN1Y2ggYSByZWNvcmRcbiAgICAgICAgICAgICAgY2hpbGRSZWNvcmQsXG4gICAgICAgICAgICAgIC8vIE90aGVyIHJlY29yZHMgd2Uga25vdyBhYm91dC5cbiAgICAgICAgICAgICAgcmVjb3JkcyxcbiAgICAgICAgICAgICAgLy8gSWYgd2UgZG9uJ3Qga25vdyBob3cgdG8gcmVzb2x2ZSBkZXBlbmRlbmN5IGFuZCB3ZSBzaG91bGQgbm90IGNoZWNrIHBhcmVudCBmb3IgaXQsXG4gICAgICAgICAgICAgIC8vIHRoYW4gcGFzcyBpbiBOdWxsIGluamVjdG9yLlxuICAgICAgICAgICAgICAhY2hpbGRSZWNvcmQgJiYgIShvcHRpb25zICYgT3B0aW9uRmxhZ3MuQ2hlY2tQYXJlbnQpID8gTlVMTF9JTkpFQ1RPUiA6IHBhcmVudCxcbiAgICAgICAgICAgICAgb3B0aW9ucyAmIE9wdGlvbkZsYWdzLk9wdGlvbmFsID8gbnVsbCA6IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCxcbiAgICAgICAgICAgICAgSW5qZWN0RmxhZ3MuRGVmYXVsdCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZWNvcmQudmFsdWUgPSB2YWx1ZSA9IHVzZU5ldyA/IG5ldyAoZm4gYXMgYW55KSguLi5kZXBzKSA6IGZuLmFwcGx5KG9iaiwgZGVwcyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKCEoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmKSkge1xuICAgIHZhbHVlID0gcGFyZW50LmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgSW5qZWN0RmxhZ3MuRGVmYXVsdCk7XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG5cbmZ1bmN0aW9uIGNvbXB1dGVEZXBzKHByb3ZpZGVyOiBTdGF0aWNQcm92aWRlcik6IERlcGVuZGVuY3lSZWNvcmRbXSB7XG4gIGxldCBkZXBzOiBEZXBlbmRlbmN5UmVjb3JkW10gPSBFTVBUWTtcbiAgY29uc3QgcHJvdmlkZXJEZXBzOiBhbnlbXSA9XG4gICAgICAocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlciAmIFN0YXRpY0NsYXNzUHJvdmlkZXIgJiBDb25zdHJ1Y3RvclByb3ZpZGVyKS5kZXBzO1xuICBpZiAocHJvdmlkZXJEZXBzICYmIHByb3ZpZGVyRGVwcy5sZW5ndGgpIHtcbiAgICBkZXBzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm92aWRlckRlcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBvcHRpb25zID0gT3B0aW9uRmxhZ3MuRGVmYXVsdDtcbiAgICAgIGxldCB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyRGVwc1tpXSk7XG4gICAgICBpZiAodG9rZW4gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICBmb3IgKGxldCBqID0gMCwgYW5ub3RhdGlvbnMgPSB0b2tlbjsgaiA8IGFubm90YXRpb25zLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgY29uc3QgYW5ub3RhdGlvbiA9IGFubm90YXRpb25zW2pdO1xuICAgICAgICAgIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgT3B0aW9uYWwgfHwgYW5ub3RhdGlvbiA9PSBPcHRpb25hbCkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfCBPcHRpb25GbGFncy5PcHRpb25hbDtcbiAgICAgICAgICB9IGVsc2UgaWYgKGFubm90YXRpb24gaW5zdGFuY2VvZiBTa2lwU2VsZiB8fCBhbm5vdGF0aW9uID09IFNraXBTZWxmKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyAmIH5PcHRpb25GbGFncy5DaGVja1NlbGY7XG4gICAgICAgICAgfSBlbHNlIGlmIChhbm5vdGF0aW9uIGluc3RhbmNlb2YgU2VsZiB8fCBhbm5vdGF0aW9uID09IFNlbGYpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zICYgfk9wdGlvbkZsYWdzLkNoZWNrUGFyZW50O1xuICAgICAgICAgIH0gZWxzZSBpZiAoYW5ub3RhdGlvbiBpbnN0YW5jZW9mIEluamVjdCkge1xuICAgICAgICAgICAgdG9rZW4gPSAoYW5ub3RhdGlvbiBhcyBJbmplY3QpLnRva2VuO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKGFubm90YXRpb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZGVwcy5wdXNoKHt0b2tlbiwgb3B0aW9uc30pO1xuICAgIH1cbiAgfSBlbHNlIGlmICgocHJvdmlkZXIgYXMgRXhpc3RpbmdQcm92aWRlcikudXNlRXhpc3RpbmcpIHtcbiAgICBjb25zdCB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKChwcm92aWRlciBhcyBFeGlzdGluZ1Byb3ZpZGVyKS51c2VFeGlzdGluZyk7XG4gICAgZGVwcyA9IFt7dG9rZW4sIG9wdGlvbnM6IE9wdGlvbkZsYWdzLkRlZmF1bHR9XTtcbiAgfSBlbHNlIGlmICghcHJvdmlkZXJEZXBzICYmICEoVVNFX1ZBTFVFIGluIHByb3ZpZGVyKSkge1xuICAgIC8vIHVzZVZhbHVlICYgdXNlRXhpc3RpbmcgYXJlIHRoZSBvbmx5IG9uZXMgd2hpY2ggYXJlIGV4ZW1wdCBmcm9tIGRlcHMgYWxsIG90aGVycyBuZWVkIGl0LlxuICAgIHRocm93IHN0YXRpY0Vycm9yKCdcXCdkZXBzXFwnIHJlcXVpcmVkJywgcHJvdmlkZXIpO1xuICB9XG4gIHJldHVybiBkZXBzO1xufVxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih0ZXh0OiBzdHJpbmcsIG9iajogYW55LCBzb3VyY2U6IHN0cmluZyB8IG51bGwgPSBudWxsKTogc3RyaW5nIHtcbiAgdGV4dCA9IHRleHQgJiYgdGV4dC5jaGFyQXQoMCkgPT09ICdcXG4nICYmIHRleHQuY2hhckF0KDEpID09IE5PX05FV19MSU5FID8gdGV4dC5zdWJzdHIoMikgOiB0ZXh0O1xuICBsZXQgY29udGV4dCA9IHN0cmluZ2lmeShvYmopO1xuICBpZiAob2JqIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICBjb250ZXh0ID0gb2JqLm1hcChzdHJpbmdpZnkpLmpvaW4oJyAtPiAnKTtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0Jykge1xuICAgIGxldCBwYXJ0cyA9IDxzdHJpbmdbXT5bXTtcbiAgICBmb3IgKGxldCBrZXkgaW4gb2JqKSB7XG4gICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gb2JqW2tleV07XG4gICAgICAgIHBhcnRzLnB1c2goXG4gICAgICAgICAgICBrZXkgKyAnOicgKyAodHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IEpTT04uc3RyaW5naWZ5KHZhbHVlKSA6IHN0cmluZ2lmeSh2YWx1ZSkpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29udGV4dCA9IGB7JHtwYXJ0cy5qb2luKCcsICcpfX1gO1xuICB9XG4gIHJldHVybiBgU3RhdGljSW5qZWN0b3JFcnJvciR7c291cmNlID8gJygnICsgc291cmNlICsgJyknIDogJyd9WyR7Y29udGV4dH1dOiAke3RleHQucmVwbGFjZShORVdfTElORSwgJ1xcbiAgJyl9YDtcbn1cblxuZnVuY3Rpb24gc3RhdGljRXJyb3IodGV4dDogc3RyaW5nLCBvYmo6IGFueSk6IEVycm9yIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihmb3JtYXRFcnJvcih0ZXh0LCBvYmopKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eTxUPihvYmpXaXRoUHJvcGVydHlUb0V4dHJhY3Q6IFQpOiBzdHJpbmcge1xuICBmb3IgKGxldCBrZXkgaW4gb2JqV2l0aFByb3BlcnR5VG9FeHRyYWN0KSB7XG4gICAgaWYgKG9ialdpdGhQcm9wZXJ0eVRvRXh0cmFjdFtrZXldID09PSBHRVRfUFJPUEVSVFlfTkFNRSkge1xuICAgICAgcmV0dXJuIGtleTtcbiAgICB9XG4gIH1cbiAgdGhyb3cgRXJyb3IoJyFwcm9wJyk7XG59XG5cbi8qKlxuICogSW5qZWN0aW9uIGZsYWdzIGZvciBESS5cbiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gSW5qZWN0RmxhZ3Mge1xuICBEZWZhdWx0ID0gMGIwMDAwLFxuXG4gIC8qKlxuICAgKiBTcGVjaWZpZXMgdGhhdCBhbiBpbmplY3RvciBzaG91bGQgcmV0cmlldmUgYSBkZXBlbmRlbmN5IGZyb20gYW55IGluamVjdG9yIHVudGlsIHJlYWNoaW5nIHRoZVxuICAgKiBob3N0IGVsZW1lbnQgb2YgdGhlIGN1cnJlbnQgY29tcG9uZW50LiAoT25seSB1c2VkIHdpdGggRWxlbWVudCBJbmplY3RvcilcbiAgICovXG4gIEhvc3QgPSAwYjAwMDEsXG4gIC8qKiBEb24ndCBkZXNjZW5kIGludG8gYW5jZXN0b3JzIG9mIHRoZSBub2RlIHJlcXVlc3RpbmcgaW5qZWN0aW9uLiAqL1xuICBTZWxmID0gMGIwMDEwLFxuICAvKiogU2tpcCB0aGUgbm9kZSB0aGF0IGlzIHJlcXVlc3RpbmcgaW5qZWN0aW9uLiAqL1xuICBTa2lwU2VsZiA9IDBiMDEwMCxcbiAgLyoqIEluamVjdCBgZGVmYXVsdFZhbHVlYCBpbnN0ZWFkIGlmIHRva2VuIG5vdCBmb3VuZC4gKi9cbiAgT3B0aW9uYWwgPSAwYjEwMDAsXG59XG5cbi8qKlxuICogQ3VycmVudCBpbmplY3RvciB2YWx1ZSB1c2VkIGJ5IGBpbmplY3RgLlxuICogLSBgdW5kZWZpbmVkYDogaXQgaXMgYW4gZXJyb3IgdG8gY2FsbCBgaW5qZWN0YFxuICogLSBgbnVsbGA6IGBpbmplY3RgIGNhbiBiZSBjYWxsZWQgYnV0IHRoZXJlIGlzIG5vIGluamVjdG9yIChsaW1wLW1vZGUpLlxuICogLSBJbmplY3RvciBpbnN0YW5jZTogVXNlIHRoZSBpbmplY3RvciBmb3IgcmVzb2x1dGlvbi5cbiAqL1xubGV0IF9jdXJyZW50SW5qZWN0b3I6IEluamVjdG9yfHVuZGVmaW5lZHxudWxsID0gdW5kZWZpbmVkO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0Q3VycmVudEluamVjdG9yKGluamVjdG9yOiBJbmplY3RvciB8IG51bGwgfCB1bmRlZmluZWQpOiBJbmplY3Rvcnx1bmRlZmluZWR8bnVsbCB7XG4gIGNvbnN0IGZvcm1lciA9IF9jdXJyZW50SW5qZWN0b3I7XG4gIF9jdXJyZW50SW5qZWN0b3IgPSBpbmplY3RvcjtcbiAgcmV0dXJuIGZvcm1lcjtcbn1cblxuLyoqXG4gKiBJbmplY3RzIGEgdG9rZW4gZnJvbSB0aGUgY3VycmVudGx5IGFjdGl2ZSBpbmplY3Rvci5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIG11c3QgYmUgdXNlZCBpbiB0aGUgY29udGV4dCBvZiBhIGZhY3RvcnkgZnVuY3Rpb24gc3VjaCBhcyBvbmUgZGVmaW5lZCBmb3IgYW5cbiAqIGBJbmplY3Rpb25Ub2tlbmAsIGFuZCB3aWxsIHRocm93IGFuIGVycm9yIGlmIG5vdCBjYWxsZWQgZnJvbSBzdWNoIGEgY29udGV4dC4gRm9yIGV4YW1wbGU6XG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvaW5qZWN0b3Jfc3BlYy50cyByZWdpb249J1NoYWtlYWJsZUluamVjdGlvblRva2VuJ31cbiAqXG4gKiBXaXRoaW4gc3VjaCBhIGZhY3RvcnkgZnVuY3Rpb24gYGluamVjdGAgaXMgdXRpbGl6ZWQgdG8gcmVxdWVzdCBpbmplY3Rpb24gb2YgYSBkZXBlbmRlbmN5LCBpbnN0ZWFkXG4gKiBvZiBwcm92aWRpbmcgYW4gYWRkaXRpb25hbCBhcnJheSBvZiBkZXBlbmRlbmNpZXMgYXMgd2FzIGNvbW1vbiB0byBkbyB3aXRoIGB1c2VGYWN0b3J5YCBwcm92aWRlcnMuXG4gKiBgaW5qZWN0YCBpcyBmYXN0ZXIgYW5kIG1vcmUgdHlwZS1zYWZlLlxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzPzogSW5qZWN0RmxhZ3MpOiBUfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVHxudWxsIHtcbiAgaWYgKF9jdXJyZW50SW5qZWN0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgIHRocm93IG5ldyBFcnJvcihgaW5qZWN0KCkgbXVzdCBiZSBjYWxsZWQgZnJvbSBhbiBpbmplY3Rpb24gY29udGV4dGApO1xuICB9IGVsc2UgaWYgKF9jdXJyZW50SW5qZWN0b3IgPT09IG51bGwpIHtcbiAgICBjb25zdCBpbmplY3RhYmxlRGVmOiBJbmplY3RhYmxlRGVmPFQ+ID0gKHRva2VuIGFzIGFueSkubmdJbmplY3RhYmxlRGVmO1xuICAgIGlmIChpbmplY3RhYmxlRGVmICYmIGluamVjdGFibGVEZWYucHJvdmlkZWRJbiA9PSAncm9vdCcpIHtcbiAgICAgIHJldHVybiBpbmplY3RhYmxlRGVmLnZhbHVlID09PSB1bmRlZmluZWQgPyBpbmplY3RhYmxlRGVmLnZhbHVlID0gaW5qZWN0YWJsZURlZi5mYWN0b3J5KCkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdGFibGVEZWYudmFsdWU7XG4gICAgfVxuICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSByZXR1cm4gbnVsbDtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEluamVjdG9yOiBOT1RfRk9VTkQgWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIF9jdXJyZW50SW5qZWN0b3IuZ2V0KHRva2VuLCBmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsID8gbnVsbCA6IHVuZGVmaW5lZCwgZmxhZ3MpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBcmdzKHR5cGVzOiAoVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+fCBhbnlbXSlbXSk6IGFueVtdIHtcbiAgY29uc3QgYXJnczogYW55W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eXBlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGFyZyA9IHR5cGVzW2ldO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcbiAgICAgIGlmIChhcmcubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQXJndW1lbnRzIGFycmF5IG11c3QgaGF2ZSBhcmd1bWVudHMuJyk7XG4gICAgICB9XG4gICAgICBsZXQgdHlwZTogVHlwZTxhbnk+fHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgICAgIGxldCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0O1xuXG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFyZy5sZW5ndGg7IGorKykge1xuICAgICAgICBjb25zdCBtZXRhID0gYXJnW2pdO1xuICAgICAgICBpZiAobWV0YSBpbnN0YW5jZW9mIE9wdGlvbmFsIHx8IG1ldGEuX19wcm90b19fLm5nTWV0YWRhdGFOYW1lID09PSAnT3B0aW9uYWwnKSB7XG4gICAgICAgICAgZmxhZ3MgfD0gSW5qZWN0RmxhZ3MuT3B0aW9uYWw7XG4gICAgICAgIH0gZWxzZSBpZiAobWV0YSBpbnN0YW5jZW9mIFNraXBTZWxmIHx8IG1ldGEuX19wcm90b19fLm5nTWV0YWRhdGFOYW1lID09PSAnU2tpcFNlbGYnKSB7XG4gICAgICAgICAgZmxhZ3MgfD0gSW5qZWN0RmxhZ3MuU2tpcFNlbGY7XG4gICAgICAgIH0gZWxzZSBpZiAobWV0YSBpbnN0YW5jZW9mIFNlbGYgfHwgbWV0YS5fX3Byb3RvX18ubmdNZXRhZGF0YU5hbWUgPT09ICdTZWxmJykge1xuICAgICAgICAgIGZsYWdzIHw9IEluamVjdEZsYWdzLlNlbGY7XG4gICAgICAgIH0gZWxzZSBpZiAobWV0YSBpbnN0YW5jZW9mIEluamVjdCkge1xuICAgICAgICAgIHR5cGUgPSBtZXRhLnRva2VuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHR5cGUgPSBtZXRhO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGFyZ3MucHVzaChpbmplY3QodHlwZSAhLCBmbGFncykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcmdzLnB1c2goaW5qZWN0KGFyZykpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXJncztcbn1cbiJdfQ==