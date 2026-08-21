import { Breadcrumb } from "@/components/documents/Breadcrumb";
import { ProjectSubNav } from "@/components/projects/ProjectSubNav";

export function ProjectPageHeader({
  workspaceId,
  projectId,
  workspaceName,
  projectName,
}: {
  workspaceId: string;
  projectId: string;
  workspaceName: string;
  projectName: string;
}) {
  return (
    <div className="shrink-0 bg-white">
      <div className="px-6 pt-5 pb-4 lg:px-10">
        <Breadcrumb
          items={[
            { label: workspaceName || "Workspace", href: "/workspaces" },
            { label: projectName || "Project", href: `/w/${workspaceId}/projects` },
          ]}
        />
      </div>
      <ProjectSubNav workspaceId={workspaceId} projectId={projectId} />
    </div>
  );
}
