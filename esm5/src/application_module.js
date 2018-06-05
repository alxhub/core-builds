/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { ApplicationInitStatus } from './application_init';
import { ApplicationRef } from './application_ref';
import { APP_ID_RANDOM_PROVIDER } from './application_tokens';
import { IterableDiffers, KeyValueDiffers, defaultIterableDiffers, defaultKeyValueDiffers } from './change_detection/change_detection';
import { Inject, Optional, SkipSelf } from './di/metadata';
import { LOCALE_ID } from './i18n/tokens';
import { Compiler } from './linker/compiler';
import { NgModule } from './metadata';
export function _iterableDiffersFactory() {
    return defaultIterableDiffers;
}
export function _keyValueDiffersFactory() {
    return defaultKeyValueDiffers;
}
export function _localeFactory(locale) {
    return locale || 'en-US';
}
/**
 * This module includes the providers of @angular/core that are needed
 * to bootstrap components via `ApplicationRef`.
 *
 * @experimental
 */
var ApplicationModule = /** @class */ (function () {
    // Inject ApplicationRef to make it eager...
    function ApplicationModule(appRef) {
    }
    ApplicationModule = tslib_1.__decorate([
        NgModule({
            providers: [
                ApplicationRef,
                ApplicationInitStatus,
                Compiler,
                APP_ID_RANDOM_PROVIDER,
                { provide: IterableDiffers, useFactory: _iterableDiffersFactory },
                { provide: KeyValueDiffers, useFactory: _keyValueDiffersFactory },
                {
                    provide: LOCALE_ID,
                    useFactory: _localeFactory,
                    deps: [[new Inject(LOCALE_ID), new Optional(), new SkipSelf()]]
                },
            ],
        }),
        tslib_1.__metadata("design:paramtypes", [ApplicationRef])
    ], ApplicationModule);
    return ApplicationModule;
}());
export { ApplicationModule };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25fbW9kdWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXBwbGljYXRpb25fbW9kdWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQWtCLHFCQUFxQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDMUUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBQyxzQkFBc0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQzVELE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLHNCQUFzQixFQUFFLHNCQUFzQixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFFckksT0FBTyxFQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3pELE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEMsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzNDLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFcEMsTUFBTTtJQUNKLE9BQU8sc0JBQXNCLENBQUM7QUFDaEMsQ0FBQztBQUVELE1BQU07SUFDSixPQUFPLHNCQUFzQixDQUFDO0FBQ2hDLENBQUM7QUFFRCxNQUFNLHlCQUF5QixNQUFlO0lBQzVDLE9BQU8sTUFBTSxJQUFJLE9BQU8sQ0FBQztBQUMzQixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFnQkg7SUFDRSw0Q0FBNEM7SUFDNUMsMkJBQVksTUFBc0I7SUFBRyxDQUFDO0lBRjNCLGlCQUFpQjtRQWY3QixRQUFRLENBQUM7WUFDUixTQUFTLEVBQUU7Z0JBQ1QsY0FBYztnQkFDZCxxQkFBcUI7Z0JBQ3JCLFFBQVE7Z0JBQ1Isc0JBQXNCO2dCQUN0QixFQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLHVCQUF1QixFQUFDO2dCQUMvRCxFQUFDLE9BQU8sRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLHVCQUF1QixFQUFDO2dCQUMvRDtvQkFDRSxPQUFPLEVBQUUsU0FBUztvQkFDbEIsVUFBVSxFQUFFLGNBQWM7b0JBQzFCLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsSUFBSSxRQUFRLEVBQUUsRUFBRSxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUM7aUJBQ2hFO2FBQ0Y7U0FDRixDQUFDO2lEQUdvQixjQUFjO09BRnZCLGlCQUFpQixDQUc3QjtJQUFELHdCQUFDO0NBQUEsQUFIRCxJQUdDO1NBSFksaUJBQWlCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0FQUF9JTklUSUFMSVpFUiwgQXBwbGljYXRpb25Jbml0U3RhdHVzfSBmcm9tICcuL2FwcGxpY2F0aW9uX2luaXQnO1xuaW1wb3J0IHtBcHBsaWNhdGlvblJlZn0gZnJvbSAnLi9hcHBsaWNhdGlvbl9yZWYnO1xuaW1wb3J0IHtBUFBfSURfUkFORE9NX1BST1ZJREVSfSBmcm9tICcuL2FwcGxpY2F0aW9uX3Rva2Vucyc7XG5pbXBvcnQge0l0ZXJhYmxlRGlmZmVycywgS2V5VmFsdWVEaWZmZXJzLCBkZWZhdWx0SXRlcmFibGVEaWZmZXJzLCBkZWZhdWx0S2V5VmFsdWVEaWZmZXJzfSBmcm9tICcuL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdGlvbic7XG5pbXBvcnQge2ZvcndhcmRSZWZ9IGZyb20gJy4vZGkvZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtJbmplY3QsIE9wdGlvbmFsLCBTa2lwU2VsZn0gZnJvbSAnLi9kaS9tZXRhZGF0YSc7XG5pbXBvcnQge0xPQ0FMRV9JRH0gZnJvbSAnLi9pMThuL3Rva2Vucyc7XG5pbXBvcnQge0NvbXBpbGVyfSBmcm9tICcuL2xpbmtlci9jb21waWxlcic7XG5pbXBvcnQge05nTW9kdWxlfSBmcm9tICcuL21ldGFkYXRhJztcblxuZXhwb3J0IGZ1bmN0aW9uIF9pdGVyYWJsZURpZmZlcnNGYWN0b3J5KCkge1xuICByZXR1cm4gZGVmYXVsdEl0ZXJhYmxlRGlmZmVycztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9rZXlWYWx1ZURpZmZlcnNGYWN0b3J5KCkge1xuICByZXR1cm4gZGVmYXVsdEtleVZhbHVlRGlmZmVycztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9sb2NhbGVGYWN0b3J5KGxvY2FsZT86IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBsb2NhbGUgfHwgJ2VuLVVTJztcbn1cblxuLyoqXG4gKiBUaGlzIG1vZHVsZSBpbmNsdWRlcyB0aGUgcHJvdmlkZXJzIG9mIEBhbmd1bGFyL2NvcmUgdGhhdCBhcmUgbmVlZGVkXG4gKiB0byBib290c3RyYXAgY29tcG9uZW50cyB2aWEgYEFwcGxpY2F0aW9uUmVmYC5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbkBOZ01vZHVsZSh7XG4gIHByb3ZpZGVyczogW1xuICAgIEFwcGxpY2F0aW9uUmVmLFxuICAgIEFwcGxpY2F0aW9uSW5pdFN0YXR1cyxcbiAgICBDb21waWxlcixcbiAgICBBUFBfSURfUkFORE9NX1BST1ZJREVSLFxuICAgIHtwcm92aWRlOiBJdGVyYWJsZURpZmZlcnMsIHVzZUZhY3Rvcnk6IF9pdGVyYWJsZURpZmZlcnNGYWN0b3J5fSxcbiAgICB7cHJvdmlkZTogS2V5VmFsdWVEaWZmZXJzLCB1c2VGYWN0b3J5OiBfa2V5VmFsdWVEaWZmZXJzRmFjdG9yeX0sXG4gICAge1xuICAgICAgcHJvdmlkZTogTE9DQUxFX0lELFxuICAgICAgdXNlRmFjdG9yeTogX2xvY2FsZUZhY3RvcnksXG4gICAgICBkZXBzOiBbW25ldyBJbmplY3QoTE9DQUxFX0lEKSwgbmV3IE9wdGlvbmFsKCksIG5ldyBTa2lwU2VsZigpXV1cbiAgICB9LFxuICBdLFxufSlcbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbk1vZHVsZSB7XG4gIC8vIEluamVjdCBBcHBsaWNhdGlvblJlZiB0byBtYWtlIGl0IGVhZ2VyLi4uXG4gIGNvbnN0cnVjdG9yKGFwcFJlZjogQXBwbGljYXRpb25SZWYpIHt9XG59XG4iXX0=