/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertEqual, assertNotNull } from './assert';
export function assertNodeType(node, type) {
    assertNotNull(node, 'should be called with a node');
    assertEqual(node.tNode.type, type, "should be a " + typeName(type));
}
export function assertNodeOfPossibleTypes(node) {
    var types = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        types[_i - 1] = arguments[_i];
    }
    assertNotNull(node, 'should be called with a node');
    var found = types.some(function (type) { return node.tNode.type === type; });
    assertEqual(found, true, "Should be one of " + types.map(typeName).join(', '));
}
function typeName(type) {
    if (type == 1 /* Projection */)
        return 'Projection';
    if (type == 0 /* Container */)
        return 'Container';
    if (type == 2 /* View */)
        return 'View';
    if (type == 3 /* Element */)
        return 'Element';
    return '<unknown>';
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV9hc3NlcnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL25vZGVfYXNzZXJ0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsV0FBVyxFQUFFLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUdwRCxNQUFNLHlCQUF5QixJQUFXLEVBQUUsSUFBZTtJQUN6RCxhQUFhLENBQUMsSUFBSSxFQUFFLDhCQUE4QixDQUFDLENBQUM7SUFDcEQsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxpQkFBZSxRQUFRLENBQUMsSUFBSSxDQUFHLENBQUMsQ0FBQztDQUNyRTtBQUVELE1BQU0sb0NBQW9DLElBQVc7SUFBRSxlQUFxQjtTQUFyQixVQUFxQixFQUFyQixxQkFBcUIsRUFBckIsSUFBcUI7UUFBckIsOEJBQXFCOztJQUMxRSxhQUFhLENBQUMsSUFBSSxFQUFFLDhCQUE4QixDQUFDLENBQUM7SUFDcEQsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFBLElBQUksSUFBSSxPQUFBLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLElBQUksRUFBeEIsQ0FBd0IsQ0FBQyxDQUFDO0lBQzNELFdBQVcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLHNCQUFvQixLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUcsQ0FBQyxDQUFDO0NBQ2hGO0FBRUQsa0JBQWtCLElBQWU7SUFDL0IsSUFBSSxJQUFJLHNCQUF3QjtRQUFFLE9BQU8sWUFBWSxDQUFDO0lBQ3RELElBQUksSUFBSSxxQkFBdUI7UUFBRSxPQUFPLFdBQVcsQ0FBQztJQUNwRCxJQUFJLElBQUksZ0JBQWtCO1FBQUUsT0FBTyxNQUFNLENBQUM7SUFDMUMsSUFBSSxJQUFJLG1CQUFxQjtRQUFFLE9BQU8sU0FBUyxDQUFDO0lBQ2hELE9BQU8sV0FBVyxDQUFDO0NBQ3BCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydEVxdWFsLCBhc3NlcnROb3ROdWxsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0xOb2RlLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vZGVUeXBlKG5vZGU6IExOb2RlLCB0eXBlOiBUTm9kZVR5cGUpIHtcbiAgYXNzZXJ0Tm90TnVsbChub2RlLCAnc2hvdWxkIGJlIGNhbGxlZCB3aXRoIGEgbm9kZScpO1xuICBhc3NlcnRFcXVhbChub2RlLnROb2RlLnR5cGUsIHR5cGUsIGBzaG91bGQgYmUgYSAke3R5cGVOYW1lKHR5cGUpfWApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhub2RlOiBMTm9kZSwgLi4udHlwZXM6IFROb2RlVHlwZVtdKSB7XG4gIGFzc2VydE5vdE51bGwobm9kZSwgJ3Nob3VsZCBiZSBjYWxsZWQgd2l0aCBhIG5vZGUnKTtcbiAgY29uc3QgZm91bmQgPSB0eXBlcy5zb21lKHR5cGUgPT4gbm9kZS50Tm9kZS50eXBlID09PSB0eXBlKTtcbiAgYXNzZXJ0RXF1YWwoZm91bmQsIHRydWUsIGBTaG91bGQgYmUgb25lIG9mICR7dHlwZXMubWFwKHR5cGVOYW1lKS5qb2luKCcsICcpfWApO1xufVxuXG5mdW5jdGlvbiB0eXBlTmFtZSh0eXBlOiBUTm9kZVR5cGUpOiBzdHJpbmcge1xuICBpZiAodHlwZSA9PSBUTm9kZVR5cGUuUHJvamVjdGlvbikgcmV0dXJuICdQcm9qZWN0aW9uJztcbiAgaWYgKHR5cGUgPT0gVE5vZGVUeXBlLkNvbnRhaW5lcikgcmV0dXJuICdDb250YWluZXInO1xuICBpZiAodHlwZSA9PSBUTm9kZVR5cGUuVmlldykgcmV0dXJuICdWaWV3JztcbiAgaWYgKHR5cGUgPT0gVE5vZGVUeXBlLkVsZW1lbnQpIHJldHVybiAnRWxlbWVudCc7XG4gIHJldHVybiAnPHVua25vd24+Jztcbn1cbiJdfQ==