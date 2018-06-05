/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
export var ERROR_TYPE = 'ngType';
export var ERROR_DEBUG_CONTEXT = 'ngDebugContext';
export var ERROR_ORIGINAL_ERROR = 'ngOriginalError';
export var ERROR_LOGGER = 'ngErrorLogger';
export function getType(error) {
    return error[ERROR_TYPE];
}
export function getDebugContext(error) {
    return error[ERROR_DEBUG_CONTEXT];
}
export function getOriginalError(error) {
    return error[ERROR_ORIGINAL_ERROR];
}
export function getErrorLogger(error) {
    return error[ERROR_LOGGER] || defaultErrorLogger;
}
function defaultErrorLogger(console) {
    var values = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        values[_i - 1] = arguments[_i];
    }
    console.error.apply(console, tslib_1.__spread(values));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBVUEsTUFBTSxDQUFDLElBQU0sVUFBVSxHQUFHLFFBQVEsQ0FBQztBQUNuQyxNQUFNLENBQUMsSUFBTSxtQkFBbUIsR0FBRyxnQkFBZ0IsQ0FBQztBQUNwRCxNQUFNLENBQUMsSUFBTSxvQkFBb0IsR0FBRyxpQkFBaUIsQ0FBQztBQUN0RCxNQUFNLENBQUMsSUFBTSxZQUFZLEdBQUcsZUFBZSxDQUFDO0FBRzVDLE1BQU0sa0JBQWtCLEtBQVk7SUFDbEMsT0FBUSxLQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7Q0FDbkM7QUFFRCxNQUFNLDBCQUEwQixLQUFZO0lBQzFDLE9BQVEsS0FBYSxDQUFDLG1CQUFtQixDQUFDLENBQUM7Q0FDNUM7QUFFRCxNQUFNLDJCQUEyQixLQUFZO0lBQzNDLE9BQVEsS0FBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7Q0FDN0M7QUFFRCxNQUFNLHlCQUF5QixLQUFZO0lBQ3pDLE9BQVEsS0FBYSxDQUFDLFlBQVksQ0FBQyxJQUFJLGtCQUFrQixDQUFDO0NBQzNEO0FBR0QsNEJBQTRCLE9BQWdCO0lBQUUsZ0JBQWdCO1NBQWhCLFVBQWdCLEVBQWhCLHFCQUFnQixFQUFoQixJQUFnQjtRQUFoQiwrQkFBZ0I7O0lBQ3RELE9BQU8sQ0FBQyxLQUFLLE9BQWIsT0FBTyxtQkFBVyxNQUFNLEdBQUU7Q0FDakMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGVidWdDb250ZXh0fSBmcm9tICcuL3ZpZXcnO1xuXG5leHBvcnQgY29uc3QgRVJST1JfVFlQRSA9ICduZ1R5cGUnO1xuZXhwb3J0IGNvbnN0IEVSUk9SX0RFQlVHX0NPTlRFWFQgPSAnbmdEZWJ1Z0NvbnRleHQnO1xuZXhwb3J0IGNvbnN0IEVSUk9SX09SSUdJTkFMX0VSUk9SID0gJ25nT3JpZ2luYWxFcnJvcic7XG5leHBvcnQgY29uc3QgRVJST1JfTE9HR0VSID0gJ25nRXJyb3JMb2dnZXInO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUeXBlKGVycm9yOiBFcnJvcik6IEZ1bmN0aW9uIHtcbiAgcmV0dXJuIChlcnJvciBhcyBhbnkpW0VSUk9SX1RZUEVdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdDb250ZXh0KGVycm9yOiBFcnJvcik6IERlYnVnQ29udGV4dCB7XG4gIHJldHVybiAoZXJyb3IgYXMgYW55KVtFUlJPUl9ERUJVR19DT05URVhUXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yaWdpbmFsRXJyb3IoZXJyb3I6IEVycm9yKTogRXJyb3Ige1xuICByZXR1cm4gKGVycm9yIGFzIGFueSlbRVJST1JfT1JJR0lOQUxfRVJST1JdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RXJyb3JMb2dnZXIoZXJyb3I6IEVycm9yKTogKGNvbnNvbGU6IENvbnNvbGUsIC4uLnZhbHVlczogYW55W10pID0+IHZvaWQge1xuICByZXR1cm4gKGVycm9yIGFzIGFueSlbRVJST1JfTE9HR0VSXSB8fCBkZWZhdWx0RXJyb3JMb2dnZXI7XG59XG5cblxuZnVuY3Rpb24gZGVmYXVsdEVycm9yTG9nZ2VyKGNvbnNvbGU6IENvbnNvbGUsIC4uLnZhbHVlczogYW55W10pIHtcbiAgKDxhbnk+Y29uc29sZS5lcnJvcikoLi4udmFsdWVzKTtcbn0iXX0=