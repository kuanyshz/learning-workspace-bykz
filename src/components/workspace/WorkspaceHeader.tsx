"use client";

import { FC, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface CourseInfo {
  id: string;
  title: string;
  description: string;
}

interface WorkspaceInfo {
  id: string;
  course: CourseInfo;
  status: string;
  last_activity: string;
  code_content: string;
}

const WorkspaceHeader: FC = () => {
  const params = useParams();
  const { data: session } = useSession();
  const workspaceId = params.id as string;

  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkspaceInfo();
  }, [workspaceId]);

  const fetchWorkspaceInfo = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/v1/workspaces/${workspaceId}`);
      if (!response.ok) throw new Error("Failed to fetch workspace");

      const data = await response.json();
      setWorkspace(data);
    } catch (error) {
      console.error("Error fetching workspace:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "stuck":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <p className="text-sm text-gray-500">Failed to load workspace</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {workspace.course.title}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {workspace.course.description}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
              workspace.status
            )}`}
          >
            {workspace.status.replace("_", " ")}
          </span>
          <div className="text-right">
            <p className="text-xs text-gray-500">Last activity</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(workspace.last_activity).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Info */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Characters</p>
          <p className="text-lg font-semibold text-gray-900">
            {workspace.code_content.length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Lines</p>
          <p className="text-lg font-semibold text-gray-900">
            {workspace.code_content.split("\n").length}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-600">Words</p>
          <p className="text-lg font-semibold text-gray-900">
            {workspace.code_content.split(/\s+/).filter(Boolean).length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceHeader;
