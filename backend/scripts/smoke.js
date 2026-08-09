"use strict";

const assert = require("node:assert/strict");
const app = require("../server");

async function main() {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const cases = [
    { method: "GET", path: "/api/test", status: 200 },
    { method: "GET", path: "/api/listing/not-a-number", status: 400 },
    { method: "POST", path: "/api/listing", status: 400, body: {} },
    {
      method: "POST",
      path: "/api/listing",
      status: 400,
      body: {
        userId: true,
        title: "Invalid listing",
        description: "Validation regression case",
        price: "10.00",
        department: "Business",
        category: "Books & Textbooks",
        condition: "GOOD",
        location: "Richmond Campus",
        photos: []
      }
    },
    {
      method: "POST",
      path: "/api/listing",
      status: 400,
      body: {
        userId: 1,
        title: "Invalid listing",
        description: "Validation regression case",
        price: true,
        department: "Business",
        category: "Books & Textbooks",
        condition: "GOOD",
        location: "Richmond Campus",
        photos: []
      }
    },
    {
      method: "POST",
      path: "/api/listing",
      status: 400,
      body: {
        userId: 1,
        title: "Invalid listing",
        description: "Validation regression case",
        price: "10.00",
        department: {},
        category: "Books & Textbooks",
        condition: "GOOD",
        location: "Richmond Campus",
        photos: []
      }
    },
    { method: "GET", path: "/api/favorite", status: 400 },
    { method: "POST", path: "/api/favorite", status: 400, body: {} },
    { method: "GET", path: "/api/user/me", status: 401 },
    { method: "GET", path: "/api/user/not-a-number", status: 400 },
    { method: "GET", path: "/api/review", status: 400 },
    { method: "POST", path: "/api/review", status: 400, body: {} },
    { method: "POST", path: "/api/report", status: 400, body: {} },
    { method: "POST", path: "/api/auth/login", status: 400, body: {} }
  ];

  try {
    for (const testCase of cases) {
      const response = await fetch(`${baseUrl}${testCase.path}`, {
        method: testCase.method,
        headers: testCase.body ? { "Content-Type": "application/json" } : undefined,
        body: testCase.body ? JSON.stringify(testCase.body) : undefined
      });

      assert.equal(
        response.status,
        testCase.status,
        `${testCase.method} ${testCase.path} returned ${response.status}`
      );
    }

    console.log(`Validated ${cases.length} HTTP smoke cases.`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
