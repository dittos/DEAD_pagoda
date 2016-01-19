// @flow
import {describe, it} from 'mocha';
import {expect} from 'chai';
import {createRoute, fetchData} from '..';

describe('fetchData in server', () => {
    it('fetches data', async () => {
        const Parent = createRoute({
            fetchData() {
                return {
                    a: { url: 'a' },
                    b: { url: 'b' }
                };
            }
        });
        const Child = createRoute({
            fetchData() {
                return {
                    a2: { url: 'a', params: {x: 'y'} },
                    c: { url: 'c' }
                };
            }
        });

        var client = (path, params) => Promise.resolve(!params ? path : {path, params});
        var routes = [{route: Parent}, {route: Child}];
        var result = await fetchData(client, routes);
        expect(result.data).to.deep.equal([
            {a: 'a', b: 'b'},
            {a2: {path: 'a', params: {x: 'y'}}, c: 'c'}
        ]);
    });

    it('dedupes same fetch requests', async () => {
        const Parent = createRoute({
            fetchData() {
                return {
                    a: { url: 'a' },
                    b: { url: 'b' }
                };
            }
        });
        const Child = createRoute({
            fetchData() {
                return {
                    a2: { url: 'a' },
                    a3: { url: 'a', params: {x: 'y'} },
                    c: { url: 'c' }
                };
            }
        });

        var requests = [];
        var client = (path, params) => {
            const result = !params ? path : {path, params};
            requests.push(result);
            return Promise.resolve(result);
        };
        var routes = [{route: Parent}, {route: Child}];
        var result = await fetchData(client, routes);
        expect(requests.length).to.equal(4);
        expect(requests).to.have.deep.members([
            'a', 'b', 'c',
            {path: 'a', params: {x: 'y'}}
        ]);
        expect(result.data).to.deep.equal([
            {a: 'a', b: 'b'},
            {a2: 'a', a3: {path: 'a', params: {x: 'y'}}, c: 'c'}
        ]);
    });
    
    it('fetches chained data', async () => {
        const Route = createRoute({
            fetchData() {
                return {
                    a: {
                        url: 'a',
                        andThen: (data) => ({
                            b: {
                                url: data + '/b',
                                andThen: (dataB) => ({
                                    c: {url: dataB + '/c'} 
                                })
                            }
                        })
                    }
                };
            }
        });
        
        var client = (path, params) => Promise.resolve(path);
        var result = await fetchData(client, [{route: Route}]);
        expect(result.data).to.deep.equal([
            {a: 'a', b: 'a/b', c: 'a/b/c'}
        ]);
    });
    
    it('passes extra props to fetchData callback', async () => {
        const Route = createRoute({
            fetchData(props = {}) {
                return {
                    a: {url: props.a}
                };
            }
        });
        
        var client = (path, params) => Promise.resolve(path);
        var result = await fetchData(client, [{
            route: Route,
            props: {a: 'a'}
        }]);
        expect(result.data).to.deep.equal([
            {a: 'a'}
        ]);
    });
});
