import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function PATCH(
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
    const {
      code_content,
      cursor_position,
      scroll_top,
      scroll_left,
      status,
    } = body;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const workspace = await db.workspace.findUnique({
      where: { id: params.workspaceId },
    });

    if (!workspace || workspace.user_id !== user.id) {
      return NextResponse.json(
        { error: "Workspace not found or unauthorized" },
        { status: 404 }
      );
    }

    const updated = await db.workspace.update({
      where: { id: params.workspaceId },
      data: {
        ...(code_content !== undefined && { code_content }),
        ...(cursor_position !== undefined && { cursor_position }),
        ...(scroll_top !== undefined && { scroll_top }),
        ...(scroll_left !== undefined && { scroll_left }),
        ...(status !== undefined && { status }),
        last_saved: new Date(),
        last_activity: new Date(),
      },
    });

    logger.info(
      { workspaceId: params.workspaceId, userId: user.id },
      "Workspace updated"
    );

    return NextResponse.json(updated);
  } catch (error) {
    logger.error(error, "Update workspace error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const workspace = await db.workspace.findUnique({
      where: { id: params.id },
      include: {
        course: true,
      },
    });

    if (!workspace || workspace.user_id !== user.id) {
      return NextResponse.json(
        { error: "Workspace not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(workspace);
  } catch (error) {
    logger.error(error, "Get workspace error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
