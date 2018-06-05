/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { reflector } from '../reflection/reflection';
import { Type } from '../type';
import { resolveForwardRef } from './forward_ref';
import { InjectionToken } from './injection_token';
import { Inject, Optional, Self, SkipSelf } from './metadata';
import { invalidProviderError, mixingMultiProvidersWithRegularProvidersError, noAnnotationError } from './reflective_errors';
import { ReflectiveKey } from './reflective_key';
/**
 * `Dependency` is used by the framework to extend DI.
 * This is internal to Angular and should not be used directly.
 */
export class ReflectiveDependency {
    constructor(key, optional, visibility) {
        this.key = key;
        this.optional = optional;
        this.visibility = visibility;
    }
    static fromKey(key) {
        return new ReflectiveDependency(key, false, null);
    }
}
const _EMPTY_LIST = [];
export class ResolvedReflectiveProvider_ {
    constructor(key, resolvedFactories, multiProvider) {
        this.key = key;
        this.resolvedFactories = resolvedFactories;
        this.multiProvider = multiProvider;
        this.resolvedFactory = this.resolvedFactories[0];
    }
}
/**
 * An internal resolved representation of a factory function created by resolving {@link
 * Provider}.
 * @experimental
 */
export class ResolvedReflectiveFactory {
    constructor(
    /**
     * Factory function which can return an instance of an object represented by a key.
     */
    factory, 
    /**
     * Arguments (dependencies) to the `factory` function.
     */
    dependencies) {
        this.factory = factory;
        this.dependencies = dependencies;
    }
}
/**
 * Resolve a single provider.
 */
function resolveReflectiveFactory(provider) {
    let factoryFn;
    let resolvedDeps;
    if (provider.useClass) {
        const useClass = resolveForwardRef(provider.useClass);
        factoryFn = reflector.factory(useClass);
        resolvedDeps = _dependenciesFor(useClass);
    }
    else if (provider.useExisting) {
        factoryFn = (aliasInstance) => aliasInstance;
        resolvedDeps = [ReflectiveDependency.fromKey(ReflectiveKey.get(provider.useExisting))];
    }
    else if (provider.useFactory) {
        factoryFn = provider.useFactory;
        resolvedDeps = constructDependencies(provider.useFactory, provider.deps);
    }
    else {
        factoryFn = () => provider.useValue;
        resolvedDeps = _EMPTY_LIST;
    }
    return new ResolvedReflectiveFactory(factoryFn, resolvedDeps);
}
/**
 * Converts the {@link Provider} into {@link ResolvedProvider}.
 *
 * {@link Injector} internally only uses {@link ResolvedProvider}, {@link Provider} contains
 * convenience provider syntax.
 */
function resolveReflectiveProvider(provider) {
    return new ResolvedReflectiveProvider_(ReflectiveKey.get(provider.provide), [resolveReflectiveFactory(provider)], provider.multi || false);
}
/**
 * Resolve a list of Providers.
 */
export function resolveReflectiveProviders(providers) {
    const normalized = _normalizeProviders(providers, []);
    const resolved = normalized.map(resolveReflectiveProvider);
    const resolvedProviderMap = mergeResolvedReflectiveProviders(resolved, new Map());
    return Array.from(resolvedProviderMap.values());
}
/**
 * Merges a list of ResolvedProviders into a list where
 * each key is contained exactly once and multi providers
 * have been merged.
 */
export function mergeResolvedReflectiveProviders(providers, normalizedProvidersMap) {
    for (let i = 0; i < providers.length; i++) {
        const provider = providers[i];
        const existing = normalizedProvidersMap.get(provider.key.id);
        if (existing) {
            if (provider.multiProvider !== existing.multiProvider) {
                throw mixingMultiProvidersWithRegularProvidersError(existing, provider);
            }
            if (provider.multiProvider) {
                for (let j = 0; j < provider.resolvedFactories.length; j++) {
                    existing.resolvedFactories.push(provider.resolvedFactories[j]);
                }
            }
            else {
                normalizedProvidersMap.set(provider.key.id, provider);
            }
        }
        else {
            let resolvedProvider;
            if (provider.multiProvider) {
                resolvedProvider = new ResolvedReflectiveProvider_(provider.key, provider.resolvedFactories.slice(), provider.multiProvider);
            }
            else {
                resolvedProvider = provider;
            }
            normalizedProvidersMap.set(provider.key.id, resolvedProvider);
        }
    }
    return normalizedProvidersMap;
}
function _normalizeProviders(providers, res) {
    providers.forEach(b => {
        if (b instanceof Type) {
            res.push({ provide: b, useClass: b });
        }
        else if (b && typeof b == 'object' && b.provide !== undefined) {
            res.push(b);
        }
        else if (b instanceof Array) {
            _normalizeProviders(b, res);
        }
        else {
            throw invalidProviderError(b);
        }
    });
    return res;
}
export function constructDependencies(typeOrFunc, dependencies) {
    if (!dependencies) {
        return _dependenciesFor(typeOrFunc);
    }
    else {
        const params = dependencies.map(t => [t]);
        return dependencies.map(t => _extractToken(typeOrFunc, t, params));
    }
}
function _dependenciesFor(typeOrFunc) {
    const params = reflector.parameters(typeOrFunc);
    if (!params)
        return [];
    if (params.some(p => p == null)) {
        throw noAnnotationError(typeOrFunc, params);
    }
    return params.map(p => _extractToken(typeOrFunc, p, params));
}
function _extractToken(typeOrFunc, metadata, params) {
    let token = null;
    let optional = false;
    if (!Array.isArray(metadata)) {
        if (metadata instanceof Inject) {
            return _createDependency(metadata.token, optional, null);
        }
        else {
            return _createDependency(metadata, optional, null);
        }
    }
    let visibility = null;
    for (let i = 0; i < metadata.length; ++i) {
        const paramMetadata = metadata[i];
        if (paramMetadata instanceof Type) {
            token = paramMetadata;
        }
        else if (paramMetadata instanceof Inject) {
            token = paramMetadata.token;
        }
        else if (paramMetadata instanceof Optional) {
            optional = true;
        }
        else if (paramMetadata instanceof Self || paramMetadata instanceof SkipSelf) {
            visibility = paramMetadata;
        }
        else if (paramMetadata instanceof InjectionToken) {
            token = paramMetadata;
        }
    }
    token = resolveForwardRef(token);
    if (token != null) {
        return _createDependency(token, optional, visibility);
    }
    else {
        throw noAnnotationError(typeOrFunc, params);
    }
}
function _createDependency(token, optional, visibility) {
    return new ReflectiveDependency(ReflectiveKey.get(token), optional, visibility);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVmbGVjdGl2ZV9wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RpL3JlZmxlY3RpdmVfcHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ25ELE9BQU8sRUFBQyxJQUFJLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFN0IsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ2hELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBRTVELE9BQU8sRUFBQyxvQkFBb0IsRUFBRSw2Q0FBNkMsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzNILE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQU0vQzs7O0dBR0c7QUFDSCxNQUFNO0lBQ0osWUFDVyxHQUFrQixFQUFTLFFBQWlCLEVBQVMsVUFBOEI7UUFBbkYsUUFBRyxHQUFILEdBQUcsQ0FBZTtRQUFTLGFBQVEsR0FBUixRQUFRLENBQVM7UUFBUyxlQUFVLEdBQVYsVUFBVSxDQUFvQjtJQUFHLENBQUM7SUFFbEcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFrQjtRQUMvQixPQUFPLElBQUksb0JBQW9CLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwRCxDQUFDO0NBQ0Y7QUFFRCxNQUFNLFdBQVcsR0FBVSxFQUFFLENBQUM7QUFxQzlCLE1BQU07SUFHSixZQUNXLEdBQWtCLEVBQVMsaUJBQThDLEVBQ3pFLGFBQXNCO1FBRHRCLFFBQUcsR0FBSCxHQUFHLENBQWU7UUFB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QUM7U0FDdkI7S0FDRjtJQUVELEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUVqQyxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7UUFDakIsT0FBTyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0tBQ3ZEO1NBQU07UUFDTCxNQUFNLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUM3QztBQUNILENBQUM7QUFFRCwyQkFDSSxLQUFVLEVBQUUsUUFBaUIsRUFBRSxVQUFrQztJQUNuRSxPQUFPLElBQUksb0JBQW9CLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDbEYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtyZWZsZWN0b3J9IGZyb20gJy4uL3JlZmxlY3Rpb24vcmVmbGVjdGlvbic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4vaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0LCBPcHRpb25hbCwgU2VsZiwgU2tpcFNlbGZ9IGZyb20gJy4vbWV0YWRhdGEnO1xuaW1wb3J0IHtDbGFzc1Byb3ZpZGVyLCBFeGlzdGluZ1Byb3ZpZGVyLCBGYWN0b3J5UHJvdmlkZXIsIFByb3ZpZGVyLCBUeXBlUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXJ9IGZyb20gJy4vcHJvdmlkZXInO1xuaW1wb3J0IHtpbnZhbGlkUHJvdmlkZXJFcnJvciwgbWl4aW5nTXVsdGlQcm92aWRlcnNXaXRoUmVndWxhclByb3ZpZGVyc0Vycm9yLCBub0Fubm90YXRpb25FcnJvcn0gZnJvbSAnLi9yZWZsZWN0aXZlX2Vycm9ycyc7XG5pbXBvcnQge1JlZmxlY3RpdmVLZXl9IGZyb20gJy4vcmVmbGVjdGl2ZV9rZXknO1xuXG5cbmludGVyZmFjZSBOb3JtYWxpemVkUHJvdmlkZXIgZXh0ZW5kcyBUeXBlUHJvdmlkZXIsIFZhbHVlUHJvdmlkZXIsIENsYXNzUHJvdmlkZXIsIEV4aXN0aW5nUHJvdmlkZXIsXG4gICAgRmFjdG9yeVByb3ZpZGVyIHt9XG5cbi8qKlxuICogYERlcGVuZGVuY3lgIGlzIHVzZWQgYnkgdGhlIGZyYW1ld29yayB0byBleHRlbmQgREkuXG4gKiBUaGlzIGlzIGludGVybmFsIHRvIEFuZ3VsYXIgYW5kIHNob3VsZCBub3QgYmUgdXNlZCBkaXJlY3RseS5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlZmxlY3RpdmVEZXBlbmRlbmN5IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMga2V5OiBSZWZsZWN0aXZlS2V5LCBwdWJsaWMgb3B0aW9uYWw6IGJvb2xlYW4sIHB1YmxpYyB2aXNpYmlsaXR5OiBTZWxmfFNraXBTZWxmfG51bGwpIHt9XG5cbiAgc3RhdGljIGZyb21LZXkoa2V5OiBSZWZsZWN0aXZlS2V5KTogUmVmbGVjdGl2ZURlcGVuZGVuY3kge1xuICAgIHJldHVybiBuZXcgUmVmbGVjdGl2ZURlcGVuZGVuY3koa2V5LCBmYWxzZSwgbnVsbCk7XG4gIH1cbn1cblxuY29uc3QgX0VNUFRZX0xJU1Q6IGFueVtdID0gW107XG5cbi8qKlxuICogQW4gaW50ZXJuYWwgcmVzb2x2ZWQgcmVwcmVzZW50YXRpb24gb2YgYSB7QGxpbmsgUHJvdmlkZXJ9IHVzZWQgYnkgdGhlIHtAbGluayBJbmplY3Rvcn0uXG4gKlxuICogSXQgaXMgdXN1YWxseSBjcmVhdGVkIGF1dG9tYXRpY2FsbHkgYnkgYEluamVjdG9yLnJlc29sdmVBbmRDcmVhdGVgLlxuICpcbiAqIEl0IGNhbiBiZSBjcmVhdGVkIG1hbnVhbGx5LCBhcyBmb2xsb3dzOlxuICpcbiAqICMjIyBFeGFtcGxlIChbbGl2ZSBkZW1vXShodHRwOi8vcGxua3IuY28vZWRpdC9SZkVuaGg4a1VFSTBHM3FzbkllVD9wJTNEcHJldmlldyZwPXByZXZpZXcpKVxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIHZhciByZXNvbHZlZFByb3ZpZGVycyA9IEluamVjdG9yLnJlc29sdmUoW3sgcHJvdmlkZTogJ21lc3NhZ2UnLCB1c2VWYWx1ZTogJ0hlbGxvJyB9XSk7XG4gKiB2YXIgaW5qZWN0b3IgPSBJbmplY3Rvci5mcm9tUmVzb2x2ZWRQcm92aWRlcnMocmVzb2x2ZWRQcm92aWRlcnMpO1xuICpcbiAqIGV4cGVjdChpbmplY3Rvci5nZXQoJ21lc3NhZ2UnKSkudG9FcXVhbCgnSGVsbG8nKTtcbiAqIGBgYFxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlciB7XG4gIC8qKlxuICAgKiBBIGtleSwgdXN1YWxseSBhIGBUeXBlPGFueT5gLlxuICAgKi9cbiAga2V5OiBSZWZsZWN0aXZlS2V5O1xuXG4gIC8qKlxuICAgKiBGYWN0b3J5IGZ1bmN0aW9uIHdoaWNoIGNhbiByZXR1cm4gYW4gaW5zdGFuY2Ugb2YgYW4gb2JqZWN0IHJlcHJlc2VudGVkIGJ5IGEga2V5LlxuICAgKi9cbiAgcmVzb2x2ZWRGYWN0b3JpZXM6IFJlc29sdmVkUmVmbGVjdGl2ZUZhY3RvcnlbXTtcblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBwcm92aWRlciBpcyBhIG11bHRpLXByb3ZpZGVyIG9yIGEgcmVndWxhciBwcm92aWRlci5cbiAgICovXG4gIG11bHRpUHJvdmlkZXI6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcl8gaW1wbGVtZW50cyBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlciB7XG4gIHJlYWRvbmx5IHJlc29sdmVkRmFjdG9yeTogUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBrZXk6IFJlZmxlY3RpdmVLZXksIHB1YmxpYyByZXNvbHZlZEZhY3RvcmllczogUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeVtdLFxuICAgICAgcHVibGljIG11bHRpUHJvdmlkZXI6IGJvb2xlYW4pIHtcbiAgICB0aGlzLnJlc29sdmVkRmFjdG9yeSA9IHRoaXMucmVzb2x2ZWRGYWN0b3JpZXNbMF07XG4gIH1cbn1cblxuLyoqXG4gKiBBbiBpbnRlcm5hbCByZXNvbHZlZCByZXByZXNlbnRhdGlvbiBvZiBhIGZhY3RvcnkgZnVuY3Rpb24gY3JlYXRlZCBieSByZXNvbHZpbmcge0BsaW5rXG4gKiBQcm92aWRlcn0uXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBjbGFzcyBSZXNvbHZlZFJlZmxlY3RpdmVGYWN0b3J5IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICAvKipcbiAgICAgICAqIEZhY3RvcnkgZnVuY3Rpb24gd2hpY2ggY2FuIHJldHVybiBhbiBpbnN0YW5jZSBvZiBhbiBvYmplY3QgcmVwcmVzZW50ZWQgYnkgYSBrZXkuXG4gICAgICAgKi9cbiAgICAgIHB1YmxpYyBmYWN0b3J5OiBGdW5jdGlvbixcblxuICAgICAgLyoqXG4gICAgICAgKiBBcmd1bWVudHMgKGRlcGVuZGVuY2llcykgdG8gdGhlIGBmYWN0b3J5YCBmdW5jdGlvbi5cbiAgICAgICAqL1xuICAgICAgcHVibGljIGRlcGVuZGVuY2llczogUmVmbGVjdGl2ZURlcGVuZGVuY3lbXSkge31cbn1cblxuXG4vKipcbiAqIFJlc29sdmUgYSBzaW5nbGUgcHJvdmlkZXIuXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVSZWZsZWN0aXZlRmFjdG9yeShwcm92aWRlcjogTm9ybWFsaXplZFByb3ZpZGVyKTogUmVzb2x2ZWRSZWZsZWN0aXZlRmFjdG9yeSB7XG4gIGxldCBmYWN0b3J5Rm46IEZ1bmN0aW9uO1xuICBsZXQgcmVzb2x2ZWREZXBzOiBSZWZsZWN0aXZlRGVwZW5kZW5jeVtdO1xuICBpZiAocHJvdmlkZXIudXNlQ2xhc3MpIHtcbiAgICBjb25zdCB1c2VDbGFzcyA9IHJlc29sdmVGb3J3YXJkUmVmKHByb3ZpZGVyLnVzZUNsYXNzKTtcbiAgICBmYWN0b3J5Rm4gPSByZWZsZWN0b3IuZmFjdG9yeSh1c2VDbGFzcyk7XG4gICAgcmVzb2x2ZWREZXBzID0gX2RlcGVuZGVuY2llc0Zvcih1c2VDbGFzcyk7XG4gIH0gZWxzZSBpZiAocHJvdmlkZXIudXNlRXhpc3RpbmcpIHtcbiAgICBmYWN0b3J5Rm4gPSAoYWxpYXNJbnN0YW5jZTogYW55KSA9PiBhbGlhc0luc3RhbmNlO1xuICAgIHJlc29sdmVkRGVwcyA9IFtSZWZsZWN0aXZlRGVwZW5kZW5jeS5mcm9tS2V5KFJlZmxlY3RpdmVLZXkuZ2V0KHByb3ZpZGVyLnVzZUV4aXN0aW5nKSldO1xuICB9IGVsc2UgaWYgKHByb3ZpZGVyLnVzZUZhY3RvcnkpIHtcbiAgICBmYWN0b3J5Rm4gPSBwcm92aWRlci51c2VGYWN0b3J5O1xuICAgIHJlc29sdmVkRGVwcyA9IGNvbnN0cnVjdERlcGVuZGVuY2llcyhwcm92aWRlci51c2VGYWN0b3J5LCBwcm92aWRlci5kZXBzKTtcbiAgfSBlbHNlIHtcbiAgICBmYWN0b3J5Rm4gPSAoKSA9PiBwcm92aWRlci51c2VWYWx1ZTtcbiAgICByZXNvbHZlZERlcHMgPSBfRU1QVFlfTElTVDtcbiAgfVxuICByZXR1cm4gbmV3IFJlc29sdmVkUmVmbGVjdGl2ZUZhY3RvcnkoZmFjdG9yeUZuLCByZXNvbHZlZERlcHMpO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIHRoZSB7QGxpbmsgUHJvdmlkZXJ9IGludG8ge0BsaW5rIFJlc29sdmVkUHJvdmlkZXJ9LlxuICpcbiAqIHtAbGluayBJbmplY3Rvcn0gaW50ZXJuYWxseSBvbmx5IHVzZXMge0BsaW5rIFJlc29sdmVkUHJvdmlkZXJ9LCB7QGxpbmsgUHJvdmlkZXJ9IGNvbnRhaW5zXG4gKiBjb252ZW5pZW5jZSBwcm92aWRlciBzeW50YXguXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVSZWZsZWN0aXZlUHJvdmlkZXIocHJvdmlkZXI6IE5vcm1hbGl6ZWRQcm92aWRlcik6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyIHtcbiAgcmV0dXJuIG5ldyBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcl8oXG4gICAgICBSZWZsZWN0aXZlS2V5LmdldChwcm92aWRlci5wcm92aWRlKSwgW3Jlc29sdmVSZWZsZWN0aXZlRmFjdG9yeShwcm92aWRlcildLFxuICAgICAgcHJvdmlkZXIubXVsdGkgfHwgZmFsc2UpO1xufVxuXG4vKipcbiAqIFJlc29sdmUgYSBsaXN0IG9mIFByb3ZpZGVycy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVSZWZsZWN0aXZlUHJvdmlkZXJzKHByb3ZpZGVyczogUHJvdmlkZXJbXSk6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyW10ge1xuICBjb25zdCBub3JtYWxpemVkID0gX25vcm1hbGl6ZVByb3ZpZGVycyhwcm92aWRlcnMsIFtdKTtcbiAgY29uc3QgcmVzb2x2ZWQgPSBub3JtYWxpemVkLm1hcChyZXNvbHZlUmVmbGVjdGl2ZVByb3ZpZGVyKTtcbiAgY29uc3QgcmVzb2x2ZWRQcm92aWRlck1hcCA9IG1lcmdlUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXJzKHJlc29sdmVkLCBuZXcgTWFwKCkpO1xuICByZXR1cm4gQXJyYXkuZnJvbShyZXNvbHZlZFByb3ZpZGVyTWFwLnZhbHVlcygpKTtcbn1cblxuLyoqXG4gKiBNZXJnZXMgYSBsaXN0IG9mIFJlc29sdmVkUHJvdmlkZXJzIGludG8gYSBsaXN0IHdoZXJlXG4gKiBlYWNoIGtleSBpcyBjb250YWluZWQgZXhhY3RseSBvbmNlIGFuZCBtdWx0aSBwcm92aWRlcnNcbiAqIGhhdmUgYmVlbiBtZXJnZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZVJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVycyhcbiAgICBwcm92aWRlcnM6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyW10sXG4gICAgbm9ybWFsaXplZFByb3ZpZGVyc01hcDogTWFwPG51bWJlciwgUmVzb2x2ZWRSZWZsZWN0aXZlUHJvdmlkZXI+KTpcbiAgICBNYXA8bnVtYmVyLCBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcj4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3ZpZGVycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHByb3ZpZGVyID0gcHJvdmlkZXJzW2ldO1xuICAgIGNvbnN0IGV4aXN0aW5nID0gbm9ybWFsaXplZFByb3ZpZGVyc01hcC5nZXQocHJvdmlkZXIua2V5LmlkKTtcbiAgICBpZiAoZXhpc3RpbmcpIHtcbiAgICAgIGlmIChwcm92aWRlci5tdWx0aVByb3ZpZGVyICE9PSBleGlzdGluZy5tdWx0aVByb3ZpZGVyKSB7XG4gICAgICAgIHRocm93IG1peGluZ011bHRpUHJvdmlkZXJzV2l0aFJlZ3VsYXJQcm92aWRlcnNFcnJvcihleGlzdGluZywgcHJvdmlkZXIpO1xuICAgICAgfVxuICAgICAgaWYgKHByb3ZpZGVyLm11bHRpUHJvdmlkZXIpIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBwcm92aWRlci5yZXNvbHZlZEZhY3Rvcmllcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGV4aXN0aW5nLnJlc29sdmVkRmFjdG9yaWVzLnB1c2gocHJvdmlkZXIucmVzb2x2ZWRGYWN0b3JpZXNbal0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBub3JtYWxpemVkUHJvdmlkZXJzTWFwLnNldChwcm92aWRlci5rZXkuaWQsIHByb3ZpZGVyKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHJlc29sdmVkUHJvdmlkZXI6IFJlc29sdmVkUmVmbGVjdGl2ZVByb3ZpZGVyO1xuICAgICAgaWYgKHByb3ZpZGVyLm11bHRpUHJvdmlkZXIpIHtcbiAgICAgICAgcmVzb2x2ZWRQcm92aWRlciA9IG5ldyBSZXNvbHZlZFJlZmxlY3RpdmVQcm92aWRlcl8oXG4gICAgICAgICAgICBwcm92aWRlci5rZXksIHByb3ZpZGVyLnJlc29sdmVkRmFjdG9yaWVzLnNsaWNlKCksIHByb3ZpZGVyLm11bHRpUHJvdmlkZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzb2x2ZWRQcm92aWRlciA9IHByb3ZpZGVyO1xuICAgICAgfVxuICAgICAgbm9ybWFsaXplZFByb3ZpZGVyc01hcC5zZXQocHJvdmlkZXIua2V5LmlkLCByZXNvbHZlZFByb3ZpZGVyKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5vcm1hbGl6ZWRQcm92aWRlcnNNYXA7XG59XG5cbmZ1bmN0aW9uIF9ub3JtYWxpemVQcm92aWRlcnMocHJvdmlkZXJzOiBQcm92aWRlcltdLCByZXM6IFByb3ZpZGVyW10pOiBQcm92aWRlcltdIHtcbiAgcHJvdmlkZXJzLmZvckVhY2goYiA9PiB7XG4gICAgaWYgKGIgaW5zdGFuY2VvZiBUeXBlKSB7XG4gICAgICByZXMucHVzaCh7cHJvdmlkZTogYiwgdXNlQ2xhc3M6IGJ9KTtcblxuICAgIH0gZWxzZSBpZiAoYiAmJiB0eXBlb2YgYiA9PSAnb2JqZWN0JyAmJiAoYiBhcyBhbnkpLnByb3ZpZGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmVzLnB1c2goYiBhcyBOb3JtYWxpemVkUHJvdmlkZXIpO1xuXG4gICAgfSBlbHNlIGlmIChiIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIF9ub3JtYWxpemVQcm92aWRlcnMoYiwgcmVzKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBpbnZhbGlkUHJvdmlkZXJFcnJvcihiKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25zdHJ1Y3REZXBlbmRlbmNpZXMoXG4gICAgdHlwZU9yRnVuYzogYW55LCBkZXBlbmRlbmNpZXM/OiBhbnlbXSk6IFJlZmxlY3RpdmVEZXBlbmRlbmN5W10ge1xuICBpZiAoIWRlcGVuZGVuY2llcykge1xuICAgIHJldHVybiBfZGVwZW5kZW5jaWVzRm9yKHR5cGVPckZ1bmMpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHBhcmFtczogYW55W11bXSA9IGRlcGVuZGVuY2llcy5tYXAodCA9PiBbdF0pO1xuICAgIHJldHVybiBkZXBlbmRlbmNpZXMubWFwKHQgPT4gX2V4dHJhY3RUb2tlbih0eXBlT3JGdW5jLCB0LCBwYXJhbXMpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfZGVwZW5kZW5jaWVzRm9yKHR5cGVPckZ1bmM6IGFueSk6IFJlZmxlY3RpdmVEZXBlbmRlbmN5W10ge1xuICBjb25zdCBwYXJhbXMgPSByZWZsZWN0b3IucGFyYW1ldGVycyh0eXBlT3JGdW5jKTtcblxuICBpZiAoIXBhcmFtcykgcmV0dXJuIFtdO1xuICBpZiAocGFyYW1zLnNvbWUocCA9PiBwID09IG51bGwpKSB7XG4gICAgdGhyb3cgbm9Bbm5vdGF0aW9uRXJyb3IodHlwZU9yRnVuYywgcGFyYW1zKTtcbiAgfVxuICByZXR1cm4gcGFyYW1zLm1hcChwID0+IF9leHRyYWN0VG9rZW4odHlwZU9yRnVuYywgcCwgcGFyYW1zKSk7XG59XG5cbmZ1bmN0aW9uIF9leHRyYWN0VG9rZW4oXG4gICAgdHlwZU9yRnVuYzogYW55LCBtZXRhZGF0YTogYW55W10gfCBhbnksIHBhcmFtczogYW55W11bXSk6IFJlZmxlY3RpdmVEZXBlbmRlbmN5IHtcbiAgbGV0IHRva2VuOiBhbnkgPSBudWxsO1xuICBsZXQgb3B0aW9uYWwgPSBmYWxzZTtcblxuICBpZiAoIUFycmF5LmlzQXJyYXkobWV0YWRhdGEpKSB7XG4gICAgaWYgKG1ldGFkYXRhIGluc3RhbmNlb2YgSW5qZWN0KSB7XG4gICAgICByZXR1cm4gX2NyZWF0ZURlcGVuZGVuY3kobWV0YWRhdGEudG9rZW4sIG9wdGlvbmFsLCBudWxsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIF9jcmVhdGVEZXBlbmRlbmN5KG1ldGFkYXRhLCBvcHRpb25hbCwgbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgbGV0IHZpc2liaWxpdHk6IFNlbGZ8U2tpcFNlbGZ8bnVsbCA9IG51bGw7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXRhZGF0YS5sZW5ndGg7ICsraSkge1xuICAgIGNvbnN0IHBhcmFtTWV0YWRhdGEgPSBtZXRhZGF0YVtpXTtcblxuICAgIGlmIChwYXJhbU1ldGFkYXRhIGluc3RhbmNlb2YgVHlwZSkge1xuICAgICAgdG9rZW4gPSBwYXJhbU1ldGFkYXRhO1xuXG4gICAgfSBlbHNlIGlmIChwYXJhbU1ldGFkYXRhIGluc3RhbmNlb2YgSW5qZWN0KSB7XG4gICAgICB0b2tlbiA9IHBhcmFtTWV0YWRhdGEudG9rZW47XG5cbiAgICB9IGVsc2UgaWYgKHBhcmFtTWV0YWRhdGEgaW5zdGFuY2VvZiBPcHRpb25hbCkge1xuICAgICAgb3B0aW9uYWwgPSB0cnVlO1xuXG4gICAgfSBlbHNlIGlmIChwYXJhbU1ldGFkYXRhIGluc3RhbmNlb2YgU2VsZiB8fCBwYXJhbU1ldGFkYXRhIGluc3RhbmNlb2YgU2tpcFNlbGYpIHtcbiAgICAgIHZpc2liaWxpdHkgPSBwYXJhbU1ldGFkYXRhO1xuICAgIH0gZWxzZSBpZiAocGFyYW1NZXRhZGF0YSBpbnN0YW5jZW9mIEluamVjdGlvblRva2VuKSB7XG4gICAgICB0b2tlbiA9IHBhcmFtTWV0YWRhdGE7XG4gICAgfVxuICB9XG5cbiAgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZih0b2tlbik7XG5cbiAgaWYgKHRva2VuICE9IG51bGwpIHtcbiAgICByZXR1cm4gX2NyZWF0ZURlcGVuZGVuY3kodG9rZW4sIG9wdGlvbmFsLCB2aXNpYmlsaXR5KTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBub0Fubm90YXRpb25FcnJvcih0eXBlT3JGdW5jLCBwYXJhbXMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9jcmVhdGVEZXBlbmRlbmN5KFxuICAgIHRva2VuOiBhbnksIG9wdGlvbmFsOiBib29sZWFuLCB2aXNpYmlsaXR5OiBTZWxmIHwgU2tpcFNlbGYgfCBudWxsKTogUmVmbGVjdGl2ZURlcGVuZGVuY3kge1xuICByZXR1cm4gbmV3IFJlZmxlY3RpdmVEZXBlbmRlbmN5KFJlZmxlY3RpdmVLZXkuZ2V0KHRva2VuKSwgb3B0aW9uYWwsIHZpc2liaWxpdHkpO1xufVxuIl19