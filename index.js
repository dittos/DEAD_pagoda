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

type FetchResult = {
    data: Array<{[key: string]: number}>;
    responses: Array<any>;
};

export function createRoute(spec: RouteSpec): Route {
    return spec;
}

function normalizingClient(client: Client, accum: Array<any>): Client {
    return (path, params) => client(path, params).then(resp => {
        accum.push(resp);
        const respID = accum.length - 1;
        return respID;
    });
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

function fetchInto(client: Client, responses: Array<any>, requestMap: FetchRequestMap, data) {
    var promises = [];
    for (let key in requestMap) {
        if (requestMap.hasOwnProperty(key)) {
            var request = requestMap[key];
            promises.push(client(request.url, request.params).then(resp => {
                data[key] = resp;
                if (request.andThen) {
                    return fetchInto(client, responses, request.andThen(responses[resp]), data);
                }
            }));
        }
    }
    return Promise.all(promises);
}

export function fetchData(client: Client, routes: Array<Route>): Promise<FetchResult> {
    const responses = [];
    client = normalizingClient(client, responses);
    const cache = new RequestCache();
    client = dedupingClient(client, cache);
    var data: Array<{[key: string]: any}> = [];
    var promises: Array<Promise<any>> = [];
    routes.forEach(route => {
        var requestMap = route.fetchData();
        var routeData: {[key: string]: any} = {};
        promises.push(fetchInto(client, responses, requestMap, routeData));
        data.push(routeData);
    });
    return Promise.all(promises).then(() => ({responses, data}));
}

export function denormalize({responses, data}: FetchResult): Array<any> {
    return data.map(routeData => {
        const result = {};
        for (let key in routeData) {
            if (routeData.hasOwnProperty(key)) {
                result[key] = responses[routeData[key]];
            }
        }
        return result;
    });
}
