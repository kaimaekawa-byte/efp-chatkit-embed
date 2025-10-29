export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    const url = new URL(request.url);
    if (url.pathname !== "/api/chatkit/session") {
      return new Response("Not Found", { status: 404, headers: corsHeaders });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }
    let body = {};
    try { body = await request.json(); } catch (e) {}
    const workflowId = body.workflow || env.WORKFLOW_ID;
    const version = body.version || env.CHATKIT_VERSION;
    const user = body.user || crypto.randomUUID();
    const res = await fetch("https://api.openai.com/v1/chatkit/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "OpenAI-Beta": "chatkit_beta=v1",
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        workflow: { id: workflowId },
        ...(version ? { version } : {}),
        user,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: data }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }
    return new Response(JSON.stringify({ client_secret: data.client_secret }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});
  },
};      
