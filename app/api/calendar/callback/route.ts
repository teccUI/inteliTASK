import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import { db } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/calendar/callback`,
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state") // This contains the userId

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=calendar_auth_failed`)
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)

    // Store tokens in Firestore
    const usersCollection = db.collection("users")

    await usersCollection.doc(state).update({
      googleCalendarTokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
      },
      updatedAt: FieldValue.serverTimestamp(),
    })

    // Redirect back to dashboard with success message
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?calendar_connected=true`)
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=calendar_auth_failed`)
  }
}
