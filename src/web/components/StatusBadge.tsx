import type { ApplicationState } from '../../shared/contracts.ts';
import { stateLabels } from '../i18n/te.ts';
export function StatusBadge({ state }: { state: ApplicationState }) {
  return <span className={'badge status-' + state.toLowerCase()}>{stateLabels[state]}</span>;
}
