export const config = {
  blockInterval: 10000,
  settlementInterval: 60000,
  graphiqlEnabled: true,
  indexer: {
    graphiqlEnabled: true,
  },
  processor: {
    graphiqlEnabled: true,
  },
  openTelemetry: {
    tracing: {
      enabled: true,
    },
    metrics: {
      enabled: true,
      scrapingFrequency: 10,
    },
  },
};

export default config;

export type SovereignConfig = typeof config;
