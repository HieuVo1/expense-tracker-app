import type { ColorSystem } from '@mui/material/styles';
import type { SettingsState } from 'src/components/settings';
import type { ThemeOptions, ThemeColorScheme } from '../types';

import { setFont, hexToRgbChannel, createPaletteChannel } from 'minimal-shared/utils';

import { primaryColorPresets } from './color-presets';
import { createShadowColor } from '../core/custom-shadows';

export function applySettingsToTheme(
  theme: ThemeOptions,
  settingsState?: SettingsState
): ThemeOptions {
  const { fontFamily, contrast = 'default', primaryColor = 'default' } = settingsState ?? {};

  const isDefaultContrast = contrast === 'default';
  const isDefaultPrimaryColor = primaryColor === 'default';

  const lightPalette = theme.colorSchemes?.light?.palette as ColorSystem['palette'] | undefined;
  const primaryPreset = primaryColorPresets[primaryColor as 'default'];
  const primaryPalette = primaryPreset ? createPaletteChannel(primaryPreset) : undefined;

  const updateColorScheme = (schemeName: ThemeColorScheme) => {
    const currentScheme = theme.colorSchemes?.[schemeName];
    const basePalette = currentScheme?.palette ?? {};
    const baseBackground = schemeName === 'light' ? (lightPalette?.background ?? {}) : {};
    const grey200 = lightPalette?.grey?.[200];

    const paletteWithPrimary =
      !isDefaultPrimaryColor && primaryPalette ? { primary: primaryPalette } : {};

    const paletteWithBackground =
      schemeName === 'light'
        ? {
            background: {
              ...baseBackground,
              ...(!isDefaultContrast && grey200
                ? { default: grey200, defaultChannel: hexToRgbChannel(grey200) }
                : {}),
            },
          }
        : {};

    const updatedPalette = {
      ...basePalette,
      ...paletteWithPrimary,
      ...paletteWithBackground,
    };

    const customShadows = Object.assign(
      {},
      currentScheme?.customShadows ?? {},
      !isDefaultPrimaryColor && primaryPalette
        ? { primary: createShadowColor(primaryPalette.mainChannel) }
        : {}
    );

    return Object.assign({}, currentScheme ?? {}, {
      palette: updatedPalette,
      customShadows,
    });
  };

  return {
    ...theme,
    colorSchemes: {
      light: updateColorScheme('light'),
      dark: updateColorScheme('dark'),
    },
    typography: {
      ...theme.typography,
      fontFamily: setFont(fontFamily),
    },
  };
}
