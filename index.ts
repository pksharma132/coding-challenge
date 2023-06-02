import * as fs from "fs";
import { performance } from "perf_hooks";

function parseDictionary(dictionaryFile: string): Record<string, string> {
  const dictionaryData = fs.readFileSync(dictionaryFile, "utf-8");
  const dictionaryLines = dictionaryData.split("\n");
  const dictionary: Record<string, string> = {};

  dictionaryLines.forEach((line) => {
    const [englishWord, frenchWord] = line.split(",");
    dictionary[englishWord] = frenchWord;
  });

  return dictionary;
}

function normalizeWord(word: string): string {
  return word.replace(/[^\w\s]/gi, "").toLowerCase();
}

function applyCasingAndSpecialChars(
  frenchWord: string,
  originalWord: string
): string {
  if (originalWord.match(/^[A-Z]+$/)) {
    return frenchWord.toUpperCase();
  } else if (originalWord.match(/^[A-Z][a-z]+$/)) {
    return (
      frenchWord.charAt(0).toUpperCase() + frenchWord.slice(1).toLowerCase()
    );
  }

  return frenchWord;
}

const inputFile = "t8.shakespeare.txt";
const findWordsFile = "find_words.txt";
const frenchDictionary = "french_dictionary.csv";

console.time("ProcessingTime");
const startTime = performance.now();

const text = fs.readFileSync(inputFile, "utf-8");
const findWords = new Set(fs.readFileSync(findWordsFile, "utf-8").split("\n"));
const dictionary = parseDictionary(frenchDictionary);

console.log(findWords);

const splitWords = text.split("\n").map((line: string) => line.split(" "));
let outputText = "";
const frequencyMap: Record<
  string,
  { normalizedWord: string; frenchWord: string; count: number }
> = {};

for (let line of splitWords) {
  let translatedLine = [];
  let outputLine = "";
  for (let word of line) {
    const normalizedWord = normalizeWord(word);
    const frenchWord = dictionary[normalizedWord];
    if (frenchWord) {
      // console.log(normalizedWord, frenchWord);
      let preservedCaseWord = applyCasingAndSpecialChars(frenchWord, word);
      if (frequencyMap[normalizedWord]) {
        frequencyMap[normalizedWord].count++;
      } else {
        frequencyMap[normalizedWord] = {
          normalizedWord,
          frenchWord,
          count: 1,
        };
      }
      translatedLine.push(preservedCaseWord);
    } else {
      translatedLine.push(word);
    }

  }
  outputLine += translatedLine.join(" ");

  outputText += outputLine + "\n";
}

const outputFileName = "t8.shakespeare.translated.txt";
fs.writeFileSync(outputFileName, outputText);

const frequencyCsvString = Object.values(frequencyMap)
  .map((value) => Object.values(value).join(","))
  .join("\n");
console.log(frequencyCsvString);

const frequencyFileName = "frequency.csv";
fs.writeFileSync(frequencyFileName, frequencyCsvString);

let endTime = performance.now();
const timeTakenMs: number = +(endTime - startTime).toFixed(2);
let memoryUsage = 0;

const minutes = Math.floor(timeTakenMs / 60000);
const seconds = ((timeTakenMs % 60000) / 1000).toFixed(0);
const timeTaken = minutes + " minutes " + seconds + " seconds";
Object.entries(process.memoryUsage()).forEach(
  (item) => (memoryUsage += +(item[1] / 1024 / 1024).toFixed(4))
);

console.log("time taken", timeTaken);
console.log("mem", memoryUsage, "MB");
