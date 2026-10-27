import { describe, it, expect } from "vitest";
import { buildBookingMessage, whatsappUrl, normalizePhoneBR, bookingErrorMessage } from "./booking";

describe("booking message", () => {
  it("fills every field of the WhatsApp template", () => {
    const msg = buildBookingMessage({
      service: "Francesinha",
      name: "Ana Souza",
      date: "2026-11-03",
      time: "14:30:00",
      protocol: "MF-261027-ABCDE",
      notes: "",
    });
    expect(msg).toContain("💅 Serviço: Francesinha");
    expect(msg).toContain("👩 Cliente: Ana Souza");
    expect(msg).toContain("📅 Data desejada: 03/11/2026");
    expect(msg).toContain("🕒 Horário desejado: 14:30");
    expect(msg).toContain("📋 Protocolo: MF-261027-ABCDE");
    expect(msg).toContain("📝 Observações: Nenhuma");
    expect(msg.startsWith("Olá, Maria! 💖")).toBe(true);
  });

  it("encodes the message for Maria's WhatsApp", () => {
    const url = whatsappUrl("(61) 99837-8967", "Olá & tchau\n#1");
    expect(url).toBe("https://wa.me/61998378967?text=Ol%C3%A1%20%26%20tchau%0A%231");
  });
});

describe("phone validation", () => {
  it("accepts mobile with DDD and strips country code", () => {
    expect(normalizePhoneBR("(61) 99837-8967")).toBe("61998378967");
    expect(normalizePhoneBR("+55 61 99837-8967")).toBe("61998378967");
  });
  it("rejects numbers without DDD", () => {
    expect(normalizePhoneBR("99837-8967")).toBeNull();
  });
});

describe("error messages", () => {
  it("explains when a slot was just taken", () => {
    expect(bookingErrorMessage("SLOT_UNAVAILABLE")).toMatch(/indisponível/);
  });
});
