import axios from 'axios';
console.log('Test');
export function api (): string {
    return axios.VERSION;
}

export function api2 (): string {
    return axios.VERSION;
}

/*
 * @description
 * Determines if a reference is undefined.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is undefined.
 */
export function isUndefined (value): value is undefined {
    return typeof value === 'undefined';
}

/*
 * @description
 * Determines if a reference is defined.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is defined.
 */
export function isDefined (value): value is any {
    return typeof value !== 'undefined';
}

/*
 * @description
 * Determines if a reference is an `Object`. Unlike `typeof` in JavaScript, `null`s are not
 * considered to be objects. Note that JavaScript arrays are objects.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is an `Object` but not `null`.
 */
export function isObject (value): boolean {
    // http://jsperf.com/isobject4
    return value !== null && typeof value === 'object';
}

/*
 * Determine if a value is an object with a null prototype
 *
 * @returns {boolean} True if `value` is an `Object` with a null prototype
 */
export function isBlankObject (value): boolean {
    return value !== null && typeof value === 'object' && !Object.getPrototypeOf(value);
}

/*
 * @description
 * Determines if a reference is a `String`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `String`.
 */
export function isString (value): value is string {
    return typeof value === 'string';
}

/*
 * @description
 * Determines if a reference is a `Number`.
 *
 * This includes the "special" numbers `NaN`, `+Infinity` and `-Infinity`.
 *
 * If you wish to exclude these then you can use the native
 * [`isFinite'](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/isFinite)
 * method.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Number`.
 */
export function isNumber (value): value is number {
    return typeof value === 'number';
}

/**
 * Check if a value is an integer
 * @param value The value to check
 * @returns {boolean} true if the value is an integer
 */
export function isInteger (value: any): boolean {
    return isNumber(value) && isFinite(value) && Math.floor(value) === value;
}

/*
 * @description
 * Determines if a value is a date.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Date`.
 */
export function isDate (value): value is Date {
    return Object.prototype.toString.call(value) === '[object Date]';
}

/*
 * @description
 * Determines if a reference is an `Array`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is an `Array`.
 */
export const isArray = Array.isArray;

/*
 * @description
 * Determines if a reference is a `Function`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `Function`.
 */
export function isFunction (value): value is (...args) => any {
    return typeof value === 'function';
}

/*
 * @description
 * Determines if a reference is a `boolean`.
 *
 * @param {*} value Reference to check.
 * @returns {boolean} True if `value` is a `boolean`.
 */
export function isBoolean (value: any): value is boolean {
    return typeof value === 'boolean';
}

/**
 * Check if the value passed is true using a fuzzy test
 * @param value to check
 * @param strict true to make a strict check false will treat strings that are > '' and not a definite false as true
 * @returns true or false
 */
export function isFuzzyTrue (value: any, strict: boolean = true): boolean {
    if (value == null) {
        return false;
    }
    if (isBoolean(value)) {
        return value;
    }
    if (isNumber(value)) {
        return value !== 0;
    }
    if (isString(value)) {
        switch (value.toLowerCase()) {
        case 'yes':
        case 'true':
            return true;
        case 'no':
        case 'false':
            return false;
        default:
            if (strict === false) {
                if (value.trim().length > 0) {
                    return true;
                }
                return false;
            }
            throw new Error('isFuzzyTrue - String not supported: ' + value.toLowerCase());
        }
    }
    throw new Error('isFuzzyTrue - Objects and arrays are not supported');
}

/**
 * Checks if `obj` is a window object.
 *
 * @private
 * @param {*} obj Object to check
 * @returns {boolean} True if `obj` is a window obj.
 */
export function isWindow (obj): obj is Window {
    return obj && obj.window === obj;
}

/**
 * Return Window object for browsers and an empty object for Node.JS
 */
export function getWindow (): Window | Record<any, any> {
    return hasBrowserCapabilities() ? window : Object.create(null);
}

/**
 * Return Navigator object for browsers and an empty object for Node.JS
 */
export function getNavigator (): Navigator | Record<any, any> {
    return hasBrowserCapabilities() ? window.navigator : Object.create(null);
}

/**
 * Check if the current process has browser capabilities by checking the existance of a window object.
 */
export function hasBrowserCapabilities (): Boolean {
    let result;
    try {
        result = typeof window !== 'undefined' && typeof window.navigator !== 'undefined';
    } catch (error) {
        result = false;
    }
    return result;
}

/**
 * @private
 * @param {*} obj
 * @return {boolean} Returns true if `obj` is an array or array-like object (NodeList, Arguments,
 *                   String ...)
 */
export function isArrayLike (obj) {

    // `null`, `undefined` and `window` are not array-like
    if (obj == null || isWindow(obj)) {
        return false;
    }

    // arrays, strings and jQuery/jqLite objects are array like
    // * jqLite is either the jQuery or jqLite constructor function
    // * we have to check the existence of jqLite first as this method is called
    //   via the forEach method when constructing the jqLite object in the first place
    if (isArray(obj) || isString(obj)) {
        return true;
    }

    // Support: iOS 8.2 (not reproducible in simulator)
    // "length" in obj used to prevent JIT error (gh-11508)
    const length = 'length' in Object(obj) && obj.length;

    // NodeList objects (with `item` method) and
    // other objects with suitable length characteristics are array-like
    return isNumber(length) &&
        (length >= 0 && ((length - 1) in obj || obj instanceof Array) || typeof obj.item === 'function');

}

/* * @kind function
 *
 * @description
 * Invokes the `iterator` function once for each item in `obj` collection, which can be either an
 * object or an array. The `iterator` function is invoked with `iterator(value, key, obj)`, where `value`
 * is the value of an object property or an array element, `key` is the object property key or
 * array element index and obj is the `obj` itself. Specifying a `context` for the function is optional.
 *
 * It is worth noting that `.forEach` does not iterate over inherited properties because it filters
 * using the `hasOwnProperty` method.
 *
 * Unlike ES262's
 * [Array.prototype.forEach](http://www.ecma-international.org/ecma-262/5.1/#sec-15.4.4.18),
 * providing 'undefined' or 'null' values for `obj` will not throw a TypeError, but rather just
 * return the value provided.
 *
 ```js
 var values = {name: 'misko', gender: 'male'};
 var log = [];
 angular.forEach(values, function(value, key) {
       this.push(key + ': ' + value);
     }, log);
 expect(log).toEqual(['name: misko', 'gender: male']);
 ```
 *
 * @param {Object|Array} obj Object to iterate over.
 * @param {Function} iterator Iterator function.
 * @param {Object=} context Object to become context (`this`) for the iterator function.
 * @returns {Object|Array} Reference to `obj`.
 */

export function forEach (obj, iterator, context?) {
    let key;
    let length;
    if (obj) {
        if (isFunction(obj)) {
            for (key in obj) {
                if (key !== 'prototype' && key !== 'length' && key !== 'name' && obj.hasOwnProperty(key)) {
                    iterator.call(context, obj[key], key, obj);
                }
            }
        } else if (isArray(obj) || isArrayLike(obj)) {
            const isPrimitive = typeof obj !== 'object';
            for (key = 0, length = obj.length; key < length; key++) {
                if (isPrimitive || key in obj) {
                    iterator.call(context, obj[key], key, obj);
                }
            }
        } else if (obj.forEach && obj.forEach !== forEach) {
            obj.forEach(iterator, context, obj);
        } else if (isBlankObject(obj)) {
            // createMap() fast path --- Safe to avoid hasOwnProperty check because prototype chain is empty
            for (key in obj) {
                iterator.call(context, obj[key], key, obj);
            }
        } else if (typeof obj.hasOwnProperty === 'function') {
            // Slow path for objects inheriting Object.prototype, hasOwnProperty check needed
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    iterator.call(context, obj[key], key, obj);
                }
            }
        } else {
            // Slow path for objects which do not have a method `hasOwnProperty`
            for (key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    iterator.call(context, obj[key], key, obj);
                }
            }
        }
    }
    return obj;
}

type AsyncForEachCallback<T> = (item: T, key?: number | string, collection?: Array<T> | Map<string|number, T> | Record<string, T>) => Promise<boolean> | Promise<void> | void;

/**
 * Simple utils for using asynchronus foreach
 *
 * @export
 * @param {*} collection
 * @param {*} callback
 */

export async function asyncForEach<T> (collection: Array<T> | Map<string|number, T> | Record<string, T>, callback: AsyncForEachCallback<T>) {
    if (!Array.isArray(collection) && !(collection instanceof Map) && typeof collection !== 'object') {
        throw new Error('Only Array and Map are supported.');
    }

    // We have to handle map a little bit differently
    if (collection instanceof Map) {
        if (!collection.size) {
            return;
        }
        const mapKeys = Array.from(collection.keys());
        const mapValues = Array.from(collection.values());
        for (let index = 0; index < collection.size; index++) {
            const result = await callback(mapValues[index], mapKeys[index], collection);
            if (result === true) {
                break;
            }
        }
    } else if (Array.isArray(collection)) {
        if (!collection.length) {
            return;
        }

        for (let index = 0; index < collection.length; index++) {
            const result = await callback(collection[index], index, collection);
            if (result === true) {
                break;
            }
        }
    } else if (typeof collection === 'object') {
        const keys = Object.keys(collection);
        if (!keys.length) {
            return;
        }

        for (let index = 0; index < keys.length; index++) {
            const key = keys[index];
            const result = await callback(collection[key], key, collection);
            if (result === true) {
                break;
            }
        }
    }
}

/**
 * @description
 * Converts a value to a string.
 * Handles string, number, boolean, date
 *
 * @param value A value of any type that will be converted to a string
 *  @returns {string} The value converted to a string
 */
export function toString (value: any): string {
    // Ensure that value is a string or else convert it to a string

    if (value == null) {
        value = '';
    } else if (!isString(value)) {
        if (isNumber(value) || isBoolean(value)) {
            value = value.toString(); // convert to a string representing the number
        } else if (isDate(value)) {
            // A date, convert to ISO string
            value = value.toISOString();
        } else {
            // This cannot be logged by oas.log due to circular dependency
            throw new Error('Value of type ' + typeof value + " can't be converted to a string.");
        }
    }
    return value;
}

/**
 * Convert a string to something that can be sorted with numeric values in order
 * @param {string} value
 * @returns {string}
 */
export function toSortString (value: string): string {
    return value.replace(/[0-9]+/g, (match) => {
        const numStr = '0000000000000000' + match;
        return numStr.substr(numStr.length - 16);
    });
}

export type ScrollElementIntoViewOptions = {
    customCoverTopElement?: HTMLElement;
    customCoverBottomElement?: HTMLElement;
};

export function queryParamsAsObject (): Record<string, string> {
    if (!hasBrowserCapabilities()) {
        return {};
    }
    const hasHashQueryParams = location.href.indexOf('#') !== -1 && location.href.indexOf('?') > location.href.indexOf('#');

    let search = hasHashQueryParams ? location.hash.substring(location.hash.indexOf('?') + 1) : location.search.substring(1);
    // Clean up multiple delimters and starting delimiters
    while (hasInvalidFormat(search)) {
        search = search.replace('?&', '').replace('&&', '&').replace(/^&/, '');
    }

    const searchAsJSON = '{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}';

    return !search ? {} : JSON.parse(searchAsJSON, (key, value) => {
        return key === '' ? value : decodeURIComponent(value);
    });
}

function hasInvalidFormat (search: string) {
    return search[0] === '?' || search[0] === '&' || search.match(/&&/);
}

export function getRandomString () {
    return Math.random().toString(36).slice(-10);
}

export function hashPathname (): string {
    // window.location.pathname returns /oas/utils/
    // We want to get the actual pathname/route of the Angular/AngularJs application, i.e. /knockdown2
    // This is a universal replacement for $location.path() from AngularJs
    const hash = window.location.hash;
    const pathMatches = hash.match(/^#([^\?]*)/);

    return pathMatches ? pathMatches[1] : '';
}

/**
 * EventEmitter wrapper for use with Angular & bindings in components
 * @param payload
 */
export const eventEmitter = payload => ({ $event: payload });

export const OasCollatorSv = new Intl.Collator('sv');
export const OasCollatorEn = new Intl.Collator('en');
export const OasCollatorSvNum = new Intl.Collator('sv', { numeric: true });
export const OasCollatorEnNum = new Intl.Collator('en', { numeric: true });

/**
 * Return an unique id
 * @returns {number} An unique number
 */
let uniqueIdCounter = 0;
export function uniqueId () {
    return uniqueIdCounter++;
}
