/* @flow */

import RequestCache from './RequestCache';

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

export function createRoute(spec: RouteSpec): Route {
    return spec;
}

function dedupingClient(client: Client): Client {
    const ongoingRequests = new RequestCache();
    const cache = new RequestCache();
    const callWithCache = (f, path, params) => {
        const cachedResult = cache.getIfPresent(path, params);
        if (cachedResult) {
            return Promise.resolve(cachedResult);
        }
        var promise = ongoingRequests.getIfPresent(path, params);
        if (!promise) {
            promise = f().then(result => {
                ongoingRequests.remove(path, params);
                cache.put(path, params, result);
                return result;
            }, err => {
                ongoingRequests.remove(path, params);
                return Promise.reject(err);
            });
            ongoingRequests.put(path, params, promise);
        }
        return promise;
    };
    return (path, params) => {
        return callWithCache(() => client(path, params), path, params);
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

export function fetchData(client: Client, routes: Array<Route>): Promise<Array<any>> {
    client = dedupingClient(client);
    var data: Array<{[key: string]: any}> = [];
    var promises: Array<Promise<any>> = [];
    routes.forEach(route => {
        var requestMap = route.fetchData();
        var routeData: {[key: string]: any} = {};
        promises.push(fetchInto(client, requestMap, routeData));
        data.push(routeData);
    });
    return Promise.all(promises).then(() => data);
}
