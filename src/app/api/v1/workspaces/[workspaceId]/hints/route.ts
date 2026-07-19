import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    // Verify workspace ownership
    const workspace = await db.workspace.findUnique({
      where: { id: params.workspaceId },
    });

    if (!workspace || workspace.user_id !== user.id) {
      return NextResponse.json(
        { error: "Workspace not found or unauthorized" },
        { status: 404 }
      );
    }

    const hints = await db.hint.findMany({
      where: { workspace_id: params.workspaceId },
      orderBy: { created_at: "desc" },
      take: 10,
    });

    return NextResponse.json({ hints });
  } catch (error) {
    logger.error(error, "Get hints error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, hintType, severity } = body;

    if (!content || !hintType) {
      return NextResponse.json(
        { error: "Content and hintType required" },
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

    // Verify workspace ownership
    const workspace = await db.workspace.findUnique({
      where: { id: params.workspaceId },
    });

    if (!workspace || workspace.user_id !== user.id) {
      return NextResponse.json(
        { error: "Workspace not found or unauthorized" },
        { status: 404 }
      );
    }

    const hint = await db.hint.create({
      data: {
        workspace_id: params.workspaceId,
        content,
        hint_type: hintType,
        severity: severity || "info",
      },
    });

    logger.info(
      { workspaceId: params.workspaceId, hintType },
      "Hint created"
    );

    return NextResponse.json(hint, { status: 201 });
  } catch (error) {
    logger.error(error, "Create hint error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
