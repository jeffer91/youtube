const { renderFirstFiveSeconds } = require("./YTRenderService");

async function renderMini(options = {}) {
  return renderFirstFiveSeconds(options);
}

if (require.main === module) {
  renderMini()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      if (!result.ok) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = { renderMini };
