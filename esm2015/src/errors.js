/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
export const ERROR_TYPE = 'ngType';
export const ERROR_DEBUG_CONTEXT = 'ngDebugContext';
export const ERROR_ORIGINAL_ERROR = 'ngOriginalError';
export const ERROR_LOGGER = 'ngErrorLogger';
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
function defaultErrorLogger(console, ...values) {
    console.error(...values);
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUlILE1BQU0sQ0FBQyxNQUFNLFVBQVUsR0FBRyxRQUFRLENBQUM7QUFDbkMsTUFBTSxDQUFDLE1BQU0sbUJBQW1CLEdBQUcsZ0JBQWdCLENBQUM7QUFDcEQsTUFBTSxDQUFDLE1BQU0sb0JBQW9CLEdBQUcsaUJBQWlCLENBQUM7QUFDdEQsTUFBTSxDQUFDLE1BQU0sWUFBWSxHQUFHLGVBQWUsQ0FBQztBQUc1QyxNQUFNLGtCQUFrQixLQUFZO0lBQ2xDLE9BQVEsS0FBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3BDLENBQUM7QUFFRCxNQUFNLDBCQUEwQixLQUFZO0lBQzFDLE9BQVEsS0FBYSxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDN0MsQ0FBQztBQUVELE1BQU0sMkJBQTJCLEtBQVk7SUFDM0MsT0FBUSxLQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBRUQsTUFBTSx5QkFBeUIsS0FBWTtJQUN6QyxPQUFRLEtBQWEsQ0FBQyxZQUFZLENBQUMsSUFBSSxrQkFBa0IsQ0FBQztBQUM1RCxDQUFDO0FBR0QsNEJBQTRCLE9BQWdCLEVBQUUsR0FBRyxNQUFhO0lBQ3RELE9BQU8sQ0FBQyxLQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQztBQUNsQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0RlYnVnQ29udGV4dH0gZnJvbSAnLi92aWV3JztcblxuZXhwb3J0IGNvbnN0IEVSUk9SX1RZUEUgPSAnbmdUeXBlJztcbmV4cG9ydCBjb25zdCBFUlJPUl9ERUJVR19DT05URVhUID0gJ25nRGVidWdDb250ZXh0JztcbmV4cG9ydCBjb25zdCBFUlJPUl9PUklHSU5BTF9FUlJPUiA9ICduZ09yaWdpbmFsRXJyb3InO1xuZXhwb3J0IGNvbnN0IEVSUk9SX0xPR0dFUiA9ICduZ0Vycm9yTG9nZ2VyJztcblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHlwZShlcnJvcjogRXJyb3IpOiBGdW5jdGlvbiB7XG4gIHJldHVybiAoZXJyb3IgYXMgYW55KVtFUlJPUl9UWVBFXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnQ29udGV4dChlcnJvcjogRXJyb3IpOiBEZWJ1Z0NvbnRleHQge1xuICByZXR1cm4gKGVycm9yIGFzIGFueSlbRVJST1JfREVCVUdfQ09OVEVYVF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPcmlnaW5hbEVycm9yKGVycm9yOiBFcnJvcik6IEVycm9yIHtcbiAgcmV0dXJuIChlcnJvciBhcyBhbnkpW0VSUk9SX09SSUdJTkFMX0VSUk9SXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVycm9yTG9nZ2VyKGVycm9yOiBFcnJvcik6IChjb25zb2xlOiBDb25zb2xlLCAuLi52YWx1ZXM6IGFueVtdKSA9PiB2b2lkIHtcbiAgcmV0dXJuIChlcnJvciBhcyBhbnkpW0VSUk9SX0xPR0dFUl0gfHwgZGVmYXVsdEVycm9yTG9nZ2VyO1xufVxuXG5cbmZ1bmN0aW9uIGRlZmF1bHRFcnJvckxvZ2dlcihjb25zb2xlOiBDb25zb2xlLCAuLi52YWx1ZXM6IGFueVtdKSB7XG4gICg8YW55PmNvbnNvbGUuZXJyb3IpKC4uLnZhbHVlcyk7XG59Il19