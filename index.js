/* @flow */

import RequestCache from './RequestCache';
import type {CacheData} from './RequestCache';

type FetchRequest = {
    url: string;
    params?: {[key: string]: any};
    andThen?: (data: any) => FetchRequestMap;
};
type FetchRequestMap = { [key: string]: FetchRequest };

type Client = (url: string, params?: {[key: string]: any}) => Promise<any>;

type RouteSpec = {
    fetchData: () => FetchRequestMap
};
type Route = {
    fetchData: () => FetchRequestMap
};

type FetchResult = {
    data: Array<{[key: string]: any}>;
    cache: CacheData;
};
type FetchStatus = {
    promise: Promise<FetchResult>;
    progress: Array<string>;
};

export function createRoute(spec: RouteSpec): Route {
    return spec;
}

function dedupingClient(client: Client, cache: RequestCache): Client {
    return (path, params) => {
        const cachedResult = cache.getIfPresent(path, params);
        if (cachedResult) {
            return cachedResult;
        }
        var promise = client(path, params);
        cache.put(path, params, promise);
        return promise;
    };
}

function fetchInto(client: Client, requestMap: FetchRequestMap, data) {
    var promises = [];
    for (let key in requestMap) {
        if (requestMap.hasOwnProperty(key)) {
            var request = requestMap[key];
            promises.push(client(request.url, request.params).then(resp => {
                data[key] = resp;
                if (request.andThen) {
                    return fetchInto(client, request.andThen(resp), data);
                }
            }));
        }
    }
    return Promise.all(promises);
}

export function fetchDataWithProgress(client: Client, routes: Array<Route>, progressCallback?: Function): FetchStatus {
    const cache = new RequestCache();
    client = dedupingClient(client, cache);
    var data: Array<{[key: string]: any}> = [];
    var promises: Array<Promise<any>> = [];
    var progress: Array<string> = [];
    routes.forEach((route, index) => {
        var requestMap = route.fetchData();
        var routeData: {[key: string]: any} = {};
        promises.push(fetchInto(client, requestMap, routeData).then(result => {
            progress[index] = 'complete';
            progressCallback && progressCallback();
            return result;
        }));
        data.push(routeData);
        progress.push('loading');
    });
    const promise = Promise.all(promises).then(() => ({cache: cache.toJSON(), data}));
    return {
        promise,
        progress
    };
}

export function fetchData(client: Client, routes: Array<Route>): Promise<FetchResult> {
    return fetchDataWithProgress(client, routes).promise;
}

export function allCached(route: Route, cache: RequestCache): boolean {
    var requestMap = route.fetchData();
    return _allCached(requestMap, cache);
}

function _allCached(requestMap: FetchRequestMap, cache: RequestCache): boolean {
    for (let key in requestMap) {
        if (requestMap.hasOwnProperty(key)) {
            var request = requestMap[key];
            var cachedResult = cache.getIfPresent(request.url, request.params); 
            if (!cachedResult) {
                return false;
            }
            if (request.andThen && !_allCached(request.andThen(cachedResult), cache)) {
                return false;
            }
        }
    }
    return true;
}
