import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { reference, draftId } = await req.json();

    if (!reference || !draftId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1. Verify payment with Paystack
    const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const paystackData = await paystackRes.json();

    if (!paystackData.status || paystackData.data.status !== "success") {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // 2. Fulfill order in Firestore
    const draftRef = adminDb.collection("drafts").doc(draftId);
    const draftSnap = await draftRef.get();

    if (!draftSnap.exists) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    const draftData = draftSnap.data() || {};
    const existingPaidAmount = draftData.paidAmount || 0;
    const additionalAmount = paystackData.data.amount / 100; // Convert back to major unit
    const newPaidAmount = existingPaidAmount + additionalAmount;
    
    // Get newly paid addons (current selected minus already paid)
    const selectedAddons = draftData.selectedAddons || [];
    const existingPaidAddons = draftData.paidAddons || [];
    const newlyPaidAddons = selectedAddons.filter((id: string) => !existingPaidAddons.includes(id));

    // Update the "published" moment or create it
    const momentId = draftId;
    
    const updatePayload = {
      ...draftData,
      status: "Published",
      isPaid: true,
      paidAmount: newPaidAmount,
      paidAddons: admin.firestore.FieldValue.arrayUnion(...selectedAddons),
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastPaymentDetails: {
        reference,
        amount: paystackData.data.amount,
        paidAt: paystackData.data.paid_at,
      }
    };

    await adminDb.collection("moments").doc(momentId).set(updatePayload, { merge: true });
    await draftRef.update({
      status: "Published",
      isPaid: true,
      paidAmount: newPaidAmount,
      paidAddons: admin.firestore.FieldValue.arrayUnion(...selectedAddons),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, momentId });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
