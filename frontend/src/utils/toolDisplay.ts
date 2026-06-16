import type { ToolInfo } from '../types/chat';

const displayNames: Record<string, string> = {
  get_git_status: 'Git 상태 확인',
  get_k8s_pods: '쿠버네티스 Pod 조회',
  get_github_repo_info: 'GitHub 저장소 정보 조회',
  get_public_ip: '공인 IP 확인',
};

const descriptions: Record<string, string> = {
  get_git_status: '현재 Git 저장소의 변경 상태를 확인합니다.',
  get_k8s_pods: '현재 Kubernetes Pod 목록과 상태를 조회합니다.',
  get_github_repo_info: '공개 GitHub 저장소 정보를 조회합니다.',
  get_public_ip: '현재 네트워크의 공인 IP를 조회합니다.',
};

export function getToolDisplayName(tool: Pick<ToolInfo, 'name' | 'display_name'> | string): string {
  const name = typeof tool === 'string' ? tool : tool.name;
  return typeof tool === 'string' ? displayNames[name] ?? name : tool.display_name ?? displayNames[name] ?? name;
}

export function getToolDescription(tool: ToolInfo): string {
  return descriptions[tool.name] ?? tool.description;
}

export function addToolDisplay(tool: ToolInfo): ToolInfo {
  return {
    ...tool,
    display_name: getToolDisplayName(tool),
    description: getToolDescription(tool),
  };
}

export function localizeToolNames(text: string): string {
  return Object.entries(displayNames).reduce(
    (current, [name, displayName]) => current.replaceAll(name, displayName),
    text,
  );
}
