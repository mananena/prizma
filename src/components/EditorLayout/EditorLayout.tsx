import type { ReactNode } from 'react'
import classes from './EditorLayout.module.css'

interface EditorLayoutProps {
  menuBar: ReactNode
  toolBar: ReactNode
  viewport: ReactNode
  sidePanel: ReactNode
  statusBar: ReactNode
}

/** Editor grid: menu bar, then the canvas with a floating tool dock beside the inspector, then the status bar. */
export function EditorLayout({
  menuBar,
  toolBar,
  viewport,
  sidePanel,
  statusBar,
}: EditorLayoutProps) {
  return (
    <div className={classes.root}>
      {menuBar}
      <div className={classes.main}>
        <div className={classes.center}>
          {viewport}
          <div className={classes.dock}>{toolBar}</div>
        </div>
        {sidePanel}
      </div>
      {statusBar}
    </div>
  )
}
