(function () {
  "use strict";

  const config = window.EVENT_RADAR_CONFIG || {};
  const supabaseUrl = config.supabaseUrl || "";
  const publishableKey = config.publishableKey || "";
  const agentUrl = `${supabaseUrl}/functions/v1/submit-event`;
  const eventColumns = "id, created_at, status, title, club, event_date, start_time, end_time, place_name, place_detail, cost, free_food, summary";
  const supabaseClient = window.supabase && supabaseUrl && publishableKey
    ? window.supabase.createClient(supabaseUrl, publishableKey)
    : null;

  const form = document.getElementById("post-form");
  const announcementInput = document.getElementById("announcement");
  const submitButton = document.getElementById("submit-button");
  const result = document.getElementById("result");
  const resultLabel = document.getElementById("result-label");
  const resultMessage = document.getElementById("result-message");
  const resultReasons = document.getElementById("result-reasons");
  const eventBoard = document.getElementById("event-board");
  const boardStatus = document.getElementById("board-status");
  const refreshButton = document.getElementById("refresh-button");
  const allEventsFilter = document.getElementById("all-events-filter");
  const freeFoodFilter = document.getElementById("free-food-filter");

  let events = [];
  let freeFoodOnly = false;

  const statusLabels = {
    published: "Posted",
    waiting: "Waiting for review",
    rejected: "Not posted",
    duplicate: "Already posted",
    error: "Something went wrong",
  };

  function setResult(status, message, reasons) {
    result.className = `result ${status}`;
    result.hidden = false;
    resultLabel.textContent = statusLabels[status] || statusLabels.error;
    resultMessage.textContent = message || "";
    resultReasons.replaceChildren();

    (Array.isArray(reasons) ? reasons : []).forEach(function (reason) {
      const item = document.createElement("li");
      item.textContent = reason;
      resultReasons.appendChild(item);
    });
  }

  function formatDateParts(dateString) {
    if (!dateString) return null;
    const parts = dateString.split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return null;
    const date = new Date(parts[0], parts[1] - 1, parts[2], 12);
    if (Number.isNaN(date.getTime())) return null;
    return {
      month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
      day: String(parts[2]),
      weekday: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date),
      monthLong: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
    };
  }

  function formatTime(timeString) {
    if (!timeString) return "";
    const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(timeString);
    if (!match) return timeString;
    const date = new Date(1970, 0, 1, Number(match[1]), Number(match[2]));
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
  }

  function formatWhen(event, dateParts) {
    if (!dateParts) return "Date and time to be announced";
    const start = formatTime(event.start_time);
    const end = formatTime(event.end_time);
    let time = start || "Time to be announced";
    if (start && end) time += ` to ${end}`;
    return `${dateParts.weekday}, ${dateParts.monthLong} ${dateParts.day} · ${time}`;
  }

  function makeTextElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text || "";
    return element;
  }

  function makeTag(text, className) {
    return makeTextElement("span", `tag${className ? ` ${className}` : ""}`, text);
  }

  function makeEventCard(event) {
    const item = document.createElement("li");
    item.className = "event";

    const dateParts = formatDateParts(event.event_date);
    const date = document.createElement("div");
    date.className = dateParts ? "date" : "date tba";
    if (dateParts) {
      date.appendChild(makeTextElement("span", "mon", dateParts.month));
      date.appendChild(makeTextElement("span", "day", dateParts.day));
    } else {
      date.appendChild(makeTextElement("span", "day", "TBA"));
    }
    item.appendChild(date);

    const body = document.createElement("div");
    body.className = "event-body";
    body.appendChild(makeTextElement("p", "when", formatWhen(event, dateParts)));
    body.appendChild(makeTextElement("h3", "", event.title || "Untitled event"));

    const metaParts = [event.club, event.place_name].filter(Boolean);
    if (event.place_detail) metaParts.push(event.place_detail);
    body.appendChild(makeTextElement("p", "meta", metaParts.join(" · ") || "Details to be announced"));
    body.appendChild(makeTextElement("p", "summary", event.summary || "No summary provided."));

    const tags = document.createElement("p");
    tags.className = "tags";
    if (event.cost && event.cost.toLowerCase().includes("free")) tags.appendChild(makeTag("Free"));
    if (event.free_food) tags.appendChild(makeTag("🍕 Free food", "food"));
    if (tags.childNodes.length > 0) body.appendChild(tags);

    item.appendChild(body);
    return item;
  }

  function renderEvents() {
    eventBoard.replaceChildren();
    const visibleEvents = freeFoodOnly ? events.filter((event) => event.free_food) : events;

    if (visibleEvents.length === 0) {
      eventBoard.appendChild(makeTextElement("li", "empty", freeFoodOnly ? "No free-food events yet." : "No events yet. Post the first one!"));
      return;
    }

    visibleEvents.forEach((event) => eventBoard.appendChild(makeEventCard(event)));
  }

  function setFilter(nextFreeFoodOnly) {
    freeFoodOnly = nextFreeFoodOnly;
    allEventsFilter.setAttribute("aria-pressed", String(!freeFoodOnly));
    freeFoodFilter.setAttribute("aria-pressed", String(freeFoodOnly));
    renderEvents();
  }

  async function loadEvents() {
    if (!supabaseClient) {
      boardStatus.textContent = "The Supabase connection is not configured.";
      eventBoard.replaceChildren(makeTextElement("li", "empty", "Events are unavailable until the Supabase connection is configured."));
      return;
    }

    boardStatus.textContent = "Loading events…";
    let response;
    try {
      response = await supabaseClient
        .from("events")
        .select(eventColumns)
        .eq("status", "published")
        .order("event_date", { ascending: true, nullsFirst: false })
        .order("start_time", { ascending: true, nullsFirst: false });
    } catch (error) {
      boardStatus.textContent = "We couldn't load the event board.";
      eventBoard.replaceChildren(makeTextElement("li", "empty", "Try Refresh, or check the Supabase connection."));
      return;
    }

    if (response.error) {
      boardStatus.textContent = "We couldn't load the event board.";
      eventBoard.replaceChildren(makeTextElement("li", "empty", "Try Refresh, or check the Supabase connection."));
      return;
    }

    events = Array.isArray(response.data) ? response.data : [];
    boardStatus.textContent = events.length === 1 ? "1 event" : `${events.length} events`;
    renderEvents();
  }

  async function submitAnnouncement(event) {
    event.preventDefault();
    const announcement = announcementInput.value.trim();
    if (!announcement) {
      setResult("error", "Add an announcement before posting.", []);
      announcementInput.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Checking announcement…";

    const formData = new FormData();
    formData.append("announcement", announcement);

    try {
      const response = await fetch(agentUrl, {
        method: "POST",
        headers: { apikey: publishableKey },
        body: formData,
      });
      const body = await response.json().catch(() => ({}));
      const status = body.ok ? body.status : "error";
      setResult(status, body.message || "The agent did not return a message.", body.reasons);
      if (body.ok && body.status === "published") {
        announcementInput.value = "";
        await loadEvents();
      }
    } catch (error) {
      setResult("error", "The event agent could not be reached. Check your connection and try again.", []);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Post announcement";
    }
  }

  form.addEventListener("submit", submitAnnouncement);
  refreshButton.addEventListener("click", loadEvents);
  allEventsFilter.addEventListener("click", function () { setFilter(false); });
  freeFoodFilter.addEventListener("click", function () { setFilter(true); });
  loadEvents();
})();
