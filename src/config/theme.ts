import {
  ActionIcon,
  Button,
  Checkbox,
  ColorInput,
  createTheme,
  Menu,
  NumberInput,
  SegmentedControl,
  Select,
  Switch,
  TextInput,
  Tooltip,
} from '@mantine/core'

const xs = { defaultProps: { size: 'xs' } }

/** Prussian-blue chrome replaces Mantine's neutral grey scale (0 = text … 9 = deepest). */
const prussian = [
  '#EAF0FF',
  '#C5D0F0',
  '#8C9CCB',
  '#5E70A6',
  '#2A417E',
  '#1F3770',
  '#13285A',
  '#0D1E45',
  '#081430',
  '#050C20',
] as const

/** Additive secondary R+B: the single UI accent; R, G, B themselves are reserved for channels. */
const magenta = [
  '#FFE6F3',
  '#FFC2E0',
  '#FF99CB',
  '#FF70B6',
  '#FF4FA6',
  '#FF2E9A',
  '#E61A86',
  '#C20D6F',
  '#9C0559',
  '#730042',
] as const

export const theme = createTheme({
  colors: { dark: prussian, magenta },
  primaryColor: 'magenta',
  primaryShade: 5,
  fontFamily: "'Onest Variable', system-ui, sans-serif",
  headings: { fontFamily: "'Onest Variable', system-ui, sans-serif" },
  defaultRadius: 'sm',
  radius: { xs: '3px', sm: '6px', md: '10px', lg: '14px', xl: '20px' },
  fontSizes: { xs: '11px', sm: '12px', md: '13px', lg: '15px', xl: '17px' },
  spacing: { xs: '4px', sm: '6px', md: '10px', lg: '14px', xl: '20px' },
  components: {
    ActionIcon: ActionIcon.extend({
      defaultProps: { size: 'md' },
      // quiet grey icon buttons hover in the chrome's blue, not Mantine's neutral grey
      vars: (_theme, props) =>
        props.variant === 'subtle' && props.color === 'gray'
          ? {
              root: {
                '--ai-hover': 'var(--mantine-color-dark-4)',
                '--ai-color': 'var(--mantine-color-dark-1)',
              },
            }
          : { root: {} },
    }),
    Button: Button.extend(xs),
    Checkbox: Checkbox.extend(xs),
    ColorInput: ColorInput.extend(xs),
    Menu: Menu.extend({ defaultProps: { shadow: 'md' } }),
    NumberInput: NumberInput.extend(xs),
    SegmentedControl: SegmentedControl.extend(xs),
    Select: Select.extend(xs),
    Switch: Switch.extend(xs),
    TextInput: TextInput.extend(xs),
    Tooltip: Tooltip.extend({ defaultProps: { openDelay: 400, color: 'dark.4' } }),
  },
})
