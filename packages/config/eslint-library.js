module.exports = {
  extends: ["prettier"],
  plugins: ["@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },
  env: {
    node: true,
    es6: true,
  },
};
