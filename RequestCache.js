/* @flow */

import {find, isEqual, remove} from 'lodash';

type RequestParams = {[key: string]: any};
type CacheEntry = {
    params: RequestParams;
    value: any;
    version: number;
};

const UNDEFINED: RequestParams = {};
const initialVersion = 0;

export default class RequestCache {
    _cache: {[key: string]: Array<CacheEntry>};
    _version: number;
    
    constructor() {
        this._cache = {};
        this._version = initialVersion;
    }

    getIfPresent(path: string, params?: RequestParams, minVersion: number = initialVersion) {
        const entries = this._cache[path];
        if (entries) {
            if (typeof params === 'undefined') {
                params = UNDEFINED;
            }
            const entry = find(entries, entry => isEqual(entry.params, params));
            if (entry && entry.version >= minVersion) {
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
        this._cache[path].push({ params, value, version: this._version });
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

    incrementVersion(): number {
        return ++this._version;
    }

    getVersion(): number {
        return this._version;
    }

    clear() {
        this._cache = {};
    }
}
