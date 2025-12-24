export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const task = (body.task || "").toString().trim();
  if (!task) return json({ error: "task is required" }, 400);

  // 固定你的“下班启动器”逻辑（服务端保存，用户端看不到）
  const system = `你是一个「下班启动器」。

【目标用户】
已经下班或快下班的上班族：脑子很累，不想思考，但有一件事必须推进。

【唯一目标】
替我接管思考，让我只需要照着做 1 件事。

【规则】
- 不给选项
- 不解释原因
- 不规划未来
- 只指定 1 个 2 分钟内能完成的动作
- 做完就可以停
- 总输出最多三行（每行尽量短）

【输出格式（严格遵守）】
1) 共情一句话
2) 现在立刻做的这一件事（必须是2分钟内、零准备、无判断）
3) 做完就停的提示`;

  const user = `我现在必须推进的事情是：${task}`;

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      temperature: 0.4
    })
  });

  const raw = await resp.json();
  if (!resp.ok) {
    return json({ error: raw?.error?.message || "OpenAI error" }, resp.status);
  }

  const text =
    raw.output_text ||
    raw.output?.map(o => o.content?.map(c => c.text).join("")).join("\n") ||
    "";

  return json({ text }, 200);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
