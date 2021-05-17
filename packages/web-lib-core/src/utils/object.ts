import * as utils from './';

/**
 *  OasEmpty contains empty objects that can be used instead of creating new empty objects
 */
export const OasEmpty = Object.freeze({
    object: Object.freeze({}),
    string: ''
});

/*
 * @ngdoc function
 * @name angular.extend
 * @kind function
 *
 * @description
 * Extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
 * to `dst`. You can specify multiple `src` objects. If you want to preserve original objects, you can do so
 * by passing an empty object as the target: `var object = angular.extend({}, object1, object2)`.
 *
 * **Note:** Keep in mind that `angular.extend` does not support recursive merge (deep copy). Use
 * {@link angular.merge} for this.
 *
 * @param {Object} dst Destination object.
 * @param {...Object} src Source object(s).
 * @returns {Object} Reference to `dst`.
 */
export function extend (dst, ...args) {
    return baseExtend(dst, args, false);
}

/*
 * @ngdoc function
 * @name angular.merge
 * @kind function
 *
 * @description
 * Deeply extends the destination object `dst` by copying own enumerable properties from the `src` object(s)
 * to `dst`. You can specify multiple `src` objects. If you want to preserve original objects, you can do so
 * by passing an empty object as the target: `var object = angular.merge({}, object1, object2)`.
 *
 * Unlike {@link angular.extend extend()}, `merge()` recursively descends into object properties of source
 * objects, performing a deep copy.
 *
 * @param {Object} dst Destination object.
 * @param {...Object} src Source object(s).
 * @returns {Object} Reference to `dst`.
 */
export function merge (dst, ...args) {
    return baseExtend(dst, args, true);
}

/** ------------------------
 Forked basic functions from AngularJs v1.5.8
 https://github.com/angular/angular.js/blob/aa306c14cb46f0fe51b6a964ef57fca10d53dc29/src/angular.js
 ------------------------ */
/**
  * Extend destination with data from objects, shallow (default) or deep
  * @param destination
  * @param objects
  * @param deep
  */
function baseExtend (destination: any, objects: any[], deep: boolean = false, level: number = 0) {

    if (level > 250) {
        throw new Error('[baseExtend] loop detected');
    }
    for (let i = 0; i < objects.length; ++i) {
        const obj = objects[i];
        if (!utils.isObject(obj) && !utils.isFunction(obj)) {
            continue;
        }
        const keys = Object.keys(obj);
        for (let j = 0; j < keys.length; j++) {
            const key = keys[j];
            const src = obj[key];

            if (deep && utils.isObject(src)) {
                if (utils.isDate(src)) {
                    destination[key] = new Date(src.valueOf());
                } else if (src.cloneOasObject) {
                    // Any object that exposes the cloneOasObject method will be copied by calling that method
                    // Used by OasExtendedValue and OasExtendedValueArray
                    // This is needed to get rid of dependencies to these modules which otherwise cause circular module loading
                    destination[key] = src.cloneOasObject();
                    //} else if (isRegExp(src)) {
                    //    dst[key] = new RegExp(src);
                    // } else if (src.nodeName) {
                    //     dst[key] = src.cloneNode(true);
                    // } else if (isElement(src)) {
                    //     dst[key] = src.clone();
                } else if (src.oasCopyReference) {
                    // The object is something that shall be copied by reference
                    destination[key] = src;
                } else {
                    if (!utils.isObject(destination[key])) {
                        destination[key] = utils.isArray(src) ? [] : {};
                    }
                    baseExtend(destination[key], [src], true, level + 1);
                }
            } else {
                destination[key] = src;
            }
        }
    }

    return destination;
}

/**
 * Flatten an array,
 * @param {Array} arr Array to flatten
 * @returns {any} Array with all inner arrays removed and merged into one array
 */
export function flattenArray (arr: Array<any>): Array<any> {
    return arr.reduce(function (flat, toFlatten) {
        return flat.concat(utils.isArray(toFlatten) ? flattenArray(toFlatten) : toFlatten);
    }, []);
}
