import { WorkspaceChrome } from "@/components/dashboard/WorkspaceChrome";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceChrome>{children}</WorkspaceChrome>;
}
