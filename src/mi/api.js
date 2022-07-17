import path from "path";
import Axios from "axios";
import dayjs from "dayjs";
import fs from "fs-extra";
import { toUrlEncode } from "../common.js";
import * as log from "../log.js";
import { getDirName } from "../utils.js";

// 公共头
const DEVICE_ID = "DA932FFFFE8816E7";
const COMMON_HEADERS = {
  "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
  "User-Agent": "MiFit/4.6.0 (iPhone; iOS 14.0.1; Scale/2.00)",
};

// 初始化请求工具
const axios = Axios.create({
  timeout: 30000,
  headers: {
    ...COMMON_HEADERS,
  },
});

export async function loginByPassword(username, password) {
  const redirect_uri = new URL(
    "https://s3-us-west-2.amazonaws.com/hm-registration/successsignin.html"
  );
  const data = toUrlEncode({
    client_id: "HuaMi",
    password: password,
    redirect_uri: redirect_uri.toString(),
    token: "access",
  });

  try {
    const res = await axios.post(
      `https://api-user.huami.com/registrations/+86${username}/tokens`,
      data
    );
    log.info("登录成功, 开始获取登录授权码");

    // 获取Code
    const path = new URL(res.request.path, redirect_uri);
    const params = path.searchParams;
    if (params.has("access")) {
      const code = params.get("access");
      log.info(`获取登录授权码成功 code: ${code}`);
      return code;
    }
    throw new Error("获取登录授权码失败");
  } catch (e) {
    log.error("登录失败， 请检查账号密码");
    throw e;
  }
}

/**
 * 获取 AccessToken
 * {
 *   token_info: {
 *     login_token: 'LOGIN_TOKEN',
 *     app_token: 'APP_TOKEN',
 *     user_id: 'USER_ID',
 *   },
 * }
 *
 * @param {code} code
 * @returns
 */
export async function getAccessToken(code) {
  const data = toUrlEncode({
    app_name: "com.xiaomi.hm.health",
    app_version: "4.6.0",
    code: code,
    country_code: "CN",
    device_id: "2C8B4939-0CCD-4E94-8CBA-CB8EA6E613A1",
    device_model: "phone",
    grant_type: "access_token",
    third_name: "huami_phone",
  });

  try {
    const res = await axios.post("https://account.huami.com/v2/client/login", data);

    const token_info = res.data.token_info;
    log.info(`获取AccessToken成功 token: ${token_info.login_token}`);
    return token_info;
  } catch (e) {
    log.error("获取AccessToken失败");
    throw e;
  }
}

export async function pushBandData(step, user_id, app_token) {
  const data = toUrlEncode({
    userid: user_id,
    last_sync_data_time: 1597306380,
    device_type: 0,
    last_deviceid: DEVICE_ID,
    data_json: await buildDataJson(step),
  });

  try {
    const res = await axios.post(
      `https://api-mifit-cn.huami.com/v1/data/band_data.json?&t=${Date.now()}`,
      data,
      {
        headers: {
          apptoken: app_token,
        },
      }
    );

    log.info(`上传步数成功 step：${step}`);
  } catch (e) {
    if (e.response.status === 401) {
      log.error("上传步数失败，token 过期");
      throw new Error("invalid_token");
    }
    log.error("上传步数失败");
    throw e;
  }
}

async function buildDataJson(step) {
  const time = dayjs().format("YYYY-MM-DD");

  let data_json = await fs.readFile(path.join(getDirName(import.meta.url), "data.json"), "utf-8");
  data_json = data_json.replace(/REPLACE_DATE/g, time);
  data_json = data_json.replace(/REPLACE_TTL/g, step);
  data_json = data_json.replace(/REPLACE_DEVICE_ID/g, DEVICE_ID);

  return data_json;
}
