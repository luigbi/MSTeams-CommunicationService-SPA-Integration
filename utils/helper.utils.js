const {
  NODE_ENV,
} = require("./../constants/env");
const {
  environments
} = require("./../constants/index");

const getEnvironment = () => {
  const {dev, devLocal, qa, stage, prod} = environments;
  switch (NODE_ENV) {
    case dev:
      return dev;
    case devLocal:
      return devLocal;
    case qa:
      return qa;
    case stage:
      return stage;
    case prod:
      return prod;
    default:
      break;
  }
}

const getEndpoint = () => {
  const environment = getEnvironment();
  const {dev, devLocal, qa, stage, prod} = environments;
  switch (environment) {
    case devLocal:
      return `https://localhost:44305`;
      case dev:
        return "https://avm-restapi-dev.yourdomain.com";
    case qa:
      return "https://avm-restapi-qa.azurewebsites.net"// "https://avm-restapi-qa.yourdomain.com";
    case stage:
      return "https://avm-restapi-stage.azurewebsites.net" // "https://avm-restapi-stage.yourdomain.com";
    case prod:
      return "https://avm-restapi-prod.azurewebsites.net";
    default:
      break;
  }
}

module.exports = {
  getEnvironment,
  getEndpoint
};
