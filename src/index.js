const core = require("@actions/core");
const path = require("path");
const axios = require("axios");
const os = require("os");
const fs = require("fs").promises;

const getAbsolutePath = (filePath) => {
    if (filePath[0] !== "~") return path.resolve(filePath);

    const homeDir = os.homedir();
    if (homeDir) return path.join(homeDir, filePath.slice(1));

    throw new Error("Unable to resolve '~' to HOME");
};

const run = async () => {
    const filePath = getAbsolutePath(core.getInput("path", { required: true }));
    const script = await fs
        .readFile(filePath, { encoding: "utf8" })
        .catch((err) => {
            throw new Error(err);
        });

    axios
        .post("https://api.psu.dev/obfuscate", {
            script,
            key: core.getInput("apiKey"),
            options: core.getInput("options"),
        })
        .then(({ data }) => {
            if (data.status === "passed") core.setOutput("file", data.data);
        })
        .catch(({ response: data }) => {
            if (data.status === "failed") {
                if (!data.reason)
                    throw new Error(
                        "An unknown error occurred while obfuscating the script. Sorry for the inconvenience."
                    );
                throw new Error(
                    `An error occurred while obfuscating your script: ${data.reason}`
                );
            }
        });
};

run();
