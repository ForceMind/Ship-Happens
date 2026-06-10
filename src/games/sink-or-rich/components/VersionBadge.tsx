import { GAME_VERSION } from '../content/version';
import styles from './styles.module.css';

export function VersionBadge() {
  return <div className={styles.versionBadge}>v{GAME_VERSION}</div>;
}
