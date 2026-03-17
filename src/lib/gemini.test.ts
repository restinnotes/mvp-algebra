import { test, describe, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateJSON, generateFromImage } from "./gemini.ts";

describe("gemini.ts", () => {
  let originalGetGenerativeModel: any;

  beforeEach(() => {
    originalGetGenerativeModel = GoogleGenerativeAI.prototype.getGenerativeModel;
  });

  afterEach(() => {
    GoogleGenerativeAI.prototype.getGenerativeModel = originalGetGenerativeModel;
  });

  describe("generateJSON", () => {
    test("parses clean JSON correctly", async () => {
      mock.method(GoogleGenerativeAI.prototype, "getGenerativeModel", () => {
        return {
          generateContent: async () => ({
            response: { text: () => '{"status": "success", "value": 42}' }
          })
        };
      });

      const result = await generateJSON("prompt", {});
      assert.deepStrictEqual(result, { status: "success", value: 42 });
    });

    test("falls back to parsing JSON wrapped in markdown code blocks", async () => {
      mock.method(GoogleGenerativeAI.prototype, "getGenerativeModel", () => {
        return {
          generateContent: async () => ({
            response: { text: () => '```json\n{"status": "fallback", "value": 100}\n```' }
          })
        };
      });

      const result = await generateJSON("prompt", {});
      assert.deepStrictEqual(result, { status: "fallback", value: 100 });
    });

    test("falls back to parsing JSON wrapped in markdown without json specifier", async () => {
      mock.method(GoogleGenerativeAI.prototype, "getGenerativeModel", () => {
        return {
          generateContent: async () => ({
            response: { text: () => '```\n{"status": "fallback", "value": 200}\n```' }
          })
        };
      });

      const result = await generateJSON("prompt", {});
      assert.deepStrictEqual(result, { status: "fallback", value: 200 });
    });
  });

  describe("generateFromImage", () => {
    test("parses clean JSON correctly", async () => {
      mock.method(GoogleGenerativeAI.prototype, "getGenerativeModel", () => {
        return {
          generateContent: async () => ({
            response: { text: () => '{"detected": true}' }
          })
        };
      });

      const result = await generateFromImage("prompt", "base64data", {});
      assert.deepStrictEqual(result, { detected: true });
    });

    test("falls back to parsing JSON wrapped in markdown code blocks", async () => {
      mock.method(GoogleGenerativeAI.prototype, "getGenerativeModel", () => {
        return {
          generateContent: async () => ({
            response: { text: () => '```json\n{"detected": false}\n```' }
          })
        };
      });

      const result = await generateFromImage("prompt", "base64data", {});
      assert.deepStrictEqual(result, { detected: false });
    });

    test("handles base64 with data URI scheme correctly", async () => {
      mock.method(GoogleGenerativeAI.prototype, "getGenerativeModel", () => {
        return {
          generateContent: async (args: any) => {
            // Verify inlineData passed to generateContent
            assert.strictEqual(args[1].inlineData.data, "testdata");
            return {
              response: { text: () => '{"status": "ok"}' }
            };
          }
        };
      });

      const result = await generateFromImage("prompt", "data:image/png;base64,testdata", {});
      assert.deepStrictEqual(result, { status: "ok" });
    });
  });
});
