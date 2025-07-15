import { type NextRequest, NextResponse } from "next/server"
import { google } from "googleapis"
import clientPromise from "@/lib/mongodb"

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

    // Store tokens in MongoDB
    const client = await clientPromise
    const db = client.db("intellitask")
    const users = db.collection("users")

    await users.updateOne(
      { uid: state },
      {
        $set: {
          googleCalendarTokens: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiryDate: tokens.expiry_date,
          },
          updatedAt: new Date(),
        },
      },
    )

    // Redirect back to dashboard with success message
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?calendar_connected=true`)
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=calendar_auth_failed`)
  }
}
