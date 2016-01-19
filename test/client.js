import {describe, it} from 'mocha';
import {expect} from 'chai';
import {createRoute, fetchDataWithProgress, allCached} from '..';
import RequestCache from '../RequestCache';

describe('fetchData in client', () => {
    it('reports progress', (done) => {
        const Parent = createRoute({
            fetchData() {
                return {
                    a: {url: 'a'}
                };
            }
        });
        const Child = createRoute({
            fetchData() {
                return {
                    a: {url: 'a'},
                    b: {url: 'b'}
                };
            }
        });
        
        const barriers = {};
        const client = (path, params) => {
            return new Promise((resolve, reject) => {
                barriers[path] = () => resolve(path);
            });
        };
        var onProgress;
        const {promise, progress} = fetchDataWithProgress(client, [Parent, Child], () => onProgress());
        promise.catch(done);
        expect(progress).to.be.deep.equal(['loading', 'loading']);
        onProgress = () => {
            expect(progress).to.be.deep.equal(['complete', 'loading']);
            
            onProgress = () => {
                expect(progress).to.be.deep.equal(['complete', 'complete']);
                done();
            };
            barriers.b();
        };
        barriers.a();
    });
    
    it('tests all required data is cached', () => {
        const Parent = createRoute({
            fetchData() {
                return {
                    a: {url: 'a'}
                };
            }
        });
        const Child = createRoute({
            fetchData() {
                return {
                    a: {url: 'a'},
                    b: {url: 'b'}
                };
            }
        });
        const Chained = createRoute({
            fetchData() {
                return {
                    a: {
                        url: 'a',
                        andThen: (a) => {b: {url: a + '/b'}}
                    }
                };
            }
        });
        
        const cache = new RequestCache();
        cache.put('a', undefined, 'a');
        expect(allCached(Parent, cache)).to.be.truthy;
        expect(allCached(Child, cache)).to.be.falsey;
        expect(allCached(Chained, cache)).to.be.falsey;
        
        cache.put('b', undefined, 'b');
        expect(allCached(Child, cache)).to.be.truthy;
        expect(allCached(Chained, cache)).to.be.truthy;
    });
});