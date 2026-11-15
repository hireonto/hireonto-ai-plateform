"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTracing = startTracing;
exports.shutdownTracing = shutdownTracing;
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
let sdk;
function startTracing() {
    if (process.env.OTEL_ENABLED !== 'true') {
        return;
    }
    sdk = new sdk_node_1.NodeSDK({
        instrumentations: [(0, auto_instrumentations_node_1.getNodeAutoInstrumentations)()],
    });
    sdk.start();
}
async function shutdownTracing() {
    await sdk?.shutdown();
}
//# sourceMappingURL=tracing.js.map