import {describe, it} from 'mocha';
import {expect} from 'chai';
import RequestCache from '../RequestCache';

describe('RequestCache', () => {
    it('returns undefined if no cached value', () => {
        const cache = new RequestCache();
        expect(cache.getIfPresent('a')).to.be.undefined;
        expect(cache.getIfPresent('a', {x: 'y'})).to.be.undefined;
    });
    
    it('returns cached value', () => {
        const cache = new RequestCache();
        cache.put('a', undefined, 'a');
        expect(cache.getIfPresent('a')).to.be.equal('a');
        expect(cache.getIfPresent('a', {x: 'y'})).to.be.undefined;
        
        cache.put('a', {x: 'y'}, 'a2');
        expect(cache.getIfPresent('a')).to.be.equal('a');
        expect(cache.getIfPresent('a', {x: 'y'})).to.be.equal('a2');
    });
    
    it('removes', () => {
        const cache = new RequestCache();
        cache.put('a', undefined, 'a');
        cache.put('a', {x: 'y'}, 'a2');
        
        cache.remove('b'); // does not throw
        
        cache.remove('a');
        expect(cache.getIfPresent('a')).to.be.undefined;
        expect(cache.getIfPresent('a', {x: 'y'})).to.be.equal('a2');
        cache.remove('a', {x: 'y'});
        expect(cache.getIfPresent('a', {x: 'y'})).to.be.undefined;
    });

    it('clears', () => {
        const cache = new RequestCache();
        cache.put('a', undefined, 'a');
        cache.put('a', {x: 'y'}, 'a2');
        cache.clear();
        expect(cache.getIfPresent('a')).to.be.undefined;
        expect(cache.getIfPresent('a', {x: 'y'})).to.be.undefined;
    });
});