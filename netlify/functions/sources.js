const { listSources } = require("../../server/aggregate");

exports.handler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
    body: JSON.stringify(listSources()),
  };
};
