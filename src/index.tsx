import React from 'react';
import {
  AnimationPlaybackControls,
  useAnimate,
  useInView,
} from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

const TICKER_DIRECTION_LEFT = -1;
const TICKER_DIRECTION_RIGHT = 1;

type TickerProps = {
  children: JSX.Element[];
  duration?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isPlaying?: boolean;
  direction?: number;
};

const noop = () => {};

const Ticker: React.FunctionComponent<TickerProps> = (props: TickerProps) => {
  const {
    children,
    duration = 10,
    onMouseEnter = noop,
    onMouseLeave = noop,
    isPlaying = true,
    direction = TICKER_DIRECTION_LEFT,
  } = props;

  const tickerRef = React.useRef<HTMLDivElement>(null);
  const [tickerUUID, setTickerUUID] = React.useState<string>('');
  const [tickerContentWidth, setTickerContentWidth] = React.useState<number | null>(0);
  const [numDupes, setNumDupes] = React.useState<number>(1);
  const [scope, animate] = useAnimate();
  const [animationControls, setAnimationControls] = React.useState<AnimationPlaybackControls | undefined>(undefined);
  const isInView = useInView(scope);

  // Generate unique ID
  React.useEffect(() => {
    setTickerUUID(uuidv4());
  }, []);

  // Measure total width of children (deferred)
  React.useEffect(() => {
    if (!tickerUUID) return;

    const timeout = setTimeout(() => {
      let contentWidth = 0;

      for (let index = 0; index < children.length; index++) {
        const element = document.getElementById(`${tickerUUID}_${index}`);
        if (element) {
          contentWidth += element.clientWidth;
        }
      }

      setTickerContentWidth(contentWidth);
    }, 0);

    return () => clearTimeout(timeout);
  }, [tickerUUID, children]);

  // Calculate how many times to duplicate the ticker row
  React.useEffect(() => {
    if (tickerRef.current && tickerContentWidth) {
      const containerWidth = tickerRef.current.clientWidth;
      const requiredDupes = Math.ceil((2 * containerWidth) / tickerContentWidth);
      setNumDupes(Math.max(requiredDupes, 1));
    }
  }, [tickerRef.current, tickerContentWidth]);

  // Start animation when in view
  React.useEffect(() => {
    if (isInView && !animationControls && tickerContentWidth) {
      const controls = animate(
        scope.current,
        { x: tickerContentWidth * direction },
        { ease: 'linear', duration, repeat: Infinity }
      );
      controls.play();
      setAnimationControls(controls);
    }
  }, [isInView, tickerContentWidth]);

  // Pause/resume based on visibility or play state
  React.useEffect(() => {
    if (animationControls) {
      if (!isInView || !isPlaying) {
        animationControls.pause();
      } else {
        animationControls.play();
      }
    }
  }, [isInView, isPlaying]);

  return (
    <div
      className="FMT__container"
      ref={tickerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        ref={scope}
        className="FMT__container__contents"
        style={{ display: 'flex' }}
      >
        {children.map((item, index) => (
          <div key={index} id={`${tickerUUID}_${index}`}>
            {item}
          </div>
        ))}
        {[...Array(numDupes)].map((_, dupeIndex) =>
          children.map((item, index) => (
            <div key={`dupe-${dupeIndex}-${index}`}>{item}</div>
          ))
        )}
      </div>
    </div>
  );
};

export default Ticker;
export { TICKER_DIRECTION_LEFT, TICKER_DIRECTION_RIGHT };
