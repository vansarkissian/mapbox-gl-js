'use strict';

const assert = require('assert');
const WebWorker = require('./web_worker');

module.exports = WorkerPool;

/**
 * Constructs a worker pool.
 * @private
 */
function WorkerPool() {
    this.active = {};
}

WorkerPool.prototype = {
    acquire: function (mapId) {
        if (!this.workers) {
            // Lazily look up the value of mapboxgl.workerCount.  This allows
            // client code a chance to set it while circumventing cyclic
            // dependency problems
            const workerCount = require('../mapbox-gl').workerCount;
            assert(typeof workerCount === 'number' && workerCount < Infinity);

            this.workers = [];
            while (this.workers.length < workerCount) {
                this.workers.push(new WebWorker());
            }
        }

        this.active[mapId] = true;
        return this.workers.slice();
    },

    release: function (mapId) {
        delete this.active[mapId];
        if (Object.keys(this.active).length === 0) {
            this.workers.forEach((w) => {
                w.terminate();
            });
            this.workers = null;
        }
    }
};
