import { createHmac } from "crypto";
import Axios from "axios";
import { logs } from "./log.js";

function getSign(secret, now) {
  const content = "" + now + "\n" + secret;
  const str = createHmac("sha256", secret).update(content).digest().toString("base64");
  return encodeURIComponent(str);
}

async function sendDingTalk(accessToken, secret) {
  const now = Date.now();
  const strMsg = JSON.stringify({
    msgtype: "text",
    text: {
      content: logs.join("\n"),
    },
  })
  // 生成签名
  const sign = getSign(secret, now);
  const fullUrl = "https://oapi.dingtalk.com/robot/send?access_token=" + accessToken + "&timestamp=" + now + "&sign=" + sign;
  const res = await Axios.post(fullUrl, strMsg, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return res.data.errcode == 0;
}

export default sendDingTalk;