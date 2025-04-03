const path = require("path");
const homepage = async (req, res) => {

  // const ApplicationAuthorized = await ApplicationLogin();

  // if (!ApplicationAuthorized) {
  //   res.status(401).json({ error: "Application not authorized" });
  //   return;
  // }

  res.sendFile(path.join(path.resolve("."), "client", "index.html"));
};

module.exports = {
  homepage,
};
