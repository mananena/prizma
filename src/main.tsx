import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import '@fontsource-variable/onest'
import '@fontsource/dela-gothic-one/cyrillic-400.css'
import '@fontsource/dela-gothic-one/latin-400.css'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App'
import { theme } from '@/config/theme'

const root = document.getElementById('root')
if (!root) throw new Error('Не найден элемент #root')

createRoot(root).render(
  <StrictMode>
    <MantineProvider theme={theme} forceColorScheme="dark">
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </StrictMode>,
)
