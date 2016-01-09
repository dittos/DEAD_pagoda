import {find, isEqual, remove} from 'lodash';

const UNDEFINED = '';
const initialVersion = 0;

export default class RequestCache {
    constructor() {
        this._cache = {};
        this._version = initialVersion;
    }

    getIfPresent(path, params, minVersion = initialVersion) {
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

    put(path, params, value) {
        if (typeof params === 'undefined') {
            params = UNDEFINED;
        }
        if (!this._cache[path]) {
            this._cache[path] = [];
        }
        this._cache[path].push({ params, value, version: this._version });
    }

    remove(path, params) {
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

    incrementVersion() {
        return ++this._version;
    }

    getVersion() {
        return this._version;
    }

    clear() {
        this._cache = {};
    }
}
