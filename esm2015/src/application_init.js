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
import { isPromise } from '../src/util/lang';
import { Inject, Injectable, InjectionToken, Optional } from './di';
/**
 * A function that will be executed when an application is initialized.
 * \@experimental
 */
export const /** @type {?} */ APP_INITIALIZER = new InjectionToken('Application Initializer');
/**
 * A class that reflects the state of running {\@link APP_INITIALIZER}s.
 *
 * \@experimental
 */
export class ApplicationInitStatus {
    /**
     * @param {?} appInits
     */
    constructor(appInits) {
        this.appInits = appInits;
        this.initialized = false;
        this.done = false;
        this.donePromise = new Promise((res, rej) => {
            this.resolve = res;
            this.reject = rej;
        });
    }
    /**
     * \@internal
     * @return {?}
     */
    runInitializers() {
        if (this.initialized) {
            return;
        }
        const /** @type {?} */ asyncInitPromises = [];
        const /** @type {?} */ complete = () => {
            (/** @type {?} */ (this)).done = true;
            this.resolve();
        };
        if (this.appInits) {
            for (let /** @type {?} */ i = 0; i < this.appInits.length; i++) {
                const /** @type {?} */ initResult = this.appInits[i]();
                if (isPromise(initResult)) {
                    asyncInitPromises.push(initResult);
                }
            }
        }
        Promise.all(asyncInitPromises).then(() => { complete(); }).catch(e => { this.reject(e); });
        if (asyncInitPromises.length === 0) {
            complete();
        }
        this.initialized = true;
    }
}
ApplicationInitStatus.decorators = [
    { type: Injectable }
];
/** @nocollapse */
ApplicationInitStatus.ctorParameters = () => [
    { type: Array, decorators: [{ type: Inject, args: [APP_INITIALIZER,] }, { type: Optional },] },
];
function ApplicationInitStatus_tsickle_Closure_declarations() {
    /** @type {!Array<{type: !Function, args: (undefined|!Array<?>)}>} */
    ApplicationInitStatus.decorators;
    /**
     * @nocollapse
     * @type {function(): !Array<(null|{type: ?, decorators: (undefined|!Array<{type: !Function, args: (undefined|!Array<?>)}>)})>}
     */
    ApplicationInitStatus.ctorParameters;
    /** @type {?} */
    ApplicationInitStatus.prototype.resolve;
    /** @type {?} */
    ApplicationInitStatus.prototype.reject;
    /** @type {?} */
    ApplicationInitStatus.prototype.initialized;
    /** @type {?} */
    ApplicationInitStatus.prototype.donePromise;
    /** @type {?} */
    ApplicationInitStatus.prototype.done;
    /** @type {?} */
    ApplicationInitStatus.prototype.appInits;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb25faW5pdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2FwcGxpY2F0aW9uX2luaXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sa0JBQWtCLENBQUM7QUFFM0MsT0FBTyxFQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBQyxNQUFNLE1BQU0sQ0FBQzs7Ozs7QUFPbEUsTUFBTSxDQUFDLHVCQUFNLGVBQWUsR0FBRyxJQUFJLGNBQWMsQ0FBb0IseUJBQXlCLENBQUMsQ0FBQzs7Ozs7O0FBUWhHLE1BQU07Ozs7SUFPSixZQUF5RDtRQUFBLGFBQVEsR0FBUixRQUFROzJCQUozQyxLQUFLO29CQUVKLEtBQUs7UUFHMUIsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLE9BQU8sQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUMxQyxJQUFJLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQztZQUNuQixJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztTQUNuQixDQUFDLENBQUM7S0FDSjs7Ozs7SUFHRCxlQUFlO1FBQ2IsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQ3BCLE9BQU87U0FDUjtRQUVELHVCQUFNLGlCQUFpQixHQUFtQixFQUFFLENBQUM7UUFFN0MsdUJBQU0sUUFBUSxHQUFHLEdBQUcsRUFBRTtZQUNwQixtQkFBQyxJQUFzQixFQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNyQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDaEIsQ0FBQztRQUVGLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNqQixLQUFLLHFCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUM3Qyx1QkFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxJQUFJLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDekIsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUNwQzthQUNGO1NBQ0Y7UUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLFFBQVEsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFM0YsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQ2xDLFFBQVEsRUFBRSxDQUFDO1NBQ1o7UUFDRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztLQUN6Qjs7O1lBM0NGLFVBQVU7Ozs7d0NBUUksTUFBTSxTQUFDLGVBQWUsY0FBRyxRQUFRIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2lzUHJvbWlzZX0gZnJvbSAnLi4vc3JjL3V0aWwvbGFuZyc7XG5cbmltcG9ydCB7SW5qZWN0LCBJbmplY3RhYmxlLCBJbmplY3Rpb25Ub2tlbiwgT3B0aW9uYWx9IGZyb20gJy4vZGknO1xuXG5cbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZXhlY3V0ZWQgd2hlbiBhbiBhcHBsaWNhdGlvbiBpcyBpbml0aWFsaXplZC5cbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGNvbnN0IEFQUF9JTklUSUFMSVpFUiA9IG5ldyBJbmplY3Rpb25Ub2tlbjxBcnJheTwoKSA9PiB2b2lkPj4oJ0FwcGxpY2F0aW9uIEluaXRpYWxpemVyJyk7XG5cbi8qKlxuICogQSBjbGFzcyB0aGF0IHJlZmxlY3RzIHRoZSBzdGF0ZSBvZiBydW5uaW5nIHtAbGluayBBUFBfSU5JVElBTElaRVJ9cy5cbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbkluaXRTdGF0dXMge1xuICBwcml2YXRlIHJlc29sdmU6IEZ1bmN0aW9uO1xuICBwcml2YXRlIHJlamVjdDogRnVuY3Rpb247XG4gIHByaXZhdGUgaW5pdGlhbGl6ZWQgPSBmYWxzZTtcbiAgcHVibGljIHJlYWRvbmx5IGRvbmVQcm9taXNlOiBQcm9taXNlPGFueT47XG4gIHB1YmxpYyByZWFkb25seSBkb25lID0gZmFsc2U7XG5cbiAgY29uc3RydWN0b3IoQEluamVjdChBUFBfSU5JVElBTElaRVIpIEBPcHRpb25hbCgpIHByaXZhdGUgYXBwSW5pdHM6ICgoKSA9PiBhbnkpW10pIHtcbiAgICB0aGlzLmRvbmVQcm9taXNlID0gbmV3IFByb21pc2UoKHJlcywgcmVqKSA9PiB7XG4gICAgICB0aGlzLnJlc29sdmUgPSByZXM7XG4gICAgICB0aGlzLnJlamVjdCA9IHJlajtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKiBAaW50ZXJuYWwgKi9cbiAgcnVuSW5pdGlhbGl6ZXJzKCkge1xuICAgIGlmICh0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYXN5bmNJbml0UHJvbWlzZXM6IFByb21pc2U8YW55PltdID0gW107XG5cbiAgICBjb25zdCBjb21wbGV0ZSA9ICgpID0+IHtcbiAgICAgICh0aGlzIGFze2RvbmU6IGJvb2xlYW59KS5kb25lID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVzb2x2ZSgpO1xuICAgIH07XG5cbiAgICBpZiAodGhpcy5hcHBJbml0cykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmFwcEluaXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGluaXRSZXN1bHQgPSB0aGlzLmFwcEluaXRzW2ldKCk7XG4gICAgICAgIGlmIChpc1Byb21pc2UoaW5pdFJlc3VsdCkpIHtcbiAgICAgICAgICBhc3luY0luaXRQcm9taXNlcy5wdXNoKGluaXRSZXN1bHQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgUHJvbWlzZS5hbGwoYXN5bmNJbml0UHJvbWlzZXMpLnRoZW4oKCkgPT4geyBjb21wbGV0ZSgpOyB9KS5jYXRjaChlID0+IHsgdGhpcy5yZWplY3QoZSk7IH0pO1xuXG4gICAgaWYgKGFzeW5jSW5pdFByb21pc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgY29tcGxldGUoKTtcbiAgICB9XG4gICAgdGhpcy5pbml0aWFsaXplZCA9IHRydWU7XG4gIH1cbn1cbiJdfQ==