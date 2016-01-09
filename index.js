/* @flow */

type FetchRequest = {
    url: string
};
type FetchRequestMap = { [key: string]: FetchRequest };

type Client = (url: string) => Promise<any>;

type RouteSpec = {
    fetchData: () => FetchRequestMap
};
type Route = {
    fetchData: () => FetchRequestMap
};

export function createRoute(spec: RouteSpec): Route {
    return spec;
}

export function fetchData(client: Client, routes: Array<Route>): Promise<Array<any>> {
    var data: Array<{[key: string]: any}> = [];
    var promises: Array<Promise<any>> = [];
    routes.forEach(route => {
        var requestMap = route.fetchData();
        var routeData = {};
        data.push(routeData);
        for (let key in requestMap) {
            if (requestMap.hasOwnProperty(key)) {
                promises.push(client(requestMap[key].url).then(resp => {
                    routeData[key] = resp;
                }));
            }
        }
    });
    return Promise.all(promises).then(() => data);
}
