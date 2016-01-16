/* @flow */

import {find, isEqual, remove} from 'lodash';

type RequestParams = {[key: string]: any};
type CacheEntry = {
    params: RequestParams;
    value: any;
};

const UNDEFINED: RequestParams = {};

export default class RequestCache {
    _cache: {[key: string]: Array<CacheEntry>};
    
    constructor() {
        this._cache = {};
    }

    getIfPresent(path: string, params?: RequestParams) {
        const entries = this._cache[path];
        if (entries) {
            if (typeof params === 'undefined') {
                params = UNDEFINED;
            }
            const entry = find(entries, entry => isEqual(entry.params, params));
            if (entry) {
                return entry.value;
            }
        }
    }

    put(path: string, params?: RequestParams, value: any) {
        if (typeof params === 'undefined') {
            params = UNDEFINED;
        }
        if (!this._cache[path]) {
            this._cache[path] = [];
        }
        this._cache[path].push({ params, value });
    }

    remove(path: string, params: RequestParams) {
        const entries = this._cache[path];
        if (entries) {
            if (typeof params === 'undefined') {
                params = UNDEFINED;
            }
            remove(entries, entry => isEqual(entry.params, params));
            if (entries.length === 0) {
                delete this._cache[path];
            }
        }
    }

    clear() {
        this._cache = {};
    }
}
