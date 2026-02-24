import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";
import { adminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

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
    const momentRef = adminDb.collection("moments").doc(draftId);
    const momentSnap = await momentRef.get();

    if (!momentSnap.exists) {
      return NextResponse.json({ error: "Moment not found" }, { status: 404 });
    }

    const momentData = momentSnap.data() || {};
    const existingPaidAmount = momentData.paidAmount || 0;
    const additionalAmount = paystackData.data.amount / 100; // Convert back to major unit
    const newPaidAmount = existingPaidAmount + additionalAmount;
    
    const selectedAddons = momentData.selectedAddons || [];

    const updatePayload: any = {
      status: "Published",
      isPaid: true,
      paidAmount: newPaidAmount,
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastPaymentDetails: {
        reference,
        amount: paystackData.data.amount,
        paidAt: paystackData.data.paid_at,
      }
    };

    if (selectedAddons.length > 0) {
      updatePayload.paidAddons = admin.firestore.FieldValue.arrayUnion(...selectedAddons);
    }

    await momentRef.update(updatePayload);

    return NextResponse.json({ success: true, momentId: draftId });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
