import {describe, it} from 'mocha';
import {expect} from 'chai';
import {createRoute, fetchData} from '..';

describe('fetchData', () => {
    it('fetches data', (done) => {
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
        var routes = [Parent, Child];
        fetchData(client, routes).then(data => {
            expect(data).to.deep.equal([
                {a: 'a', b: 'b'},
                {a2: {path: 'a', params: {x: 'y'}}, c: 'c'}
            ]);
            done();
        }).catch(done);
    });

    it('dedupes same fetch requests', (done) => {
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
        var routes = [Parent, Child];
        fetchData(client, routes).then(data => {
            expect(requests.length).to.equal(4);
            expect(requests).to.have.deep.members([
                'a', 'b', 'c',
                {path: 'a', params: {x: 'y'}}
            ]);
            expect(data).to.deep.equal([
                {a: 'a', b: 'b'},
                {a2: 'a', a3: {path: 'a', params: {x: 'y'}}, c: 'c'}
            ]);
            done();
        }).catch(done);
    });
});
