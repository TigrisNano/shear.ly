const noConsoleLog = require("./eslint-rules/no-console-log.js");

module.exports = [
  {
    files: ["src/server.ts"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      custom: {
        rules: {
          "no-console-log": noConsoleLog,
        },
      },
    },
    rules: {
      "custom/no-console-log": "error",
    },
  },
];
