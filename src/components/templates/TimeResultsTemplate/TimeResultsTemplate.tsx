import Header from "@/components/organisms/Header/Header";
import GameTimesContainer from "@/components/organisms/GameTimesContainer/GameTimesContainer";
import Button from "@/components/atoms/Button/Button";
import styles from "./TimeResultsTemplate.module.css";

export interface TimeResultsTemplateProps {
  /**
   * Every game's round durations, oldest game first. The last entry is the game
   * in progress, so it shows as its own section and a fresh one appears the
   * moment a new game starts.
   */
  games: number[][];
  /** Wipes every game and the current one. */
  onReset?: () => void;
}

/**
 * Layout skeleton for the Time Results route: the shared header, a card per
 * game, and a Reset. Placement only — the route supplies the games.
 */
export default function TimeResultsTemplate({
  games,
  onReset,
}: TimeResultsTemplateProps) {
  return (
    <div className={styles.page}>
      <Header />
      {games.map((durations, index) => (
        <div key={index} className={styles.section}>
          <GameTimesContainer game={index + 1} durations={durations} />
        </div>
      ))}
      <div className={styles.actions}>
        <Button color="danger" variant="outlined" onClick={onReset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
