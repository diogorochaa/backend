import {
  CURRENT_EVENT_VERSION,
  createEventEnvelope,
  isDomainEventEnvelope,
  UnsupportedEventVersionError,
  unwrapEventPayload,
} from "./event-envelope";

describe("event-envelope", () => {
  it("creates versioned envelope", () => {
    const envelope = createEventEnvelope("user.created", {
      userId: "1",
    });

    expect(envelope.version).toBe(CURRENT_EVENT_VERSION);
    expect(envelope.type).toBe("user.created");
    expect(envelope.data).toEqual({ userId: "1" });
    expect(isDomainEventEnvelope(envelope)).toBe(true);
  });

  it("unwraps envelope data", () => {
    const envelope = createEventEnvelope("user.created", { userId: "1" });
    const data = unwrapEventPayload<{ userId: string }>(
      envelope,
      "user.created",
    );
    expect(data.userId).toBe("1");
  });

  it("supports legacy raw payload", () => {
    const data = unwrapEventPayload<{ userId: string }>(
      { userId: "legacy" },
      "user.created",
    );
    expect(data.userId).toBe("legacy");
  });

  it("rejects unsupported version", () => {
    const future = {
      version: 99,
      type: "user.created",
      data: {},
      occurredAt: new Date().toISOString(),
    };

    expect(() => unwrapEventPayload(future, "user.created")).toThrow(
      UnsupportedEventVersionError,
    );
  });
});
