import {expect} from 'chai';
import {createRoute, fetchData} from '..';

describe('fetchData', () => {
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
                    c: { url: 'c' },
                    d: { url: 'd' }
                };
            }
        });

        var client = (path, params) => Promise.resolve(path);
        var routes = [Parent, Child];
        var data = await fetchData(client, routes);
        expect(data).to.deep.equal([
            {a: 'a', b: 'b'},
            {c: 'c', d: 'd'}
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
                    c: { url: 'c' }
                };
            }
        });

        var requests = [];
        var client = (path, params) => {
            requests.push(path);
            return Promise.resolve(path);
        };
        var routes = [Parent, Child];
        var data = await fetchData(client, routes);
        expect(requests.length).to.equal(3);
        expect(requests).to.have.members(['a', 'b', 'c']);
        expect(data).to.deep.equal([
            {a: 'a', b: 'b'},
            {a2: 'a', c: 'c'}
        ]);
    });
});
