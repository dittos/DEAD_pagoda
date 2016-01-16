/* @flow */

import {find, isEqual, remove} from 'lodash';

type RequestParams = {[key: string]: any};
type CacheEntry = {
    params?: RequestParams;
    value: any;
};
export type CacheData = {[key: string]: Array<CacheEntry>};

export default class RequestCache {
    _cache: CacheData;
    
    constructor(cache: CacheData = {}) {
        this._cache = cache;
    }

    getIfPresent(path: string, params?: RequestParams) {
        const entries = this._cache[path];
        if (entries) {
            const entry = find(entries, entry => isEqual(entry.params, params));
            if (entry) {
                return entry.value;
            }
        }
    }

    put(path: string, params?: RequestParams, value: any) {
        if (!this._cache[path]) {
            this._cache[path] = [];
        }
        const entry: CacheEntry = { value };
        if (typeof params !== 'undefined') {
            entry.params = params;
        }
        this._cache[path].push(entry);
    }

    remove(path: string, params: RequestParams) {
        const entries = this._cache[path];
        if (entries) {
            remove(entries, entry => isEqual(entry.params, params));
            if (entries.length === 0) {
                delete this._cache[path];
            }
        }
    }

    clear() {
        this._cache = {};
    }
    
    toJSON(): CacheData {
        return this._cache;
    }
}
