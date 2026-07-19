import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { events, sessionId } = body;

    if (!Array.isArray(events) || !sessionId) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get latest workspace for this user
    const workspace = await db.workspace.findFirst({
      where: { user_id: user.id },
      orderBy: { updated_at: "desc" },
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "No active workspace" },
        { status: 404 }
      );
    }

    // Batch insert telemetry events
    const telemetryEvents = events.map((evt: any) => ({
      workspace_id: workspace.id,
      session_id: sessionId,
      event_type: evt.type,
      event_data: evt,
      cursor_pos: evt.cursorPosition,
      content_length: evt.contentLength,
      timestamp: new Date(evt.timestamp),
    }));

    await db.telemetryEvent.createMany({
      data: telemetryEvents,
    });

    logger.info(
      {
        userId: user.id,
        workspaceId: workspace.id,
        eventCount: events.length,
      },
      "Telemetry events recorded"
    );

    return NextResponse.json({
      success: true,
      recorded: events.length,
    });
  } catch (error) {
    logger.error(error, "Telemetry endpoint error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
