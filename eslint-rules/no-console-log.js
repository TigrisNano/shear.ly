module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow console.log in production code",
    },
    schema: [],
  },

  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.name === "console" &&
          node.callee.property.name === "log"
        ) {
          context.report({
            node,
            message: "Do not use console.log in production code.",
          });
        }
      },
    };
  },
};
