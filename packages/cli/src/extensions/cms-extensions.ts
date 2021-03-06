import { GluegunToolbox } from "gluegun";
import { join, resolve } from "path";
import { merge } from "lodash";

module.exports = (toolbox: GluegunToolbox) => {
  toolbox.resolveCms = async (directoryPath, aliases, cmsComponentsMap) => {
    // Read cmsMap.json file in cms folder, every cms folder should contain one
    const readedMap = await toolbox.filesystem.readAsync(
      join(directoryPath, "cmsMap.json"),
      "json"
    );

    // if there is no cmsMap.json file, we do nothing with it
    if (!readedMap) return;

    Object.keys(readedMap).forEach((sectionKey) => {
      Object.values(readedMap[sectionKey]).forEach((value: string) => {
        const alias = `sw-cms/${sectionKey}/${value}`;
        const path = resolve(join(directoryPath, sectionKey, value));
        const configPathExists = toolbox.filesystem.exists(`${path}.vue`);
        if (configPathExists) {
          aliases[alias] = path.replace(/\\/g, "/");
        } else {
          toolbox.print.warning(
            `[cms] Invalid config for type ${alias} - destination file not exist in folder: ${directoryPath}`
          );
        }
      });
    });

    merge(cmsComponentsMap, readedMap);
  };

  toolbox.createCmsTemplate = async (directoryPath = "cms") => {
    const cmsMapFileName = "cmsMap.json";
    const cmsReadmeFile = "readme.md";
    // create folders structure
    await toolbox.filesystem.dirAsync(directoryPath);
    await toolbox.filesystem.dirAsync(join(directoryPath, "sections"));
    await toolbox.filesystem.dirAsync(join(directoryPath, "blocks"));
    await toolbox.filesystem.dirAsync(join(directoryPath, "elements"));
    const cmsMapConfigExists = await toolbox.filesystem.existsAsync(
      join(directoryPath, cmsMapFileName)
    );
    if (!cmsMapConfigExists) {
      await toolbox.template.generate({
        template: "/cms/" + cmsMapFileName,
        target: "cms/" + cmsMapFileName,
        props: {},
      });
    }
    const cmsReadmeExists = await toolbox.filesystem.existsAsync(
      join(directoryPath, cmsReadmeFile)
    );
    if (!cmsReadmeExists) {
      await toolbox.template.generate({
        template: "/cms/" + cmsReadmeFile,
        target: "cms/" + cmsReadmeFile,
        props: {},
      });
    }
  };
};
