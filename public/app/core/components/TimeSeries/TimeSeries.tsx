import { useCallback } from 'react';

import { type DataFrame, type TimeRange } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { hasVisibleLegendSeries, PlotLegend, type UPlotConfigBuilder } from '@grafana/ui/internal';
import { type TimeSeriesLegendOptions } from 'app/plugins/panel/timeseries/panelcfg.gen';

import { GraphNG, type GraphNGProps, type PropDiffFn } from '../GraphNG/GraphNG';

import { getXAxisConfig, preparePlotConfigBuilder } from './utils';

// deprecated LegendDisplayMode.Hidden
const HIDDEN_LEGEND_DISPLAY_MODE = 'hidden';

const propsToDiff:Array<string | PropDiffFn> = ['legend', 'options', 'annotationLanes', 'theme'];

type TimeSeriesProps = Omit<GraphNGProps, 'prepConfig' | 'propsToDiff' | 'renderLegend' | 'theme' | 'legend'> & {
  legend: TimeSeriesLegendOptions;
  onPinnedToSidebarChange?: (pinned: boolean) => void;
};

export function TimeSeries(props: TimeSeriesProps) {
  const { timeZone, options, renderers, tweakAxis, tweakScale, legend, frames, onPinnedToSidebarChange } = props;
  const theme = useTheme2();

  const prepConfig = useCallback(
    (alignedFrame: DataFrame, allFrames: DataFrame[], getTimeRange: () => TimeRange, annotationLanes?: number) => {
      return preparePlotConfigBuilder({
        frame: alignedFrame,
        theme,
        timeZones: Array.isArray(timeZone) ? timeZone : [timeZone],
        getTimeRange,
        allFrames,
        renderers,
        tweakScale,
        tweakAxis,
        hoverProximity: options?.tooltip?.hoverProximity,
        orientation: options?.orientation,
        xAxisConfig: getXAxisConfig(annotationLanes),
      });
    },
    [theme, timeZone, options, renderers, tweakAxis, tweakScale]
  );

  const renderLegend = useCallback(
    (uPlotConfig: UPlotConfigBuilder) => {
      // `displayMode: hidden` is the deprecated way of hiding the legend: VizLegend renders nothing for it,
      // and VizLayout would then wait forever for a legend height before rendering the plot.
      if (
        !uPlotConfig ||
        (legend && (!legend.showLegend || String(legend.displayMode) === HIDDEN_LEGEND_DISPLAY_MODE)) ||
        !hasVisibleLegendSeries(uPlotConfig, frames)
      ) {
        return null;
      }

      return (
        <PlotLegend data={frames} config={uPlotConfig} {...legend} onPinnedToSidebarChange={onPinnedToSidebarChange} />
      );
    },
    [legend, frames, onPinnedToSidebarChange]
  );

  return (
    <GraphNG {...props} theme={theme} prepConfig={prepConfig} propsToDiff={propsToDiff} renderLegend={renderLegend} />
  );
}
