const http = require("http");
const fs = require("fs");
const readlineSync = require("readline-sync");
const express = require("express");
const app = express();

const { Worker, workerData } = require("worker_threads");
interface WordFrequency {
  word: string;
  frequency: number;
}

const server = http.createServer((req: any, res: any) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("home");
  } else {
    const filePath = "./files/file.txt";
    const fileContent = fs.readFileSync(filePath, "utf-8");
    if (req.url === "/single-thread") {
      let text = fileContent;
      const words = text.split(/\s+/);
      const frequencyMap: { [word: string]: number } = {};

      for (const word of words) {
        const cleanedWord = word.toLowerCase().replace(/[^a-zA-Z]/g, "");
        if (cleanedWord) {
          frequencyMap[cleanedWord] = (frequencyMap[cleanedWord] || 0) + 1;
        }
      }
      const frequencies: { word: string; frequency: number }[] = [];
      for (const [word, frequency] of Object.entries(frequencyMap)) {
        frequencies.push({ word, frequency });
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      let htmlArray: string = "";
      let showFreqOf = frequencies; /// single thread
      for (var i = 0; i < showFreqOf.length; i++) {
        htmlArray += `<p class="freq">${showFreqOf[i].word} : ${showFreqOf[i].frequency}</p>`;
      }
      res.write(callOutPut(htmlArray, fileContent));
      res.end();
    } else if (req.url === "/multi-thread") {
      const lines = fileContent.split("\n");
      var workPromises: Promise<any>[] = [];
      for (const line of lines) {
        workPromises.push(createWorker(line));
        Promise.all(workPromises).then((values: any) => {
          if (lines.length === values.length) {
            const mergedArray = [].concat(...values);
            const mergedData = new Map<string, WordFrequency>();
            mergedArray.forEach((item) => {
              const { word, frequency } = item;

              if (mergedData.has(word)) {
                // If the word already exists in mergedData, add the frequencies
                const existingItem = mergedData.get(word);
                if (existingItem) {
                  existingItem.frequency += frequency;
                }
              } else {
                // If the word doesn't exist, create a new entry
                mergedData.set(word, { word, frequency });
              }
            });

            // Convert the mergedData Map back to an array
            const mergedMultiFreqArray: WordFrequency[] = Array.from(
              mergedData.values()
            );
            res.writeHead(200, { "Content-Type": "text/html" });
            let htmlArray: string = "";
            let showFreqOf = mergedMultiFreqArray; /// multi thread
            for (var i = 0; i < showFreqOf.length; i++) {
              htmlArray += `<p class="freq">${showFreqOf[i].word} : ${showFreqOf[i].frequency}</p>`;
            }
            res.write(callOutPut(htmlArray, fileContent));
            res.end();
          }
        });
      }
    }
  }
});

server.listen(8000, () => console.log("server is running"));

function createWorker(line: string) {
  return new Promise(function (resolve: any, reject: any) {
    const worker = new Worker("./src/worker.js", {
      workerData: line,
    });
    worker.on("message", (data: string) => {
      resolve(data);
    });
    worker.on("error", (msg: string) => {
      reject(`An error ocurred: ${msg}`);
    });
  });
}

function callOutPut(htmlArray: any, fileContent: any) {
  return `<html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,      initial-scale=1.0">
      <title>Word Counter</title>
      <style>
      body {
        display: flex;
        flex-direction: row;
        background: #f4f4f4;
        margin: 0;
        font-family: 'Open Sans', sans-serif;
        font-weight: 300;
        letter-spacing: 1px;
      }
      .count {
        width: 60%;
        display: flex;
        flex-wrap: wrap;
        background: #fff;
        padding: 30px;
        border-radius: 20px;
        box-shadow: rgb(99 99 99 / 20%) 0px 2px 8px 0px;
        overflow-y: auto;  
        align-items: center;
        justify-content: center;
      }
      .freq {
        width: 30% !important;
        height: 10%;
        display: flex;
        align-items: center;
      }  
      .freq::before { 
        content: "•";
        color: #b83b3b;
        text-shadow: #b83b3b 0 0 5px;
        margin:0 10px;
      }
      h4 {
        width: 100%;
      }
      .text {
        width: 40%;
        display: flex;
        flex-wrap: wrap;
        margin: 50px 25px;
        background: #fff;
        padding: 30px;
        border-radius: 20px;
        box-shadow: rgb(99 99 99 / 20%) 0px 2px 8px 0px;
        overflow-y: auto;
      }
      </style>
    </head>
    <body>
      <div class="text">
      <h4>Text content</h4>
      <p>${fileContent}</p>
    </div>
      <div class="count">
        <h4>Words and it's frequencies</h4>
        <p>${htmlArray}</p>
      </div>
    </body>
  </html>`;
}
