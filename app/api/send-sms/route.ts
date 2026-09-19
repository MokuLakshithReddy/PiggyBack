import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phoneNumber, recipientName, shipmentId, message } = body;

    const cleanPhone = (phoneNumber || "").replace(/\D/g, "");

    // Simulated carrier delivery through Indian Telecom DLT gateway (Airtel / Jio / Vi / BSNL)
    const messageId = `DLT-PGB-${Date.now().toString(36).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    return NextResponse.json({
      success: true,
      messageId,
      status: "DISPATCHED",
      carrierReport: "DELIVRD_ACK",
      telecomCircle: cleanPhone.startsWith("91") ? "IN-PAN-INDIA" : "GLOBAL",
      recipient: cleanPhone,
      recipientName,
      shipmentId,
      senderHeader: "VK-PGBACK",
      dltEntityId: "110145290001",
      timestamp,
      deliveryTimeMs: 240,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to dispatch SMS gateway request" },
      { status: 500 }
    );
  }
}
