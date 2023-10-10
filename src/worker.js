const { parentPort, workerData } = require("worker_threads");

const multiWords = workerData.split(/\s+/);
const multifrequencyMap = {};
const multiFrequencies = [];
for (const word of multiWords) {
  const cleanedWord = word.toLowerCase().replace(/[^a-zA-Z]/g, "");
  if (cleanedWord) {
    multifrequencyMap[cleanedWord] = (multifrequencyMap[cleanedWord] || 0) + 1;
  }
}
for (const [word, frequency] of Object.entries(multifrequencyMap)) {
  multiFrequencies.push({ word, frequency });
}

parentPort.postMessage(multiFrequencies);
