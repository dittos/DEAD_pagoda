import {describe, it} from 'mocha';
import {expect} from 'chai';
import {createRoute, fetchDataWithProgress} from '..';

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
});