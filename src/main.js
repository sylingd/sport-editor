import path from "path";
import fs from "fs-extra";
import { loginByPassword, getAccessToken, pushBandData } from "./mi/api.js";
import { isEmpty } from "./common.js";
import * as log from "./log.js";
import sendDingTalk from "./dingtalk.js";
import { __dirname } from "./utils.js";

// 回写 config
async function writeConfig(nowConfig, key, value) {
  const configPath = path.join(__dirname, "config.json");
  nowConfig[key] = value;
  await fs.writeJSON(configPath, nowConfig);
}

async function login(config) {
  const code = await loginByPassword(config.username, config.password);
  const { app_token, user_id } = await getAccessToken(code);
  
  writeConfig(config, "app_token", app_token);
  writeConfig(config, "user_id", user_id);
}

export async function run(config) {
  if (isEmpty(config.app_token) || isEmpty(config.user_id)) {
    log.warn("未获取到 APP_TOKEN 或 USER_ID 将使用账号密码方式运行");
    await login(config);
  }

  const step = getRamdomStep(config.step_size);
  let doRetry = false;
  try {
    await pushBandData(step, config.user_id, config.app_token);
  } catch (e) {
    if (e.message === "invalid_token") {
      // token 过期，重新尝试
      doRetry = true;
    }
  }

  if (doRetry) {
    try {
      await login(config);
      await pushBandData(step, config.user_id, config.app_token);
    } catch (e) {
      // ignore
    }
  }

  // 发送通知
  if (config.ding_access_token && config.ding_secret) {
    await sendDingTalk(config.ding_access_token, config.ding_secret);
  }
}

function getRamdomStep(step_size = DEFAULT_STEP_SIZE) {
  if (!step_size.includes("-")) throw new Error("步数范围格式异常");

  const temp = step_size.split("-");
  if (temp.length !== 2) return getRamdomStep();

  const min = new Number(temp[0]);
  const max = new Number(temp[1]);
  const step = parseInt(min + Math.random() * (max - min));
  log.info(`在 [${min} 至 ${max}] 范围内随机步数 step: ${step}`);
  return step;
}
