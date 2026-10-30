import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const SOURCE = "groupme";
const GROUPME_API = "https://api.groupme.com/v3";
const MAX_MESSAGES = 20;
const THREAD_LIMIT = 4;
const THREAD_WINDOW_SECONDS = 10 * 60;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

type GroupMeMessage = {
  id: string;
  text?: string | null;
  user_id?: string | null;
  name?: string | null;
  sender_type?: string | null;
  system?: boolean;
  created_at?: number | null;
};

type GroupMeGroup = {
  name?: string | null;
};

type Cursor = {
  source: string;
  last_id: string;
  read_count: number;
  updated_at: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function messageText(message: GroupMeMessage): string {
  return textValue(message.text);
}

function messageId(message: GroupMeMessage): string {
  return textValue(message.id);
}

function isSkippedMessage(message: GroupMeMessage): boolean {
  return message.sender_type === "bot" ||
    message.sender_type === "system" ||
    message.system === true ||
    !messageText(message);
}

function messageTime(message: GroupMeMessage): number {
  return typeof message.created_at === "number" ? message.created_at : 0;
}

function oldestFirst(messages: GroupMeMessage[]): GroupMeMessage[] {
  return [...messages].sort((left, right) => {
    const timeDifference = messageTime(left) - messageTime(right);
    if (timeDifference !== 0) return timeDifference;
    return messageId(left).localeCompare(messageId(right));
  });
}

function getSupabaseSecretKey(): string {
  const secretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed = JSON.parse(secretKeys);
      if (typeof parsed?.default === "string" && parsed.default) return parsed.default;
    } catch {
      // Fall through to the documented compatibility secret.
    }
  }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

function groupMeHeaders(token: string): HeadersInit {
  return {
    "X-Access-Token": token,
    "Accept": "application/json",
  };
}

async function groupMeRequest(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<{ status: number; payload: Record<string, unknown> }> {
  const response = await fetch(GROUPME_API + path, {
    ...init,
    headers: {
      ...groupMeHeaders(token),
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 304) {
    return { status: 304, payload: {} };
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const payloadRecord = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const meta = payloadRecord.meta && typeof payloadRecord.meta === "object"
      ? payloadRecord.meta as Record<string, unknown>
      : {};
    const errors = Array.isArray(meta.errors)
      ? meta.errors.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
      : [];
    const detail = errors.length > 0 ? " " + errors.join(" ") : "";
    throw new Error("GroupMe returned HTTP " + response.status + "." + detail);
  }
  return {
    status: response.status,
    payload: payload && typeof payload === "object" ? payload as Record<string, unknown> : {},
  };
}

function messagesFromPayload(payload: Record<string, unknown>): GroupMeMessage[] {
  const response = payload.response;
  const responseRecord = response && typeof response === "object"
    ? response as Record<string, unknown>
    : {};
  const messages = Array.isArray(responseRecord.messages)
    ? responseRecord.messages
    : Array.isArray(payload.messages)
      ? payload.messages
      : [];

  return messages
    .filter((message): message is Record<string, unknown> => Boolean(message && typeof message === "object"))
    .map((message) => ({
      id: textValue(message.id),
      text: typeof message.text === "string" ? message.text : "",
      user_id: textValue(message.user_id),
      name: textValue(message.name),
      sender_type: textValue(message.sender_type),
      system: message.system === true,
      created_at: typeof message.created_at === "number" ? message.created_at : null,
    }))
    .filter((message) => Boolean(message.id));
}

async function getGroup(token: string, groupId: string): Promise<GroupMeGroup> {
  const result = await groupMeRequest("/groups/" + encodeURIComponent(groupId), token);
  const response = result.payload.response;
  const group = response && typeof response === "object" ? response : result.payload;
  return group as GroupMeGroup;
}

async function readMessages(token: string, groupId: string, afterId = ""): Promise<GroupMeMessage[]> {
  const params = new URLSearchParams({
    limit: String(MAX_MESSAGES),
  });
  if (afterId) params.set("after_id", afterId);

  const result = await groupMeRequest(
    "/groups/" + encodeURIComponent(groupId) + "/messages?" + params.toString(),
    token,
  );
  if (result.status === 304) return [];
  return messagesFromPayload(result.payload);
}

async function readThread(
  token: string,
  groupId: string,
  message: GroupMeMessage,
): Promise<string[]> {
  if (!message.user_id || !message.created_at) return [];

  const params = new URLSearchParams({
    before_id: message.id,
    limit: "20",
  });
  const result = await groupMeRequest(
    "/groups/" + encodeURIComponent(groupId) + "/messages?" + params.toString(),
    token,
  );
  if (result.status === 304) return [];

  const cutoff = message.created_at - THREAD_WINDOW_SECONDS;
  return oldestFirst(messagesFromPayload(result.payload))
    .filter((candidate) =>
      candidate.id !== message.id &&
      candidate.user_id === message.user_id &&
      messageTime(candidate) >= cutoff &&
      messageTime(candidate) < message.created_at &&
      !isSkippedMessage(candidate)
    )
    .slice(-THREAD_LIMIT)
    .map((candidate) => messageText(candidate).slice(0, 500));
}

async function getCursor(
  supabase: ReturnType<typeof createClient>,
): Promise<{ cursor: Cursor | null; error: string }> {
  const { data, error } = await supabase
    .from("channel_cursor")
    .select("source, last_id, read_count, updated_at")
    .eq("source", SOURCE)
    .maybeSingle();

  return {
    cursor: data as Cursor | null,
    error: error?.message ?? "",
  };
}

async function saveCursor(
  supabase: ReturnType<typeof createClient>,
  lastId: string,
  readCount: number,
): Promise<string> {
  const { error } = await supabase
    .from("channel_cursor")
    .upsert({
      source: SOURCE,
      last_id: lastId,
      read_count: readCount,
      updated_at: new Date().toISOString(),
    });
  return error?.message ?? "";
}

async function sendToAgent(
  supabaseUrl: string,
  supabaseKey: string,
  message: GroupMeMessage,
  groupName: string,
  thread: string[],
): Promise<Record<string, unknown>> {
  const response = await fetch(supabaseUrl + "/functions/v1/submit-event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
    },
    body: JSON.stringify({
      announcement: messageText(message),
      source: SOURCE,
      source_id: message.id,
      source_name: groupName,
      thread,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    throw new Error(textValue(record.message) || "The event agent returned HTTP " + response.status + ".");
  }
  return payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
}

function decisionText(decision: Record<string, unknown>): string {
  const status = textValue(decision.status) || "error";
  const message = textValue(decision.message) || "The event agent could not process this post.";
  const reasons = Array.isArray(decision.reasons)
    ? decision.reasons.filter((reason): reason is string => typeof reason === "string").map((reason) => reason.trim()).filter(Boolean)
    : [];
  const reasonText = reasons.length > 0 ? " " + reasons.join(" ") : "";
  return ("[Event Radar] " + status + ": " + message + reasonText).slice(0, 1000);
}

async function replyInGroupMe(
  token: string,
  botId: string,
  text: string,
): Promise<void> {
  if (!botId) return;
  const response = await fetch(GROUPME_API + "/bots/post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Access-Token": token,
    },
    body: JSON.stringify({ bot_id: botId, text }),
  });
  if (!response.ok) throw new Error("GroupMe returned HTTP " + response.status + " while posting the decision.");
}

async function handleCheck(token: string, groupId: string): Promise<Response> {
  try {
    await getGroup(token, groupId);
    return jsonResponse({
      ok: true,
      ready: true,
      check: SOURCE,
      group: true,
      message: "The GroupMe token and group are working.",
    });
  } catch (error) {
    console.error("GroupMe check failed", error);
    return jsonResponse({
      ok: false,
      ready: false,
      check: SOURCE,
      group: false,
      message: "The GroupMe token or group could not be checked: " + (error instanceof Error ? error.message : "unknown GroupMe error"),
    }, 502);
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const token = textValue(Deno.env.get("GROUPME_TOKEN"));
  const groupId = textValue(Deno.env.get("GROUPME_GROUP_ID"));
  const botId = textValue(Deno.env.get("GROUPME_BOT_ID"));
  const supabaseUrl = textValue(Deno.env.get("SUPABASE_URL"));
  const supabaseKey = getSupabaseSecretKey();
  const configured = Boolean(token && groupId && supabaseUrl && supabaseKey);

  if (request.method === "GET") {
    const check = new URL(request.url).searchParams.get("check");
    if (check) {
      if (check !== SOURCE) {
        return jsonResponse({ ok: false, ready: false, message: "Use check=groupme for this reader." }, 400);
      }
      if (!token || !groupId) {
        return jsonResponse({
          ok: false,
          ready: false,
          check: SOURCE,
          group: false,
          message: "The GroupMe reader is missing its configured secrets.",
        }, 500);
      }
      return handleCheck(token, groupId);
    }

    if (!configured) {
      return jsonResponse({
        ok: true,
        ready: false,
        last_message_id: "",
        read_count: 0,
        bot: Boolean(botId),
        message: "The GroupMe reader is missing a required secret.",
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    });
    const cursorResult = await getCursor(supabase);
    if (cursorResult.error) {
      console.error("Could not read the GroupMe cursor", cursorResult.error);
      return jsonResponse({ ok: false, ready: false, message: "The GroupMe cursor could not be read." }, 500);
    }
    return jsonResponse({
      ok: true,
      ready: true,
      last_message_id: cursorResult.cursor?.last_id ?? "",
      read_count: cursorResult.cursor?.read_count ?? 0,
      bot: Boolean(botId),
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({ ok: false, message: "Use GET, POST, or OPTIONS with this function." }, 405);
  }
  if (!configured) {
    return jsonResponse({ ok: false, message: "The GroupMe reader is not configured yet." }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const cursorResult = await getCursor(supabase);
  if (cursorResult.error) {
    console.error("Could not read the GroupMe cursor", cursorResult.error);
    return jsonResponse({ ok: false, message: "The GroupMe cursor could not be read." }, 500);
  }

  let messages: GroupMeMessage[];
  let groupName = "GroupMe";
  try {
    const group = await getGroup(token, groupId);
    groupName = textValue(group.name) || "GroupMe";
    messages = oldestFirst(await readMessages(token, groupId, cursorResult.cursor?.last_id ?? ""));
  } catch (error) {
    console.error("Could not read GroupMe messages", error);
    return jsonResponse({ ok: false, message: "GroupMe messages could not be read." }, 502);
  }

  if (!cursorResult.cursor) {
    const newest = messages[messages.length - 1];
    if (newest) {
      const saveError = await saveCursor(supabase, newest.id, 0);
      if (saveError) {
        console.error("Could not initialize the GroupMe cursor", saveError);
        return jsonResponse({ ok: false, message: "The GroupMe cursor could not be saved." }, 500);
      }
    }
    return jsonResponse({
      ok: true,
      ready: true,
      first_run: true,
      processed: 0,
      last_message_id: newest?.id ?? "",
      read_count: 0,
      bot: Boolean(botId),
    });
  }

  let processed = 0;
  let skipped = 0;
  for (const message of messages) {
    if (isSkippedMessage(message)) {
      skipped += 1;
      continue;
    }

    let thread: string[] = [];
    try {
      thread = await readThread(token, groupId, message);
    } catch (error) {
      console.error("Could not read earlier GroupMe messages", error);
    }

    try {
      const decision = await sendToAgent(supabaseUrl, supabaseKey, message, groupName, thread);
      if (!decision.already_read) {
        await replyInGroupMe(token, botId, decisionText(decision));
      }
      processed += 1;
    } catch (error) {
      console.error("Could not process a GroupMe message", error);
    }
  }

  const newest = messages[messages.length - 1];
  const nextLastId = newest?.id ?? cursorResult.cursor.last_id;
  const nextReadCount = cursorResult.cursor.read_count + messages.length;
  const saveError = await saveCursor(supabase, nextLastId, nextReadCount);
  if (saveError) {
    console.error("Could not save the GroupMe cursor", saveError);
    return jsonResponse({ ok: false, message: "The GroupMe cursor could not be saved." }, 500);
  }

  return jsonResponse({
    ok: true,
    ready: true,
    processed,
    skipped,
    read: messages.length,
    last_message_id: nextLastId,
    read_count: nextReadCount,
    bot: Boolean(botId),
  });
});
