import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state") // This is the userId
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=calendar_auth_failed`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=missing_parameters`)
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/calendar/callback`,
    )

    const { tokens } = await oauth2Client.getToken(code)

    // Store tokens in Firestore
    const userRef = adminDb.collection("users").doc(state)
    await userRef.update({
      googleCalendarTokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      },
      updatedAt: new Date(),
    })

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?calendar_connected=true`)
  } catch (error) {
    console.error("Error handling calendar callback:", error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=calendar_callback_failed`)
  }
}
