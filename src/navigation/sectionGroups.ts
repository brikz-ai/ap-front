// Grupo de navegacao de cada secao (eyebrow do PageHeader e breadcrumb do Header).
const SECTION_GROUPS: Record<string, string> = {
  'partner-registration': 'Principal',
  'schedule-view': 'Principal',
  'contracts': 'Principal',
  'clients': 'Principal',
  'clients-test': 'Principal',
  'client-detail': 'Principal',
  'client-detail-test': 'Principal',
  'client-radar': 'Principal',
  'contract-detail': 'Principal',
  'contracts-monitoring': 'Monitoramento',
  'liquidation-problems': 'Monitoramento',
  'chargeback-monitoring': 'Monitoramento',
  'settlement-control': 'Relatórios',
  'receivables-ledger': 'Relatórios',
  'reports': 'Relatórios',
  'disputes': 'Contestação',
  'financial': 'Configurações',
  'settlement-domicile': 'Configurações',
  'notifications': 'Configurações',
  'menu-setup': 'Configurações',
  'user-management': 'Gestão de acessos',
  'role-permissions': 'Gestão de acessos',
  'access-logs': 'Gestão de acessos',
};

export function getSectionGroup(section: string): string {
  return SECTION_GROUPS[section] ?? 'Operação';
}

// Telas de detalhe com cabecalho proprio (botao voltar): o PageHeader global nao e renderizado.
const SECTIONS_WITH_OWN_HEADER = new Set<string>([
  'client-detail',
  'client-detail-test',
  'client-radar',
  'contract-detail',
]);

export function hasOwnHeader(section: string): boolean {
  return SECTIONS_WITH_OWN_HEADER.has(section);
}
