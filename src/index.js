import path from "path";
import fs from "fs-extra";
import { __dirname } from "./utils.js";
import { run } from "./main.js";

const DEFAULT_STEP_SIZE = "5000-15000";

// 尝试读取 config
async function main() {
  const configPath = path.join(__dirname, "config.json");
  // 获取环境变量
  const config = {
    username: '',
    password: '',
    user_id: '',
    app_token: '',
    ding_access_token: '',
    ding_secret: '',
    step_size: DEFAULT_STEP_SIZE,
  };
  if (fs.existsSync(configPath)) {
    const f = await fs.readJSON(configPath);
    Object.keys(f).forEach(k => {
      config[k] = f[k];
    });
  }

  if (process.env) {
    // 获取环境变量
    const envMap = {
      username: 'XIAOMI_AMAZFIT_USERNAME',
      password: 'XIAOMI_AMAZFIT_PASSWORD',
      user_id: 'XIAOMI_AMAZFIT_USER_ID',
      app_token: 'XIAOMI_AMAZFIT_APP_TOKEN',
      step_size: 'XIAOMI_AMAZFIT_STEP_SIZE',
      ding_access_token: 'DINGTALK_ACCESS_TOKEN',
      ding_secret: 'DINGTALK_SECRET',
    };

    Object.keys(envMap).forEach(k => {
      if (typeof process.env[envMap[k]] !== 'undefined') {
        config[k] = process.env[envMap[k]];
      }
    });
  }

  await run(config);
}

main();