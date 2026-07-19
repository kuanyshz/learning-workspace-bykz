import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
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
      include: {
        workspaces: {
          orderBy: { updated_at: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      workspaces: user.workspaces,
    });
  } catch (error) {
    logger.error(error, "Get workspaces error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID required" },
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

    // Check if workspace already exists
    let workspace = await db.workspace.findUnique({
      where: {
        user_id_course_id: {
          user_id: user.id,
          course_id: courseId,
        },
      },
    });

    // Create if doesn't exist
    if (!workspace) {
      workspace = await db.workspace.create({
        data: {
          user_id: user.id,
          course_id: courseId,
          code_content: "",
        },
      });
    }

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    logger.error(error, "Create workspace error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
