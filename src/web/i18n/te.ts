import type { ApplicationState, Role, WorkflowAction } from '../../shared/contracts.ts';
export const stateLabels: Record<ApplicationState, string> = {
  PENDING_GPO: 'క్షేత్ర విచారణ',
  PENDING_RI: 'ఆర్ఐ పరిశీలన',
  PENDING_TAHSILDAR: 'తుది నిర్ణయం',
  APPROVED: 'ఆమోదించబడింది',
  REJECTED: 'తిరస్కరించబడింది',
};
export const roleLabels: Record<Role, string> = {
  GPO: 'గ్రామ పాలన అధికారి',
  RI: 'రెవెన్యూ ఇన్‌స్పెక్టర్',
  TAHSILDAR: 'తహసీల్దార్',
};
export const actionLabels: Record<WorkflowAction, string> = {
  SUBMIT_REPORT: 'నివేదిక సమర్పించు',
  RECOMMEND: 'సిఫార్సు పంపు',
  APPROVE: 'ఆమోదించు',
  REJECT: 'తిరస్కరించు',
  RETURN: 'వెనక్కి పంపు',
};
export const money = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
export const displayTime = (value: string) =>
  new Intl.DateTimeFormat('te-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
