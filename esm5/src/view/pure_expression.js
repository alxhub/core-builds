/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { asPureExpressionData } from './types';
import { calcBindingFlags, checkAndUpdateBinding } from './util';
export function purePipeDef(checkIndex, argCount) {
    // argCount + 1 to include the pipe as first arg
    return _pureExpressionDef(128 /* TypePurePipe */, checkIndex, new Array(argCount + 1));
}
export function pureArrayDef(checkIndex, argCount) {
    return _pureExpressionDef(32 /* TypePureArray */, checkIndex, new Array(argCount));
}
export function pureObjectDef(checkIndex, propToIndex) {
    var keys = Object.keys(propToIndex);
    var nbKeys = keys.length;
    var propertyNames = new Array(nbKeys);
    for (var i = 0; i < nbKeys; i++) {
        var key = keys[i];
        var index = propToIndex[key];
        propertyNames[index] = key;
    }
    return _pureExpressionDef(64 /* TypePureObject */, checkIndex, propertyNames);
}
function _pureExpressionDef(flags, checkIndex, propertyNames) {
    var bindings = new Array(propertyNames.length);
    for (var i = 0; i < propertyNames.length; i++) {
        var prop = propertyNames[i];
        bindings[i] = {
            flags: 8 /* TypeProperty */,
            name: prop,
            ns: null,
            nonMinifiedName: prop,
            securityContext: null,
            suffix: null
        };
    }
    return {
        // will bet set by the view definition
        nodeIndex: -1,
        parent: null,
        renderParent: null,
        bindingIndex: -1,
        outputIndex: -1,
        // regular values
        checkIndex: checkIndex,
        flags: flags,
        childFlags: 0,
        directChildFlags: 0,
        childMatchedQueries: 0,
        matchedQueries: {},
        matchedQueryIds: 0,
        references: {},
        ngContentIndex: -1,
        childCount: 0, bindings: bindings,
        bindingFlags: calcBindingFlags(bindings),
        outputs: [],
        element: null,
        provider: null,
        text: null,
        query: null,
        ngContent: null
    };
}
export function createPureExpression(view, def) {
    return { value: undefined };
}
export function checkAndUpdatePureExpressionInline(view, def, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    var bindings = def.bindings;
    var changed = false;
    var bindLen = bindings.length;
    if (bindLen > 0 && checkAndUpdateBinding(view, def, 0, v0))
        changed = true;
    if (bindLen > 1 && checkAndUpdateBinding(view, def, 1, v1))
        changed = true;
    if (bindLen > 2 && checkAndUpdateBinding(view, def, 2, v2))
        changed = true;
    if (bindLen > 3 && checkAndUpdateBinding(view, def, 3, v3))
        changed = true;
    if (bindLen > 4 && checkAndUpdateBinding(view, def, 4, v4))
        changed = true;
    if (bindLen > 5 && checkAndUpdateBinding(view, def, 5, v5))
        changed = true;
    if (bindLen > 6 && checkAndUpdateBinding(view, def, 6, v6))
        changed = true;
    if (bindLen > 7 && checkAndUpdateBinding(view, def, 7, v7))
        changed = true;
    if (bindLen > 8 && checkAndUpdateBinding(view, def, 8, v8))
        changed = true;
    if (bindLen > 9 && checkAndUpdateBinding(view, def, 9, v9))
        changed = true;
    if (changed) {
        var data = asPureExpressionData(view, def.nodeIndex);
        var value = void 0;
        switch (def.flags & 201347067 /* Types */) {
            case 32 /* TypePureArray */:
                value = new Array(bindings.length);
                if (bindLen > 0)
                    value[0] = v0;
                if (bindLen > 1)
                    value[1] = v1;
                if (bindLen > 2)
                    value[2] = v2;
                if (bindLen > 3)
                    value[3] = v3;
                if (bindLen > 4)
                    value[4] = v4;
                if (bindLen > 5)
                    value[5] = v5;
                if (bindLen > 6)
                    value[6] = v6;
                if (bindLen > 7)
                    value[7] = v7;
                if (bindLen > 8)
                    value[8] = v8;
                if (bindLen > 9)
                    value[9] = v9;
                break;
            case 64 /* TypePureObject */:
                value = {};
                if (bindLen > 0)
                    value[bindings[0].name] = v0;
                if (bindLen > 1)
                    value[bindings[1].name] = v1;
                if (bindLen > 2)
                    value[bindings[2].name] = v2;
                if (bindLen > 3)
                    value[bindings[3].name] = v3;
                if (bindLen > 4)
                    value[bindings[4].name] = v4;
                if (bindLen > 5)
                    value[bindings[5].name] = v5;
                if (bindLen > 6)
                    value[bindings[6].name] = v6;
                if (bindLen > 7)
                    value[bindings[7].name] = v7;
                if (bindLen > 8)
                    value[bindings[8].name] = v8;
                if (bindLen > 9)
                    value[bindings[9].name] = v9;
                break;
            case 128 /* TypePurePipe */:
                var pipe = v0;
                switch (bindLen) {
                    case 1:
                        value = pipe.transform(v0);
                        break;
                    case 2:
                        value = pipe.transform(v1);
                        break;
                    case 3:
                        value = pipe.transform(v1, v2);
                        break;
                    case 4:
                        value = pipe.transform(v1, v2, v3);
                        break;
                    case 5:
                        value = pipe.transform(v1, v2, v3, v4);
                        break;
                    case 6:
                        value = pipe.transform(v1, v2, v3, v4, v5);
                        break;
                    case 7:
                        value = pipe.transform(v1, v2, v3, v4, v5, v6);
                        break;
                    case 8:
                        value = pipe.transform(v1, v2, v3, v4, v5, v6, v7);
                        break;
                    case 9:
                        value = pipe.transform(v1, v2, v3, v4, v5, v6, v7, v8);
                        break;
                    case 10:
                        value = pipe.transform(v1, v2, v3, v4, v5, v6, v7, v8, v9);
                        break;
                }
                break;
        }
        data.value = value;
    }
    return changed;
}
export function checkAndUpdatePureExpressionDynamic(view, def, values) {
    var bindings = def.bindings;
    var changed = false;
    for (var i = 0; i < values.length; i++) {
        // Note: We need to loop over all values, so that
        // the old values are updates as well!
        if (checkAndUpdateBinding(view, def, i, values[i])) {
            changed = true;
        }
    }
    if (changed) {
        var data = asPureExpressionData(view, def.nodeIndex);
        var value = void 0;
        switch (def.flags & 201347067 /* Types */) {
            case 32 /* TypePureArray */:
                value = values;
                break;
            case 64 /* TypePureObject */:
                value = {};
                for (var i = 0; i < values.length; i++) {
                    value[bindings[i].name] = values[i];
                }
                break;
            case 128 /* TypePurePipe */:
                var pipe = values[0];
                var params = values.slice(1);
                value = pipe.transform.apply(pipe, tslib_1.__spread(params));
                break;
        }
        data.value = value;
    }
    return changed;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVyZV9leHByZXNzaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdmlldy9wdXJlX2V4cHJlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFRQSxPQUFPLEVBQTZFLG9CQUFvQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ3pILE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUUvRCxNQUFNLHNCQUFzQixVQUFrQixFQUFFLFFBQWdCOztJQUU5RCxPQUFPLGtCQUFrQix5QkFBeUIsVUFBVSxFQUFFLElBQUksS0FBSyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3hGO0FBRUQsTUFBTSx1QkFBdUIsVUFBa0IsRUFBRSxRQUFnQjtJQUMvRCxPQUFPLGtCQUFrQix5QkFBMEIsVUFBVSxFQUFFLElBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Q0FDckY7QUFFRCxNQUFNLHdCQUF3QixVQUFrQixFQUFFLFdBQWtDO0lBQ2xGLElBQU0sSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDdEMsSUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUMzQixJQUFNLGFBQWEsR0FBRyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN4QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQy9CLElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwQixJQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsYUFBYSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQztLQUM1QjtJQUVE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QUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQy9CLE1BQU07b0JBQ1IsS0FBSyxDQUFDO3dCQUNKLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQ25DLE1BQU07b0JBQ1IsS0FBSyxDQUFDO3dCQUNKLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUN2QyxNQUFNO29CQUNSLEtBQUssQ0FBQzt3QkFDSixLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQzNDLE1BQU07b0JBQ1IsS0FBSyxDQUFDO3dCQUNKLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQy9DLE1BQU07b0JBQ1IsS0FBSyxDQUFDO3dCQUNKLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUNuRCxNQUFNO29CQUNSLEtBQUssQ0FBQzt3QkFDSixLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQ3ZELE1BQU07b0JBQ1IsS0FBSyxFQUFFO3dCQUNMLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7d0JBQzNELE1BQU07aUJBQ1Q7Z0JBQ0QsTUFBTTtTQUNUO1FBQ0QsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7S0FDcEI7SUFDRCxPQUFPLE9BQU8sQ0FBQztDQUNoQjtBQUVELE1BQU0sOENBQ0YsSUFBYyxFQUFFLEdBQVksRUFBRSxNQUFhO0lBQzdDLElBQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUM7SUFDOUIsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO0lBQ3BCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOzs7UUFHdEMsSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNsRCxPQUFPLEdBQUcsSUFBSSxDQUFDO1NBQ2hCO0tBQ0Y7SUFDRCxJQUFJLE9BQU8sRUFBRTtRQUNYLElBQU0sSUFBSSxHQUFHLG9CQUFvQixDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdkQsSUFBSSxLQUFLLFNBQUssQ0FBQztRQUNmLFFBQVEsR0FBRyxDQUFDLEtBQUssd0JBQWtCLEVBQUU7WUFDbkM7Z0JBQ0UsS0FBSyxHQUFHLE1BQU0sQ0FBQztnQkFDZixNQUFNO1lBQ1I7Z0JBQ0UsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDWCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtvQkFDdEMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFNLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ3ZDO2dCQUNELE1BQU07WUFDUjtnQkFDRSxJQUFNLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZCLElBQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQy9CLEtBQUssR0FBUyxJQUFJLENBQUMsU0FBUyxPQUFkLElBQUksbUJBQWUsTUFBTSxFQUFDLENBQUM7Z0JBQ3pDLE1BQU07U0FDVDtRQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0tBQ3BCO0lBQ0QsT0FBTyxPQUFPLENBQUM7Q0FDaEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7QmluZGluZ0RlZiwgQmluZGluZ0ZsYWdzLCBOb2RlRGVmLCBOb2RlRmxhZ3MsIFB1cmVFeHByZXNzaW9uRGF0YSwgVmlld0RhdGEsIGFzUHVyZUV4cHJlc3Npb25EYXRhfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7Y2FsY0JpbmRpbmdGbGFncywgY2hlY2tBbmRVcGRhdGVCaW5kaW5nfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgZnVuY3Rpb24gcHVyZVBpcGVEZWYoY2hlY2tJbmRleDogbnVtYmVyLCBhcmdDb3VudDogbnVtYmVyKTogTm9kZURlZiB7XG4gIC8vIGFyZ0NvdW50ICsgMSB0byBpbmNsdWRlIHRoZSBwaXBlIGFzIGZpcnN0IGFyZ1xuICByZXR1cm4gX3B1cmVFeHByZXNzaW9uRGVmKE5vZGVGbGFncy5UeXBlUHVyZVBpcGUsIGNoZWNrSW5kZXgsIG5ldyBBcnJheShhcmdDb3VudCArIDEpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHB1cmVBcnJheURlZihjaGVja0luZGV4OiBudW1iZXIsIGFyZ0NvdW50OiBudW1iZXIpOiBOb2RlRGVmIHtcbiAgcmV0dXJuIF9wdXJlRXhwcmVzc2lvbkRlZihOb2RlRmxhZ3MuVHlwZVB1cmVBcnJheSwgY2hlY2tJbmRleCwgbmV3IEFycmF5KGFyZ0NvdW50KSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwdXJlT2JqZWN0RGVmKGNoZWNrSW5kZXg6IG51bWJlciwgcHJvcFRvSW5kZXg6IHtbcDogc3RyaW5nXTogbnVtYmVyfSk6IE5vZGVEZWYge1xuICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocHJvcFRvSW5kZXgpO1xuICBjb25zdCBuYktleXMgPSBrZXlzLmxlbmd0aDtcbiAgY29uc3QgcHJvcGVydHlOYW1lcyA9IG5ldyBBcnJheShuYktleXMpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5iS2V5czsgaSsrKSB7XG4gICAgY29uc3Qga2V5ID0ga2V5c1tpXTtcbiAgICBjb25zdCBpbmRleCA9IHByb3BUb0luZGV4W2tleV07XG4gICAgcHJvcGVydHlOYW1lc1tpbmRleF0gPSBrZXk7XG4gIH1cblxuICByZXR1cm4gX3B1cmVFeHByZXNzaW9uRGVmKE5vZGVGbGFncy5UeXBlUHVyZU9iamVjdCwgY2hlY2tJbmRleCwgcHJvcGVydHlOYW1lcyk7XG59XG5cbmZ1bmN0aW9uIF9wdXJlRXhwcmVzc2lvbkRlZihcbiAgICBmbGFnczogTm9kZUZsYWdzLCBjaGVja0luZGV4OiBudW1iZXIsIHByb3BlcnR5TmFtZXM6IHN0cmluZ1tdKTogTm9kZURlZiB7XG4gIGNvbnN0IGJpbmRpbmdzOiBCaW5kaW5nRGVmW10gPSBuZXcgQXJyYXkocHJvcGVydHlOYW1lcy5sZW5ndGgpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BlcnR5TmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwcm9wID0gcHJvcGVydHlOYW1lc1tpXTtcbiAgICBiaW5kaW5nc1tpXSA9IHtcbiAgICAgIGZsYWdzOiBCaW5kaW5nRmxhZ3MuVHlwZVByb3BlcnR5LFxuICAgICAgbmFtZTogcHJvcCxcbiAgICAgIG5zOiBudWxsLFxuICAgICAgbm9uTWluaWZpZWROYW1lOiBwcm9wLFxuICAgICAgc2VjdXJpdHlDb250ZXh0OiBudWxsLFxuICAgICAgc3VmZml4OiBudWxsXG4gICAgfTtcbiAgfVxuICByZXR1cm4ge1xuICAgIC8vIHdpbGwgYmV0IHNldCBieSB0aGUgdmlldyBkZWZpbml0aW9uXG4gICAgbm9kZUluZGV4OiAtMSxcbiAgICBwYXJlbnQ6IG51bGwsXG4gICAgcmVuZGVyUGFyZW50OiBudWxsLFxuICAgIGJpbmRpbmdJbmRleDogLTEsXG4gICAgb3V0cHV0SW5kZXg6IC0xLFxuICAgIC8vIHJlZ3VsYXIgdmFsdWVzXG4gICAgY2hlY2tJbmRleCxcbiAgICBmbGFncyxcbiAgICBjaGlsZEZsYWdzOiAwLFxuICAgIGRpcmVjdENoaWxkRmxhZ3M6IDAsXG4gICAgY2hpbGRNYXRjaGVkUXVlcmllczogMCxcbiAgICBtYXRjaGVkUXVlcmllczoge30sXG4gICAgbWF0Y2hlZFF1ZXJ5SWRzOiAwLFxuICAgIHJlZmVyZW5jZXM6IHt9LFxuICAgIG5nQ29udGVudEluZGV4OiAtMSxcbiAgICBjaGlsZENvdW50OiAwLCBiaW5kaW5ncyxcbiAgICBiaW5kaW5nRmxhZ3M6IGNhbGNCaW5kaW5nRmxhZ3MoYmluZGluZ3MpLFxuICAgIG91dHB1dHM6IFtdLFxuICAgIGVsZW1lbnQ6IG51bGwsXG4gICAgcHJvdmlkZXI6IG51bGwsXG4gICAgdGV4dDogbnVsbCxcbiAgICBxdWVyeTogbnVsbCxcbiAgICBuZ0NvbnRlbnQ6IG51bGxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVB1cmVFeHByZXNzaW9uKHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYpOiBQdXJlRXhwcmVzc2lvbkRhdGEge1xuICByZXR1cm4ge3ZhbHVlOiB1bmRlZmluZWR9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVQdXJlRXhwcmVzc2lvbklubGluZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmLCB2MDogYW55LCB2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55LCB2NTogYW55LCB2NjogYW55LFxuICAgIHY3OiBhbnksIHY4OiBhbnksIHY5OiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgYmluZGluZ3MgPSBkZWYuYmluZGluZ3M7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGNvbnN0IGJpbmRMZW4gPSBiaW5kaW5ncy5sZW5ndGg7XG4gIGlmIChiaW5kTGVuID4gMCAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCAwLCB2MCkpIGNoYW5nZWQgPSB0cnVlO1xuICBpZiAoYmluZExlbiA+IDEgJiYgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgMSwgdjEpKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgaWYgKGJpbmRMZW4gPiAyICYmIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIDIsIHYyKSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gMyAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCAzLCB2MykpIGNoYW5nZWQgPSB0cnVlO1xuICBpZiAoYmluZExlbiA+IDQgJiYgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgNCwgdjQpKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgaWYgKGJpbmRMZW4gPiA1ICYmIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIDUsIHY1KSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gNiAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCA2LCB2NikpIGNoYW5nZWQgPSB0cnVlO1xuICBpZiAoYmluZExlbiA+IDcgJiYgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgNywgdjcpKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgaWYgKGJpbmRMZW4gPiA4ICYmIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIDgsIHY4KSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gOSAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCA5LCB2OSkpIGNoYW5nZWQgPSB0cnVlO1xuXG4gIGlmIChjaGFuZ2VkKSB7XG4gICAgY29uc3QgZGF0YSA9IGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXcsIGRlZi5ub2RlSW5kZXgpO1xuICAgIGxldCB2YWx1ZTogYW55O1xuICAgIHN3aXRjaCAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVzKSB7XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlUHVyZUFycmF5OlxuICAgICAgICB2YWx1ZSA9IG5ldyBBcnJheShiaW5kaW5ncy5sZW5ndGgpO1xuICAgICAgICBpZiAoYmluZExlbiA+IDApIHZhbHVlWzBdID0gdjA7XG4gICAgICAgIGlmIChiaW5kTGVuID4gMSkgdmFsdWVbMV0gPSB2MTtcbiAgICAgICAgaWYgKGJpbmRMZW4gPiAyKSB2YWx1ZVsyXSA9IHYyO1xuICAgICAgICBpZiAoYmluZExlbiA+IDMpIHZhbHVlWzNdID0gdjM7XG4gICAgICAgIGlmIChiaW5kTGVuID4gNCkgdmFsdWVbNF0gPSB2NDtcbiAgICAgICAgaWYgKGJpbmRMZW4gPiA1KSB2YWx1ZVs1XSA9IHY1O1xuICAgICAgICBpZiAoYmluZExlbiA+IDYpIHZhbHVlWzZdID0gdjY7XG4gICAgICAgIGlmIChiaW5kTGVuID4gNykgdmFsdWVbN10gPSB2NztcbiAgICAgICAgaWYgKGJpbmRMZW4gPiA4KSB2YWx1ZVs4XSA9IHY4O1xuICAgICAgICBpZiAoYmluZExlbiA+IDkpIHZhbHVlWzldID0gdjk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVB1cmVPYmplY3Q6XG4gICAgICAgIHZhbHVlID0ge307XG4gICAgICAgIGlmIChiaW5kTGVuID4gMCkgdmFsdWVbYmluZGluZ3NbMF0ubmFtZSAhXSA9IHYwO1xuICAgICAgICBpZiAoYmluZExlbiA+IDEpIHZhbHVlW2JpbmRpbmdzWzFdLm5hbWUgIV0gPSB2MTtcbiAgICAgICAgaWYgKGJpbmRMZW4gPiAyKSB2YWx1ZVtiaW5kaW5nc1syXS5uYW1lICFdID0gdjI7XG4gICAgICAgIGlmIChiaW5kTGVuID4gMykgdmFsdWVbYmluZGluZ3NbM10ubmFtZSAhXSA9IHYzO1xuICAgICAgICBpZiAoYmluZExlbiA+IDQpIHZhbHVlW2JpbmRpbmdzWzRdLm5hbWUgIV0gPSB2NDtcbiAgICAgICAgaWYgKGJpbmRMZW4gPiA1KSB2YWx1ZVtiaW5kaW5nc1s1XS5uYW1lICFdID0gdjU7XG4gICAgICAgIGlmIChiaW5kTGVuID4gNikgdmFsdWVbYmluZGluZ3NbNl0ubmFtZSAhXSA9IHY2O1xuICAgICAgICBpZiAoYmluZExlbiA+IDcpIHZhbHVlW2JpbmRpbmdzWzddLm5hbWUgIV0gPSB2NztcbiAgICAgICAgaWYgKGJpbmRMZW4gPiA4KSB2YWx1ZVtiaW5kaW5nc1s4XS5uYW1lICFdID0gdjg7XG4gICAgICAgIGlmIChiaW5kTGVuID4gOSkgdmFsdWVbYmluZGluZ3NbOV0ubmFtZSAhXSA9IHY5O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVQdXJlUGlwZTpcbiAgICAgICAgY29uc3QgcGlwZSA9IHYwO1xuICAgICAgICBzd2l0Y2ggKGJpbmRMZW4pIHtcbiAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICB2YWx1ZSA9IHBpcGUudHJhbnNmb3JtKHYwKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIHZhbHVlID0gcGlwZS50cmFuc2Zvcm0odjEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgdmFsdWUgPSBwaXBlLnRyYW5zZm9ybSh2MSwgdjIpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSA0OlxuICAgICAgICAgICAgdmFsdWUgPSBwaXBlLnRyYW5zZm9ybSh2MSwgdjIsIHYzKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgNTpcbiAgICAgICAgICAgIHZhbHVlID0gcGlwZS50cmFuc2Zvcm0odjEsIHYyLCB2MywgdjQpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgdmFsdWUgPSBwaXBlLnRyYW5zZm9ybSh2MSwgdjIsIHYzLCB2NCwgdjUpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSA3OlxuICAgICAgICAgICAgdmFsdWUgPSBwaXBlLnRyYW5zZm9ybSh2MSwgdjIsIHYzLCB2NCwgdjUsIHY2KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgODpcbiAgICAgICAgICAgIHZhbHVlID0gcGlwZS50cmFuc2Zvcm0odjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSA5OlxuICAgICAgICAgICAgdmFsdWUgPSBwaXBlLnRyYW5zZm9ybSh2MSwgdjIsIHYzLCB2NCwgdjUsIHY2LCB2NywgdjgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxMDpcbiAgICAgICAgICAgIHZhbHVlID0gcGlwZS50cmFuc2Zvcm0odjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4LCB2OSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgZGF0YS52YWx1ZSA9IHZhbHVlO1xuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVQdXJlRXhwcmVzc2lvbkR5bmFtaWMoXG4gICAgdmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZiwgdmFsdWVzOiBhbnlbXSk6IGJvb2xlYW4ge1xuICBjb25zdCBiaW5kaW5ncyA9IGRlZi5iaW5kaW5ncztcbiAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb3RlOiBXZSBuZWVkIHRvIGxvb3Agb3ZlciBhbGwgdmFsdWVzLCBzbyB0aGF0XG4gICAgLy8gdGhlIG9sZCB2YWx1ZXMgYXJlIHVwZGF0ZXMgYXMgd2VsbCFcbiAgICBpZiAoY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgaSwgdmFsdWVzW2ldKSkge1xuICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgfVxuICB9XG4gIGlmIChjaGFuZ2VkKSB7XG4gICAgY29uc3QgZGF0YSA9IGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXcsIGRlZi5ub2RlSW5kZXgpO1xuICAgIGxldCB2YWx1ZTogYW55O1xuICAgIHN3aXRjaCAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVzKSB7XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlUHVyZUFycmF5OlxuICAgICAgICB2YWx1ZSA9IHZhbHVlcztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlUHVyZU9iamVjdDpcbiAgICAgICAgdmFsdWUgPSB7fTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB2YWx1ZVtiaW5kaW5nc1tpXS5uYW1lICFdID0gdmFsdWVzW2ldO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVB1cmVQaXBlOlxuICAgICAgICBjb25zdCBwaXBlID0gdmFsdWVzWzBdO1xuICAgICAgICBjb25zdCBwYXJhbXMgPSB2YWx1ZXMuc2xpY2UoMSk7XG4gICAgICAgIHZhbHVlID0gKDxhbnk+cGlwZS50cmFuc2Zvcm0pKC4uLnBhcmFtcyk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBkYXRhLnZhbHVlID0gdmFsdWU7XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG4iXX0=