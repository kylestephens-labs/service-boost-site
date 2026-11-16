// The review build constructs this adapter without an endpoint. A released
// build must explicitly bind its approved /quote endpoint after readiness.
function createVisitIntake(endpoint, transport) {
  let state = "idle";
  let acceptedBody;
  return {
    async submit(payload) {
      if (!endpoint) return "disabled";
      if (state === "sending") return state;
      const body = JSON.stringify(payload);
      if (body === acceptedBody) return "accepted";
      state = "sending";
      try {
        const response = await transport(endpoint, {
          method: "POST",
          credentials: "omit",
          redirect: "error",
          headers: { "Content-Type": "application/json" },
          body,
          signal: AbortSignal.timeout(20000),
        });
        const data = await response.json();
        state = response.status === 200 &&
          data.message === "Your request has been sent. Kyle will follow up using your preferred reply method."
          ? "accepted" : "unconfirmed";
        if (state === "accepted") acceptedBody = body;
      } catch {
        state = "unconfirmed";
      }
      return state;
    },
  };
}
