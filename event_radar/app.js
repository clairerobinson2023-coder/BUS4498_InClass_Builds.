(function () {
  "use strict";

  const config = window.EVENT_RADAR_CONFIG || {};
  const supabaseUrl = config.supabaseUrl || "";
  const publishableKey = config.publishableKey || "";
  const agentUrl = `${supabaseUrl}/functions/v1/submit-event`;
  const eventColumns = "id, created_at, status, title, club, event_date, start_time, end_time, place_name, place_detail, cost, free_food, summary, flyer_url";
  const moderatorColumns = "id, created_at, status, status_reason, announcement, title, club, event_date, start_time, end_time, place_name, place_detail, cost, free_food, summary, flyer_url";
  const maxFlyerBytes = 5 * 1024 * 1024;
  const allowedFlyerTypes = new Set(["image/jpeg", "image/png"]);
  const supabaseClient = window.supabase && supabaseUrl && publishableKey
    ? window.supabase.createClient(supabaseUrl, publishableKey)
    : null;

  const form = document.getElementById("post-form");
  const announcementInput = document.getElementById("announcement");
  const flyerInput = document.getElementById("flyer");
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
  const moderatorPanel = document.getElementById("moderator-panel");
  const moderatorSignedOut = document.getElementById("moderator-signed-out");
  const moderatorSignedIn = document.getElementById("moderator-signed-in");
  const signInForm = document.getElementById("sign-in-form");
  const moderatorEmail = document.getElementById("moderator-email");
  const moderatorPassword = document.getElementById("moderator-password");
  const signInButton = document.getElementById("sign-in-button");
  const signOutButton = document.getElementById("sign-out-button");
  const moderatorStatus = document.getElementById("moderator-status");
  const waitingStatus = document.getElementById("waiting-status");
  const waitingBoard = document.getElementById("waiting-board");
  const moderatorResult = document.getElementById("moderator-result");
  const moderatorResultMessage = document.getElementById("moderator-result-message");

  let events = [];
  let freeFoodOnly = false;
  let currentUser = null;

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

  function safeFlyerUrl(value) {
    if (!value || !supabaseUrl) return "";
    try {
      const flyerUrl = new URL(value);
      const projectUrl = new URL(supabaseUrl);
      const flyersPath = "/storage/v1/object/public/flyers/";
      if (flyerUrl.origin !== projectUrl.origin || !flyerUrl.pathname.startsWith(flyersPath)) return "";
      return flyerUrl.href;
    } catch (error) {
      return "";
    }
  }

  function makeEventCard(event, includeReview) {
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
    const flyerUrl = safeFlyerUrl(event.flyer_url);
    if (flyerUrl) {
      const flyer = document.createElement("img");
      flyer.className = "flyer";
      flyer.src = flyerUrl;
      flyer.alt = `${event.title || "Event"} flyer`;
      flyer.loading = "lazy";
      flyer.decoding = "async";
      item.appendChild(flyer);
    }

    if (includeReview) {
      const review = document.createElement("div");
      review.className = "review";

      review.appendChild(makeTextElement("p", "why", event.status_reason || "This post needs moderator review."));
      review.appendChild(makeTextElement("p", "original", `Original post: ${event.announcement || "(No original announcement saved.)"}`));

      const actions = document.createElement("p");
      actions.className = "actions";
      const approveButton = document.createElement("button");
      approveButton.type = "button";
      approveButton.textContent = "Approve";
      approveButton.addEventListener("click", function () { reviewEvent(event.id, "published"); });
      const rejectButton = document.createElement("button");
      rejectButton.type = "button";
      rejectButton.className = "ghost";
      rejectButton.textContent = "Reject";
      rejectButton.addEventListener("click", function () { reviewEvent(event.id, "rejected"); });
      actions.appendChild(approveButton);
      actions.appendChild(rejectButton);
      review.appendChild(actions);
      item.appendChild(review);
    }
    return item;
  }

  function renderEvents() {
    eventBoard.replaceChildren();
    const visibleEvents = freeFoodOnly ? events.filter((event) => event.free_food) : events;

    if (visibleEvents.length === 0) {
      eventBoard.appendChild(makeTextElement("li", "empty", freeFoodOnly ? "No free-food events yet." : "No events yet. Post the first one!"));
      return;
    }

    visibleEvents.forEach((event) => eventBoard.appendChild(makeEventCard(event, false)));
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

  function setModeratorResult(status, message) {
    moderatorResult.className = `result ${status}`;
    moderatorResult.hidden = false;
    moderatorResultMessage.textContent = message || "";
  }

  function clearModeratorResult() {
    moderatorResult.hidden = true;
    moderatorResultMessage.textContent = "";
  }

  async function loadWaitingEvents() {
    if (!supabaseClient || !currentUser) return;

    waitingStatus.textContent = "Loading waiting posts…";
    let response;
    try {
      response = await supabaseClient
        .from("events")
        .select(moderatorColumns)
        .eq("status", "waiting")
        .order("created_at", { ascending: false });
    } catch (error) {
      waitingStatus.textContent = "We couldn't load waiting posts.";
      waitingBoard.replaceChildren(makeTextElement("li", "empty", "Try again, or check the Supabase connection."));
      return;
    }

    if (response.error) {
      waitingStatus.textContent = "We couldn't load waiting posts.";
      waitingBoard.replaceChildren(makeTextElement("li", "empty", "Try again, or check the Supabase connection."));
      return;
    }

    const waitingEvents = Array.isArray(response.data) ? response.data : [];
    waitingStatus.textContent = waitingEvents.length === 1 ? "1 post waiting" : `${waitingEvents.length} posts waiting`;
    waitingBoard.replaceChildren();
    if (waitingEvents.length === 0) {
      waitingBoard.appendChild(makeTextElement("li", "empty", "No posts are waiting for review."));
      return;
    }
    waitingEvents.forEach((event) => waitingBoard.appendChild(makeEventCard(event, true)));
  }

  async function setModeratorUser(user) {
    currentUser = user;
    const signedIn = Boolean(user);
    moderatorSignedOut.hidden = signedIn;
    moderatorSignedIn.hidden = !signedIn;

    if (!signedIn) {
      moderatorStatus.textContent = "";
      waitingStatus.textContent = "Sign in to see waiting posts.";
      waitingBoard.replaceChildren();
      return;
    }

    moderatorStatus.textContent = `Signed in as ${user.email || "moderator"}.`;
    clearModeratorResult();
    await loadWaitingEvents();
  }

  async function signIn(event) {
    event.preventDefault();
    if (!supabaseClient) {
      setModeratorResult("error", "The Supabase connection is not configured.");
      return;
    }

    signInButton.disabled = true;
    signInButton.textContent = "Signing in…";
    clearModeratorResult();
    try {
      const response = await supabaseClient.auth.signInWithPassword({
        email: moderatorEmail.value.trim(),
        password: moderatorPassword.value,
      });

      if (response.error) {
        setModeratorResult("error", "Sign-in failed. Check the email and password.");
      } else {
        moderatorPanel.open = true;
        moderatorPassword.value = "";
      }
    } catch (error) {
      setModeratorResult("error", "Sign-in failed. Check your connection and try again.");
    } finally {
      signInButton.disabled = false;
      signInButton.textContent = "Sign in";
    }
  }

  async function signOut() {
    if (!supabaseClient) return;
    signOutButton.disabled = true;
    try {
      const response = await supabaseClient.auth.signOut();
      if (response.error) setModeratorResult("error", "Sign-out failed. Try again.");
    } catch (error) {
      setModeratorResult("error", "Sign-out failed. Check your connection and try again.");
    } finally {
      signOutButton.disabled = false;
    }
  }

  async function reviewEvent(eventId, nextStatus) {
    if (!supabaseClient || !currentUser) return;

    const action = nextStatus === "published" ? "approve" : "reject";
    setModeratorResult("waiting", `${action === "approve" ? "Approving" : "Rejecting"} post…`);
    const response = await supabaseClient
      .from("events")
      .update({
        status: nextStatus,
        status_reason: nextStatus === "published" ? "Approved by moderator." : "Rejected by moderator.",
        reviewed_at: new Date().toISOString(),
        reviewed_by: currentUser.id,
      })
      .eq("id", eventId);

    if (response.error) {
      setModeratorResult("error", "That review could not be saved. Try again.");
      return;
    }

    setModeratorResult("published", nextStatus === "published" ? "The post is now published." : "The post was rejected.");
    await Promise.all([loadWaitingEvents(), loadEvents()]);
  }

  async function initAuth() {
    if (!supabaseClient) {
      setModeratorResult("error", "The Supabase connection is not configured.");
      return;
    }

    let sessionResponse;
    try {
      sessionResponse = await supabaseClient.auth.getSession();
    } catch (error) {
      setModeratorResult("error", "The sign-in service could not be reached.");
      return;
    }
    await setModeratorUser(sessionResponse.data.session ? sessionResponse.data.session.user : null);
    supabaseClient.auth.onAuthStateChange(function (_event, session) {
      window.setTimeout(function () {
        setModeratorUser(session ? session.user : null);
      }, 0);
    });
  }

  async function submitAnnouncement(event) {
    event.preventDefault();
    const announcement = announcementInput.value.trim();
    const flyer = flyerInput.files && flyerInput.files[0];
    if (!announcement) {
      setResult("error", "Add an announcement before posting.", []);
      announcementInput.focus();
      return;
    }
    if (flyer && !allowedFlyerTypes.has(flyer.type)) {
      setResult("error", "The flyer must be a JPG or PNG image.", []);
      flyerInput.focus();
      return;
    }
    if (flyer && flyer.size > maxFlyerBytes) {
      setResult("error", "The flyer must be 5 MB or smaller.", []);
      flyerInput.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Checking announcement…";

    const formData = new FormData();
    formData.append("announcement", announcement);
    if (flyer) formData.append("flyer", flyer);

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
        flyerInput.value = "";
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
  signInForm.addEventListener("submit", signIn);
  signOutButton.addEventListener("click", signOut);
  loadEvents();
  initAuth();
})();
